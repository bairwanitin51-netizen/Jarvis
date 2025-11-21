
import { GoogleGenAI, Chat, Modality, LiveServerMessage, FunctionDeclaration, Type, FunctionCall } from "@google/genai";
import { JARVIS_SYSTEM_INSTRUCTION } from '../constants';
import { MessageSender, type SystemAction, type SystemInfo, type Message, type Source } from '../types';
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
    // Open the API key selection dialog, providing the billing documentation link.
    await window.aistudio.openSelectKey({
      billingLink: BILLING_DOC_LINK
    });
    // Assume success after triggering openSelectKey() to mitigate race condition
    return true;
  } catch (error) {
    console.error("User did not select API key or an error occurred:", error);
    // Optionally, inform the user in the UI if needed
    return false;
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
  // Create a new GoogleGenAI instance for each session to ensure the latest API key is used.
  const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chat = aiInstance.chats.create({
    // Changed model to 'gemini-3-pro-preview' as per coding guidelines for complex text tasks.
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
      tools: [{googleSearch: {}}], // Text chat uses Google Search grounding.
    },
  });
};

const ACTION_REGEX = /\[SYSTEM_ACTION:\s*(.*?)\s*\|\s*Target:\s*(.*?)\s*\|\s*State:(.*?)\]/;
const FAILURE_REGEX = /\[SYSTEM_FAILURE:\s*(.*?)\]/;


interface JarvisResponse {
  text: string;
  action: SystemAction | null;
  systemInfo: SystemInfo | null;
  sources?: Source[];
}

const parseResponse = (text: string): Omit<JarvisResponse, 'sources'> => {
  let cleanedText = text;
  let action: SystemAction | null = null;
  const systemInfo: SystemInfo = {};

  const actionMatch = cleanedText.match(ACTION_REGEX);
  if (actionMatch) {
    cleanedText = cleanedText.replace(ACTION_REGEX, '').trim();
    action = { functionType: actionMatch[1].trim(), target: actionMatch[2].trim(), state: actionMatch[3].trim(), subProtocol: 'Default' };
  }
  
  const failureMatch = cleanedText.match(FAILURE_REGEX);
  if (failureMatch) {
    cleanedText = cleanedText.replace(FAILURE_REGEX, '').trim();
    systemInfo.systemFailure = failureMatch[1].trim();
  }

  return { text: cleanedText, action, systemInfo: Object.keys(systemInfo).length > 0 ? systemInfo : null };
};

export const getJarvisResponse = async (prompt: string): Promise<JarvisResponse> => {
  const apiKeySelected = await ensureApiKeySelected();
  if (!apiKeySelected) {
    return {
      text: "Sir, my core protocols indicate a missing API key. Please select one via the developer tools to proceed.",
      action: null,
      systemInfo: { systemFailure: "API_KEY_REQUIRED" },
    };
  }

  // If chat session is not active or was invalidated, attempt to start/restart it.
  if (!chat) {
    await startJarvisSession();
    if (!chat) { // If startJarvisSession failed to create chat (e.g., API key not selected)
      return {
        text: "Apologies, Sir. I was unable to initialize my chat protocols. Please ensure an API key is selected and try again.",
        action: null,
        systemInfo: { systemFailure: "CHAT_INIT_FAILED" },
      };
    }
  }

  try {
    const result = await chat.sendMessage({ message: prompt });
    const parsed = parseResponse(result.text);

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Source[] = groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title,
        }))
        .filter((source: any): source is Source => source.uri && source.title) ?? [];

    const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

    return { 
        ...parsed, 
        sources: uniqueSources.length > 0 ? uniqueSources : undefined 
    };
  } catch (error: any) {
    console.error("Error getting response from Gemini:", error);
    // If the error indicates a missing/invalid API key (common "entity not found"), invalidate chat and re-prompt.
    if (error.message?.includes("Requested entity was not found.") || error.message?.includes("API key not valid.")) {
      chat = null; // Invalidate current chat session.
      await ensureApiKeySelected(); // Trigger API key selection again.
      return {
        text: "Apologies, Sir. My connection protocols require re-authentication. Please select your API key and try again.",
        action: null,
        systemInfo: { systemFailure: "API_KEY_REAUTHENTICATION_REQUIRED" },
      };
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
    name: 'openApplication',
    parameters: {
      type: Type.OBJECT,
      description: 'Opens a known web application in a new tab.',
      properties: {
        appName: { 
          type: Type.STRING, 
          description: "The name of the application. Supported: 'youtube', 'spotify', 'google', 'gmail', 'github', 'reddit', 'twitter', 'amazon', 'wikipedia', 'whatsapp', 'vscode'.", 
          enum: ['youtube', 'spotify', 'google', 'gmail', 'github', 'reddit', 'twitter', 'amazon', 'wikipedia', 'whatsapp', 'vscode'] 
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
  private liveSession: ReturnType<GoogleGenAI['live']['connect']> | null = null; // Store the session promise/object
  
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
    if (this.status !== 'OFF' && this.status !== 'IDLE' && this.status !== 'ERROR') return;
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
          onmessage: (message) => this.handleSessionMessage(message, sessionPromise),
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
      this.liveSession = sessionPromise; // Store the promise

      // Request both audio and video for the Vision Engine
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Audio Setup
      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`, **do not** add other condition checks.
        this.liveSession?.then((session) => { // Use this.liveSession (which is the promise)
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioContext.destination);

      // Video/Vision Setup
      this.setupVisionSystem(sessionPromise);

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

  private setupVisionSystem(sessionPromise: Promise<any>) {
    if (!this.mediaStream) return;

    // Create hidden video element to play stream for capture
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = this.mediaStream;
    this.videoElement.muted = true;
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
        
        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: { mimeType: 'image/jpeg', data: base64Data }
          });
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
    this.liveSession?.then(session => {
        session.close();
        this.liveSession = null;
    }).catch(e => console.error("Error closing live session:", e));


    this.mediaStream = null;
    this.scriptProcessor = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
  }

  private handleSessionOpen() {
    this.setStatus('LISTENING');
  }

  private async executeBrowserAction(functionCall: FunctionCall): Promise<{ success: boolean; message: string }> {
    const { name, args } = functionCall;
    try {
      switch (name) {
        case 'navigate':
          return BrowserActions.navigate(args.direction as 'back' | 'forward' | 'home');
        case 'scroll':
          return BrowserActions.scroll(args.direction as 'up' | 'down', args.pixels as number | undefined);
        case 'click':
          return BrowserActions.click(args.selector as string);
        case 'typeText':
          return BrowserActions.typeText(args.text as string, args.selector as string);
        case 'openApplication':
          return BrowserActions.openApplication(args.appName as string);
        default:
          return { success: false, message: `Unknown function: ${name}` };
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      return { success: false, message: `Error executing ${name}: ${errorMessage}` };
    }
  }


  private async handleSessionMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    if (message.toolCall) {
      // Ensure we have a valid session to send tool responses back to
      const session = await sessionPromise; 
      if (!session) {
          console.error("Live session not available to send tool responses.");
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
      const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.addEventListener('ended', () => {
        this.outputSources.delete(source);
        if (this.outputSources.size === 0 && this.status === 'SPEAKING') { // Only transition if still speaking
          this.setStatus('LISTENING');
        }
      });
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.outputSources.add(source);
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
        const { text, action, systemInfo } = parseResponse(this.currentOutputTranscription);
        this.callbacks.onNewMessage({ id: (Date.now() + 1).toString(), sender: MessageSender.JARVIS, text, action, systemInfo });
      }
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
      this.callbacks.onUserTranscript('');
      this.callbacks.onJarvisTranscript('');
      // After turn complete, if no audio is playing, ensure status is LISTENING
      if (this.outputSources.size === 0 && this.status === 'SPEAKING') {
          this.setStatus('LISTENING');
      } else if (this.outputSources.size === 0 && this.status !== 'OFF' && this.status !== 'ERROR') {
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