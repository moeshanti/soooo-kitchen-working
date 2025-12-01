
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
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        try { await aistudio.openSelectKey(); } catch (e) { console.error(e); }
    }

    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: `Professional food photography, cinematic lighting, 8k resolution, overhead shot of: ${prompt}. Appetizing, vibrant colors.` }] },
            config: { imageConfig: { aspectRatio: "16:9", imageSize: "2K" } }
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part) return `data:image/png;base64,${part.inlineData.data}`;
        throw new Error("No image data returned");
    } catch (e) { 
        console.warn("Image generation failed, using fallback", e);
        return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop"; 
    }
};

// VEO Video Generation with Robust Fallback
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
        // Reliable fallback URL (Public Storage)
        return { 
            url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
            isFallback: true 
        };
    }
};

export const suggestRecipeFromPantry = async (imageBlob: Blob): Promise<{ title: string, reason: string, matchScore: number }[]> => {
    const ai = getAI();
    try {
        const base64Image = await blobToBase64(imageBlob);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: "Look at these ingredients in the fridge/pantry. Identify them. Then, suggest 3 Middle Eastern recipes I could make with them. Return JSON with 'title', 'reason' (why it works with these items), and 'matchScore' (0-100)." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            matchScore: { type: Type.INTEGER }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (e) {
        console.error("Pantry scan error", e);
        return [];
    }
};

// --- TTS ---
let sharedAudioContext: AudioContext | null = null;

export const speakText = async (text: string): Promise<{ stop: () => void }> => {
  if (!text.trim()) return { stop: () => {} };

  if (!sharedAudioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      sharedAudioContext = new AudioContextClass();
  }

  if (sharedAudioContext.state === 'suspended') {
      try {
        await sharedAudioContext.resume();
      } catch (e) {
        console.warn("Failed to resume AudioContext", e);
      }
  }

  const ai = getAI();
  let source: AudioBufferSourceNode | null = null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = pcmToAudioBuffer(base64Audio, sharedAudioContext, 24000);
      source = sharedAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(sharedAudioContext.destination);
      source.start();
    }
  } catch (e) {
    console.error("TTS error", e);
  }

  return {
      stop: () => {
          if (source) {
              try {
                  source.stop();
              } catch (e) { /* ignore if already stopped */ }
          }
      }
  };
};

function pcmToAudioBuffer(base64: string, ctx: AudioContext, sampleRate: number): AudioBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const int16Buffer = new Int16Array(len / 2);
    for (let i = 0; i < len; i += 2) {
        const byte1 = binaryString.charCodeAt(i);
        const byte2 = binaryString.charCodeAt(i + 1);
        const sample = (byte2 << 8) | byte1;
        int16Buffer[i / 2] = sample >= 32768 ? sample - 65536 : sample;
    }
    const audioBuffer = ctx.createBuffer(1, int16Buffer.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Buffer.length; i++) {
        channelData[i] = int16Buffer[i] / 32768.0;
    }
    return audioBuffer;
}

export const connectLiveSession = async (
    onMessage: (audioData: string | undefined, isTurnComplete: boolean) => void, 
    onClose: () => void
) => {
  const ai = getAI();
  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        console.log("Live session connected");
      },
      onmessage: (msg: LiveServerMessage) => {
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        const isTurnComplete = msg.serverContent?.turnComplete || false;
        onMessage(audioData, isTurnComplete);
      },
      onclose: () => {
        onClose();
      },
      onerror: (e) => {
        console.error("Live session error:", e);
        onClose();
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: 'You are SooSoo, a warm, experienced Middle Eastern mother and chef. Speak warmly and guide the user through cooking.'
    }
  });

  return {
    sendAudio: async (blob: Blob) => {
      const base64 = await blobToBase64(blob);
      session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64
        }
      });
    },
    close: () => {
      session.close();
    }
  };
};
