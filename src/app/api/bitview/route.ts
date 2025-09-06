import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Extract the query parameters
  const index = searchParams.get('index');
  const ids = searchParams.get('ids');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const count = searchParams.get('count');
  const format = searchParams.get('format') || 'json';
  
  if (!index || !ids) {
    return NextResponse.json({ error: 'Missing required parameters: index and ids' }, { status: 400 });
  }
  
  // Parse the ids parameter - it can be a single metric or comma-separated list
  const metricIds = ids.split(',').map(id => id.trim());
  
  // If only one metric and it's not 'date', use direct access pattern
  if (metricIds.length === 1 && metricIds[0] !== 'date') {
    const metricId = metricIds[0];
    const bitviewUrl = `https://bitview.space/api/vecs/${index}-to-${metricId}`;
    const url = new URL(bitviewUrl);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (count) url.searchParams.set('count', count);
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'ClarionAI/1.0.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      
      // Return the data with proper CORS headers
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } catch (error) {
      console.error('Error fetching from bitview.space:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data from bitview.space' },
        { status: 500 }
      );
    }
  }
  
  // For multiple metrics or just 'date', fetch each metric separately and combine
  if (metricIds.length > 1 || metricIds[0] === 'date') {
    try {
      const promises = metricIds.map(async (metricId) => {
        const singleUrl = `https://bitview.space/api/vecs/${index}-to-${metricId}`;
        const url = new URL(singleUrl);
        if (from) url.searchParams.set('from', from);
        if (to) url.searchParams.set('to', to);
        if (count) url.searchParams.set('count', count);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'ClarionAI/1.0.0',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for metric ${metricId}`);
        }
        
        const data = await response.json();
        return { metric: metricId, data };
      });
      
      const results = await Promise.all(promises);
      
      // If we only have one metric, return it directly
      if (results.length === 1) {
        return new NextResponse(JSON.stringify(results[0].data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      
      // For multiple metrics, return as array format [dates, metric1, metric2, ...]
      const dataArrays = results.map(r => r.data);
      
      return new NextResponse(JSON.stringify(dataArrays), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } catch (error) {
      console.error('Error fetching multiple metrics from bitview.space:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data from bitview.space' },
        { status: 500 }
      );
    }
  }
  
  // For single non-date metrics, use the query API as fallback
  const bitviewUrl = new URL('https://bitview.space/api/vecs/query');
  bitviewUrl.searchParams.set('index', index);
  bitviewUrl.searchParams.set('ids', ids);
  if (from) bitviewUrl.searchParams.set('from', from);
  if (to) bitviewUrl.searchParams.set('to', to);
  if (count) bitviewUrl.searchParams.set('count', count);
  bitviewUrl.searchParams.set('format', format);
  
  try {
    // Make the request to bitview.space
    const response = await fetch(bitviewUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'ClarionAI/1.0.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.text();
    
    // Return the data with proper CORS headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching from bitview.space:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from bitview.space' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
