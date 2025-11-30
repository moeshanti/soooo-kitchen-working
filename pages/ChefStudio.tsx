
import React, { useState, useRef, useEffect } from 'react';
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

export const ChefStudio: React.FC<ChefStudioProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState<StudioStep>('select');
  const [status, setStatus] = useState('');
  
  // Recipe State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [ingredientsStr, setIngredientsStr] = useState('');
  const [instructionsStr, setInstructionsStr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // --- Input Data State ---
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

  // Effect to attach stream to video element when active
  useEffect(() => {
      if (isCameraOpen && videoRef.current && cameraStream) {
          videoRef.current.srcObject = cameraStream;
      }
  }, [isCameraOpen, cameraStream]);

  const capturePhoto = async () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Get Data URL for preview UI
              const dataUrl = canvas.toDataURL('image/jpeg');
              setImageUrl(dataUrl);

              // Get Blob for AI
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

  // --- Audio Recording Logic ---
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
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
              setCapturedAudioBlob(audioBlob);
              stream.getTracks().forEach(track => track.stop()); // Stop mic
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Mic Error:", err);
          alert("Could not access microphone. Please check permissions.");
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
      setStatus('Consulting the spirits of the kitchen...');

      try {
          const result = await generateRecipeMultimodal(
              capturedImageBlob || undefined, 
              capturedAudioBlob || undefined
          );

          if (result) {
              if (result.title) setTitle(result.title);
              if (result.description) setDescription(result.description);
              if (result.origin) setOrigin(result.origin || '');
              if (result.ingredients) setIngredientsStr(result.ingredients?.map(i => `${i.amount} ${i.item}`).join('\n') || '');
              if (result.instructions) setInstructionsStr(result.instructions?.map(i => i.text).join('\n') || '');
              
              setStep('edit');
          } else {
              throw new Error("No result returned");
          }
      } catch (err) {
          console.error(err);
          alert('Failed to generate recipe. Please try again.');
          setStep('select');
      }
  };

  const handleSkip = () => {
      setStep('edit');
  };

  // --- Editor Handlers ---
  const handleGenerateImage = async () => {
      if (!title) {
          alert("Please enter a title first");
          return;
      }
      setStep('processing');
      setStatus('Painting your dish...');
      try {
          const url = await generateDishImage(title + " " + description);
          setImageUrl(url);
          setStep('edit');
      } catch (err) {
          alert("Failed to generate image");
          setStep('edit');
      }
  };

  const handleGenerateVideo = async () => {
    if (!title) {
        alert("Please enter a title first");
        return;
    }
    setStep('processing');
    setStatus('Directing your tutorial (this may take a minute)...');
    try {
        const imageParam = (imageUrl && imageUrl.startsWith('data:')) ? imageUrl : undefined;
        const result = await generateTutorialVideo(title, imageParam);
        
        if (result && result.url) {
            setVideoUrl(result.url);
            if (result.isFallback) {
                alert("Veo AI video quota reached. Showing a simulated video instead.");
            }
        } else {
            alert("Video generation failed or was cancelled.");
        }
    } catch (err: any) {
        console.error(err);
        alert("Failed to generate video");
    } finally {
        setStep('edit');
    }
  };

  const handleSave = () => {
      const ingredients: Ingredient[] = ingredientsStr.split('\n').map(line => ({ item: line, amount: '' }));
      const instructions: InstructionStep[] = instructionsStr.split('\n').map((line, idx) => ({ stepNumber: idx + 1, text: line }));

      const newRecipe: Recipe = {
          id: Date.now().toString(),
          title,
          description,
          origin: origin || 'Middle East',
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200',
          videoUrl,
          prepTime: 30,
          cookTime: 30,
          difficulty: 'Medium',
          calories: 500,
          ingredients,
          instructions,
          createdAt: Date.now(),
          reviews: []
      };
      onSave(newRecipe);
  };

  // --- RENDERERS ---

  if (step === 'processing') {
      return (
          <div className="min-h-screen bg-soosoo-black text-white p-8 animate-fade-in flex flex-col justify-center items-center">
               <div className="w-20 h-20 border-4 border-soosoo-gold border-t-transparent rounded-full animate-spin mb-8"></div>
               <h2 className="text-2xl font-serif text-soosoo-gold animate-pulse">{status}</h2>
               <p className="text-gray-500 mt-2">Gemini is weaving your ingredients and stories together...</p>
          </div>
      );
  }

  if (step === 'select') {
      const canGenerate = capturedImageBlob || capturedAudioBlob;

      return (
          <div className="min-h-screen bg-soosoo-black text-white p-8 animate-fade-in flex flex-col">
              <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-center">
                  
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-12">
                      <button onClick={onCancel} className="text-gray-500 hover:text-white transition flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
                          Cancel
                      </button>
                      <h1 className="text-4xl font-serif">Add Susu's Recipe</h1>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                      
                      {/* Card 1: Camera */}
                      <div className={`group relative bg-[#1A1A1A] border ${capturedImageBlob ? 'border-green-500/50' : (isCameraOpen ? 'border-soosoo-gold' : 'border-white/10')} rounded-2xl overflow-hidden hover:border-soosoo-gold transition-colors duration-300`}>
                          <div className="p-8">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <span className={`inline-block w-8 h-8 rounded-full ${capturedImageBlob ? 'bg-green-500 text-white' : 'bg-soosoo-gold text-black'} font-bold text-center leading-8 mb-4`}>
                                          {capturedImageBlob ? '✓' : '1'}
                                      </span>
                                      <h2 className="text-2xl font-bold mb-2">Take a Photo</h2>
                                  </div>
                                  {capturedImageBlob && (
                                      <button onClick={retakePhoto} className="text-xs uppercase tracking-widest text-gray-500 hover:text-white">Retake</button>
                                  )}
                              </div>
                              <p className="text-gray-400 text-sm">Snap a photo of the dish or ingredients.</p>
                          </div>
                          
                          <div className="relative h-72 bg-black/50 m-2 rounded-xl overflow-hidden border border-white/5 group-hover:border-soosoo-gold/30 transition">
                              {capturedImageBlob ? (
                                  // Captured State
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
                                  // Active Camera State
                                  <div className="relative w-full h-full">
                                      <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted
                                        className="w-full h-full object-cover"
                                      />
                                      {/* Inline Controls Overlay */}
                                      <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                                          <div className="flex justify-end">
                                              <button 
                                                  onClick={stopCamera}
                                                  className="bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition border border-white/20"
                                              >
                                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                              </button>
                                          </div>
                                          <div className="flex justify-center pb-2">
                                              <button 
                                                  onClick={capturePhoto}
                                                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition bg-white/20 hover:bg-white/40 backdrop-blur-md shadow-xl"
                                              >
                                                  <div className="w-12 h-12 bg-white rounded-full"></div>
                                              </button>
                                          </div>
                                      </div>
                                      <canvas ref={canvasRef} className="hidden"></canvas>
                                  </div>
                              ) : (
                                  // Initial State
                                  <>
                                      <img 
                                          src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000&auto=format&fit=crop" 
                                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                                          alt="Dark Food Background" 
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                          <button 
                                              onClick={startCamera}
                                              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition bg-red-600 hover:bg-red-500 shadow-2xl z-10"
                                          >
                                              <div className="w-8 h-8 bg-white rounded-sm"></div>
                                          </button>
                                      </div>
                                      <div className="absolute bottom-4 left-4 text-white font-mono text-xs drop-shadow-md">Tap to Open Camera</div>
                                  </>
                              )}
                          </div>
                      </div>

                      {/* Card 2: Voice */}
                      <div className={`group relative bg-[#1A1A1A] border ${capturedAudioBlob ? 'border-green-500/50' : (isRecording ? 'border-soosoo-gold' : 'border-white/10')} rounded-2xl overflow-hidden hover:border-soosoo-gold transition-colors duration-300`}>
                          <div className="p-8">
                               <div className="flex justify-between items-start">
                                  <div>
                                      <span className={`inline-block w-8 h-8 rounded-full ${capturedAudioBlob ? 'bg-green-500 text-white' : 'bg-soosoo-gold text-black'} font-bold text-center leading-8 mb-4`}>
                                          {capturedAudioBlob ? '✓' : '2'}
                                      </span>
                                      <h2 className="text-2xl font-bold mb-2">Explain the Recipe</h2>
                                  </div>
                                  {capturedAudioBlob && (
                                      <button onClick={resetRecording} className="text-xs uppercase tracking-widest text-gray-500 hover:text-white">Re-record</button>
                                  )}
                              </div>
                              <p className="text-gray-400 text-sm">"Start by chopping onions..." - Just talk, and we'll write it down.</p>
                          </div>

                          <div className="relative h-72 bg-black/50 m-2 rounded-xl flex flex-col items-center justify-center border border-white/5 group-hover:border-soosoo-gold/30 transition">
                              {capturedAudioBlob ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full bg-green-500/10 animate-fade-in">
                                      <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      </div>
                                      <span className="text-white font-serif text-lg">Audio Saved</span>
                                  </div>
                              ) : isRecording ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full bg-black/80 animate-fade-in">
                                      <div className="relative mb-8">
                                          <div className="w-24 h-24 rounded-full bg-soosoo-gold/20 animate-ping absolute inset-0"></div>
                                          <div className="w-24 h-24 rounded-full bg-soosoo-gold flex items-center justify-center relative z-10">
                                               <svg className="w-10 h-10 text-black animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                          </div>
                                      </div>
                                      <h3 className="text-white font-serif text-xl mb-6">Listening...</h3>
                                      <button 
                                          onClick={stopRecording}
                                          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest rounded-full shadow-lg transition transform hover:scale-105"
                                      >
                                          Stop Recording
                                      </button>
                                  </div>
                              ) : (
                                  <>
                                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition">
                                          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                      </div>
                                      
                                      <button 
                                          onClick={startRecording}
                                          className="px-8 py-3 bg-[#E89F2A] hover:bg-[#d68f20] text-black font-bold uppercase tracking-widest rounded-md shadow-lg transform transition hover:scale-105"
                                      >
                                          Start Recording
                                      </button>
                                  </>
                              )}
                          </div>
                      </div>

                  </div>

                  {/* Create Button */}
                  <div className="flex flex-col items-center pb-12">
                       <button 
                          onClick={handleCreateMasterpiece}
                          disabled={!canGenerate}
                          className={`
                              group relative px-12 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-sm transition-all duration-300 shadow-2xl
                              ${canGenerate 
                                  ? 'bg-soosoo-gold text-black hover:bg-white hover:scale-105 cursor-pointer' 
                                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}
                          `}
                       >
                           <span className="relative z-10 flex items-center gap-3">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                               Create Masterpiece
                           </span>
                           {canGenerate && (
                               <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                           )}
                       </button>
                       <div className="mt-6 text-center">
                          <button onClick={handleSkip} className="text-gray-500 text-xs uppercase tracking-widest hover:text-white underline decoration-gray-700 underline-offset-4 hover:decoration-white transition">
                              Skip / Start from Scratch
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- EDITOR UI ---
  return (
    <div className="min-h-screen bg-soosoo-black p-4 md:p-8 animate-fade-in pb-20">
      <div className="max-w-4xl mx-auto bg-soosoo-paper border border-white/5 rounded-none shadow-2xl overflow-hidden">
        
        <div className="bg-black/40 p-8 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-4">
                <button onClick={() => setStep('select')} className="text-gray-500 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                    <h1 className="text-3xl font-serif text-soosoo-gold italic">Refine Recipe</h1>
                    <p className="text-gray-500 text-sm uppercase tracking-widest mt-1">AI Generated Draft</p>
                </div>
            </div>
            {(step === 'processing') && (
                <div className="flex items-center gap-3 bg-soosoo-gold/10 px-4 py-2 border border-soosoo-gold/30">
                    <div className="w-1 h-1 bg-soosoo-gold rounded-full animate-ping"></div>
                    <span className="text-soosoo-gold text-xs font-bold uppercase tracking-widest">{status}</span>
                </div>
            )}
        </div>

        <div className="p-8 space-y-8">
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Recipe Title</label>
                    <input 
                        value={title} onChange={e => setTitle(e.target.value)}
                        className="w-full p-4 bg-black/30 border border-white/10 text-white focus:border-soosoo-gold outline-none font-serif text-xl" 
                        placeholder="e.g. Grandma's Lentil Soup"
                    />
                </div>
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Origin / Cuisine</label>
                    <input 
                         value={origin} onChange={e => setOrigin(e.target.value)}
                         className="w-full p-4 bg-black/30 border border-white/10 text-white focus:border-soosoo-gold outline-none font-serif text-xl" 
                         placeholder="e.g. Lebanon"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Story & Description</label>
                <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full p-4 bg-black/30 border border-white/10 text-white focus:border-soosoo-gold outline-none h-32 font-light leading-relaxed" 
                    placeholder="Tell the story behind this dish..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Ingredients (One per line)</label>
                    <textarea 
                        value={ingredientsStr} onChange={e => setIngredientsStr(e.target.value)}
                        className="w-full p-4 bg-black/30 border border-white/10 text-gray-300 focus:border-soosoo-gold outline-none h-48 font-mono text-xs leading-6" 
                    />
                </div>
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Instructions (One step per line)</label>
                    <textarea 
                        value={instructionsStr} onChange={e => setInstructionsStr(e.target.value)}
                        className="w-full p-4 bg-black/30 border border-white/10 text-gray-300 focus:border-soosoo-gold outline-none h-48 font-mono text-xs leading-6" 
                    />
                </div>
            </div>

            {/* Media Generation Section */}
            <div className="border-t border-white/5 pt-8 bg-white/5 -mx-8 px-8 pb-8">
                <h3 className="text-xl font-serif text-soosoo-gold mb-6 mt-4">Media Studio</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Gen */}
                    <div className="space-y-4">
                        <div className="aspect-video bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden relative group rounded-md">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <span className="text-gray-600 text-xs uppercase tracking-widest">No image yet</span>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleGenerateImage}
                            disabled={step === 'processing'}
                            className="w-full py-3 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 hover:border-soosoo-gold transition text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                            Generate Photo (Gemini)
                        </button>
                    </div>

                    {/* Video Gen */}
                    <div className="space-y-4">
                         <div className="aspect-video bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden relative rounded-md">
                            {videoUrl ? (
                                <video src={videoUrl} controls className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center px-4">
                                     <p className="text-gray-600 text-xs uppercase tracking-widest">No video yet</p>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleGenerateVideo}
                            disabled={step === 'processing'}
                            className="w-full py-3 bg-soosoo-red/20 text-red-200 hover:text-white hover:bg-soosoo-red border border-soosoo-red/30 transition text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Generate Tutorial (Veo)
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
                <button onClick={onCancel} className="px-8 py-3 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition">Discard</button>
                <button onClick={handleSave} className="px-10 py-3 bg-soosoo-gold text-black hover:bg-white text-xs font-bold uppercase tracking-widest transition shadow-lg shadow-soosoo-gold/20">Save Recipe</button>
            </div>

        </div>
      </div>
    </div>
  );
};
