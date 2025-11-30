import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe } from "../types";

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
    // Assuming mp3/webm depending on browser, but sending as generic audio/mp3 usually works for Gemini if header is stripped
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

// --- Legacy Single Mode Functions (kept for compatibility if needed internally) ---
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
        
        // Find image part
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
        // Fallback placeholder
        return "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000";
    }
};

// --- Video Generation (Veo) ---
export const generateTutorialVideo = async (prompt: string, imageDataUrl?: string): Promise<string | null> => {
    // Check for API Key first for Veo
    // Cast window to any to access aistudio which might be defined globally
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
        try {
            await aistudio.openSelectKey();
        } catch (e) {
            console.error("Key selection failed or cancelled", e);
            // Don't crash, just return null or let it fail gracefully later
        }
    }

    // Re-init AI to ensure key is picked up if it was just selected
    const ai = getAI(); 

    try {
        const request: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic cooking shot: ${prompt}. High quality, slow motion, professional lighting.`,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        };

        // If we have an image, use it for Image-to-Video
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
            // Fetch the actual bytes with the key
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
// Global shared AudioContext to prevent hitting browser limit of 6 contexts
let sharedAudioContext: AudioContext | null = null;

export const speakText = async (text: string): Promise<void> => {
  if (!text.trim()) return;

  // Initialize singleton context
  if (!sharedAudioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      sharedAudioContext = new AudioContextClass();
  }

  // Always resume context on user interaction to comply with autoplay policies
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
      // Gemini returns raw PCM data (Int16), NOT a wav/mp3 file.
      // We must manually convert this to an AudioBuffer.
      // Sample rate for Gemini Flash 2.5 TTS is 24000Hz.
      const audioBuffer = pcmToAudioBuffer(base64Audio, sharedAudioContext, 24000);
      
      const source = sharedAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(sharedAudioContext.destination);
      source.start();
    } else {
        console.warn("No audio data returned from Gemini TTS");
    }
  } catch (e) {
    console.error("TTS error", e);
    throw e; // Re-throw to allow caller to handle state
  }
};

/**
 * Converts Raw PCM (Int16) base64 string to an AudioBuffer.
 * This is required because Gemini TTS returns raw bytes, not a file with headers.
 */
function pcmToAudioBuffer(base64: string, ctx: AudioContext, sampleRate: number): AudioBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    
    // Create Int16Array from binary string
    // Each sample is 2 bytes (16 bits)
    const int16Buffer = new Int16Array(len / 2);
    for (let i = 0; i < len; i += 2) {
        // Little endian
        const byte1 = binaryString.charCodeAt(i);
        const byte2 = binaryString.charCodeAt(i + 1);
        // Combine two bytes into one 16-bit integer
        const sample = (byte2 << 8) | byte1;
        // Handle signed integer
        int16Buffer[i / 2] = sample >= 32768 ? sample - 65536 : sample;
    }

    // Create AudioBuffer
    const audioBuffer = ctx.createBuffer(1, int16Buffer.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 to Float32 [-1.0, 1.0]
    for (let i = 0; i < int16Buffer.length; i++) {
        channelData[i] = int16Buffer[i] / 32768.0;
    }

    return audioBuffer;
}