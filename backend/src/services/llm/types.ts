export interface LlmMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}