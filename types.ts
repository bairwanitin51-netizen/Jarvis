
export enum MessageSender {
  USER = 'USER',
  JARVIS = 'JARVIS',
  SYSTEM_ACTION = 'SYSTEM_ACTION',
  SYSTEM_INFO = 'SYSTEM_INFO',
}

export interface SystemAction {
  functionType: string;
  target: string;
  state: string;
  subProtocol: string;
}

/**
 * Simplified to only include essential failure information.
 */
export interface SystemInfo {
  systemFailure?: string;
}

export interface Source {
  uri: string;
  title: string;
}

export interface RenderModel {
  viewport: string;
  angle: string;
  style: string;
}

export interface Simulation {
  variable: string;
  duration: string;
  niche: string;
}

export interface Widget {
  title: string;
  type: string;
  color: string;
}

export interface FileOperation {
  filename: string;
  status: 'CREATING' | 'UPLOADED';
}

export interface JarvisSettings {
  sarcasmLevel: number; // 0-100
  voiceSpeed: number; // 0.5 - 2.0
  vpnStatus: 'ACTIVE' | 'INACTIVE';
  theme: 'CYBER' | 'DARK' | 'LIGHT';
}

export interface SettingsUpdate {
  key: string;
  value: string;
}

// --- M.U.I. Actions ---
export interface UiAction {
  type: 'SCROLL_UP' | 'SCROLL_DOWN' | 'SCROLL_TO_TOP' | 'SCROLL_TO_BOTTOM' | 'SCROLL_TO_TIMESTAMP' | 'LOCK' | 'UNLOCK';
  target?: string;
  amount?: string; // e.g., "50%"
}

export interface ClipboardAction {
  type: 'COPY' | 'BATCH_COPY';
  content?: string;
  targetType?: string; // 'LINKS', 'CODE', etc.
}

export interface HighlightAction {
  target: string;
  color: string; // 'YELLOW', 'RED', 'GREEN', 'BLUE'
  style?: string;
}

export interface ThemeAction {
  theme: string; // 'OLED_BLACK', 'CYBERNETIC', etc.
  mode?: 'FOCUS' | 'NORMAL';
}
// -----------------------

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  action?: SystemAction;
  systemInfo?: SystemInfo;
  sources?: Source[];
  renderModel?: RenderModel;
  simulation?: Simulation;
  widget?: Widget;
  fileOperation?: FileOperation;
  settingsUpdate?: SettingsUpdate;
  
  // M.U.I. Fields
  uiAction?: UiAction;
  clipboardAction?: ClipboardAction;
  highlightAction?: HighlightAction;
  themeAction?: ThemeAction;
  uiElementAction?: string; // e.g., 'HIDE_ALL_EXCEPT_TEXT'

  mode?: string;
  visualContext?: string;
  agiPlan?: AgiPlan;
}

export enum Protocol {
  NORMAL = 'NORMAL',
  CLEAN_SLATE = 'CLEAN_SLATE',
  VERONICA = 'VERONICA',
  HOUSE_PARTY = 'HOUSE_PARTY',
  SILENT_NIGHT = 'SILENT_NIGHT',
  AGI_BROWSER = 'AGI_BROWSER',
}

export enum AppMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export interface AgiPlan {
  steps: string[];
  currentStepIndex: number;
  status: 'PLANNING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}
