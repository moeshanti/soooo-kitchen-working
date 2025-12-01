
import React, { useState } from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onShare: (e: React.MouseEvent, recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onShare, onToggleFavorite }) => {
  const [imgSrc, setImgSrc] = useState(recipe.imageUrl);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fallback image 
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop';

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const difficultyColor = {
      'Easy': 'bg-green-500/80',
      'Medium': 'bg-yellow-500/80',
      'Hard': 'bg-red-500/80'
  }[recipe.difficulty] || 'bg-gray-500/80';

  const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(recipe.id);
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col gap-4"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-white/5">
        
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/20 z-10 transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}></div>

        <img 
          src={imgSrc} 
          alt={recipe.title} 
          onError={handleError}
          className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 z-20">
             <span className={`${difficultyColor} backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-md shadow-sm`}>
                 {recipe.difficulty}
             </span>
        </div>

        {/* Icons */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
             <button 
                onClick={(e) => onShare(e, recipe)}
                className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 hover:bg-soosoo-gold hover:text-white transition"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
             </button>
             <button 
                onClick={handleFavoriteClick}
                className={`bg-black/40 backdrop-blur-md p-2 rounded-full transition-all duration-300 ${recipe.isFavorite ? 'text-soosoo-gold bg-soosoo-gold/10' : 'text-white/80 hover:bg-soosoo-gold hover:text-white'}`}
             >
                {recipe.isFavorite ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                )}
             </button>
        </div>

        {/* Video Icon */}
        {recipe.videoUrl && (
             <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">Video</span>
             </div>
        )}
      </div>

      {/* Content */}
      <div className="px-1">
         <h3 className="font-serif text-2xl text-white group-hover:text-[#E89F2A] transition-colors leading-tight">
             {recipe.title}
         </h3>
         <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
             <span>{recipe.prepTime + recipe.cookTime} min</span>
             <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
             <span>{recipe.calories} kcal</span>
         </div>
      </div>
    </div>
  );
};
