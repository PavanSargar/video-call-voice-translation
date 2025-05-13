import { setCORS } from "./marianMT";

const translate = setCORS();

/**
 * Tests translation for different languages
 * Used for debugging translation issues
 */
export async function testTranslation(
  text: string,
  targetLang: string
): Promise<string> {
  console.log(`Testing translation to ${targetLang}: "${text}"`);

  try {
    const result = await translate(text, {
      from: "auto",
      to: targetLang,
    });

    console.log(`Translation result: "${result.text}"`);
    console.log("Translation metadata:", result);

    return result.text;
  } catch (error) {
    console.error(`Translation test failed for ${targetLang}:`, error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Example usage in browser console:
// import { testTranslation } from '~/utils/testTranslation';
// testTranslation('Hello world', 'kn');
// testTranslation('Hello world', 'hi');
// testTranslation('Hello world', 'ja');
