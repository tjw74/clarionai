import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('API Route: Starting request processing');
  
  try {
    const body = await request.json();
    console.log('API Route: Request body parsed successfully');
    
    const { prompt, imageBase64, maxTokens = 1000, temperature = 0.7 } = body;
    
    console.log('API Route received:', { 
      prompt: prompt?.substring(0, 100) + '...',
      hasImage: !!imageBase64,
      imageSize: imageBase64?.length || 0,
      maxTokens,
      temperature 
    });

    const requestContent: unknown[] = [
      {
        type: 'text',
        text: prompt
      }
    ];

    // Add image if provided and not too large
    if (imageBase64 && imageBase64.length < 20000000) {
      requestContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: imageBase64
        }
      });
    }

    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    console.log('API Route: Making request to Anthropic API');
    console.log('API Route: Request content length:', requestContent.length);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: requestContent
          }
        ]
      }),
    });

    console.log('API Route: Anthropic API response status:', response.status);
    console.log('API Route: Anthropic API response ok:', response.ok);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('API Route: Anthropic API error:', error);
      return NextResponse.json(
        { error: `Anthropic API error: ${error.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    console.log('API Route: Parsing Anthropic API response');
    const data = await response.json();
    
    console.log('Anthropic API response:', data);
    console.log('Data content structure:', JSON.stringify(data.content, null, 2));
    
    // Handle different possible response structures
    let content = '';
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      if (data.content[0].text) {
        content = data.content[0].text;
      } else if (data.content[0].content) {
        content = data.content[0].content;
      }
    } else if (data.content && typeof data.content === 'string') {
      content = data.content;
    }
    
    console.log('Extracted content:', content);
    console.log('Returning to client:', { content: content, usage: data.usage });
    
    return NextResponse.json({
      content: content,
      usage: data.usage
    });

  } catch (error) {
    console.error('Anthropic proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 