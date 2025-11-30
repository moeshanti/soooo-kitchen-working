
import React, { useState } from 'react';
import { Recipe, Ingredient, Review, DietaryAnalysis } from '../types';
import { speakText, generateTutorialVideo, generateThinkingSubstitutions } from '../services/geminiService';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onStartCooking: () => void;
  onUpdateRecipe: (updatedRecipe: Recipe) => void;
  onAddToCart: (ingredients: Ingredient[], recipeTitle: string) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack, onStartCooking, onUpdateRecipe, onAddToCart }) => {
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [imgSrc, setImgSrc] = useState(recipe.imageUrl);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedVideoUrl, setAnimatedVideoUrl] = useState<string | null>(null);
  
  // Thinking Mode State
  const [showDietary, setShowDietary] = useState(false);
  const [dietaryInput, setDietaryInput] = useState('');
  const [dietaryResult, setDietaryResult] = useState<DietaryAnalysis | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingError, setThinkingError] = useState('');
  
  // Shopping List Selection
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(recipe.ingredients.map((_, i) => i)));

  const getAverageRating = () => {
    if (!recipe.reviews || recipe.reviews.length === 0) return null;
    const sum = recipe.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / recipe.reviews.length).toFixed(1);
  };

  const toggleIngredient = (index: number) => {
      const newSet = new Set(selectedIndices);
      if (newSet.has(index)) {
          newSet.delete(index);
      } else {
          newSet.add(index);
      }
      setSelectedIndices(newSet);
  };

  const handleAddSelectionToCart = () => {
      const selectedItems = recipe.ingredients.filter((_, i) => selectedIndices.has(i));
      if (selectedItems.length === 0) {
          alert("Select at least one ingredient.");
          return;
      }
      onAddToCart(selectedItems, recipe.title);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;

    const review: Review = {
      id: Date.now().toString(),
      userName: userName,
      rating: newRating,
      comment: newComment,
      createdAt: Date.now()
    };

    const updatedRecipe = {
      ...recipe,
      reviews: [review, ...(recipe.reviews || [])]
    };

    onUpdateRecipe(updatedRecipe);
    setNewComment('');
    setUserName('');
    setNewRating(5);
    alert('Shukran! Your review has been added.');
  };

  const handleSpeakIngredients = async () => {
      if (isSpeaking) return;
      setIsSpeaking(true);
      try {
        const text = "Here are the ingredients you need: " + recipe.ingredients.map(i => `${i.amount} of ${i.item}`).join(", ");
        const { stop } = await speakText(text);
        // We could store 'stop' if we wanted a "Stop Reading" button, but simple playback is fine here.
      } catch (error) {
        console.error("Failed to speak ingredients", error);
        alert("Sorry, I couldn't read the ingredients right now.");
      } finally {
        setIsSpeaking(false);
      }
  };

  // Veo: Image-to-Video
  const handleBringToLife = async () => {
      setIsAnimating(true);
      try {
          const result = await generateTutorialVideo(recipe.title, imgSrc);
          if (result && result.url) {
              setAnimatedVideoUrl(result.url);
              // Persist the video
              const updated = { ...recipe, videoUrl: result.url };
              onUpdateRecipe(updated);
              
              if (result.isFallback) {
                  // Optional: Notify user it's a simulation if needed, but for "Bring to Life" seamless is better
                  console.log("Using simulation video due to quota");
              }
          } else {
              alert("Could not animate this dish. Try again later.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnimating(false);
      }
  };

  // Thinking: Dietary Analysis
  const handleAnalyzeDiet = async (inputOverride?: string) => {
      const query = inputOverride || dietaryInput;
      if (!query.trim()) return;
      
      if (inputOverride) setDietaryInput(inputOverride);

      setIsThinking(true);
      setDietaryResult(null);
      setThinkingError('');
      
      try {
          const result = await generateThinkingSubstitutions(recipe, query);
          if (result) {
            setDietaryResult(result);
          } else {
            setThinkingError("The chef needs a bit more information. Try a different request.");
          }
      } catch (e) {
          setThinkingError("My apologies, the kitchen is very busy. Please try again.");
      } finally {
          setIsThinking(false);
      }
  };

  const avgRating = getAverageRating();

  const QUICK_PROMPTS = [
      { label: '🌿 Vegan', value: 'Vegan' },
      { label: '🍞 Gluten Free', value: 'Gluten Free' },
      { label: '🥑 Keto', value: 'Keto' },
      { label: '🥜 Nut Free', value: 'Nut Free' }
  ];

  const currentVideoUrl = recipe.videoUrl || animatedVideoUrl;

  // Fallback video if API failed or no video generated yet, for display in tutorial section
  // Using reliable public GCS sample or similar
  const fallbackVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; 
  const displayVideoUrl = currentVideoUrl || fallbackVideoUrl;
  const isSimulation = !currentVideoUrl; // If we are showing fallback, it's a simulation

  return (
    <div className="min-h-screen bg-soosoo-black animate-fade-in pb-20">
      
      {/* Cinematic Header */}
      <div className="relative h-[85vh] w-full overflow-hidden group/hero">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-soosoo-black via-transparent to-transparent z-10"></div>
        
        {/* Layer Logic: Video stays ON TOP if available. Image stays BEHIND. */}
        
        {/* Static Image (Always rendered for background) */}
        <img 
            src={imgSrc} 
            className="absolute inset-0 w-full h-full object-cover animate-[float_30s_ease-in-out_infinite] scale-110 z-0" 
            alt={recipe.title} 
            onError={() => setImgSrc('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200')}
        />

        {/* Dynamic Video (Rendered on top when ready) */}
        {currentVideoUrl && (
             <video 
                src={currentVideoUrl} 
                className="absolute inset-0 w-full h-full object-cover scale-105 z-1 animate-fade-in" 
                autoPlay loop muted playsInline
             />
        )}
        
        {/* Bring to Life Trigger - Only show if no video exists yet */}
        {!currentVideoUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-opacity duration-500">
                <button 
                    onClick={handleBringToLife}
                    disabled={isAnimating}
                    className="bg-black/40 backdrop-blur-xl border border-white/30 text-white px-8 py-4 rounded-full flex items-center gap-4 hover:bg-soosoo-gold hover:text-black transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] group/btn hover:scale-105"
                >
                    {isAnimating ? (
                        <>
                            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            <span className="uppercase tracking-widest text-xs font-bold">Summoning Magic...</span>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <span className="absolute -inset-1 bg-white/20 rounded-full animate-ping"></span>
                                <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="uppercase tracking-widest text-xs font-bold">Bring Dish to Life</span>
                        </>
                    )}
                </button>
            </div>
        )}
        
        {/* Back Button */}
        <div className="absolute top-28 left-6 z-30">
          <button onClick={onBack} className="text-white hover:text-soosoo-gold transition flex items-center gap-2 group">
            <span className="border border-white/20 rounded-full p-3 bg-black/20 backdrop-blur group-hover:border-soosoo-gold transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </span>
            <span className="text-xs uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">Back</span>
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20 pb-20">
          <div className="max-w-6xl mx-auto">
             <div className="flex items-center gap-4 mb-6 opacity-0 animate-[slideUp_1s_ease-out_0.5s_forwards]">
                <span className="text-soosoo-gold tracking-[0.3em] text-xs font-bold uppercase border border-soosoo-gold/30 px-3 py-1 backdrop-blur-sm bg-black/30">
                    {recipe.origin}
                </span>
                {avgRating && (
                    <div className="flex items-center gap-2 text-white/80">
                        <span className="text-soosoo-gold">★</span>
                        <span className="font-mono text-sm">{avgRating}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">/ {recipe.reviews?.length} reviews</span>
                    </div>
                )}
             </div>
             
             <h1 className="font-serif text-6xl md:text-9xl text-white font-medium mb-8 leading-none opacity-0 animate-[slideUp_1s_ease-out_0.2s_forwards] drop-shadow-2xl">
                {recipe.title}
             </h1>
             
             <div className="flex gap-12 text-sm font-sans tracking-widest text-gray-300 uppercase opacity-0 animate-[slideUp_1s_ease-out_0.8s_forwards]">
                <div className="flex flex-col">
                    <span className="text-soosoo-gold text-[10px] mb-1">Prep</span>
                    <span className="font-bold">{recipe.prepTime}m</span>
                </div>
                <div className="w-px bg-white/20 h-10"></div>
                <div className="flex flex-col">
                    <span className="text-soosoo-gold text-[10px] mb-1">Cook</span>
                    <span className="font-bold">{recipe.cookTime}m</span>
                </div>
                <div className="w-px bg-white/20 h-10"></div>
                 <div className="flex flex-col">
                    <span className="text-soosoo-gold text-[10px] mb-1">Energy</span>
                    <span className="font-bold">{recipe.calories} kcal</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-30">
        
        {/* Intro Story */}
        <div className="bg-soosoo-charcoal p-10 md:p-16 border-l-4 border-soosoo-gold shadow-2xl mb-16">
             <p className="text-2xl md:text-3xl font-serif italic text-gray-300 leading-relaxed">"{recipe.description}"</p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-16">
            
            {/* Left Column: Ingredients */}
            <div>
                <div className="sticky top-32">
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                        <h2 className="text-3xl font-serif text-soosoo-gold">Ingredients</h2>
                        <button 
                            onClick={() => setShowShoppingList(!showShoppingList)}
                            className="text-gray-400 hover:text-white text-xs uppercase tracking-widest border border-white/10 px-3 py-1 hover:border-soosoo-gold transition"
                        >
                            {showShoppingList ? 'Hide List' : 'Shop List'}
                        </button>
                    </div>

                    {showShoppingList && (
                        <div className="bg-soosoo-paper p-6 mb-8 border border-soosoo-gold/20 shadow-lg animate-fade-in relative overflow-hidden">
                            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                                Select items to buy
                            </h3>
                            <ul className="space-y-3 mb-6 relative z-10">
                                {recipe.ingredients.map((ing, i) => (
                                    <li 
                                        key={i} 
                                        className={`flex items-center text-sm p-2 rounded cursor-pointer transition-colors ${selectedIndices.has(i) ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                                        onClick={() => toggleIngredient(i)}
                                    >
                                        <div className={`w-4 h-4 mr-3 border flex items-center justify-center transition-colors ${selectedIndices.has(i) ? 'border-soosoo-gold bg-soosoo-gold' : 'border-gray-600'}`}>
                                            {selectedIndices.has(i) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <span className={selectedIndices.has(i) ? '' : 'line-through decoration-gray-600'}>{ing.amount} {ing.item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <button 
                                    onClick={handleAddSelectionToCart}
                                    className="w-full bg-soosoo-gold text-black font-bold uppercase tracking-widest text-xs py-3 hover:bg-white transition flex items-center justify-center gap-2"
                                >
                                    Add Selection to Cart
                                </button>
                            </div>
                        </div>
                    )}

                    <ul className="space-y-6">
                        {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-baseline justify-between group">
                                <span className="text-gray-300 font-light group-hover:text-white transition text-lg">{ing.item}</span>
                                <div className="flex-grow mx-4 border-b border-dotted border-gray-800 h-4"></div>
                                <span className="font-mono text-soosoo-gold text-sm">{ing.amount}</span>
                            </li>
                        ))}
                    </ul>

                    {/* THINKING MODE: Dietary Intelligence Card (CHEF MODE UI) */}
                    <div className="mt-12 group relative overflow-hidden rounded-xl bg-[#121212] border border-white/10 transition-all hover:border-soosoo-gold/30">
                        
                        {/* Thinking Overlay (Scanning Effect) */}
                        {isThinking && (
                            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-soosoo-gold shadow-[0_0_20px_#D4AF37] animate-[slideDown_2s_linear_infinite]"></div>
                                <div className="absolute inset-0 bg-soosoo-gold/5"></div>
                            </div>
                        )}

                        <div className="p-6 relative z-10">
                             <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowDietary(!showDietary)}>
                                 <h4 className="text-sm font-bold uppercase tracking-widest text-soosoo-gold flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full bg-soosoo-gold/10 flex items-center justify-center transition-all ${isThinking ? 'animate-pulse bg-soosoo-gold text-black' : ''}`}>
                                        <span className="text-lg">👩‍🍳</span>
                                    </div>
                                    Chef's Dietary Intelligence
                                 </h4>
                                 <svg className={`w-4 h-4 text-gray-500 transform transition-transform ${showDietary ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                             </div>
                             
                             {showDietary && (
                                 <div className="mt-6 animate-fade-in space-y-4">
                                     <p className="text-gray-500 text-xs">Uses <span className="text-soosoo-gold">Gemini Thinking</span> to intelligently adapt recipes.</p>
                                     
                                     <div className="flex relative">
                                         <input 
                                            value={dietaryInput}
                                            onChange={(e) => setDietaryInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeDiet()}
                                            placeholder="How should I adapt this?"
                                            disabled={isThinking}
                                            className="bg-black/50 border border-white/20 text-white text-sm pl-4 pr-24 py-4 w-full focus:border-soosoo-gold outline-none transition-colors rounded-lg font-mono"
                                         />
                                         <button 
                                            onClick={() => handleAnalyzeDiet()}
                                            disabled={isThinking}
                                            className="absolute right-1 top-1 bottom-1 bg-soosoo-gold text-black px-4 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                         >
                                             {isThinking ? 'Thinking...' : 'Ask Chef'}
                                         </button>
                                     </div>

                                     {/* Quick Prompts */}
                                     {!dietaryResult && !isThinking && (
                                         <div className="flex flex-wrap gap-2 mt-2">
                                             {QUICK_PROMPTS.map(p => (
                                                 <button
                                                    key={p.value}
                                                    onClick={() => handleAnalyzeDiet(p.value)}
                                                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:border-soosoo-gold transition"
                                                 >
                                                     {p.label}
                                                 </button>
                                             ))}
                                         </div>
                                     )}

                                     {thinkingError && (
                                         <div className="text-red-400 text-xs mt-2 border-l-2 border-red-500 pl-3 py-1">
                                             {thinkingError}
                                         </div>
                                     )}

                                     {dietaryResult && (
                                         <div className="mt-6 space-y-4 animate-fade-in">
                                             {/* Header Badge */}
                                             <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                 <span className="text-white font-serif text-lg">{dietaryResult.title}</span>
                                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                                                     dietaryResult.feasibility === 'High' ? 'bg-green-500/20 text-green-400' : 
                                                     dietaryResult.feasibility === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                     'bg-red-500/20 text-red-400'
                                                 }`}>
                                                     Feasibility: {dietaryResult.feasibility}
                                                 </span>
                                             </div>

                                             {/* Cards Grid */}
                                             <div className="grid gap-3">
                                                 {dietaryResult.substitutions.map((sub, idx) => (
                                                     <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-soosoo-gold/30 transition-colors">
                                                         <div className="flex items-center gap-3 text-sm mb-2">
                                                             <span className="text-gray-500 line-through decoration-red-500/50">{sub.original}</span>
                                                             <svg className="w-4 h-4 text-soosoo-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                             <span className="text-white font-bold">{sub.substitute}</span>
                                                         </div>
                                                         <p className="text-xs text-gray-300 mb-2 font-sans bg-black/30 p-2 rounded leading-relaxed">{sub.instruction}</p>
                                                         <div className="flex gap-2 items-start">
                                                             <span className="text-[10px] uppercase text-soosoo-gold tracking-wider mt-0.5">Why:</span>
                                                             <p className="text-[11px] text-gray-500 italic leading-tight">{sub.science}</p>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>

                                             {/* Verdict */}
                                             <div className="bg-soosoo-gold/10 p-4 rounded-lg border-l-2 border-soosoo-gold">
                                                 <h5 className="text-[10px] font-bold text-soosoo-gold uppercase tracking-widest mb-1">Chef's Promise</h5>
                                                 <p className="text-sm text-gray-300 font-light">{dietaryResult.verdict}</p>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                    </div>

                     {/* Read Ingredients Voice Helper */}
                    <div className="mt-8">
                        <button 
                        onClick={handleSpeakIngredients}
                        disabled={isSpeaking}
                        className={`text-xs uppercase tracking-widest flex items-center gap-2 transition ${isSpeaking ? 'text-soosoo-gold animate-pulse' : 'text-gray-500 hover:text-soosoo-gold'}`}
                        >
                        {isSpeaking ? (
                            <>
                                <span className="w-2 h-2 bg-soosoo-gold rounded-full animate-ping"></span>
                                Generating Audio...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                Listen to Ingredients
                            </>
                        )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Instructions & Media */}
            <div>
                 {/* Video Player Section */}
                 <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-3xl font-serif text-soosoo-gold">Watch Tutorial</h2>
                        {currentVideoUrl && !currentVideoUrl.includes('storage.googleapis') && (
                            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                AI Generated
                            </span>
                        )}
                        {isSimulation && (
                             <span className="bg-yellow-600/30 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-yellow-600/50">
                                AI Video Unavailable - Showing Simulation
                            </span>
                        )}
                    </div>
                    
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 group bg-black">
                        <video 
                            src={displayVideoUrl} 
                            className="w-full h-full object-cover" 
                            controls 
                            playsInline
                        />
                        {/* Overlay Gradient for Cinema feel */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                <h2 className="text-3xl font-serif text-soosoo-gold mb-8 border-b border-white/10 pb-4">The Method</h2>
                <div className="space-y-12">
                    {recipe.instructions.map((step, idx) => (
                        <div key={idx} className="group relative pl-10 border-l border-gray-800 hover:border-soosoo-gold transition-colors duration-500">
                            <span className="absolute -left-3.5 top-0 w-7 h-7 bg-soosoo-black border border-gray-800 group-hover:border-soosoo-gold text-gray-500 group-hover:text-soosoo-gold rounded-full flex items-center justify-center font-serif font-bold transition-all">
                                {step.stepNumber}
                            </span>
                            <p className="text-xl text-gray-300 font-light leading-relaxed group-hover:text-white transition-colors">
                                {step.text}
                            </p>
                            {step.durationMinutes && (
                                <div className="mt-3 text-xs text-gray-600 font-mono flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {step.durationMinutes} min
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Cooking Mode CTA */}
                <div className="mt-20 flex justify-center">
                    <button 
                        onClick={onStartCooking}
                        className="group relative px-12 py-6 bg-transparent border border-soosoo-gold text-soosoo-gold overflow-hidden transition-all hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                    >
                        <div className="absolute inset-0 w-0 bg-soosoo-gold transition-all duration-[400ms] ease-out group-hover:w-full"></div>
                        <span className="relative flex items-center gap-4 font-bold uppercase tracking-widest text-sm">
                            Enter Cooking Mode
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                    </button>
                </div>

                {/* Reviews Section */}
                <div className="mt-24 pt-12 border-t border-white/5">
                    <h2 className="text-2xl font-serif text-white mb-8">Guest Book</h2>
                    
                    <form onSubmit={handleSubmitReview} className="bg-soosoo-paper p-8 mb-10 border border-white/5 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewRating(star)}
                                            className={`text-2xl transition hover:scale-110 ${newRating >= star ? 'text-soosoo-gold' : 'text-gray-700'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Name</label>
                                <input 
                                    required
                                    className="w-full bg-black/30 border border-gray-700 text-white p-3 text-sm focus:border-soosoo-gold outline-none transition-colors"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Thoughts</label>
                            <textarea 
                                required
                                className="w-full bg-black/30 border border-gray-700 text-white p-3 text-sm h-24 focus:border-soosoo-gold outline-none transition-colors"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your experience..."
                            />
                        </div>
                        <button type="submit" className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-soosoo-gold transition duration-300">
                            Sign Guestbook
                        </button>
                    </form>

                    <div className="space-y-8">
                        {recipe.reviews && recipe.reviews.length > 0 ? (
                            recipe.reviews.map(review => (
                                <div key={review.id} className="border-b border-white/5 pb-8 last:border-0">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <h4 className="font-serif text-xl text-white italic">{review.userName}</h4>
                                        <span className="text-soosoo-gold text-sm tracking-widest">
                                            {'★'.repeat(review.rating)}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 font-light leading-relaxed">{review.comment}</p>
                                    <div className="mt-2 text-[10px] text-gray-600 uppercase tracking-widest">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600 italic">The table is quiet. Be the first to speak.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
