import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { speakText } from '../services/geminiService';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-speak new step text
  useEffect(() => {
    // Small delay to make it feel natural
    const timer = setTimeout(() => {
        const text = recipe.instructions[currentStep].text;
        speakText(text);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentStep, recipe.instructions]);

  const handleNext = () => {
      if (currentStep < recipe.instructions.length - 1) {
          setCurrentStep(c => c + 1);
      } else {
          speakText("Mabrouk! You have finished cooking.");
      }
  };

  const handlePrev = () => {
      if (currentStep > 0) {
          setCurrentStep(c => c - 1);
      }
  };

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8">
            <h2 className="text-2xl font-serif text-soosoo-gold italic">{recipe.title}</h2>
            <button onClick={onExit} className="group flex items-center gap-2 text-gray-500 hover:text-white transition">
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Exit</span>
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-900 w-full">
            <div className="h-full bg-soosoo-gold transition-all duration-700 ease-out shadow-[0_0_10px_#D4AF37]" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-6xl mx-auto relative">
            <div className="absolute top-10 text-soosoo-gold/30 font-serif text-9xl opacity-20 select-none">
                {currentStep + 1}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-medium leading-snug mb-16 relative z-10 text-gray-100">
                {recipe.instructions[currentStep].text}
            </h1>

            {recipe.instructions[currentStep].durationMinutes && (
                <div className="inline-flex items-center gap-4 border border-white/20 px-8 py-4 rounded-full text-xl text-soosoo-gold bg-white/5 backdrop-blur-md">
                    <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-mono">{recipe.instructions[currentStep].durationMinutes} mins</span>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="p-10 border-t border-white/10 bg-black">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <button 
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex items-center gap-4 text-lg font-bold text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition uppercase tracking-widest"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                </button>

                {/* Voice Control Indicator */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full border border-soosoo-gold/30 flex items-center justify-center animate-pulse">
                        <svg className="w-6 h-6 text-soosoo-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    </div>
                </div>

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