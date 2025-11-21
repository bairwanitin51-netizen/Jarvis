
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

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  action?: SystemAction;
  systemInfo?: SystemInfo;
  sources?: Source[];
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