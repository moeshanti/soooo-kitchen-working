
import React from 'react';
import { UserMode } from '../types';

interface NavbarProps {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  navigate: (path: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mode, setMode, navigate, cartCount, onOpenCart }) => {
  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 shadow-2xl flex items-center justify-between gap-12 max-w-5xl w-[90%] md:w-auto transition-all duration-300 hover:bg-black/80 hover:border-soosoo-gold/30">
        
        {/* Logo Section */}
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          {/* Icon/Logo Graphic */}
          <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-soosoo-gold to-yellow-600 rounded-full shadow-lg group-hover:rotate-12 transition-transform duration-500">
             <span className="text-3xl filter drop-shadow-md">🍳</span>
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif font-bold text-white leading-none tracking-wide drop-shadow-md group-hover:text-soosoo-gold transition-colors">
              Susu's <span className="font-light text-gray-300 group-hover:text-white">Kitchen</span>
            </h1>
            <span className="text-[10px] font-bold text-soosoo-gold uppercase tracking-[0.3em] leading-none mt-1.5 ml-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
              Made with love
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={onOpenCart}
            className="text-gray-400 hover:text-soosoo-gold transition transform hover:scale-110 relative"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-soosoo-gold text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg">
                    {cartCount}
                </span>
            )}
          </button>
          
          <div className="h-8 w-px bg-white/10"></div>
          
          <button 
            className="flex items-center gap-3 group/profile"
            onClick={() => setMode(mode === UserMode.CHEF ? UserMode.VIEWER : UserMode.CHEF)}
          >
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover/profile:border-soosoo-gold transition-all duration-300 shadow-lg">
               <img src="https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?q=80&w=150&auto=format&fit=crop" className="w-full h-full object-cover" alt="Susu" />
             </div>
             <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-bold text-white tracking-wider group-hover/profile:text-soosoo-gold transition-colors">Susu</span>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">{mode} Mode</span>
             </div>
          </button>
        </div>

      </div>
    </nav>
  );
};
