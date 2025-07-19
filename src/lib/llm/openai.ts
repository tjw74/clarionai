// OpenAI API wrapper for chart analysis
export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIRequest {
  prompt: string;
  imageBase64?: string;
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIAPI {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeChart(request: OpenAIRequest): Promise<OpenAIResponse> {
    const { prompt, imageBase64, maxTokens = 1000, temperature = 0.7 } = request;

    try {
      const messages: Array<{
        role: string;
        content: Array<{
          type: string;
          text?: string;
          image_url?: {
            url: string;
            detail: string;
          };
        }>;
      }> = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ];

      // Add image if provided
      if (imageBase64) {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: 'high'
          }
        });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async chat(request: OpenAIRequest): Promise<OpenAIResponse> {
    const { prompt, maxTokens = 500, temperature = 0.7 } = request;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
} 