
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { Recipe, DietaryAnalysis } from "../types";

const getAI = () => {
    if (!process.env.API_KEY) {
        console.error("API_KEY is missing from environment variables.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read blob'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const askMama = async (query: string, context?: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Context: ${context || 'General kitchen advice'}. User Query: ${query}`,
      config: { systemInstruction: "You are SooSoo, a warm, experienced Middle Eastern mother and chef." }
    });
    return response.text || "Sorry habibi, I'm having a little trouble hearing you. Ask me again?";
  } catch (error) {
    return "My dear, the internet is acting up. Let's try again in a moment.";
  }
};

export const generateThinkingSubstitutions = async (recipe: Recipe, diet: string): Promise<DietaryAnalysis | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a Master Chef. Adapt "${recipe.title}" for "${diet}". Return structured JSON.`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, 
        maxOutputTokens: 8192, 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                feasibility: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                substitutions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, substitute: { type: Type.STRING }, instruction: { type: Type.STRING }, science: { type: Type.STRING } } } },
                verdict: { type: Type.STRING }
            }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (e) { return null; }
};

export const generateRecipeMultimodal = async (imageBlob?: Blob, audioBlob?: Blob): Promise<Partial<Recipe>> => {
  const ai = getAI();
  const parts: any[] = [];
  if (imageBlob) parts.push({ inlineData: { mimeType: 'image/jpeg', data: await blobToBase64(imageBlob) } });
  if (audioBlob) parts.push({ inlineData: { mimeType: 'audio/mp3', data: await blobToBase64(audioBlob) } });
  parts.push({ text: "Create a structured JSON recipe based on the provided inputs." });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            origin: { type: Type.STRING },
            prepTime: { type: Type.INTEGER },
            cookTime: { type: Type.INTEGER },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
            calories: { type: Type.INTEGER },
            ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, amount: { type: Type.STRING } } } },
            instructions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { stepNumber: { type: Type.INTEGER }, text: { type: Type.STRING }, durationMinutes: { type: Type.INTEGER } } } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { throw e; }
};

export const generateDishImage = async (prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: `Cinematic food photography: ${prompt}` }] },
            config: { imageConfig: { aspectRatio: "16:9", imageSize: "2K" } }
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part) return `data:image/png;base64,${part.inlineData.data}`;
        throw new Error("No image");
    } catch (e) { return "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000"; }
};

export const generateTutorialVideo = async (prompt: string, imageDataUrl?: string): Promise<{ url: string, isFallback: boolean } | null> => {
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        try { await aistudio.openSelectKey(); } catch (e) {}
    }
    const ai = getAI(); 
    try {
        const request: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic cooking video: ${prompt}`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        };
        if (imageDataUrl && imageDataUrl.startsWith('data:')) {
             request.image = { imageBytes: imageDataUrl.split(',')[1].replace(/[\r\n]+/g, ""), mimeType: 'image/jpeg' };
        }
        let operation = await ai.models.generateVideos(request);
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             const fetchRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
             if (fetchRes.ok) {
                 const blob = await fetchRes.blob();
                 return { url: URL.createObjectURL(blob), isFallback: false };
             }
        }
        throw new Error("Video generation failed");
    } catch (e: any) {
        console.warn("Veo error or quota exceeded, using fallback.", e);
        // Reliable fallback URL
        return { 
            url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
            isFallback: true 
        };
    }
};

export const suggestRecipeFromPantry = async (imageBlob: Blob) => { return []; }; 
export const speakText = async (text: string) => { return { stop: () => {} }; };

export const connectLiveSession = async (
    onMessage: (audioData: string | undefined, isTurnComplete: boolean) => void, 
    onClose: () => void
) => {
  const ai = getAI();
  let session: any = null;

  try {
      session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Live session connected'),
            onmessage: (message: LiveServerMessage) => {
                const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                const isTurnComplete = message.serverContent?.turnComplete || false;
                onMessage(audioData, isTurnComplete);
            },
            onclose: () => {
                console.log('Live session closed');
                onClose();
            },
            onerror: (e) => {
                console.error('Live session error:', e);
                onClose();
            }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are SooSoo, a warm, experienced Middle Eastern mother and chef. Guide the user through cooking.',
        },
      });
  } catch (e) {
      console.error("Failed to connect live session", e);
      // Let the caller handle connection failure if necessary
      throw e;
  }

  return {
      sendAudio: async (blob: Blob) => {
          if (!session) return;
          const base64 = await blobToBase64(blob);
          session.sendRealtimeInput({
              media: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64
              }
          });
      },
      close: () => {
          if (session) {
            session.close();
          }
      }
  };
};
