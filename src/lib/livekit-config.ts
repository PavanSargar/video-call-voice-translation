/**
 * LiveKit configuration helpers
 * This centralizes the logic for handling LiveKit URLs and API endpoints
 */

/**
 * Gets the WebSocket URL for LiveKit client connections
 */
export function getLiveKitWsUrl(): string {
  const url = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!url) {
    throw new Error("LiveKit WebSocket URL not configured");
  }

  // Ensure it has the wss:// prefix
  if (!url.startsWith("wss://")) {
    console.warn("LiveKit WebSocket URL should start with wss://", { url });
  }

  return url;
}

/**
 * Gets the HTTP API URL for LiveKit server API calls
 */
export function getLiveKitApiUrl(): string {
  // First try the dedicated API URL if configured
  const apiUrl = process.env.LIVEKIT_API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  // Fall back to converting the WebSocket URL
  const wsUrl = getLiveKitWsUrl();
  const httpUrl = wsUrl.replace("wss://", "https://");

  // Return the correct API URL for LiveKit Cloud
  return httpUrl;
}

/**
 * Gets the API credentials for LiveKit
 */
export function getLiveKitCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit API credentials not configured");
  }

  return { apiKey, apiSecret };
}
