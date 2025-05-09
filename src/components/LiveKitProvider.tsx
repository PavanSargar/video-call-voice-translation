import {
  VideoConference,
  formatChatMessageLinks,
} from "@livekit/components-react";
import React, { useEffect, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { getDirectToken, connectToRoom } from "~/lib/direct-livekit";
import { DebugMode } from "~/lib/Debug";

interface LiveKitProviderProps {
  identity: string;
  userName: string;
  roomName: string;
  children?: React.ReactNode;
  onConnected?: (room: Room) => void;
  onDisconnected?: () => void;
  showDebug?: boolean;
}

/**
 * A wrapper component that connects to LiveKit without using regions
 */
export default function LiveKitProvider({
  identity,
  userName,
  roomName,
  children,
  onConnected,
  onDisconnected,
  showDebug = false,
}: LiveKitProviderProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let currentRoom: Room | null = null;

    const connect = async () => {
      if (isConnecting || room) return;

      try {
        setIsConnecting(true);
        setError(null);

        console.log(
          `Connecting to room ${roomName} as ${userName} (${identity})`
        );

        // Get token directly from our API
        const { token, url } = await getDirectToken(
          identity,
          userName,
          roomName
        );

        if (!token || !url) {
          throw new Error("Failed to get connection token");
        }

        console.log(`Got token (${token.length} chars) and URL: ${url}`);

        // Connect directly to the room
        currentRoom = await connectToRoom(url, token, {
          // Use very basic options to avoid region fetching
          adaptiveStream: false,
          dynacast: false,
        });

        if (mounted) {
          setRoom(currentRoom);
          setIsConnecting(false);
          if (onConnected) onConnected(currentRoom);
        }

        // Handle disconnection
        currentRoom.once(RoomEvent.Disconnected, () => {
          console.log("Disconnected from room");
          if (mounted) {
            setRoom(null);
            if (onDisconnected) onDisconnected();
          }
        });
      } catch (err: any) {
        console.error("Failed to connect to LiveKit room:", err);
        if (mounted) {
          setError(err.message || "Failed to connect to room");
          setIsConnecting(false);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (currentRoom) {
        console.log("Cleaning up room connection");
        currentRoom.disconnect();
      }
    };
  }, [
    identity,
    userName,
    roomName,
    isConnecting,
    room,
    onConnected,
    onDisconnected,
  ]);

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="text-xl font-bold text-red-500">Connection Error</div>
        <div className="text-md">{error}</div>
        <button className="lk-button mt-4" onClick={() => setError(null)}>
          Try Again
        </button>
      </div>
    );
  }

  if (isConnecting || !room) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="lk-loader"></div>
      </div>
    );
  }

  return (
    <div className="lk-video-conference-container">
      {children}
      {showDebug && <DebugMode />}
    </div>
  );
}
