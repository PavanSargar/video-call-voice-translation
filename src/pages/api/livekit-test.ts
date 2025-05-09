import type { NextApiRequest, NextApiResponse } from "next";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Output environment for debugging
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Get API URL - use dedicated API URL if available, otherwise convert from WebSocket URL
  const apiUrl =
    process.env.LIVEKIT_API_URL ||
    (wsUrl ? wsUrl.replace("wss://", "https://") : null);

  // Validate inputs
  if (!apiKey || !apiSecret || !wsUrl || !apiUrl) {
    return res.status(500).json({
      error: "Missing configuration",
      config: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        hasApiSecret: !!apiSecret,
        apiSecretLength: apiSecret?.length,
        hasWsUrl: !!wsUrl,
        hasApiUrl: !!apiUrl,
      },
    });
  }

  try {
    // Test 1: Create a token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: "test-user",
      name: "Test User",
    });
    token.addGrant({ room: "test-room", roomJoin: true });
    const jwt = token.toJwt();

    // Test 2: Try to connect to the API
    let roomServiceResult = null;
    let error = null;

    try {
      // For LiveKit Cloud, make sure API URL is correctly formed
      console.log("Connecting to LiveKit API at:", apiUrl);

      // Try two different formats
      let roomService;

      try {
        // Try with standard URL
        roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
      } catch (err) {
        console.log("Failed with standard URL, trying with /twirp suffix");
        // Try with /twirp suffix which is needed for some LiveKit deployments
        const apiUrlWithTwirp = apiUrl.endsWith("/")
          ? `${apiUrl}twirp`
          : `${apiUrl}/twirp`;
        roomService = new RoomServiceClient(apiUrlWithTwirp, apiKey, apiSecret);
      }

      // List rooms as a simple API test
      const rooms = await roomService.listRooms();
      roomServiceResult = {
        success: true,
        roomCount: rooms.length,
        roomNames: rooms.map((r) => r.name),
      };
    } catch (err: any) {
      error = {
        message: err.message || "Unknown error",
        stack: err.stack || "",
        name: err.name || "Error",
      };
    }

    // Return all results for debugging
    return res.status(200).json({
      message: "LiveKit test results",
      config: {
        apiKey: `${apiKey?.substring(0, 4)}...${apiKey?.substring(
          apiKey.length - 4
        )}`,
        apiKeyLength: apiKey?.length,
        apiSecretLength: apiSecret?.length,
        wsUrl,
        apiUrl,
      },
      tokenTest: {
        success: !!jwt,
        tokenLength: jwt?.length,
        tokenStart: jwt?.substring(0, 20) + "...",
      },
      apiTest: {
        success: !!roomServiceResult,
        result: roomServiceResult,
        error,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Test failed",
      message: err.message || "Unknown error",
      stack: err.stack || "",
    });
  }
}
