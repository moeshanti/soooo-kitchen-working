
import React, { useState, useMemo, useRef } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { PROFILES } from '../constants';
import { suggestRecipeFromPantry } from '../services/geminiService';

interface HomeProps {
  recipes: Recipe[];
  onRecipeClick: (id: string) => void;
  onCreateClick: () => void;
  onShare: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ recipes, onRecipeClick, onCreateClick, onShare, onToggleFavorite }) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('p1'); 
  
  // Pantry Scavenger State
  const [isScanningPantry, setIsScanningPantry] = useState(false);
  const [pantrySuggestions, setPantrySuggestions] = useState<{ title: string, reason: string, matchScore: number }[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FILTERS = ['ALL', 'FAVORITES', 'APPETIZER', 'BREAKFAST', 'DESSERT', 'DIFFICULT', 'DINNER', 'EASY'];

  const filteredRecipes = useMemo(() => {
    let result = [...recipes];
    if (activeFilter !== 'ALL') {
        if (activeFilter === 'FAVORITES') {
            result = result.filter(r => r.isFavorite);
        } else if (activeFilter === 'EASY' || activeFilter === 'DIFFICULT') {
             const diffMap: Record<string, string> = { 'EASY': 'Easy', 'DIFFICULT': 'Hard' };
             result = result.filter(r => r.difficulty === diffMap[activeFilter]);
        } else {
            result = result.filter(r => 
                r.title.toUpperCase().includes(activeFilter) || 
                r.description.toUpperCase().includes(activeFilter) ||
                r.origin.toUpperCase().includes(activeFilter)
            );
        }
    }
    return result;
  }, [recipes, activeFilter]);

  const handlePantryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsScanningPantry(true);
          try {
              const suggestions = await suggestRecipeFromPantry(file);
              setPantrySuggestions(suggestions);
          } catch (error) {
              alert("Could not analyze pantry.");
          } finally {
              setIsScanningPantry(false);
          }
      }
  };

  const handleShareClick = (e: React.MouseEvent, recipe: Recipe) => {
      e.stopPropagation();
      onShare(recipe);
  };

  return (
    <div className="min-h-screen bg-soosoo-black pb-20">
      
      {/* Hero Section */}
      <div className="relative w-full h-[600px] overflow-hidden">
        <div className="absolute inset-0">
            <img 
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2400&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-80"
                alt="Ingredients"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-soosoo-black via-transparent to-transparent"></div>
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 h-full flex flex-col md:flex-row items-center justify-between z-10">
            
            {/* Left Content */}
            <div className="mt-20 md:mt-0 flex-1 max-w-2xl">
                <h1 className="text-6xl md:text-8xl font-serif text-white leading-tight mb-2 drop-shadow-lg">
                    Susu's <br />
                    <span className="text-soosoo-gold font-serif">Kitchen</span>
                </h1>
                
                <div className="h-16 border-l-4 border-soosoo-gold pl-6 flex items-center my-8">
                    <p className="text-xl md:text-2xl font-serif italic text-gray-200">
                        "The secret ingredient is always love. Come, let's cook together."
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                    onClick={onCreateClick}
                    className="bg-[#E89F2A] hover:bg-[#d68f20] text-black px-8 py-4 rounded-md font-bold uppercase tracking-widest text-sm flex items-center gap-3 transition-transform hover:scale-105 shadow-lg shadow-amber-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Create Masterpiece
                    </button>

                    {/* Pantry Scavenger Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 text-white px-6 py-4 rounded-md font-bold uppercase tracking-widest text-sm flex items-center gap-3 transition-transform hover:scale-105"
                    >
                        {isScanningPantry ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                        Pantry Scan
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePantryUpload} />
                </div>
            </div>

            {/* Right Card - Profile Selector */}
            <div className="hidden md:block w-[380px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl mt-12">
                <h3 className="text-center text-xs font-bold text-gray-300 uppercase tracking-widest mb-6">Who is cooking today?</h3>
                
                <div className="flex justify-center gap-4 mb-2">
                    {PROFILES.map(profile => (
                        <div 
                            key={profile.id}
                            onClick={() => setSelectedProfileId(profile.id)}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                            <div className={`w-14 h-14 rounded-full p-0.5 transition-all duration-300 ${selectedProfileId === profile.id ? 'border-2 border-soosoo-gold scale-110' : 'border border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedProfileId === profile.id ? 'text-white' : 'text-gray-500'}`}>
                                {profile.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Pantry Suggestions Overlay */}
      {pantrySuggestions && (
          <div className="max-w-[1400px] mx-auto px-6 mb-12 animate-fade-in relative z-30">
              <div className="bg-soosoo-paper border border-soosoo-gold p-6 rounded-xl shadow-2xl relative">
                  <button onClick={() => setPantrySuggestions(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <h3 className="text-xl font-serif text-soosoo-gold mb-4 flex items-center gap-2">
                      <span className="text-2xl">📸</span> Pantry Chef Suggestions
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                      {pantrySuggestions.map((sug, i) => (
                          <div key={i} className="bg-black/40 p-4 rounded-lg border border-white/10 hover:border-soosoo-gold transition cursor-pointer">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-white">{sug.title}</h4>
                                  <span className="text-xs font-mono text-green-400">{sug.matchScore}% Match</span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed">{sug.reason}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Filter & Grid Section */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 -mt-10 relative z-20">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h2 className="text-4xl font-serif text-white">Family Masterpieces</h2>
                <p className="text-gray-500 text-sm mt-1">{filteredRecipes.length} recipes</p>
            </div>

            {/* Pills Filter */}
            <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                            activeFilter === filter 
                                ? 'bg-[#E89F2A] text-black shadow-lg shadow-amber-500/20' 
                                : 'bg-transparent border border-white/20 text-gray-400 hover:border-white/50 hover:text-white'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Scroll Bar Visual */}
        <div className="w-full h-1 bg-white/10 rounded-full mb-12 overflow-hidden">
             <div className="w-1/3 h-full bg-white/30 rounded-full"></div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.length > 0 ? (
                filteredRecipes.map(recipe => (
                    <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onClick={() => onRecipeClick(recipe.id)}
                        onShare={handleShareClick}
                        onToggleFavorite={onToggleFavorite}
                    />
                ))
            ) : (
                <div className="col-span-full py-20 text-center text-gray-500 font-serif italic">
                    {activeFilter === 'FAVORITES' ? 'You have no favorite recipes yet.' : 'No recipes found for this category.'}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
