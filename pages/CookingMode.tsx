
import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { speakText, connectLiveSession } from '../services/geminiService';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Smart Timer State
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- Live Mode State ---
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'listening' | 'speaking'>('disconnected');
  const liveSessionRef = useRef<{ sendAudio: (b: Blob) => void; close: () => void } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Audio Playback Ref to stop current utterance
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Track playback time to schedule chunks sequentially
  const nextStartTimeRef = useRef<number>(0);

  // Stop audio on unmount or when step changes
  useEffect(() => {
      return () => {
          if (stopAudioRef.current) {
              stopAudioRef.current();
          }
      };
  }, []);

  // Auto-speak new step text (Legacy TTS)
  useEffect(() => {
    if (!isLiveMode) {
        // Stop any previous audio before starting new one
        if (stopAudioRef.current) {
            stopAudioRef.current();
            stopAudioRef.current = null;
        }

        // IMMEDIATE PLAYBACK: No timeout delay
        (async () => {
            const text = recipe.instructions[currentStep].text;
            const { stop } = await speakText(text);
            stopAudioRef.current = stop;
        })();
        
        return () => {
            if (stopAudioRef.current) stopAudioRef.current();
        };
    }
  }, [currentStep, recipe.instructions, isLiveMode]);

  // Timer Countdown Logic
  useEffect(() => {
      let interval: any;
      if (isTimerRunning && timerRemaining !== null && timerRemaining > 0) {
          interval = setInterval(() => {
              setTimerRemaining(prev => (prev !== null ? prev - 1 : 0));
          }, 1000);
      } else if (timerRemaining === 0) {
          setIsTimerRunning(false);
          (async () => {
              const { stop } = await speakText("Timer finished! Check your food.");
              stopAudioRef.current = stop;
          })();
      }
      return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  const handleNext = async () => {
      // Stop current instruction audio immediately
      if (stopAudioRef.current) {
          stopAudioRef.current();
      }

      if (currentStep < recipe.instructions.length - 1) {
          setCurrentStep(c => c + 1);
          setTimerRemaining(null); 
      } else {
          const { stop } = await speakText("Mabrouk! You have finished cooking.");
          stopAudioRef.current = stop;
      }
  };

  const handlePrev = () => {
      if (stopAudioRef.current) {
          stopAudioRef.current();
      }
      if (currentStep > 0) {
          setCurrentStep(c => c - 1);
          setTimerRemaining(null);
      }
  };

  const handleExit = () => {
      if (stopAudioRef.current) {
          stopAudioRef.current();
      }
      stopLiveSession();
      onExit();
  };

  // Helper to extract time from text (e.g. "boil for 10 minutes")
  const extractTimeFromStep = (text: string): number | null => {
      const match = text.match(/(\d+)\s*(mins?|minutes?)/i);
      if (match) return parseInt(match[1]);
      return null;
  };

  const detectedTime = extractTimeFromStep(recipe.instructions[currentStep].text);

  const startSmartTimer = (minutes: number) => {
      setTimerDuration(minutes * 60);
      setTimerRemaining(minutes * 60);
      setIsTimerRunning(true);
  };

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100;

  // --- Live API Handlers ---
  const toggleLiveMode = async () => {
      if (isLiveMode) {
          stopLiveSession();
      } else {
          startLiveSession();
      }
  };

  const startLiveSession = async () => {
      setLiveStatus('connecting');
      // Stop legacy TTS if switching to live mode
      if (stopAudioRef.current) stopAudioRef.current();

      try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const outCtx = new AudioContextClass({ sampleRate: 24000 });
          audioContextRef.current = outCtx;
          nextStartTimeRef.current = 0;

          const session = await connectLiveSession(
              async (base64Audio, isTurnComplete) => {
                  if (base64Audio) {
                      setLiveStatus('speaking');
                      
                      const binaryString = atob(base64Audio);
                      const len = binaryString.length;
                      const int16 = new Int16Array(len / 2);
                      for (let i = 0; i < len; i += 2) {
                        const b1 = binaryString.charCodeAt(i);
                        const b2 = binaryString.charCodeAt(i + 1);
                        const s = (b2 << 8) | b1;
                        int16[i/2] = s >= 32768 ? s - 65536 : s;
                      }
                      const float32 = new Float32Array(int16.length);
                      for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

                      const buffer = outCtx.createBuffer(1, float32.length, 24000);
                      buffer.copyToChannel(float32, 0);
                      
                      const source = outCtx.createBufferSource();
                      source.buffer = buffer;
                      source.connect(outCtx.destination);
                      
                      const now = outCtx.currentTime;
                      const startTime = Math.max(now, nextStartTimeRef.current);
                      
                      source.start(startTime);
                      nextStartTimeRef.current = startTime + buffer.duration;
                  }

                  if (isTurnComplete) {
                      const now = outCtx.currentTime;
                      const timeRemaining = Math.max(0, nextStartTimeRef.current - now);
                      
                      setTimeout(() => {
                          if (audioContextRef.current?.state !== 'closed') {
                             setLiveStatus('listening');
                          }
                      }, timeRemaining * 1000);
                  }
              },
              () => {
                  stopLiveSession();
              }
          );
          
          liveSessionRef.current = session;
          setIsLiveMode(true);
          setLiveStatus('listening');

          const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
          const inCtx = new AudioContext({ sampleRate: 16000 });
          const source = inCtx.createMediaStreamSource(stream);
          const processor = inCtx.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i=0; i<l; i++) {
                  int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              const blob = new Blob([int16.buffer], { type: 'audio/pcm' });
              session.sendAudio(blob);
          };

          source.connect(processor);
          processor.connect(inCtx.destination); 
          
          sourceRef.current = source;
          processorRef.current = processor;

      } catch (e) {
          console.error("Failed to start live", e);
          setLiveStatus('disconnected');
          setIsLiveMode(false);
          alert("Could not start Live Mode. Check permissions.");
      }
  };

  const stopLiveSession = () => {
      if (liveSessionRef.current) liveSessionRef.current.close();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (processorRef.current) processorRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
      }
      
      liveSessionRef.current = null;
      setIsLiveMode(false);
      setLiveStatus('disconnected');
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 z-10">
            <h2 className="text-2xl font-serif text-soosoo-gold italic">{recipe.title}</h2>
            <button onClick={handleExit} className="group flex items-center gap-2 text-gray-500 hover:text-white transition">
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Exit</span>
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-900 w-full">
            <div className="h-full bg-soosoo-gold transition-all duration-700 ease-out shadow-[0_0_10px_#D4AF37]" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-6xl mx-auto relative w-full">
            <div className="absolute top-10 text-soosoo-gold/30 font-serif text-9xl opacity-20 select-none">
                {currentStep + 1}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-medium leading-snug mb-16 relative z-10 text-gray-100">
                {recipe.instructions[currentStep].text}
            </h1>

            {/* Smart Timer Chip */}
            {detectedTime && !timerRemaining && (
                <button 
                    onClick={() => startSmartTimer(detectedTime)}
                    className="inline-flex items-center gap-3 bg-white/10 hover:bg-soosoo-gold hover:text-black border border-white/20 px-6 py-3 rounded-full text-lg font-bold transition-all mb-8 animate-pulse"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Start Timer ({detectedTime}m)
                </button>
            )}

            {/* Active Timer Display */}
            {timerRemaining !== null && (
                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="text-6xl font-mono font-bold text-soosoo-gold tabular-nums tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                        {formatTime(timerRemaining)}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-xs uppercase font-bold text-gray-400 hover:text-white">
                            {isTimerRunning ? 'Pause' : 'Resume'}
                        </button>
                        <button onClick={() => setTimerRemaining(null)} className="text-xs uppercase font-bold text-red-400 hover:text-red-300">
                            Stop
                        </button>
                    </div>
                </div>
            )}

            {/* LIVE API VISUALIZER */}
            {isLiveMode && (
                <div className="flex flex-col items-center gap-4 mt-8 animate-fade-in">
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${liveStatus === 'speaking' ? 'scale-110 shadow-[0_0_50px_#D4AF37]' : 'scale-100 shadow-[0_0_20px_#D4AF37]'}`}>
                         <div className={`absolute inset-0 bg-soosoo-gold rounded-full opacity-20 ${liveStatus === 'speaking' ? 'animate-ping' : ''}`}></div>
                         <div className="w-24 h-24 bg-gradient-to-br from-soosoo-gold to-yellow-700 rounded-full flex items-center justify-center relative z-10">
                             {liveStatus === 'connecting' ? (
                                 <svg className="w-10 h-10 text-black animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                             ) : (
                                 <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                             )}
                         </div>
                    </div>
                    <span className="text-soosoo-gold uppercase tracking-widest text-xs font-bold">
                        {liveStatus === 'connecting' ? 'Connecting to Mama...' : (liveStatus === 'speaking' ? 'Mama is speaking...' : 'Mama is listening...')}
                    </span>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="p-10 border-t border-white/10 bg-black relative z-20">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <button 
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex items-center gap-4 text-lg font-bold text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition uppercase tracking-widest"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                </button>

                {/* Live Button Toggle */}
                <button 
                    onClick={toggleLiveMode}
                    className={`flex flex-col items-center gap-2 transition-transform hover:scale-105 ${isLiveMode ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isLiveMode ? 'border-soosoo-gold bg-soosoo-gold text-black' : 'border-gray-500 text-gray-500'}`}>
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-widest ${isLiveMode ? 'text-soosoo-gold' : 'text-gray-500'}`}>
                        {isLiveMode ? 'Live On' : 'Mama Live'}
                    </span>
                </button>

                <button 
                    onClick={handleNext}
                    disabled={currentStep === recipe.instructions.length - 1}
                     className="flex items-center gap-4 text-lg font-bold text-soosoo-gold hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition uppercase tracking-widest"
                >
                    Next
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    </div>
  );
};
