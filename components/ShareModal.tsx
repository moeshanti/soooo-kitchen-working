import React, { useState } from 'react';
import { Recipe } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, recipe }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !recipe) return null;

  // Simulate a shareable link (in a real app this would be the actual URL)
  const shareUrl = `${window.location.origin}/#recipe/${recipe.id}`;
  const shareText = `Check out this masterpiece "${recipe.title}" from Susu's Kitchen! 🍳✨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleSMS = () => {
    const url = `sms:?&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.location.href = url;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100 animate-slide-up">
        
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
            <h3 className="text-2xl font-serif text-soosoo-gold mb-2">Share Masterpiece</h3>
            <p className="text-gray-400 text-sm">Spread the love for {recipe.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button onClick={handleWhatsApp} className="flex flex-col items-center justify-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 p-6 rounded-xl transition-all group">
                <svg className="w-8 h-8 text-[#25D366] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="text-[#25D366] font-bold text-xs uppercase tracking-widest">WhatsApp</span>
            </button>

            <button onClick={handleSMS} className="flex flex-col items-center justify-center gap-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 p-6 rounded-xl transition-all group">
                <svg className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <span className="text-blue-500 font-bold text-xs uppercase tracking-widest">SMS</span>
            </button>

            <button onClick={handleCopy} className="flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-xl transition-all group">
                {copied ? (
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
                <span className={`font-bold text-xs uppercase tracking-widest ${copied ? 'text-green-400' : 'text-white'}`}>
                    {copied ? 'Copied!' : 'Copy Link'}
                </span>
            </button>

            {/* Native Share - Only show if supported */}
            {typeof navigator.share === 'function' && (
                <button onClick={handleNativeShare} className="flex flex-col items-center justify-center gap-3 bg-soosoo-gold/10 hover:bg-soosoo-gold/20 border border-soosoo-gold/30 p-6 rounded-xl transition-all group">
                    <svg className="w-8 h-8 text-soosoo-gold group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    <span className="text-soosoo-gold font-bold text-xs uppercase tracking-widest">More</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
