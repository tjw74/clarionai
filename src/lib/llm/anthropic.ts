// Anthropic API wrapper for chart analysis
export interface AnthropicResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicRequest {
  prompt: string;
  imageBase64?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AnthropicAPI {
  private apiKey: string;
  private baseURL = '/api/anthropic'; // Use our server-side proxy

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeChart(request: AnthropicRequest): Promise<AnthropicResponse> {
    const { prompt, imageBase64, maxTokens = 1000, temperature = 0.7 } = request;

    const content: unknown[] = [
      {
        type: 'text',
        text: prompt
      }
    ];

    // Add image if provided and not too large
    if (imageBase64 && imageBase64.length < 20000000) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: imageBase64
        }
      });
    }

    let response;
    try {
      console.log('Anthropic client making request to:', this.baseURL);
      console.log('Request payload:', {
        prompt: prompt?.substring(0, 100) + '...',
        hasImage: !!imageBase64,
        maxTokens,
        temperature
      });
      
      response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          imageBase64,
          maxTokens,
          temperature
        }),
      });

      console.log('Anthropic client response status:', response.status);
      console.log('Anthropic client response ok:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('Anthropic client error response:', error);
        throw new Error(`Anthropic API error: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Anthropic client fetch error details:', error);
      throw error;
    }

    let data;
    try {
      console.log('Anthropic client: About to parse response JSON');
      const responseText = await response.text();
      console.log('Anthropic client raw response text length:', responseText.length);
      console.log('Anthropic client raw response text preview:', responseText.substring(0, 200) + '...');
      
      data = JSON.parse(responseText);
      console.log('Anthropic client received data:', data);
      console.log('Anthropic client data.content:', data.content);
      console.log('Anthropic client data.content type:', typeof data.content);
      console.log('Anthropic client data.content length:', data.content?.length);
      console.log('Anthropic client data keys:', Object.keys(data));
      console.log('Anthropic client full data structure:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Anthropic client JSON parse error:', parseError);
      throw new Error('Failed to parse response from API route');
    }
    
    console.log('Anthropic client returning:', { content: data.content, usage: data.usage });
    
    return {
      content: data.content,
      usage: data.usage
    };
  }

  async chat(request: AnthropicRequest): Promise<AnthropicResponse> {
    const { prompt, maxTokens = 500, temperature = 0.7 } = request;

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
        temperature
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content,
      usage: data.usage
    };
  }
} 