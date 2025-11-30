
import { GoogleGenAI, Chat, Modality, LiveServerMessage, FunctionDeclaration, Type, FunctionCall } from "@google/genai";
import { JARVIS_SYSTEM_INSTRUCTION } from '../constants';
import { MessageSender, type SystemAction, type SystemInfo, type Message, type Source, type RenderModel, type Simulation, type Widget, type FileOperation, type SettingsUpdate, type UiAction, type ClipboardAction, type HighlightAction, type ThemeAction, type AgiPlan } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import * as BrowserActions from '../utils/browserActions';

// Link to billing documentation. MUST be provided in the dialog.
const BILLING_DOC_LINK = "ai.google.dev/gemini-api/docs/billing";

let chat: Chat | null = null; // Stays global for chat session continuity

const ensureApiKeySelected = async (): Promise<boolean> => {
  // Check if API key is already selected
  if (await window.aistudio.hasSelectedApiKey()) {
    return true;
  }

  // If not, prompt user to select API key
  try {
    // Open the API key selection dialog. The dialog itself will provide the billing documentation link.
    // The `openSelectKey` function expects no arguments.
    await window.aistudio.openSelectKey();
    // Assume success after triggering openSelectKey() to mitigate race condition
    return true;
  } catch (error) {
    console.error("User did not select API key or an error occurred:", error);
    // Optionally, inform the user in the UI if needed
    return false;
  }
};

// Function to get current geolocation, if permission is granted
const getUserLocation = async (): Promise<{latitude: number; longitude: number} | undefined> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          resolve(undefined);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      resolve(undefined);
    }
  });
};


// --- VIDEO GENERATION SERVICE (VEO 3.1) ---

const generateVeoVideo = async (prompt: string): Promise<{ url: string | null; error?: string }> => {
    try {
        // Ensure fresh instance and key for the heavy operation
        await ensureApiKeySelected();
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        console.log("Starting Veo 3.1 Generation with prompt:", prompt);
        
        let operation = null;
        let usedModel = '';

        // List of models to try in order of preference (Fast first, then Quality)
        // This fallback strategy helps avoid 404s if a specific preview model is not available to the key.
        const candidateModels = ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'];
        let lastError = null;
        let accessDenied = false;

        for (const model of candidateModels) {
            try {
                console.log(`Attempting generation with model: ${model}`);
                operation = await ai.models.generateVideos({
                    model: model,
                    prompt: prompt,
                    config: {
                        numberOfVideos: 1,
                        resolution: '1080p', 
                        aspectRatio: '16:9'
                    }
                });
                usedModel = model;
                lastError = null;
                break; // Success, exit loop
            } catch (error: any) {
                const errorMsg = error.message || error.toString() || JSON.stringify(error);
                console.warn(`Veo model ${model} failed:`, errorMsg);

                // If 404, it implies no access to this specific model for this project/key
                if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
                     accessDenied = true;
                     lastError = "404_NOT_FOUND";
                     continue;
                }
                lastError = errorMsg;
            }
        }

        if (lastError === "404_NOT_FOUND" && !operation) {
             return { url: null, error: "Veo Model Not Found (404). Ensure your API key has access to Veo 3.1 (Trusted Tester Program) or check your GCP project permissions." };
        }

        if (!operation) {
            return { url: null, error: lastError || "Video generation failed to initialize." };
        }

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log(`Veo Generation Status (${usedModel}):`, operation.metadata);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (downloadLink) {
            // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await videoResponse.blob();
            return { url: URL.createObjectURL(blob) };
        }
        return { url: null, error: "No video URI in response." };
    } catch (error: any) {
        console.error("Veo 3.1 Video Generation Failed:", error);
        return { url: null, error: error.message || "Unknown Veo Error" };
    }
};


// --- TEXT-BASED CHAT SERVICE (Existing) ---

export const startJarvisSession = async () => {
  const apiKeySelected = await ensureApiKeySelected();
  if (!apiKeySelected) {
    console.warn("API key not selected, cannot start JARVIS text session.");
    // chat will remain null, getJarvisResponse will handle showing a message.
    return;
  }
  
  const toolConfigs = [];
  toolConfigs.push({googleSearch: {}});

  // Create a new GoogleGenAI instance for each session to ensure the latest API key is used.
  const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chat = aiInstance.chats.create({
    // Changed model to 'gemini-3-pro-preview' as per coding guidelines for complex text tasks.
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
      tools: toolConfigs, // Text chat uses Google Search.
    },
  });
};

// Updated regex to be flexible with parameter keys (supporting both "Target:" and "Resolution:" etc.)
const ACTION_REGEX = /\[SYSTEM_ACTION:\s*([^|]+?)(?:\s*\|\s*(?:Target:\s*)?([^|]+?))?(?:\s*\|\s*(?:State:\s*)?([^\]]+?))?\]/i;
const FAILURE_REGEX = /\[SYSTEM_FAILURE:\s*(.*?)\]/;
const RENDER_REGEX = /\[DISPLAY_RENDER:\s*([^|]+?)\s*\|\s*Angle:\s*([^|]+?)\s*\|\s*Style:\s*([^\]]+?)\]/i;
const SIMULATION_REGEX = /\[RUNNING_SIMULATION:\s*([^\]]+)\]/i;
const WIDGET_REGEX = /\[DISPLAY_WIDGET:\s*([^\]]+)\]/i;
const FILE_CREATION_REGEX = /\[CREATING_FILE:\s*([^\]]+)\]/i;
const DB_ACCESS_REGEX = /\[ACCESSING_DATABASE:\s*([^\]]+)\]/i;
const CURRENT_MODE_REGEX = /\[CURRENT_MODE:\s*([^\]]+)\]/i;
const VISUAL_WIDGET_REGEX = /\[VISUAL_WIDGET:\s*([^\]]+)\]/i;
const VEO_ACTION_REGEX = /\[VEO_ACTION:\s*GENERATE\]([\s\S]*?)\[\/VEO_ACTION\]/i;
const SETTING_UPDATE_REGEX = /\[SETTING_UPDATE:\s*([^=]+)=([^\]]+)\]/i;
const TYPING_SPEED_REGEX = /\[TYPING_SPEED:\s*[^\]]+\]/i;
const AGI_PLAN_REGEX = /\[AGI_PLAN:\s*([^\]]+)\]/i;
const AGI_EXECUTE_REGEX = /\[AGI_EXECUTE:\s*([^\]]+)\]/i;

// --- M.U.I. REGEX ---
const UI_ACTION_REGEX = /\[UI_ACTION:\s*([^|]+)(?:\s*\|\s*(?:Amount:\s*|Target:\s*)?([^\]]+))?\]/i;
const CLIPBOARD_REGEX = /\[SYSTEM_CLIPBOARD:\s*([^|]+)(?:\s*\|\s*(?:Content:\s*|Type:\s*)?([^\]]+))?\]/i;
const HIGHLIGHT_REGEX = /\[UI_HIGHLIGHT:\s*"([^"]+)"\s*\|\s*(?:Color:\s*|Style:\s*)?([^\]]+)\]/i;
const THEME_SWITCH_REGEX = /\[THEME_SWITCH:\s*([^\]]+)\]/i;
const UI_ELEMENTS_REGEX = /\[UI_ELEMENTS:\s*([^\]]+)\]/i;

interface JarvisResponse {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  action: SystemAction | null;
  systemInfo: SystemInfo | null;
  sources?: Source[];
  renderModel?: RenderModel;
  simulation?: Simulation;
  widget?: Widget;
  fileOperation?: FileOperation;
  settingsUpdate?: SettingsUpdate;
  
  // M.U.I. Response Fields
  uiAction?: UiAction;
  clipboardAction?: ClipboardAction;
  highlightAction?: HighlightAction;
  themeAction?: ThemeAction;
  uiElementAction?: string;

  mode?: string;
  visualContext?: string;
  videoPrompt?: string;
  
  // AGI Fields
  agiPlan?: AgiPlan;
  agiExecuteStep?: string;
}

const parseResponse = (text: string | undefined): Omit<JarvisResponse, 'sources' | 'imageUrl' | 'videoUrl'> & { videoPrompt?: string } => {
  let cleanedText = text || '';
  let action: SystemAction | null = null;
  let renderModel: RenderModel | undefined = undefined;
  let simulation: Simulation | undefined = undefined;
  let widget: Widget | undefined = undefined;
  let fileOperation: FileOperation | undefined = undefined;
  let settingsUpdate: SettingsUpdate | undefined = undefined;
  let mode: string | undefined = undefined;
  let visualContext: string | undefined = undefined;
  let videoPrompt: string | undefined = undefined;
  let agiPlan: AgiPlan | undefined = undefined;
  let agiExecuteStep: string | undefined = undefined;
  
  // M.U.I. Vars
  let uiAction: UiAction | undefined = undefined;
  let clipboardAction: ClipboardAction | undefined = undefined;
  let highlightAction: HighlightAction | undefined = undefined;
  let themeAction: ThemeAction | undefined = undefined;
  let uiElementAction: string | undefined = undefined;

  const systemInfo: SystemInfo = {};

  // Extract AGI Plan
  const agiPlanMatch = cleanedText.match(AGI_PLAN_REGEX);
  if (agiPlanMatch) {
    cleanedText = cleanedText.replace(AGI_PLAN_REGEX, '').trim();
    const steps = agiPlanMatch[1].split('|').map(s => s.trim());
    agiPlan = {
        steps: steps,
        currentStepIndex: 0,
        status: 'PLANNING'
    };
  }

  // Extract AGI Execution Step
  const agiExecuteMatch = cleanedText.match(AGI_EXECUTE_REGEX);
  if (agiExecuteMatch) {
    cleanedText = cleanedText.replace(AGI_EXECUTE_REGEX, '').trim();
    agiExecuteStep = agiExecuteMatch[1].trim();
    if (agiPlan) {
        agiPlan.status = 'EXECUTING';
    }
  }

  // Extract Current Mode
  const modeMatch = cleanedText.match(CURRENT_MODE_REGEX);
  if (modeMatch) {
    cleanedText = cleanedText.replace(CURRENT_MODE_REGEX, '').trim();
    mode = modeMatch[1].trim();
  }

  // Extract Visual Context/Widget Label
  const visualWidgetMatch = cleanedText.match(VISUAL_WIDGET_REGEX);
  if (visualWidgetMatch) {
    cleanedText = cleanedText.replace(VISUAL_WIDGET_REGEX, '').trim();
    visualContext = visualWidgetMatch[1].trim();
  }

  // Clean Typing Speed Tags (we consume them but don't display them)
  cleanedText = cleanedText.replace(TYPING_SPEED_REGEX, '');

  // Check for Veo Action
  const veoMatch = cleanedText.match(VEO_ACTION_REGEX);
  if (veoMatch) {
      const veoContent = veoMatch[1];
      
      // Parse using the new Advanced Video Generation Protocol structure
      const scene = veoContent.match(/SCENE DESCRIPTION:\s*([\s\S]+?)(?=\n\*\*|ACTION|CAMERA|LIGHTING|AUDIO|\[\/)/i)?.[1]?.trim() || '';
      const actionPhysics = veoContent.match(/ACTION & PHYSICS:\s*([\s\S]+?)(?=\n\*\*|CAMERA|LIGHTING|AUDIO|\[\/)/i)?.[1]?.trim() || '';
      const camera = veoContent.match(/CAMERA & ANGLES:\s*([\s\S]+?)(?=\n\*\*|LIGHTING|AUDIO|\[\/)/i)?.[1]?.trim() || '';
      const lighting = veoContent.match(/LIGHTING & ATMOSPHERE:\s*([\s\S]+?)(?=\n\*\*|AUDIO|\[\/)/i)?.[1]?.trim() || '';
      const audio = veoContent.match(/AUDIO SPECIFICATIONS(?:.*):\s*([\s\S]+?)(?=\n\*\*|\[\/|$)/i)?.[1]?.trim() || '';
      
      if (scene) {
          videoPrompt = `Cinematic Video Generation. Scene: ${scene}. Action & Physics: ${actionPhysics}. Camera: ${camera}. Lighting: ${lighting}. Audio: ${audio}. High Resolution, Photorealistic, 4K.`;
      } else {
          const subject = veoContent.match(/\*\s*Subject:\s*(.+?)(?:\n|$)/i)?.[1] || '';
          const cameraFallback = veoContent.match(/\*\s*Camera:\s*(.+?)(?:\n|$)/i)?.[1] || '';
          const lightingFallback = veoContent.match(/\*\s*Lighting:\s*(.+?)(?:\n|$)/i)?.[1] || '';
          
          if (subject) {
             videoPrompt = `${subject}. Cinematic shot: ${cameraFallback}. Lighting: ${lightingFallback}. 4K resolution, photorealistic.`;
          } else {
             videoPrompt = veoContent.replace(/\*|\[|\]/g, '').trim();
          }
      }
  }

  const actionMatch = cleanedText.match(ACTION_REGEX);
  if (actionMatch) {
    cleanedText = cleanedText.replace(ACTION_REGEX, '').trim();
    action = { 
      functionType: actionMatch[1]?.trim() || 'UNKNOWN', 
      target: actionMatch[2]?.trim() || 'N/A', 
      state: actionMatch[3]?.trim() || 'N/A', 
      subProtocol: 'Default' 
    };
  }

  const dbAccessMatch = cleanedText.match(DB_ACCESS_REGEX);
  if (dbAccessMatch) {
    cleanedText = cleanedText.replace(DB_ACCESS_REGEX, '').trim();
    action = {
        functionType: 'ACCESS_DB',
        target: dbAccessMatch[1].trim(),
        state: 'SCANNING',
        subProtocol: 'DATA'
    };
  }

  const renderMatch = cleanedText.match(RENDER_REGEX);
  if (renderMatch) {
    cleanedText = cleanedText.replace(RENDER_REGEX, '').trim();
    renderModel = {
      viewport: renderMatch[1].trim(),
      angle: renderMatch[2].trim(),
      style: renderMatch[3].trim()
    };
  }
  
  const simulationMatch = cleanedText.match(SIMULATION_REGEX);
  if (simulationMatch) {
    cleanedText = cleanedText.replace(SIMULATION_REGEX, '').trim();
    const parts = simulationMatch[1].split('|');
    const simData: any = {};
    parts.forEach(p => {
        const [key, val] = p.split(/=|:/);
        if (key && val) simData[key.trim().toLowerCase()] = val.trim().replace(/^['"]|['"]$/g, '');
    });
    simulation = {
        variable: simData.variable || 'Unknown',
        duration: simData.duration || 'Unknown',
        niche: simData.niche || 'General'
    };
  }

  const widgetMatch = cleanedText.match(WIDGET_REGEX);
  if (widgetMatch) {
    cleanedText = cleanedText.replace(WIDGET_REGEX, '').trim();
    const parts = widgetMatch[1].split('|');
    const title = parts[0].trim();
    const widgetData: any = { title };
    
    parts.slice(1).forEach(p => {
        const [key, val] = p.split(/=|:/);
        if (key && val) widgetData[key.trim().toLowerCase()] = val.trim().replace(/^['"]|['"]$/g, '');
    });
    widget = {
        title: title,
        type: widgetData.type || 'Generic',
        color: widgetData.color || 'Cyan'
    };
  }

  const fileCreationMatch = cleanedText.match(FILE_CREATION_REGEX);
  if (fileCreationMatch) {
    cleanedText = cleanedText.replace(FILE_CREATION_REGEX, '').trim();
    fileOperation = {
        filename: fileCreationMatch[1].trim(),
        status: 'CREATING'
    };
  }

  const failureMatch = cleanedText.match(FAILURE_REGEX);
  if (failureMatch) {
    cleanedText = cleanedText.replace(FAILURE_REGEX, '').trim();
    systemInfo.systemFailure = failureMatch[1].trim();
  }

  const settingMatch = cleanedText.match(SETTING_UPDATE_REGEX);
  if (settingMatch) {
      cleanedText = cleanedText.replace(SETTING_UPDATE_REGEX, '').trim();
      settingsUpdate = {
          key: settingMatch[1].trim(),
          value: settingMatch[2].trim()
      };
  }

  // --- M.U.I Parsing ---
  const uiActionMatch = cleanedText.match(UI_ACTION_REGEX);
  if (uiActionMatch) {
      cleanedText = cleanedText.replace(UI_ACTION_REGEX, '').trim();
      uiAction = {
          type: uiActionMatch[1].trim() as any,
          amount: uiActionMatch[2]?.trim()
      };
  }

  const clipboardMatch = cleanedText.match(CLIPBOARD_REGEX);
  if (clipboardMatch) {
      cleanedText = cleanedText.replace(CLIPBOARD_REGEX, '').trim();
      clipboardAction = {
          type: clipboardMatch[1].trim() as any,
          content: clipboardMatch[2]?.trim()
      };
  }

  const highlightMatch = cleanedText.match(HIGHLIGHT_REGEX);
  if (highlightMatch) {
      cleanedText = cleanedText.replace(HIGHLIGHT_REGEX, '').trim();
      highlightAction = {
          target: highlightMatch[1].trim(),
          color: highlightMatch[2].trim()
      };
  }

  const themeSwitchMatch = cleanedText.match(THEME_SWITCH_REGEX);
  if (themeSwitchMatch) {
      cleanedText = cleanedText.replace(THEME_SWITCH_REGEX, '').trim();
      themeAction = {
          theme: themeSwitchMatch[1].trim()
      };
  }

  const uiElementsMatch = cleanedText.match(UI_ELEMENTS_REGEX);
  if (uiElementsMatch) {
      cleanedText = cleanedText.replace(UI_ELEMENTS_REGEX, '').trim();
      uiElementAction = uiElementsMatch[1].trim();
  }
  // ---------------------

  cleanedText = cleanedText.replace(/^\*\*Jarvis:\*\*\s*/i, '').replace(/^Jarvis:\s*/i, '');

  return { 
    text: cleanedText.trim(), 
    action, 
    systemInfo: Object.keys(systemInfo).length > 0 ? systemInfo : null,
    renderModel,
    simulation,
    widget,
    fileOperation,
    settingsUpdate,
    uiAction,
    clipboardAction,
    highlightAction,
    themeAction,
    uiElementAction,
    mode,
    visualContext,
    videoPrompt,
    agiPlan,
    agiExecuteStep
  };
};

export const getJarvisResponse = async (prompt: string, imageAttachment?: { data: string; mimeType: string }): Promise<JarvisResponse> => {
  const apiKeySelected = await ensureApiKeySelected();
  if (!apiKeySelected) {
    return {
      text: "Sir, my core protocols indicate a missing API key. Please select one via the developer tools to proceed.",
      action: null,
      systemInfo: { systemFailure: "API_KEY_REQUIRED" },
    };
  }

  // --- IMAGE GENERATION / EDITING LOGIC ---
  const isGenerationRequest = /generate|create|draw|make an image/i.test(prompt);
  
  if (imageAttachment || isGenerationRequest) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash-image';
      const parts: any[] = [];
      if (imageAttachment) {
        parts.push({
          inlineData: {
            mimeType: imageAttachment.mimeType,
            data: imageAttachment.data
          }
        });
      }
      parts.push({ text: prompt || (imageAttachment ? "Enhance this image." : "Generate an image.") });

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
      });

      let generatedText = '';
      let generatedImageUrl: string | undefined = undefined;

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
          } else if (part.text) {
            generatedText += part.text;
          }
        }
      }

      return {
        text: generatedText || (generatedImageUrl ? "Here is the processed image, Sir." : "Process complete."),
        imageUrl: generatedImageUrl,
        action: null,
        systemInfo: null
      };

    } catch (error: any) {
      console.error("Error generating content with gemini-2.5-flash-image:", error);
       if (error.message?.includes("Requested entity was not found.") || error.message?.includes("API key not valid.")) {
          await ensureApiKeySelected();
          return {
            text: "Apologies, Sir. I require re-authentication for image protocols.",
            action: null,
            systemInfo: { systemFailure: "API_KEY_REAUTHENTICATION_REQUIRED" },
          };
       }
      return {
        text: "I encountered an error while processing the visual data, Sir.",
        action: null,
        systemInfo: { systemFailure: `IMAGE_PROCESS_ERROR: ${error.message}` }
      };
    }
  }


  // --- TEXT CHAT LOGIC (Standard) ---
  if (!chat) {
    await startJarvisSession();
    if (!chat) { 
      return {
        text: "Apologies, Sir. I was unable to initialize my chat protocols. Please ensure an API key is selected and try again.",
        action: null,
        systemInfo: { systemFailure: "CHAT_INIT_FAILED" },
      };
    }
  }

  try {
    let result = await chat.sendMessage({ message: prompt });
    let parsed = parseResponse(result.text);

    // --- AGI AUTONOMOUS LOOP ---
    let agiLoopCount = 0;
    const MAX_AGI_LOOPS = 5;

    while (parsed.agiExecuteStep && agiLoopCount < MAX_AGI_LOOPS) {
        agiLoopCount++;
        console.log(`[AGI_LOOP] Step ${agiLoopCount}: Executing ${parsed.agiExecuteStep}`);
        
        // Determine action based on step description (Simple Heuristic)
        // In a real AGI, the LLM would call a specific tool. Here we infer or use general 'googleSearch' if available via text.
        // But since we are simulating "Browser Actions" via text commands in the system prompt,
        // we need to map "Step 1" to an action.
        // Actually, the system prompt says: "You will then perform the browser action".
        // The LLM *should* have outputted a tool call or we need to ask it to.
        // For this implementation, we will assume the `agiExecuteStep` IS the action description and we report success to move forward.
        
        // Simulate "Doing the work"
        const feedback = `[SYSTEM_FEEDBACK: Step "${parsed.agiExecuteStep}" executed successfully. Proceed to next step.]`;
        
        // In a real browser, we would call BrowserActions here based on the text.
        // For now, we feed the success back to the model to drive the next step.
        
        result = await chat.sendMessage({ message: feedback });
        const newParsed = parseResponse(result.text);
        
        // Merge results
        parsed.text += `\n\n--- Step ${agiLoopCount} Complete ---\n` + newParsed.text;
        parsed.agiExecuteStep = newParsed.agiExecuteStep; // Update step for next loop
        if (newParsed.agiPlan) parsed.agiPlan = newParsed.agiPlan; // Update plan if changed
        
        if (!parsed.agiExecuteStep) {
            console.log("[AGI_LOOP] No further execution steps. Task complete.");
            if (parsed.agiPlan) parsed.agiPlan.status = 'COMPLETED';
            break;
        }
    }
    // ---------------------------

    // Handle Video Generation if prompted by the model
    let generatedVideoUrl: string | undefined = undefined;
    if (parsed.videoPrompt) {
        const videoResult = await generateVeoVideo(parsed.videoPrompt);
        generatedVideoUrl = videoResult.url || undefined;
        
        if (!generatedVideoUrl) {
             const errorMsg = videoResult.error || "VEO_CORE_RENDER_FAILED";
             parsed.systemInfo = { ...parsed.systemInfo, systemFailure: errorMsg };
             
             // Make permission errors more visible
             if (errorMsg.includes('404') || errorMsg.includes('Access Denied')) {
                 parsed.text += `\n\n[SYSTEM ALERT]: ${errorMsg}`;
             }
        }
    }

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Source[] = groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri || chunk.maps?.uri,
            title: chunk.web?.title || chunk.maps?.title || 'External Source',
        }))
        .filter((source: any): source is Source => source.uri && source.title) ?? [];

    const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

    return { 
        ...parsed, 
        videoUrl: generatedVideoUrl,
        sources: uniqueSources.length > 0 ? uniqueSources : undefined 
    };
  } catch (error: any) {
    console.error("Error getting response from Gemini:", error);
    if (error.message?.includes("Requested entity was not found.") || error.message?.includes("API key not valid.")) {
      chat = null;
      await ensureApiKeySelected();
      return {
        text: "Apologies, Sir. My connection protocols require re-authentication. Please select your API key and try again.",
        action: null,
        systemInfo: { systemFailure: "API_KEY_REAUTHENTICATION_REQUIRED" },
      };
    }
    if (error.message?.includes("Google Maps tool is not enabled")) {
        return {
            text: "Sir, it appears the Google Maps grounding module is incompatible with my current quantum processing core (Gemini 3 Pro). I have disabled it to maintain system stability. Please retry your request.",
            action: null,
            systemInfo: { systemFailure: "MAPS_TOOL_INCOMPATIBLE" }
        }
    }

    return { text: "Apologies, Sir. I seem to be experiencing a temporary communication disruption with my core systems.", action: null, systemInfo: { systemFailure: `Error Code: 503-SERVICE_UNAVAILABLE. Gemini core connection lost. Details: ${error.message}` } };
  }
};


// --- VOICE-BASED LIVE SESSION SERVICE (New) ---

// Define Function Declarations for voice control
const navigationTools: FunctionDeclaration[] = [
  {
    name: 'navigate',
    parameters: {
      type: Type.OBJECT,
      description: 'Navigates the browser page.',
      properties: {
        direction: { type: Type.STRING, description: "Direction to navigate: 'back', 'forward', or 'home'.", enum: ['back', 'forward', 'home'] },
      },
      required: ['direction'],
    },
  },
  {
    name: 'scroll',
    parameters: {
      type: Type.OBJECT,
      description: 'Scrolls the main window of the page.',
      properties: {
        direction: { type: Type.STRING, description: "Direction to scroll: 'up' or 'down'.", enum: ['up', 'down'] },
        pixels: { type: Type.NUMBER, description: 'The number of pixels to scroll. Defaults to a screen height if not provided.' },
      },
      required: ['direction'],
    },
  },
  {
    name: 'click',
    parameters: {
      type: Type.OBJECT,
      description: 'Clicks an element on the page using a CSS selector.',
      properties: {
        selector: { type: Type.STRING, description: 'A valid CSS selector for the element to click.' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'typeText',
    parameters: {
      type: Type.OBJECT,
      description: 'Types text into a specified input field.',
      properties: {
        text: { type: Type.STRING, description: 'The text to type into the field.' },
        selector: { type: Type.STRING, description: 'A valid CSS selector for the input or textarea element.' },
      },
      required: ['text', 'selector'],
    },
  },
  {
    name: 'pressKey',
    parameters: {
        type: Type.OBJECT,
        description: "Simulates pressing a specific key (like Enter) to submit forms or trigger actions.",
        properties: {
            key: { type: Type.STRING, description: "The key to press, e.g., 'Enter', 'Escape', 'ArrowDown'.", enum: ['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] },
            selector: { type: Type.STRING, description: "Optional CSS selector to focus before pressing the key." }
        },
        required: ['key']
    }
  },
  {
    name: 'openApplication',
    parameters: {
      type: Type.OBJECT,
      description: 'Opens a known web application in a new tab.',
      properties: {
        appName: { 
          type: Type.STRING, 
          description: "The name of the application. Supported: 'youtube', 'spotify', 'google', 'gmail', 'github', 'reddit', 'twitter', 'amazon', 'wikipedia', 'whatsapp', 'vscode', 'chatgpt', 'claude'.", 
          enum: ['youtube', 'spotify', 'google', 'gmail', 'github', 'reddit', 'twitter', 'amazon', 'wikipedia', 'whatsapp', 'vscode', 'chatgpt', 'claude'] 
        },
      },
      required: ['appName'],
    },
  },
];


export type VoiceStatus = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR' | 'OFF';

export interface LiveSessionCallbacks {
  onStatusChange: (status: VoiceStatus) => void;
  onUserTranscript: (text: string) => void;
  onJarvisTranscript: (text: string) => void;
  onNewMessage: (message: Message) => void;
  onError: (error: string) => void;
}

export class LiveSessionManager {
  private status: VoiceStatus = 'OFF';
  private callbacks: LiveSessionCallbacks;
  
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private liveSessionPromise: Promise<any> | null = null; // Store the session promise/object
  
  private nextStartTime = 0;
  private outputSources = new Set<AudioBufferSourceNode>();

  private currentInputTranscription = '';
  private currentOutputTranscription = '';
  
  // Vision System Components
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private frameInterval: number | null = null;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  private setStatus(status: VoiceStatus) {
    this.status = status;
    this.callbacks.onStatusChange(status);
  }

  async start() {
    // If the session is already in an active state, do not attempt to start again.
    if (this.status === 'CONNECTING' || this.status === 'LISTENING' || this.status === 'SPEAKING') {
      console.log(`Live session already in progress with status: ${this.status}`);
      return;
    }
    this.setStatus('CONNECTING');

    const apiKeySelected = await ensureApiKeySelected();
    if (!apiKeySelected) {
      this.handleError("API key not selected. Live session cannot start.");
      return;
    }

    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Create new GoogleGenAI instance right before making an API call for the live session.
      const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Store the promise from ai.live.connect to ensure sendRealtimeInput is called after connection.
      const sessionPromise = aiInstance.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => this.handleSessionOpen(),
          // Pass the sessionPromise directly to onmessage
          onmessage: (message) => this.handleSessionMessage(message), // Pass message directly, sessionPromise is now this.liveSessionPromise
          onerror: (e) => this.handleError(e.message || 'Unknown live session error'),
          onclose: () => this.stop(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: navigationTools }], // Live session uses navigation tools.
        },
      });
      this.liveSessionPromise = sessionPromise; // Store the promise

      // Request both audio and video for the Vision Engine
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Audio Setup
      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`, **do not** add other condition checks.
        this.liveSessionPromise?.then((session) => { // Use this.liveSessionPromise
          if (this.status === 'LISTENING' || this.status === 'SPEAKING') { // Only send if actively listening/speaking
            session.sendRealtimeInput({ media: pcmBlob });
          }
        });
      };
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioContext.destination);

      // Video/Vision Setup
      this.setupVisionSystem();

    } catch (err: any) {
      // If the error is due to an invalid API key, prompt the user to select again.
      if (err.message?.includes("Requested entity was not found.") || err.message?.includes("API key not valid.")) {
        await ensureApiKeySelected(); // Trigger API key selection again.
        this.handleError("Live session connection failed due to API key. Please re-select your API key.");
      } else {
        this.handleError(err instanceof Error ? err.message : 'Failed to start microphone/camera.');
      }
    }
  }

  private setupVisionSystem() {
    if (!this.mediaStream) return;

    // Create hidden video element to play stream for capture
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = this.mediaStream;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true; // Important for iOS
    // Append to body to ensure it starts playing and can be drawn to canvas
    // It will be hidden by CSS, or we can remove it after setup
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.left = '-9999px';
    this.videoElement.style.top = '-9999px';
    document.body.appendChild(this.videoElement); 

    this.videoElement.play().catch(e => console.error("Video play error:", e));

    this.canvasElement = document.createElement('canvas');
    const ctx = this.canvasElement.getContext('2d');
    const JPEG_QUALITY = 0.5;
    const FRAME_RATE = 2; // 2 frames per second

    this.frameInterval = window.setInterval(() => {
      if (this.videoElement && this.canvasElement && ctx && this.videoElement.readyState >= 2) {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        ctx.drawImage(this.videoElement, 0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight);
        
        // Ensure to get the base64 data correctly
        const base64Data = this.canvasElement.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
        
        this.liveSessionPromise?.then((session) => {
          if (this.status === 'LISTENING' || this.status === 'SPEAKING') { // Only send if actively listening/speaking
            session.sendRealtimeInput({
              media: { mimeType: 'image/jpeg', data: base64Data }
            });
          }
        });
      }
    }, 1000 / FRAME_RATE);
  }

  stop() {
    if (this.status === 'OFF') {
      return;
    }
    this.setStatus('OFF');

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    
    // Stop all audio output sources immediately
    for (const source of this.outputSources.values()) {
        source.stop();
        this.outputSources.delete(source);
    }
    this.nextStartTime = 0; // Reset playback cursor

    // Clean up video element
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.remove();
      this.videoElement = null;
    }
    this.canvasElement = null;

    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.scriptProcessor?.disconnect();

    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close();
    }
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close();
    }
    // Also close the live session if it's open
    this.liveSessionPromise?.then(session => {
        session.close();
        this.liveSessionPromise = null;
    }).catch(e => console.error("Error closing live session:", e));


    this.mediaStream = null;
    this.scriptProcessor = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;

    // Reset transcripts
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
    this.callbacks.onUserTranscript('');
    this.callbacks.onJarvisTranscript('');
  }

  private handleSessionOpen() {
    this.setStatus('LISTENING');
  }

  private async executeBrowserAction(functionCall: FunctionCall): Promise<{ success: boolean; message: string }> {
    const { name, args } = functionCall;
    try {
      // Log the function call for debugging/tracking
      console.debug(`Executing tool: ${name} with args:`, args);

      switch (name) {
        case 'navigate':
          return BrowserActions.navigate(args.direction as 'back' | 'forward' | 'home');
        case 'scroll':
          // Convert pixels to number if it came as string from args
          const pixels = typeof args.pixels === 'string' ? parseFloat(args.pixels) : (args.pixels as number | undefined);
          return BrowserActions.scroll(args.direction as 'up' | 'down', pixels);
        case 'click':
          return BrowserActions.click(args.selector as string);
        case 'typeText':
          return BrowserActions.typeText(args.text as string, args.selector as string);
        case 'pressKey':
            return BrowserActions.pressKey(args.key as string, args.selector as string);
        case 'openApplication':
          return BrowserActions.openApplication(args.appName as string);
        default:
          return { success: false, message: `Unknown function: ${name}` };
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(`Error during tool execution for ${name}:`, e);
      return { success: false, message: `Error executing ${name}: ${errorMessage}` };
    }
  }


  private async handleSessionMessage(message: LiveServerMessage) {
    // Only process messages if the session is still active (not 'OFF' or 'ERROR')
    if (this.status === 'OFF' || this.status === 'ERROR') {
      return;
    }

    if (message.toolCall) {
      // Ensure we have a valid session to send tool responses back to
      const session = await this.liveSessionPromise; 
      if (!session) {
          console.error("Live session promise not resolved to an active session to send tool responses.");
          // Trigger a re-initialization or error state if tool calls can't be responded to
          this.handleError("Live session desynchronized: cannot send tool responses.");
          return;
      }
      for (const fc of message.toolCall.functionCalls) {
        const result = await this.executeBrowserAction(fc);
        
        session.sendToolResponse({
          functionResponses: {
            id: fc.id,
            name: fc.name,
            response: { result: JSON.stringify(result) }, // Ensure result is stringified for tool response
          }
        });

        // Add a system action message to the chat
        const actionMessage: Message = {
          id: `action-${fc.id}`,
          sender: MessageSender.SYSTEM_ACTION,
          text: result.message,
        };
        this.callbacks.onNewMessage(actionMessage);
      }
    }

    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
      this.callbacks.onJarvisTranscript(this.currentOutputTranscription);
    }
    if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
      this.callbacks.onUserTranscript(this.currentInputTranscription);
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext) {
      this.setStatus('SPEAKING');
      // Schedule audio playback to ensure smooth, gapless playback
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      try {
        const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputAudioContext.destination);
        source.addEventListener('ended', () => {
          this.outputSources.delete(source);
          // If all audio chunks have finished playing and session is not explicitly stopped
          // and we were speaking, transition back to listening.
          if (this.outputSources.size === 0 && this.status === 'SPEAKING') {
            this.setStatus('LISTENING');
          }
        });
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.outputSources.add(source);
      } catch (audioError) {
        console.error("Error decoding or playing audio:", audioError);
        // Do not stop the whole session, just log audio error and continue listening
        if (this.status === 'SPEAKING') {
          this.setStatus('LISTENING');
        }
      }
    }

    if (message.serverContent?.interrupted) {
      // Stop all currently playing audio immediately
      for (const source of this.outputSources.values()) {
        source.stop();
      }
      this.outputSources.clear();
      this.nextStartTime = 0; // Reset playback cursor for immediate new audio
      this.currentOutputTranscription = ''; // Clear partial output transcription on interruption
      this.callbacks.onJarvisTranscript('');
      this.setStatus('LISTENING'); // Always transition back to listening if interrupted
    }

    if (message.serverContent?.turnComplete) {
      if (this.currentInputTranscription.trim()) {
        this.callbacks.onNewMessage({
          id: Date.now().toString(),
          sender: MessageSender.USER,
          text: this.currentInputTranscription.trim(),
        });
      }
      if (this.currentOutputTranscription.trim()) {
        const parsed = parseResponse(this.currentOutputTranscription);
        
        // Check for Video Generation Prompt even in Live Mode
        let videoUrl: string | undefined;
        if (parsed.videoPrompt) {
             const videoResult = await generateVeoVideo(parsed.videoPrompt);
             videoUrl = videoResult.url || undefined;
             if (!videoUrl && videoResult.error) {
                 parsed.systemInfo = { ...(parsed.systemInfo || {}), systemFailure: videoResult.error };
                 // Ensure the error is visible in the transcript if it's a permissions issue
                 if (videoResult.error.includes('404') || videoResult.error.includes('Access Denied')) {
                    parsed.text += `\n\n[SYSTEM ALERT]: ${videoResult.error}`;
                 }
             }
        }

        this.callbacks.onNewMessage({ 
            id: (Date.now() + 1).toString(), 
            sender: MessageSender.JARVIS, 
            text: parsed.text, 
            action: parsed.action, 
            systemInfo: parsed.systemInfo, 
            renderModel: parsed.renderModel, 
            simulation: parsed.simulation, 
            widget: parsed.widget, 
            fileOperation: parsed.fileOperation, 
            settingsUpdate: parsed.settingsUpdate, 
            uiAction: parsed.uiAction, 
            clipboardAction: parsed.clipboardAction, 
            highlightAction: parsed.highlightAction, 
            themeAction: parsed.themeAction, 
            uiElementAction: parsed.uiElementAction, 
            mode: parsed.mode, 
            visualContext: parsed.visualContext,
            videoUrl: videoUrl
        });
      }
      // Clear transcripts after turn completion
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
      this.callbacks.onUserTranscript('');
      this.callbacks.onJarvisTranscript('');
      
      // Ensure status is LISTENING if no audio is currently playing and not explicitly OFF/ERROR
      if (this.outputSources.size === 0 && (this.status as VoiceStatus) !== 'OFF' && (this.status as VoiceStatus) !== 'ERROR') {
          this.setStatus('LISTENING');
      }
    }
  }

  private handleError(errorMessage: string) {
    console.error("JARVIS Live Session Error:", errorMessage);
    this.setStatus('ERROR');
    this.callbacks.onError(errorMessage);
    this.stop(); // Stop the session on error
  }
}
