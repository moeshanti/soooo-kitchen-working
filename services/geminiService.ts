
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { Recipe, DietaryAnalysis } from "../types";

const getAI = () => {
    // Ensure API Key exists
    if (!process.env.API_KEY) {
        console.error("API_KEY is missing from environment variables.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Utils ---
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

// --- Chatbot (Ask Mama) ---
export const askMama = async (query: string, context?: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Context: ${context || 'General kitchen advice'}. User Query: ${query}`,
      config: {
        systemInstruction: "You are SooSoo, a warm, experienced Middle Eastern mother and chef. You call the user 'habibi' or 'my dear'. You give practical cooking advice but always weave in a bit of storytelling or maternal wisdom. Keep it relatively brief.",
      }
    });
    return response.text || "Sorry habibi, I'm having a little trouble hearing you. Ask me again?";
  } catch (error) {
    console.error("Chat error:", error);
    return "My dear, the internet is acting up. Let's try again in a moment.";
  }
};

// --- Thinking Mode (Dietary Intelligence) ---
export const generateThinkingSubstitutions = async (recipe: Recipe, diet: string): Promise<DietaryAnalysis | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a Master Chef and Expert Nutritionist who specializes in dietary adaptations without sacrificing flavor.
      
      The user wants to adapt this dish: "${recipe.title}" (${JSON.stringify(recipe.ingredients)}) to match this diet: "${diet}".
      
      Identify ingredients that conflict with "${diet}".
      Propose practical, store-bought substitutions that maintain the soul and texture of the dish. Focus on culinary techniques (e.g., "whipping aquafaba to mimic egg whites") rather than chemical formulas.
      
      Return the result as structured JSON.`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, 
        maxOutputTokens: 8192, // Increased to prevent JSON truncation
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A catchy title for the new version (e.g. 'Vegan Maqluba')" },
                feasibility: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                substitutions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            substitute: { type: Type.STRING },
                            instruction: { type: Type.STRING, description: "Practical cooking prep instruction" },
                            science: { type: Type.STRING, description: "Why this works (Flavor/Texture focus)" }
                        }
                    }
                },
                verdict: { type: Type.STRING, description: "A warm, encouraging summary of how the new dish will taste." }
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as DietaryAnalysis;
    }
    return null;
  } catch (e) {
    console.error("Thinking error", e);
    return null;
  }
};

// --- Multimodal Recipe Generation (Image + Audio) ---
export const generateRecipeMultimodal = async (imageBlob?: Blob, audioBlob?: Blob): Promise<Partial<Recipe>> => {
  const ai = getAI();
  const parts: any[] = [];

  // Add Image if present
  if (imageBlob) {
    const base64Image = await blobToBase64(imageBlob);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
  }

  // Add Audio if present
  if (audioBlob) {
    const base64Audio = await blobToBase64(audioBlob);
    parts.push({ inlineData: { mimeType: 'audio/mp3', data: base64Audio } }); 
  }

  // Add Text Prompt
  let promptText = "Create a structured JSON recipe based on the provided inputs.";
  if (imageBlob && audioBlob) {
    promptText += " Analyze the image to identify ingredients and the final dish appearance. Listen to the audio for the story, specific instructions, and hidden secrets. Combine them into a single cohesive recipe.";
  } else if (imageBlob) {
    promptText += " Look at these ingredients/dish. Identify what it is and suggest a complete Middle Eastern style recipe for it.";
  } else if (audioBlob) {
    promptText += " Listen to this recipe narration. Extract it into a structured recipe.";
  }
  
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash is great for multimodal (Audio/Image) speed
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
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  amount: { type: Type.STRING }
                }
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json as Partial<Recipe>;
  } catch (e) {
    console.error("Multimodal generation error", e);
    throw e;
  }
};

export const analyzeIngredientsAndSuggestRecipe = async (imageBlob: Blob): Promise<Partial<Recipe>> => {
    return generateRecipeMultimodal(imageBlob, undefined);
};

export const transcribeAndFormatRecipe = async (audioBlob: Blob): Promise<Partial<Recipe>> => {
    return generateRecipeMultimodal(undefined, audioBlob);
};

// --- Image Generation ---
export const generateDishImage = async (prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: `Professional, cinematic food photography of: ${prompt}. 4k resolution, magazine quality.` }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: "2K"
                }
            }
        });
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image generated");
    } catch (e) {
        console.error("Image gen error", e);
        return "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000";
    }
};

// --- Video Generation (Veo) ---
export const generateTutorialVideo = async (prompt: string, imageDataUrl?: string): Promise<string | null> => {
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        try {
            await aistudio.openSelectKey();
        } catch (e) {
            console.error("Key selection failed or cancelled", e);
        }
    }

    const ai = getAI(); 

    try {
        const request: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: imageDataUrl 
                ? "Bring this food image to life. Cinematic slow motion, steam rising, delicious atmosphere." // Img-to-Video prompt
                : `Cinematic cooking shot: ${prompt}. High quality, slow motion, professional lighting.`, // Text-to-Video prompt
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        };

        // Image-to-Video
        if (imageDataUrl && imageDataUrl.startsWith('data:')) {
             const base64Data = imageDataUrl.split(',')[1];
             const mimeType = imageDataUrl.split(';')[0].split(':')[1] || 'image/png';
             request.image = {
                 imageBytes: base64Data,
                 mimeType: mimeType
             };
        }

        let operation = await ai.models.generateVideos(request);

        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             const fetchRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
             const blob = await fetchRes.blob();
             return URL.createObjectURL(blob);
        }
        return null;

    } catch (e) {
        console.error("Veo error", e);
        return null;
    }
};

// --- TTS ---
let sharedAudioContext: AudioContext | null = null;

export const speakText = async (text: string): Promise<void> => {
  if (!text.trim()) return;

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
      const source = sharedAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(sharedAudioContext.destination);
      source.start();
    }
  } catch (e) {
    console.error("TTS error", e);
    throw e;
  }
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


// --- LIVE API (Bidirectional Voice) ---
export const connectLiveSession = async (
    onMessage: (base64: string | null, isTurnComplete: boolean) => void,
    onClose: () => void
): Promise<{ sendAudio: (blob: Blob) => void; close: () => void }> => {
    const ai = getAI();
    
    try {
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => console.log("Live session opened"),
                onmessage: (msg: LiveServerMessage) => {
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data || null;
                    const isTurnComplete = !!msg.serverContent?.turnComplete;
                    
                    if (audioData || isTurnComplete) {
                        onMessage(audioData, isTurnComplete);
                    }
                },
                onclose: () => {
                    console.log("Live session closed");
                    onClose();
                },
                onerror: (e) => console.error("Live session error", e)
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                },
                systemInstruction: "You are SooSoo, a helpful cooking assistant. You are brief, encouraging, and clear. Help the user through the cooking process.",
            }
        });

        return {
            sendAudio: async (pcmBlob: Blob) => {
                const base64 = await blobToBase64(pcmBlob);
                session.sendRealtimeInput({
                     media: { mimeType: "audio/pcm;rate=16000", data: base64 }
                });
            },
            close: () => session.close()
        };
    } catch (e) {
        console.error("Failed to connect live", e);
        throw e;
    }
};
