import type { NextApiRequest, NextApiResponse } from "next";
import { AccessToken, VideoGrant } from "livekit-server-sdk";
import { getLiveKitWsUrl, getLiveKitCredentials } from "~/lib/livekit-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract request parameters
    const { identity, name, roomName } = req.body;

    // Validate required parameters
    if (!identity || !roomName) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["identity", "roomName"],
        received: { identity, roomName },
      });
    }

    try {
      // Get credentials from our centralized config
      const { apiKey, apiSecret } = getLiveKitCredentials();
      // Get the WebSocket URL for client connections
      const wsUrl = getLiveKitWsUrl();

      // Create token with video grants
      const grant: VideoGrant = {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      };

      // Generate the token
      const token = new AccessToken(apiKey, apiSecret, {
        identity,
        name: name || identity,
      });

      // Set a shorter TTL to avoid issues
      token.ttl = "5m"; // 5 minutes
      token.addGrant(grant);

      const jwt = token.toJwt();
      console.log(`Generated token for ${identity} in room ${roomName}`);

      // Return the token and connection details
      return res.status(200).json({
        token: jwt,
        identity,
        roomName,
        url: wsUrl,
      });
    } catch (credentialError: any) {
      console.error("Error with LiveKit credentials:", credentialError);
      return res.status(500).json({
        error: "LiveKit configuration error",
        message: credentialError.message,
      });
    }
  } catch (error: any) {
    console.error("Error generating token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
}
