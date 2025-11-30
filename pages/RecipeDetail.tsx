
import React, { useState } from 'react';
import { Recipe, Ingredient, Review } from '../types';
import { speakText } from '../services/geminiService';

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
        await speakText(text);
      } catch (error) {
        console.error("Failed to speak ingredients", error);
        alert("Sorry, I couldn't read the ingredients right now.");
      } finally {
        setIsSpeaking(false);
      }
  };

  const avgRating = getAverageRating();

  return (
    <div className="min-h-screen bg-soosoo-black animate-fade-in pb-20">
      
      {/* Cinematic Header */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-soosoo-black via-transparent to-transparent z-10"></div>
        
        <img 
            src={imgSrc} 
            className="w-full h-full object-cover animate-[float_30s_ease-in-out_infinite] scale-110" 
            alt={recipe.title} 
            onError={() => setImgSrc('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200')}
        />
        
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
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <svg className="w-20 h-20 text-soosoo-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                            </div>
                            
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
                                        {selectedIndices.has(i) && (
                                            <span className="ml-auto text-soosoo-gold text-xs font-mono">${ing.priceEstimate?.toFixed(2)}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {/* Add to Global Cart Action */}
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <button 
                                    onClick={handleAddSelectionToCart}
                                    className="w-full bg-soosoo-gold text-black font-bold uppercase tracking-widest text-xs py-3 hover:bg-white transition flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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

                     {/* Read Ingredients Voice Helper */}
                    <div className="mt-12">
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
                 {/* AI Video (Veo) */}
                {recipe.videoUrl && (
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif text-soosoo-gold mb-6">Visual Guide</h2>
                        <div className="relative rounded-sm overflow-hidden border border-white/10 shadow-2xl group cursor-pointer">
                             <div className="absolute inset-0 bg-soosoo-gold/10 pointer-events-none mix-blend-overlay group-hover:opacity-0 transition"></div>
                             <video src={recipe.videoUrl} controls className="w-full aspect-video" />
                        </div>
                    </div>
                )}

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
