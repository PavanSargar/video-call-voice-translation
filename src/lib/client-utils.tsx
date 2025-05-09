import { useEffect, useState } from "react";

/**
 * Hook to get the LiveKit server URL and regions
 * This uses our custom API endpoint to get the information
 * with proper authentication
 */
export function useServerUrl(region?: string) {
  const [serverUrl, setServerUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServerInfo() {
      try {
        setLoading(true);
        console.log("Fetching LiveKit server info from API...");

        // Use our custom API endpoint
        const endpoint = "/api/livekit-regions";
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log("LiveKit server info:", data);

        if (data.url) {
          setServerUrl(data.url);
        } else {
          setError("No LiveKit URL returned from server");
        }
      } catch (err) {
        console.error("Error fetching LiveKit server info:", err);
        setError((err as Error).message || "Unknown error");

        // Fallback to environment variable if API call fails
        const fallbackUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (fallbackUrl) {
          console.log(
            "Using fallback LiveKit URL from environment:",
            fallbackUrl
          );
          setServerUrl(fallbackUrl);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchServerInfo();
  }, [region]); // Re-run if region changes

  return { serverUrl, loading, error };
}
