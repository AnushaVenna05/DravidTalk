import { GoogleGenerativeAI } from "@google/generative-ai";

export async function translateToMalayalam(text: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        return "Error: No API Key found. Please set your key in Settings.";
    }

    // Masked log for debugging
    const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
    console.log(`DravidaTalk: Using API Key [${maskedKey}]`);

    if (apiKey.length < 10) {
        return "Error: API Key is invalid. Please check your Settings.";
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Translate to Malayalam: "${text}".
        Provide the output in this EXACT format: [Malayalam Script] ([Phonetic Romanization for a Telugu speaker]).
        Example: സുഖമാണോ? (Sukhamano?)
        Example: വെള്ളം (Vellam)`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error: any) {
        console.error("Gemini Translation Error:", error);
        if (error.message?.includes("429") || error.message?.includes("quota")) {
            const isDaily = error.message?.toLowerCase().includes("day");
            const waitTime = isDaily ? "Try again tomorrow or use a different API key." : "Please wait 60 seconds.";
            return `Quota reached (${isDaily ? 'Daily' : 'Minute'}). ${waitTime} 😊`;
        }
        return `Translation failed: ${error.message || "Unknown error"}.`;
    }
}

export async function getRandomKeralaFact(apiKey: string): Promise<{ fact: string; word: string; translation: string }> {
    if (!apiKey) return { fact: "Kerala is known for its greenery.", word: "Green", translation: "പച്ച (Pacha)" };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate a unique, fascinating "Did you know?" fact about Kerala culture, food, history,cinema, tourism,politics or geography for a language learning app. 
        Also provide 1 specific English word related to that fact and its Malayalam translation.
        
        REQUIRED FORMAT (JSON-like, no other text):
        {
          "fact": "Did you know?...",
          "word": "EnglishWord",
          "translation": "മലയാളം (Romanization)"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Basic JSON extraction in case model adds markers
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Invalid format returned");
    } catch (error) {
        console.error("Fact generation error:", error);
        // Fallback to a hardcoded one if API fails
        return {
            fact: "Kerala's backwaters are a chain of brackish lagoons and lakes lying parallel to the Arabian Sea coast.",
            word: "Water",
            translation: "വെള്ളം (Vellam)"
        };
    }
}
