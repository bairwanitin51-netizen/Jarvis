
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
  mode?: string;
  visualContext?: string;
}

export enum Protocol {
  NORMAL = 'NORMAL',
  CLEAN_SLATE = 'CLEAN_SLATE',
  VERONICA = 'VERONICA',
  HOUSE_PARTY = 'HOUSE_PARTY',
  SILENT_NIGHT = 'SILENT_NIGHT',
}

export enum AppMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}
