import { Room, RoomOptions } from "livekit-client";

/**
 * Helper function to get a LiveKit connection token from our custom API
 */
export async function getDirectToken(
  identity: string,
  userName: string,
  roomName: string
): Promise<{
  token: string;
  url: string;
}> {
  try {
    console.log("Getting LiveKit token for:", {
      identity,
      userName,
      roomName,
    });

    // Use our custom API endpoint
    const response = await fetch("/api/livekit-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identity,
        name: userName,
        roomName,
      }),
    });

    if (!response.ok) {
      // Try to parse error message
      let errorText = "Unknown error";
      try {
        const errorData = await response.json();
        errorText = errorData.error || `API error: ${response.status}`;
      } catch (e) {
        errorText = `API error: ${response.status}`;
      }

      throw new Error(errorText);
    }

    const data = await response.json();
    console.log("Got token response:", {
      hasToken: !!data.token,
      tokenLength: data.token?.length,
      url: data.url,
    });

    return {
      token: data.token,
      url: data.url,
    };
  } catch (error) {
    console.error("Failed to get LiveKit token:", error);
    throw error;
  }
}

/**
 * Helper function to connect to a LiveKit room directly without using LiveKitRoom component
 * This bypasses the regions API fetch that's causing 401 errors
 */
export async function connectToRoom(
  serverUrl: string,
  token: string,
  options?: RoomOptions
): Promise<Room> {
  // Create a new room instance
  const room = new Room(options);

  try {
    console.log("Connecting to LiveKit room at:", serverUrl);

    // Connect to the room directly with explicit options to skip region fetch
    await room.connect(serverUrl, token, {
      autoSubscribe: true,
    });

    console.log("Connected to room:", room.name);
    return room;
  } catch (error) {
    console.error("Failed to connect to room:", error);
    throw error;
  }
}
