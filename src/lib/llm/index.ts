// Unified LLM interface for both OpenAI and Anthropic
import { OpenAIAPI, OpenAIRequest } from './openai';
import { AnthropicAPI, AnthropicRequest } from './anthropic';

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMRequest {
  prompt: string;
  imageBase64?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class LLMService {
  private openai: OpenAIAPI | null = null;
  private anthropic: AnthropicAPI | null = null;

  constructor() {}

  setAPIKey(provider: LLMProvider, apiKey: string) {
    if (provider === 'openai') {
      this.openai = new OpenAIAPI(apiKey);
    } else if (provider === 'anthropic') {
      this.anthropic = new AnthropicAPI(apiKey);
    }
  }

  async analyzeChart(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    console.log('LLMService.analyzeChart called with provider:', provider);
    console.log('OpenAI configured:', !!this.openai);
    console.log('Anthropic configured:', !!this.anthropic);
    
    if (provider === 'openai') {
      if (!this.openai) {
        throw new Error('OpenAI API key not set');
      }
      console.log('Calling OpenAI analyzeChart');
      const response = await this.openai.analyzeChart(request as OpenAIRequest);
      return response;
    } else if (provider === 'anthropic') {
      if (!this.anthropic) {
        throw new Error('Anthropic API key not set');
      }
      console.log('Calling Anthropic analyzeChart');
      const response = await this.anthropic.analyzeChart(request as AnthropicRequest);
      return response;
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  }

  async chat(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    if (provider === 'openai') {
      if (!this.openai) {
        throw new Error('OpenAI API key not set');
      }
      const response = await this.openai.chat(request as OpenAIRequest);
      return response;
    } else if (provider === 'anthropic') {
      if (!this.anthropic) {
        throw new Error('Anthropic API key not set');
      }
      const response = await this.anthropic.chat(request as AnthropicRequest);
      return response;
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  }

  isConfigured(provider: LLMProvider): boolean {
    if (provider === 'openai') {
      return this.openai !== null;
    } else if (provider === 'anthropic') {
      return this.anthropic !== null;
    }
    return false;
  }
}

// Export singleton instance
export const llmService = new LLMService(); 