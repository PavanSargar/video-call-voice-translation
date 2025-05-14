import { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { api } from "~/utils/api";

type UseTranscribeProps = {
  roomName: string;
  audioEnabled: boolean;
  languageCode?: string;
};

const useTranscribe = ({
  roomName,
  audioEnabled,
  languageCode,
}: UseTranscribeProps) => {
  const {
    transcript,
    resetTranscript,
    finalTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const pusherMutation = api.pusher.send.useMutation();

  useEffect(() => {
    if (finalTranscript !== "") {
      pusherMutation.mutate({
        message: transcript,
        roomName: roomName,
        isFinal: true,
      });
      resetTranscript();
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Browser doesn't support speech recognition.");
      return;
    }

    if (audioEnabled) {
      // Stop any ongoing speech recognition
      SpeechRecognition.stopListening();

      // Use the provided language code or default to English
      const recognitionLanguage = languageCode || "en-US";
      console.log(
        `Starting speech recognition with language: ${recognitionLanguage}`
      );

      // Start listening with the specified language
      SpeechRecognition.startListening({
        continuous: true,
        language: recognitionLanguage,
      });
    } else {
      SpeechRecognition.stopListening();
    }

    // Clean up on unmount or when language/audio state changes
    return () => {
      SpeechRecognition.stopListening();
    };
  }, [audioEnabled, languageCode, browserSupportsSpeechRecognition]);

  return null;
};

export default useTranscribe;
