
export type Language = 'en' | 'ur';

export enum AnswerMode {
  SIMPLE = 'simple',
  STEP_BY_STEP = 'stepByStep',
  VISUAL = 'visual',
  SHORT = 'short',
  DETAILED = 'detailed',
  HANDWRITTEN = 'handwritten',
  EASY_NOTES = 'easyNotes',
}

export interface BilingualText {
  en: string;
  ur: string;
}

export interface SolutionResponse {
  simple: BilingualText;
  stepByStep: BilingualText;
  visual: BilingualText; // Mermaid diagram code
  short: BilingualText;
  detailed: BilingualText;
  handwrittenNotes: BilingualText;
  easyNotes: BilingualText; 
  subject: BilingualText;
}

export interface HistoryItem {
  id: string;
  question: string;
  timestamp: number;
  solution: SolutionResponse;
}

export interface QuestionInput {
  text: string;
  image?: File | null;
  audio?: Blob | null;
}

// Auth Types
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'user';

export interface User {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
