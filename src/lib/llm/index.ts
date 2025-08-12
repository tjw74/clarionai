// All LLM functionality has moved to the AI SDK v5 via /api/ai/chat
export type LLMProvider = 'openai' | 'anthropic';
export interface LLMRequest { prompt: string; imageBase64?: string; maxTokens?: number; temperature?: number }
export interface LLMResponse { content: string }
export const llmService = undefined as never;