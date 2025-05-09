import { RoomServiceClient } from "livekit-server-sdk";

/**
 * Returns a properly configured RoomServiceClient for interacting with LiveKit API
 */
export function getRoomClient(): RoomServiceClient {
  checkKeys();
  // Get the base URL but convert it to HTTPS for the API client
  const url = getLiveKitURL();
  const apiUrl = url.replace("wss://", "https://");
  console.log("Creating RoomServiceClient with URL:", apiUrl);
  return new RoomServiceClient(
    apiUrl,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

/**
 * Returns the LiveKit WebSocket URL from environment variables
 */
export function getLiveKitURL(region?: string | string[]): string {
  let targetKey = "LIVEKIT_URL";

  // Support regional URLs if provided
  if (region && !Array.isArray(region)) {
    targetKey = `LIVEKIT_URL_${region}`.toUpperCase();
  }

  // Get URL from environment variable
  const url = process.env[targetKey];
  if (!url) {
    console.error(`${targetKey} is not defined in environment variables`);
    throw new Error(`${targetKey} is not defined`);
  }

  // Ensure URL starts with wss:// for WebSocket connections
  if (!url.startsWith("wss://")) {
    console.warn(
      `LiveKit URL doesn't start with wss://, which might cause connection issues`
    );
  }

  return url;
}

/**
 * Validates that required LiveKit API keys are properly configured
 */
function checkKeys() {
  if (
    typeof process.env.LIVEKIT_API_KEY === "undefined" ||
    !process.env.LIVEKIT_API_KEY
  ) {
    console.error("LIVEKIT_API_KEY is missing in environment variables");
    throw new Error("LIVEKIT_API_KEY is not defined");
  }

  if (
    typeof process.env.LIVEKIT_API_SECRET === "undefined" ||
    !process.env.LIVEKIT_API_SECRET
  ) {
    console.error("LIVEKIT_API_SECRET is missing in environment variables");
    throw new Error("LIVEKIT_API_SECRET is not defined");
  }

  console.log(
    "LiveKit configuration validated, API key length:",
    process.env.LIVEKIT_API_KEY.length
  );
}
