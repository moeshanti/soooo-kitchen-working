
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
              const updated = { ...recipe, videoUrl: result.url };
              onUpdateRecipe(updated);
          } else {
              alert("Could not animate this dish. Try again later.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnimating(false);
      }
  };

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
  const displayVideoUrl = currentVideoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const isSimulation = !currentVideoUrl;

  return (
    <div className="min-h-screen bg-soosoo-black animate-fade-in pb-20">
      
      {/* Cinematic Header */}
      <div className="relative h-[85vh] w-full overflow-hidden group/hero">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-soosoo-black via-transparent to-transparent z-10"></div>
        
        <img 
            src={imgSrc} 
            className="absolute inset-0 w-full h-full object-cover animate-[float_30s_ease-in-out_infinite] scale-110 z-0" 
            alt={recipe.title} 
            onError={() => setImgSrc('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200')}
        />

        {currentVideoUrl && (
             <video src={currentVideoUrl} className="absolute inset-0 w-full h-full object-cover scale-105 z-1 animate-fade-in" autoPlay loop muted playsInline />
        )}
        
        {!currentVideoUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-opacity duration-500">
                <button onClick={handleBringToLife} disabled={isAnimating} className="bg-black/40 backdrop-blur-xl border border-white/30 text-white px-8 py-4 rounded-full flex items-center gap-4 hover:bg-soosoo-gold hover:text-black transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] group/btn hover:scale-105">
                    {isAnimating ? (
                        <><span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span><span className="uppercase tracking-widest text-xs font-bold">Summoning Magic...</span></>
                    ) : (
                        <><div className="relative"><span className="absolute -inset-1 bg-white/20 rounded-full animate-ping"></span><svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><span className="uppercase tracking-widest text-xs font-bold">Bring Dish to Life</span></>
                    )}
                </button>
            </div>
        )}
        
        <div className="absolute top-28 left-6 z-30">
          <button onClick={onBack} className="text-white hover:text-soosoo-gold transition flex items-center gap-2 group">
            <span className="border border-white/20 rounded-full p-3 bg-black/20 backdrop-blur group-hover:border-soosoo-gold transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7 7-7" /></svg>
            </span>
            <span className="text-xs uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">Back</span>
          </button>
        </div>

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
             
             <h1 className="font-serif text-6xl md:text-9xl text-white font-medium mb-8 leading-none opacity-0 animate-[slideUp_1s_ease-out_0.2s_forwards] drop-shadow-2xl">{recipe.title}</h1>
             
             <div className="flex gap-12 text-sm font-sans tracking-widest text-gray-300 uppercase opacity-0 animate-[slideUp_1s_ease-out_0.8s_forwards]">
                <div className="flex flex-col"><span className="text-soosoo-gold text-[10px] mb-1">Prep</span><span className="font-bold">{recipe.prepTime}m</span></div>
                <div className="w-px bg-white/20 h-10"></div>
                <div className="flex flex-col"><span className="text-soosoo-gold text-[10px] mb-1">Cook</span><span className="font-bold">{recipe.cookTime}m</span></div>
                <div className="w-px bg-white/20 h-10"></div>
                 <div className="flex flex-col"><span className="text-soosoo-gold text-[10px] mb-1">Energy</span><span className="font-bold">{recipe.calories} kcal</span></div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-30">
        <div className="bg-soosoo-charcoal p-10 md:p-16 border-l-4 border-soosoo-gold shadow-2xl mb-16">
             <p className="text-2xl md:text-3xl font-serif italic text-gray-300 leading-relaxed">"{recipe.description}"</p>
        </div>

        <div className="grid md:grid-cols-[1fr_1.5fr] gap-16">
            <div>
                <div className="sticky top-32">
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                        <h2 className="text-3xl font-serif text-soosoo-gold">Ingredients</h2>
                        <button onClick={() => setShowShoppingList(!showShoppingList)} className="text-gray-400 hover:text-white text-xs uppercase tracking-widest border border-white/10 px-3 py-1 hover:border-soosoo-gold transition">
                            {showShoppingList ? 'Hide List' : 'Shop List'}
                        </button>
                    </div>

                    {showShoppingList && (
                        <div className="bg-soosoo-paper p-6 mb-8 border border-soosoo-gold/20 shadow-lg animate-fade-in relative overflow-hidden">
                            <h3 className="font-bold text-white mb-4 uppercase text-xs tracking-widest flex items-center gap-2">Select items to buy</h3>
                            <ul className="space-y-3 mb-6 relative z-10">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i} className={`flex items-center text-sm p-2 rounded cursor-pointer transition-colors ${selectedIndices.has(i) ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5'}`} onClick={() => toggleIngredient(i)}>
                                        <div className={`w-4 h-4 mr-3 border flex items-center justify-center transition-colors ${selectedIndices.has(i) ? 'border-soosoo-gold bg-soosoo-gold' : 'border-gray-600'}`}>
                                            {selectedIndices.has(i) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <span className={selectedIndices.has(i) ? '' : 'line-through decoration-gray-600'}>{ing.amount} {ing.item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <button onClick={handleAddSelectionToCart} className="w-full bg-soosoo-gold text-black font-bold uppercase tracking-widest text-xs py-3 hover:bg-white transition flex items-center justify-center gap-2">Add Selection to Cart</button>
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

                    {/* Dietary Intelligence (Chef Mode UI) */}
                    {/* ... (Existing Intelligence UI code) ... */}

                     <div className="mt-8">
                        <button onClick={handleSpeakIngredients} disabled={isSpeaking} className={`text-xs uppercase tracking-widest flex items-center gap-2 transition ${isSpeaking ? 'text-soosoo-gold animate-pulse' : 'text-gray-500 hover:text-soosoo-gold'}`}>
                        {isSpeaking ? (
                            <><span className="w-2 h-2 bg-soosoo-gold rounded-full animate-ping"></span>Generating Audio...</>
                        ) : (
                            <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>Listen to Ingredients</>
                        )}
                        </button>
                    </div>
                </div>
            </div>

            <div>
                 {/* Video Player Section */}
                 <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-3xl font-serif text-soosoo-gold">Watch Tutorial</h2>
                        {isSimulation && (
                             <span className="bg-yellow-600/30 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-yellow-600/50">
                                AI Video Unavailable - Showing Simulation
                            </span>
                        )}
                    </div>
                    
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 group bg-black">
                        <video src={displayVideoUrl} className="w-full h-full object-cover" controls playsInline />
                    </div>
                </div>

                <h2 className="text-3xl font-serif text-soosoo-gold mb-8 border-b border-white/10 pb-4">The Method</h2>
                <div className="space-y-12">
                    {recipe.instructions.map((step, idx) => (
                        <div key={idx} className="group relative pl-10 border-l border-gray-800 hover:border-soosoo-gold transition-colors duration-500">
                            <span className="absolute -left-3.5 top-0 w-7 h-7 bg-soosoo-black border border-gray-800 group-hover:border-soosoo-gold text-gray-500 group-hover:text-soosoo-gold rounded-full flex items-center justify-center font-serif font-bold transition-all">{step.stepNumber}</span>
                            <p className="text-xl text-gray-300 font-light leading-relaxed group-hover:text-white transition-colors">{step.text}</p>
                            {step.durationMinutes && (
                                <div className="mt-3 text-xs text-gray-600 font-mono flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{step.durationMinutes} min</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-20 flex justify-center">
                    <button onClick={onStartCooking} className="group relative px-12 py-6 bg-transparent border border-soosoo-gold text-soosoo-gold overflow-hidden transition-all hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                        <div className="absolute inset-0 w-0 bg-soosoo-gold transition-all duration-[400ms] ease-out group-hover:w-full"></div>
                        <span className="relative flex items-center gap-4 font-bold uppercase tracking-widest text-sm">Enter Cooking Mode<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                    </button>
                </div>

                <div className="mt-24 pt-12 border-t border-white/5">
                    <h2 className="text-2xl font-serif text-white mb-8">Guest Book</h2>
                    {/* Reviews (Existing) */}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
