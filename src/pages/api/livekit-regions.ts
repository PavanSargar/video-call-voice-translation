import type { NextApiRequest, NextApiResponse } from "next";
import { RoomServiceClient } from "livekit-server-sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers to allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get LiveKit configuration from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error("Missing LiveKit configuration:", {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasLivekitUrl: !!livekitUrl,
      });
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Convert WebSocket URL to HTTP URL for API requests
    const apiHost = livekitUrl.replace("wss://", "https://");

    console.log("Providing LiveKit connection information:", {
      url: livekitUrl,
      apiHost: apiHost,
    });

    // This endpoint provides the information needed to connect without region fetching
    res.status(200).json({
      url: livekitUrl, // The LiveKit WebSocket URL
      regions: null, // Explicitly set regions to null to avoid fetching
      // Ice servers that can be used for WebRTC connections
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });
  } catch (error) {
    console.error("Error fetching LiveKit regions:", error);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
}
