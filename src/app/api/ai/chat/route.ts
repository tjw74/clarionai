import { NextRequest } from 'next/server';
import { convertToModelMessages, streamText } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic, createAnthropic } from '@ai-sdk/anthropic';

type Provider = 'openai' | 'anthropic';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages: uiMessages, provider, apiKey } = body as {
      messages: any[];
      provider: Provider;
      apiKey?: string;
    };

    // Select provider client
    const anthropicProvider = apiKey ? createAnthropic({ apiKey }) : anthropic;
    const openaiProvider = apiKey ? createOpenAI({ apiKey }) : openai;
    const model = provider === 'anthropic'
      ? anthropicProvider.chat('claude-3-5-sonnet-20240620')
      : openaiProvider.chat('gpt-4o');

    const result = await streamText({
      model,
      messages: convertToModelMessages(uiMessages as any),
    });

    return result.toUIMessageStreamResponse({ originalMessages: uiMessages as any });
  } catch (err) {
    return new Response(`Chat route error: ${err instanceof Error ? err.message : 'Unknown error'}`, { status: 500 });
  }
}


