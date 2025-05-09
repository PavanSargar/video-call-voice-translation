import { nullable, string, z } from "zod";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import type {
  AccessTokenOptions,
  VideoGrant,
  CreateOptions,
} from "livekit-server-sdk";
import { translate } from "@vitalets/google-translate-api";
import { getRoomClient, getLiveKitURL } from "~/lib/serverUtils";
import axios from "axios";

// Use environment variables for LiveKit configuration
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const wsUrl =
  process.env.LIVEKIT_URL || (process.env.NEXT_PUBLIC_LIVEKIT_URL as string);
// Get API URL - use dedicated API URL if available, otherwise convert from WebSocket URL
const apiUrl =
  process.env.LIVEKIT_API_URL || wsUrl.replace("wss://", "https://");

// Create the room client with proper URL format and path
const roomClient = new RoomServiceClient(apiUrl, apiKey, apiSecret);

// Create token generation function
const createToken = (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  // Ensure we're using the correct API key and secret
  if (!apiKey || !apiSecret) {
    console.error("Missing LiveKit API key or secret");
    throw new Error("LiveKit configuration error");
  }

  console.log("Creating token with:", {
    apiKeyLength: apiKey.length,
    secretLength: apiSecret.length,
    userInfo: JSON.stringify(userInfo),
    grant: JSON.stringify(grant),
  });

  // Create the token with the correct API key and secret
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.ttl = "5m"; // 5 minutes expiration
  at.addGrant(grant);
  return at.toJwt();
};

// Import other required dependencies
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TokenResult } from "~/lib/type";
import { CreateRoomRequest } from "livekit-server-sdk/dist/proto/livekit_room";

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPEN_API_SECRET,
});
import { Configuration, OpenAIApi } from "openai";
const openai = new OpenAIApi(configuration);

export const roomsRouter = createTRPCRouter({
  joinRoom: protectedProcedure
    .input(
      z.object({
        roomName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log("Joining room:", input.roomName);

        const identity = ctx.session.user.id;
        const name = ctx.session.user.name || "Anonymous";
        const { roomName } = input;

        // Validate inputs
        if (!identity || !roomName) {
          throw new Error("Missing required parameters for room joining");
        }

        // Define video access permissions
        const grant: VideoGrant = {
          room: roomName,
          roomJoin: true,
          canPublish: true,
          canPublishData: true,
          canSubscribe: true,
        };

        console.log("Creating token for user:", {
          id: identity,
          name: name,
          room: roomName,
        });

        // Generate token for LiveKit with a short TTL to avoid stale tokens
        const at = new AccessToken(apiKey, apiSecret, {
          identity,
          name,
        });
        at.ttl = "5m"; // 5 minutes expiration
        at.addGrant(grant);
        const token = at.toJwt();

        console.log("Token generated successfully, length:", token.length);

        const result: TokenResult = {
          identity,
          accessToken: token,
        };

        try {
          // Record participant in database
          const participant = await ctx.prisma.participant.findUnique({
            where: {
              UserId_RoomName: {
                UserId: ctx.session.user.id,
                RoomName: roomName,
              },
            },
          });

          if (participant === null) {
            await ctx.prisma.participant.create({
              data: {
                User: {
                  connect: {
                    id: ctx.session.user.id,
                  },
                },
                Room: {
                  connect: {
                    name: roomName,
                  },
                },
              },
            });
            console.log("Added participant to database");
          } else {
            console.log("Participant already in database");
          }
        } catch (dbError) {
          console.error("Database error when recording participant:", dbError);
          // Continue even if database operation fails
        }

        return result;
      } catch (error) {
        console.error("Error in joinRoom:", error);
        throw error;
      }
    }),
  createRoom: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log("Starting room creation process");

      // First create room in database
      const room = await ctx.prisma.room.create({
        data: {
          Owner: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      console.log("Room created in database:", room);

      // Then try to create room in LiveKit
      try {
        // Get the LiveKit URL for reference in logs
        const liveKitUrl = getLiveKitURL();
        console.log(
          `Creating LiveKit room with name: ${room.name} on LiveKit server: ${liveKitUrl}`
        );

        // Use a simple structure for the request
        const createRoomOptions = { name: room.name };

        // Make the actual API call to LiveKit
        const response = await roomClient.createRoom(createRoomOptions);
        console.log("LiveKit room creation successful:", response);
      } catch (livekitError: any) {
        console.error("Failed to create LiveKit room:", {
          message: livekitError.message,
          code: livekitError.code,
          statusCode: livekitError.statusCode,
          name: livekitError.name,
        });

        // LiveKit room creation failed, but we can still return the room info
        // The room will be created in LiveKit when user joins
        console.log("Proceeding despite LiveKit room creation failure");
      }

      // Return the room name regardless of LiveKit creation success
      // The LiveKit room will be created on-demand if it doesn't exist
      return {
        roomName: room.name,
      };
    } catch (error) {
      console.error("Error in createRoom:", error);
      throw error;
    }
  }),
  getRoomsByUser: protectedProcedure.query(async ({ ctx }) => {
    const rooms = await ctx.prisma.room.findMany({
      where: {
        OR: [
          {
            Owner: {
              id: ctx.session.user.id,
            },
          },
          {
            Participant: {
              some: {
                UserId: ctx.session.user.id,
              },
            },
          },
        ],
      },
    });

    return rooms;
  }),
  getRoomSummary: protectedProcedure
    .input(
      z.object({
        roomName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // order all transcripts by createdAt in ascending order
      const transcripts = await ctx.prisma.transcript.findMany({
        where: {
          Room: {
            name: input.roomName,
          },
        },
        include: {
          User: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      const chatLog = transcripts.map((transcript) => ({
        speaker: transcript.User.name,
        utterance: transcript.text,
        timestamp: transcript.createdAt.toISOString(),
      }));
      if (chatLog.length === 0) {
        return null;
      }

      const apiKey = process.env.ONEAI_API_KEY;
      console.log(chatLog);
      try {
        const config = {
          method: "POST",
          url: "https://api.oneai.com/api/v0/pipeline",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
          },
          data: {
            input: chatLog,
            input_type: "conversation",
            content_type: "application/json",
            output_type: "json",
            multilingual: {
              enabled: true,
            },
            steps: [
              {
                skill: "article-topics",
              },
              {
                skill: "numbers",
              },
              {
                skill: "names",
              },
              {
                skill: "emotions",
              },
              {
                skill: "summarize",
              },
            ],
          },
        };

        const res = await axios.request(config);
        console.log(res.status);
        return res.data;
      } catch (error) {
        console.log(error);
      }
    }),
});
