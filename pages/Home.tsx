import React, { useState, useMemo } from 'react';
import { Recipe, UserMode } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { PROFILES } from '../constants';

interface HomeProps {
  recipes: Recipe[];
  onRecipeClick: (id: string) => void;
  onCreateClick: () => void;
}

export const Home: React.FC<HomeProps> = ({ recipes, onRecipeClick, onCreateClick }) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('p1'); // Default Susu

  // Hardcoded filters from screenshot
  const FILTERS = ['ALL', 'APPETIZER', 'BREAKFAST', 'DESSERT', 'DIFFICULT', 'DINNER', 'EASY'];

  const filteredRecipes = useMemo(() => {
    let result = [...recipes];
    if (activeFilter !== 'ALL') {
        if (activeFilter === 'EASY' || activeFilter === 'DIFFICULT') { // Assuming Difficult maps to Hard
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

  return (
    <div className="min-h-screen bg-soosoo-black pb-20">
      
      {/* Hero Section */}
      <div className="relative w-full h-[600px] overflow-hidden">
        {/* Background Image - Overhead ingredients */}
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

                <button 
                  onClick={onCreateClick}
                  className="mt-4 bg-[#E89F2A] hover:bg-[#d68f20] text-black px-8 py-4 rounded-md font-bold uppercase tracking-widest text-sm flex items-center gap-3 transition-transform hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    Create New Masterpiece
                </button>
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
                    />
                ))
            ) : (
                <div className="col-span-full py-20 text-center text-gray-500 font-serif italic">
                    No recipes found for this category.
                </div>
            )}
        </div>

      </div>
    </div>
  );
};