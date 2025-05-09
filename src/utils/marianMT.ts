import axios from "axios";

type TranslationResult = {
  text: string;
  from: {
    language: {
      iso: string;
    };
  };
  raw: any;
};

type TranslationOptions = {
  from?: string;
  to: string;
  format?: string;
  model?: string;
};

/**
 * Translates text using MarianMT API
 * This is a replacement for the Google Translate API
 */
export async function translate(
  text: string,
  options: TranslationOptions
): Promise<TranslationResult> {
  try {
    // Read configuration from environment variables
    const apiEndpoint = process.env.MARIAN_MT_API_ENDPOINT;
    const apiKey = process.env.MARIAN_MT_API_KEY;
    const defaultModel = process.env.MARIAN_MT_DEFAULT_MODEL || "opus-mt";

    if (!apiEndpoint) {
      throw new Error(
        "MARIAN_MT_API_ENDPOINT is not defined in environment variables"
      );
    }

    // Prepare request data
    const requestData = {
      text,
      source_language: options.from || "auto",
      target_language: options.to,
      model: options.model || defaultModel,
      format: options.format || "text",
    };

    // Set headers including API key if provided
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Make API request
    const response = await axios.post(apiEndpoint, requestData, { headers });

    // Return in a format compatible with the previous Google Translate implementation
    return {
      text:
        response.data.translated_text ||
        response.data.translatedText ||
        response.data.text,
      from: {
        language: {
          iso: response.data.detected_source_language || options.from || "auto",
        },
      },
      raw: response.data,
    };
  } catch (error) {
    console.error("MarianMT translation error:", error);
    // Fallback with original text to prevent application from breaking
    return {
      text: text,
      from: {
        language: {
          iso: options.from || "auto",
        },
      },
      raw: { error: error },
    };
  }
}

// For browser usage with CORS support
export function setCORS(corsProxy: string) {
  return async function translateWithCORS(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    try {
      // Read configuration from environment variables (if in browser, these should be NEXT_PUBLIC_*)
      const apiEndpoint =
        typeof window !== "undefined"
          ? (window as any).__ENV?.NEXT_PUBLIC_MARIAN_MT_API_ENDPOINT
          : process.env.MARIAN_MT_API_ENDPOINT;

      const apiKey =
        typeof window !== "undefined"
          ? (window as any).__ENV?.NEXT_PUBLIC_MARIAN_MT_API_KEY
          : process.env.MARIAN_MT_API_KEY;

      const defaultModel =
        typeof window !== "undefined"
          ? (window as any).__ENV?.NEXT_PUBLIC_MARIAN_MT_DEFAULT_MODEL
          : process.env.MARIAN_MT_DEFAULT_MODEL || "opus-mt";

      // Use the corsProxy if in browser environment
      const endpoint =
        typeof window !== "undefined"
          ? `${corsProxy}/${apiEndpoint}`
          : apiEndpoint;

      // Prepare request data
      const requestData = {
        text,
        source_language: options.from || "auto",
        target_language: options.to,
        model: options.model || defaultModel,
        format: options.format || "text",
      };

      // Set headers including API key if provided
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      // Make API request
      const response = await axios.post(endpoint, requestData, { headers });

      // Return in a format compatible with the previous Google Translate implementation
      return {
        text:
          response.data.translated_text ||
          response.data.translatedText ||
          response.data.text,
        from: {
          language: {
            iso:
              response.data.detected_source_language || options.from || "auto",
          },
        },
        raw: response.data,
      };
    } catch (error) {
      console.error("MarianMT translation error:", error);
      // Fallback with original text to prevent application from breaking
      return {
        text: text,
        from: {
          language: {
            iso: options.from || "auto",
          },
        },
        raw: { error: error },
      };
    }
  };
}

// Export language codes if needed
export const languages = {
  auto: "Automatic",
  en: "English",
  fr: "French",
  de: "German",
  ja: "Japanese",
  es: "Spanish",
  hi: "Hindi",
  ru: "Russian",
  ar: "Arabic",
  zh: "Chinese",
  pt: "Portuguese",
  // Add more languages as supported by your MarianMT implementation
};
