// Professional prompts for chart analysis
export interface AnalysisContext {
  selectedMetrics: string[];
  metricNames: Record<string, string>;
  timeRange?: string;
}

export function getChartAnalysisPrompt(context: AnalysisContext): string {
  const { selectedMetrics, metricNames, timeRange } = context;
  
  const metricList = selectedMetrics
    .map(key => `- ${metricNames[key] || key}`)
    .join('\n');

  return `You are an expert cryptocurrency and Bitcoin market analyst with deep knowledge of on-chain metrics and technical analysis.

I'm showing you a chart with the following Bitcoin metrics:
${metricList}

${timeRange ? `Time period: ${timeRange}` : ''}

Please provide a professional analysis that includes:

1. **Key Observations** (2-3 bullet points)
   - What are the most notable patterns or trends?
   - Any significant divergences or convergences?

2. **Market Context** (2-3 sentences)
   - What do these metrics suggest about current market conditions?
   - How do these indicators relate to Bitcoin's overall health?

3. **Risk Assessment** (1-2 sentences)
   - What potential risks or opportunities do you see?
   - Any warning signs or bullish signals?

Keep your analysis concise, professional, and actionable. Focus on insights that would be valuable to a sophisticated Bitcoin investor or analyst.

Format your response with clear sections and bullet points for easy reading.`;
}

export function getFollowUpPrompt(userQuestion: string, context: AnalysisContext): string {
  return `You are continuing a conversation about Bitcoin market analysis. 

Previous context: The user was analyzing a chart with these metrics:
${context.selectedMetrics.map(key => `- ${context.metricNames[key] || key}`).join('\n')}

User's follow-up question: "${userQuestion}"

Please provide a helpful, professional response that:
- Addresses their specific question
- Draws on your expertise in Bitcoin and cryptocurrency markets
- Maintains the analytical tone of the conversation
- Provides actionable insights when possible

Keep your response concise and focused on their question.`;
} 