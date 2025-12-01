
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Recipe, Ingredient, InstructionStep } from '../types';
import { 
    generateRecipeMultimodal,
    generateDishImage,
    generateTutorialVideo
} from '../services/geminiService';

interface ChefStudioProps {
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

type StudioStep = 'select' | 'processing' | 'edit';

// Helper to compress images before saving to avoid localStorage limits
const compressImage = (dataUrl: string, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
        img.onerror = () => resolve(dataUrl); // Fallback to original if fail
    });
};

export const ChefStudio: React.FC<ChefStudioProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState<StudioStep>('select');
  const [status, setStatus] = useState('');
  
  // Recipe State (managed as structured data locally)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ item: '', amount: '' }]);
  const [instructions, setInstructions] = useState<InstructionStep[]>([{ stepNumber: 1, text: '' }]);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSimulatedVideo, setIsSimulatedVideo] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- Input Data State for AI Generation ---
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
  const [capturedAudioBlob, setCapturedAudioBlob] = useState<Blob | null>(null);

  // --- Camera Logic ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        setCameraStream(stream);
        setIsCameraOpen(true);
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
      }
      setIsCameraOpen(false);
  };

  useEffect(() => {
      if (isCameraOpen && videoRef.current && cameraStream) {
          videoRef.current.srcObject = cameraStream;
      }
  }, [isCameraOpen, cameraStream]);

  const capturePhoto = async () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg');
              setImageUrl(dataUrl);
              canvas.toBlob(async (blob) => {
                  if (blob) {
                      setCapturedImageBlob(blob);
                      stopCamera();
                  }
              }, 'image/jpeg');
          }
      }
  };

  const retakePhoto = () => {
      setCapturedImageBlob(null);
      setImageUrl('');
      startCamera();
  };

  // --- Audio Logic ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };
          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
              setCapturedAudioBlob(audioBlob);
              stream.getTracks().forEach(track => track.stop());
          };
          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          alert("Could not access microphone.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const resetRecording = () => {
      setCapturedAudioBlob(null);
      startRecording();
  };

  // --- AI Processing ---
  const handleCreateMasterpiece = async () => {
      if (!capturedImageBlob && !capturedAudioBlob) return;
      setStep('processing');
      setStatus('Consulting Mama SooSoo...');
      try {
          const result = await generateRecipeMultimodal(
              capturedImageBlob || undefined, 
              capturedAudioBlob || undefined
          );
          if (result) {
              if (result.title) setTitle(result.title);
              if (result.description) setDescription(result.description);
              if (result.origin) setOrigin(result.origin || '');
              
              if (result.ingredients) {
                  setIngredients(result.ingredients.filter(ing => ing.item.trim() !== ''));
              }

              if (result.instructions) {
                  setInstructions(result.instructions.filter(inst => inst.text.trim() !== ''));
              }
              setStep('edit');
          } else {
              throw new Error("No result returned");
          }
      } catch (err) {
          console.error("Multimodal generation error:", err); 
          alert('Failed to generate recipe. Please try again.');
          setStep('select');
      }
  };

  const handleGenerateImage = async () => {
      if (!title) return alert("Please enter a title first");
      setIsGeneratingImage(true);
      try {
          const url = await generateDishImage(title + " " + description);
          setImageUrl(url);
      } catch (err) {
          // Service handles fallback, but safety net
          setImageUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop");
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleGenerateVideo = async () => {
    if (!title) return alert("Please enter a title first");
    setStep('processing');
    setStatus('Directing your tutorial...');
    try {
        const imageParam = (imageUrl && imageUrl.startsWith('data:')) ? imageUrl : undefined;
        const result = await generateTutorialVideo(title, imageParam);
        
        if (result && result.url) {
            setVideoUrl(result.url);
            setIsSimulatedVideo(result.isFallback);
        } else {
            alert("Video generation failed.");
        }
    } catch (err: any) {
        console.error("Video Error (Safe Log):", err.message || "Unknown error during video generation"); 
        alert("Failed to generate video");
    } finally {
        setStep('edit');
    }
  };

  const handleSkip = useCallback(() => {
      setStep('edit');
      setIngredients([{ item: '', amount: '' }]);
      setInstructions([{ stepNumber: 1, text: '' }]);
  }, []);

  const handleSave = async () => {
      const sanitizedIngredients = ingredients.filter(ing => ing.item.trim().length > 0);
      const sanitizedInstructions = instructions.filter(inst => inst.text.trim().length > 0).map((inst, idx) => ({...inst, stepNumber: idx + 1}));

      if (!title.trim()) return alert("Please add a title!");
      if (sanitizedIngredients.length === 0) return alert("Please add at least one ingredient!");
      if (sanitizedInstructions.length === 0) return alert("Please add at least one instruction step!");

      let finalImageUrl = imageUrl;
      if (imageUrl.startsWith('data:')) {
          try {
              finalImageUrl = await compressImage(imageUrl);
          } catch (e) {
              console.warn("Compression failed, using original data URL. Potential storage issue.", e); 
          }
      }

      const newRecipe: Recipe = {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim(),
          origin: origin.trim() || 'Middle East',
          imageUrl: finalImageUrl,
          videoUrl, 
          prepTime: 30,
          cookTime: 30,
          difficulty: 'Medium',
          calories: 500,
          ingredients: sanitizedIngredients,
          instructions: sanitizedInstructions,
          createdAt: Date.now(),
          reviews: []
      };
      
      onSave(newRecipe);
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { item: '', amount: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = { ...newInstructions[index], text: value, stepNumber: index + 1 };
    setInstructions(newInstructions);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, { stepNumber: instructions.length + 1, text: '' }]);
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index).map((inst, idx) => ({...inst, stepNumber: idx + 1}));
    setInstructions(newInstructions);
  };

  // --- RENDERERS ---
  if (step === 'processing') {
      return (
          <div className="min-h-screen bg-soosoo-black text-white p-8 animate-fade-in flex flex-col justify-center items-center">
               <div className="w-20 h-20 border-4 border-soosoo-gold border-t-transparent rounded-full animate-spin mb-8"></div>
               <h2 className="text-2xl font-serif text-soosoo-gold animate-pulse">{status}</h2>
               <p className="text-gray-500 mt-2">Mama SooSoo is preparing your masterpiece...</p>
          </div>
      );
  }

  if (step === 'select') {
      const canGenerate = capturedImageBlob || capturedAudioBlob;
      return (
          <div className="min-h-screen bg-soosoo-black text-white p-8 animate-fade-in flex flex-col">
              <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-12">
                      <button onClick={onCancel} className="text-gray-500 hover:text-white transition flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
                          Cancel
                      </button>
                      <h1 className="text-4xl font-serif">Add Susu's Recipe</h1>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                      {/* Camera Card */}
                      <div className={`group relative bg-[#1A1A1A] border ${capturedImageBlob ? 'border-green-500/50' : 'border-white/10'} rounded-2xl overflow-hidden hover:border-soosoo-gold transition`}>
                          <div className="p-8">
                              <div className="flex justify-between">
                                  <h2 className="text-2xl font-bold mb-2">1. Take a Photo</h2>
                                  {capturedImageBlob && <button onClick={retakePhoto} className="text-xs uppercase text-gray-500">Retake</button>}
                              </div>
                              <p className="text-gray-400 text-sm">Snap the dish or ingredients.</p>
                          </div>
                          <div className="relative h-72 bg-black/50 m-2 rounded-xl overflow-hidden">
                              {capturedImageBlob ? (
                                  <div className="relative w-full h-full">
                                      <img src={imageUrl} className="w-full h-full object-cover" alt="Captured" />
                                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                                              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                              <span className="text-white text-xs font-bold uppercase tracking-wider">Photo Ready</span>
                                          </div>
                                      </div>
                                  </div>
                              ) : isCameraOpen ? (
                                  <div className="relative w-full h-full">
                                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                      <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-white/20"></button>
                                      <canvas ref={canvasRef} className="hidden"></canvas>
                                  </div>
                              ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <button onClick={startCamera} className="w-20 h-20 rounded-full bg-red-600 border-4 border-white"></button>
                                  </div>
                              )}
                          </div>
                      </div>
                      {/* Audio Card */}
                      <div className={`group relative bg-[#1A1A1A] border ${capturedAudioBlob ? 'border-green-500/50' : 'border-white/10'} rounded-2xl overflow-hidden hover:border-soosoo-gold transition`}>
                          <div className="p-8">
                               <div className="flex justify-between">
                                  <h2 className="text-2xl font-bold mb-2">2. Explain it</h2>
                                  {capturedAudioBlob && <button onClick={resetRecording} className="text-xs uppercase text-gray-500">Reset</button>}
                               </div>
                              <p className="text-gray-400 text-sm">Describe how to cook it.</p>
                          </div>
                          <div className="relative h-72 bg-black/50 m-2 rounded-xl flex items-center justify-center">
                              {capturedAudioBlob ? (
                                  <span className="text-green-500 font-bold">Audio Saved</span>
                              ) : (
                                  <button onClick={isRecording ? stopRecording : startRecording} className={`px-8 py-3 rounded-full font-bold ${isRecording ? 'bg-red-600 text-white' : 'bg-soosoo-gold text-black'}`}>
                                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                                  </button>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-center flex-col items-center">
                       <button onClick={handleCreateMasterpiece} disabled={!canGenerate} className={`px-12 py-5 rounded-full font-bold uppercase tracking-widest ${canGenerate ? 'bg-soosoo-gold text-black' : 'bg-gray-800 text-gray-500'}`}>Create Masterpiece</button>
                       <button onClick={handleSkip} className="mt-4 text-gray-500 underline text-xs uppercase">Skip to Editor</button>
                  </div>
              </div>
          </div>
      );
  }

  // --- EDITOR UI ---
  return (
    <div className="min-h-screen bg-soosoo-black p-4 md:p-8 animate-fade-in pb-20">
      <div className="max-w-4xl mx-auto bg-soosoo-paper border border-white/5 rounded-none shadow-2xl">
        <div className="bg-black/40 p-8 border-b border-white/5 flex justify-between items-center">
            <h1 className="text-3xl font-serif text-soosoo-gold">Refine Recipe</h1>
            <div className="flex items-center gap-6">
                <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs uppercase tracking-widest font-bold transition">Discard</button>
                <button onClick={handleSave} className="px-10 py-3 bg-soosoo-gold text-black font-bold uppercase tracking-widest hover:bg-white transition">Save Recipe</button>
            </div>
        </div>
        <div className="p-8 space-y-8">
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-black/30 border border-white/10 text-white text-xl font-serif" placeholder="Recipe Title" />
            <input value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-4 bg-black/30 border border-white/10 text-white" placeholder="Origin" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 bg-black/30 border border-white/10 text-white h-32" placeholder="Story" />
            
            {/* Structured Ingredients Input */}
            <div>
                <h3 className="text-soosoo-gold font-serif mb-4">Ingredients</h3>
                {ingredients.map((ing, index) => (
                    <div key={index} className="flex gap-4 mb-3">
                        <input 
                            value={ing.amount} 
                            onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)} 
                            className="w-1/4 p-3 bg-black/30 border border-white/10 text-white" 
                            placeholder="Amount (e.g., 2 cups)" 
                        />
                        <input 
                            value={ing.item} 
                            onChange={(e) => handleIngredientChange(index, 'item', e.target.value)} 
                            className="flex-grow p-3 bg-black/30 border border-white/10 text-white" 
                            placeholder="Item (e.g., Flour)" 
                        />
                        <button onClick={() => handleRemoveIngredient(index)} className="text-red-400 hover:text-red-300">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
                <button onClick={handleAddIngredient} className="mt-4 px-6 py-2 bg-white/10 text-white text-xs font-bold uppercase hover:bg-white/20">Add Ingredient</button>
            </div>

            {/* Structured Instructions Input */}
            <div>
                <h3 className="text-soosoo-gold font-serif mb-4">Instructions</h3>
                {instructions.map((step, index) => (
                    <div key={index} className="flex gap-4 mb-3 items-start">
                        <span className="text-gray-500 mt-2">{index + 1}.</span>
                        <textarea 
                            value={step.text} 
                            onChange={(e) => handleInstructionChange(index, e.target.value)} 
                            className="flex-grow p-3 bg-black/30 border border-white/10 text-white h-24" 
                            placeholder="Describe this step" 
                        />
                        <button onClick={() => handleRemoveInstruction(index)} className="text-red-400 hover:text-red-300 mt-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
                <button onClick={handleAddInstruction} className="mt-4 px-6 py-2 bg-white/10 text-white text-xs font-bold uppercase hover:bg-white/20">Add Step</button>
            </div>
            
            <div className="border-t border-white/5 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-soosoo-gold font-serif mb-4">Photo</h3>
                    <div className="aspect-video bg-black/50 mb-4 flex items-center justify-center overflow-hidden">
                        {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="Recipe" /> : <span className="text-gray-600">No Image</span>}
                    </div>
                    <button 
                        onClick={handleGenerateImage} 
                        disabled={isGeneratingImage}
                        className="w-full py-3 bg-white/10 text-white text-xs font-bold uppercase hover:bg-white/20 flex items-center justify-center gap-2"
                    >
                        {isGeneratingImage ? (
                            <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
                        ) : "Generate AI Photo"}
                    </button>
                </div>
                <div>
                    <h3 className="text-soosoo-gold font-serif mb-4">Tutorial Video</h3>
                    <div className="aspect-video bg-black/50 mb-4 flex items-center justify-center overflow-hidden relative">
                        {videoUrl ? (
                            <>
                                <video 
                                    key={videoUrl} // Force re-render on new URL
                                    src={videoUrl} 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline 
                                    className="w-full h-full object-cover" 
                                    onError={() => console.warn("Video failed to load in ChefStudio")} 
                                />
                                {isSimulatedVideo && <div className="absolute top-2 right-2 bg-yellow-600/90 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm shadow-lg border border-yellow-400/50">Simulation Mode</div>}
                            </>
                        ) : <span className="text-gray-600">No Video</span>}
                    </div>
                    <button onClick={handleGenerateVideo} className="w-full py-3 bg-red-900/50 text-red-200 text-xs font-bold uppercase hover:bg-red-900">Generate Tutorial (Veo)</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
