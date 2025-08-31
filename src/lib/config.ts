// Application configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://bitview.space",
  },
  
  // App Configuration
  app: {
    name: "Clarion AI",
    version: "1.0.0",
  },
} as const;

// Helper function to get API URL
export function getApiUrl(endpoint: string): string {
  return `${config.api.baseUrl}${endpoint}`;
}
