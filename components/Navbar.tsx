
import React, { useState, useEffect } from 'react';
import { UserMode } from '../types';

interface NavbarProps {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  navigate: (path: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mode, setMode, navigate, cartCount, onOpenCart }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Auto-collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
        setScrolled(window.scrollY > 50);
        if (window.scrollY > 50) setIsExpanded(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`
            pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl 
            flex items-center justify-between transition-all duration-500 ease-out
            ${isExpanded ? 'px-8 py-4 rounded-2xl gap-8 w-auto' : 'px-6 py-3 rounded-full gap-4 w-auto'}
        `}
      >
        
        {/* Home / Logo */}
        <button 
            onClick={() => navigate('/')}
            className="group flex items-center gap-3"
        >
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-soosoo-gold to-yellow-600 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-xl filter drop-shadow-sm">🍳</span>
            </div>
            {isExpanded && (
                <div className="flex flex-col animate-fade-in">
                    <span className="text-lg font-serif font-bold text-white leading-none">Susu's</span>
                    <span className="text-[9px] text-soosoo-gold uppercase tracking-[0.2em] leading-none">Kitchen</span>
                </div>
            )}
        </button>

        {/* Divider */}
        {isExpanded && <div className="h-8 w-px bg-white/10 animate-fade-in"></div>}

        {/* Cart */}
        <button 
            onClick={onOpenCart}
            className="relative p-2 text-gray-400 hover:text-soosoo-gold transition-colors hover:scale-110 transform"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-soosoo-gold text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg">
                    {cartCount}
                </span>
            )}
        </button>

        {/* Profile Switcher */}
        {isExpanded && (
            <button 
                onClick={() => setMode(mode === UserMode.CHEF ? UserMode.VIEWER : UserMode.CHEF)}
                className="flex items-center gap-3 animate-fade-in bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition-colors"
            >
                <img 
                    src="https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?q=80&w=150&auto=format&fit=crop" 
                    className="w-6 h-6 rounded-full object-cover border border-soosoo-gold/50" 
                    alt="Profile" 
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {mode === UserMode.CHEF ? 'Chef Mode' : 'Viewer'}
                </span>
            </button>
        )}

      </div>
    </div>
  );
};
