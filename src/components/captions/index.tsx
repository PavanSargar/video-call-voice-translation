import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import speakOut from "~/utils/speak";
import { setCORS, languages } from "~/utils/marianMT";

// Initialize the translation function with a direct connection (no CORS proxy needed)
const translate = setCORS();

type Transcription = {
  sender: string;
  message: string;
  senderId: string;
  isFinal: boolean;
};

interface Props {
  transcriptionQueue: Transcription[];
  setTranscriptionQueue: Dispatch<SetStateAction<Transcription[]>>;
  languageCode: string;
}

const Captions: React.FC<Props> = ({
  transcriptionQueue,
  setTranscriptionQueue,
  languageCode,
}) => {
  const [caption, setCaption] = useState<{ sender: string; message: string }>();
  const [translationError, setTranslationError] = useState<string | null>(null);
  // Get language name for display
  const targetLangCode = languageCode.split("-")[0] || "en";
  const languageName =
    languages[targetLangCode as keyof typeof languages] || targetLangCode;

  useEffect(() => {
    async function translateText() {
      console.info("transcriptionQueue", transcriptionQueue);
      if (transcriptionQueue.length > 0 && transcriptionQueue[0]?.message) {
        try {
          // Extract the language code from the full locale code (e.g., "kn-IN" -> "kn")
          const targetLang = languageCode.split("-")[0] || "en";

          // Determine if we need to translate from a non-English language to English
          // This happens when the message is in a non-English language and target is English
          const isTranslatingToEnglish = targetLang === "en";

          // For translating from other languages to English, we need to detect the source language
          // We'll use "auto" for source which will let the translation API detect the language
          const sourceLanguage = isTranslatingToEnglish ? "auto" : "auto";

          console.log(
            `Translating ${
              isTranslatingToEnglish ? "to" : "from"
            } English: source=${sourceLanguage}, target=${targetLang}`
          );

          // Log translation attempt
          console.log(
            `Attempting to translate: "${transcriptionQueue[0].message}" to ${targetLang}`
          );

          // Handle the message translation with explicit source and target languages
          const res = await translate(transcriptionQueue[0].message, {
            from: sourceLanguage,
            to: targetLang,
          });

          console.log("Translation result:", res);

          if (res.text) {
            // Check if translation actually happened (text changed)
            const isTranslated = res.text !== transcriptionQueue[0].message;
            console.log(
              `Translation successful: ${
                isTranslated ? "Yes" : "No (same as original)"
              }`
            );

            setCaption({
              message: res.text,
              sender: transcriptionQueue[0]?.sender as string,
            });

            // Speak the translated text
            const isEmpty = transcriptionQueue.length <= 1;
            speakOut(res.text as string, isEmpty, languageCode);

            // Clear any previous errors
            setTranslationError(null);
          } else {
            console.error("Translation returned empty text");
            setTranslationError("Translation failed - using original text");
            setCaption({
              message: transcriptionQueue[0].message,
              sender: transcriptionQueue[0]?.sender as string,
            });
          }
        } catch (error) {
          console.error("Error during translation:", error);
          setTranslationError("Translation error - using original text");
          setCaption({
            message: transcriptionQueue[0].message,
            sender: transcriptionQueue[0]?.sender as string,
          });
        } finally {
          // Remove the processed message from the queue
          setTranscriptionQueue((prev) => prev.slice(1));
        }
      }
    }

    translateText();

    // Hide the caption after 5 seconds
    const timer = setTimeout(() => {
      setCaption({
        message: "",
        sender: "",
      });
      setTranslationError(null);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [transcriptionQueue]);

  return (
    <div className="closed-captions-wrapper z-50">
      <div className="closed-captions-container">
        <div className="caption-language-indicator mb-1 text-xs text-gray-400">
          {languageName} captions
        </div>
        {caption?.message ? (
          <>
            <div className="closed-captions-username">{caption.sender}</div>
            <span>:&nbsp;</span>
          </>
        ) : null}
        <div className="closed-captions-text">
          {caption?.message}
          {translationError && (
            <div className="caption-error">{translationError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Captions;
