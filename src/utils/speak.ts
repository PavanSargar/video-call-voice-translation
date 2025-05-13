import { transliterate } from "transliteration";

let lastSpokenText = "";

/**
 * Simple text-to-speech function that works across browsers
 */
const speakOut = (text: string, isEmpty: boolean, langCode?: string): void => {
  // Skip if no text to speak
  if (!text || text.trim() === "") return;

  // Skip duplicates unless queue is empty
  if (text === lastSpokenText && !isEmpty) {
    console.log("Skipping duplicate text");
    return;
  }

  // Reset tracking if queue is empty
  if (isEmpty) lastSpokenText = "";

  // Stop any current speech
  try {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.error("Error cancelling speech:", e);
  }

  try {
    // Create new utterance
    const speech = new SpeechSynthesisUtterance();

    // Set language - default to English if none provided
    speech.lang = langCode || "en-US";

    // For certain languages, transliterate the text to improve speech
    const nonLatinScripts = ["zh", "ja", "ko", "ar", "ru"];
    const langBase = (langCode || "").split("-")[0];

    // Use transliteration for non-Latin scripts if needed
    if (langBase && nonLatinScripts.includes(langBase)) {
      speech.text = transliterate(text);
    } else {
      speech.text = text;
    }

    // Log and speak
    console.log(`Speaking in ${speech.lang}: ${speech.text}`);
    window.speechSynthesis.speak(speech);

    // Track what we just said
    lastSpokenText = text;
  } catch (error) {
    console.error("Speech synthesis error:", error);
  }
};

export default speakOut;
