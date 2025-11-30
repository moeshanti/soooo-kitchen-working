
import React from 'react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClear: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemove, 
  onUpdateQuantity,
  onClear
}) => {
  const totalCost = cartItems.reduce((acc, item) => acc + ((item.priceEstimate || 0) * item.quantityMultiplier), 0);

  const handleShareCart = (method: 'whatsapp' | 'sms') => {
      if (cartItems.length === 0) return;

      let text = `🛒 *My Order from Susu's Kitchen*\n\n`;
      
      // Group by recipe for nicer formatting
      const byRecipe: Record<string, CartItem[]> = {};
      cartItems.forEach(item => {
          if (!byRecipe[item.recipeTitle]) byRecipe[item.recipeTitle] = [];
          byRecipe[item.recipeTitle].push(item);
      });

      Object.entries(byRecipe).forEach(([recipe, items]) => {
          text += `*${recipe}*\n`;
          items.forEach(item => {
             text += `- ${item.quantityMultiplier}x ${item.amount} ${item.item}\n`;
          });
          text += `\n`;
      });

      text += `💰 Est. Total: $${totalCost.toFixed(2)}`;
      
      const encodedText = encodeURIComponent(text);

      if (method === 'whatsapp') {
          window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      } else if (method === 'sms') {
          window.open(`sms:?&body=${encodedText}`, '_self');
      }
  };

  const handleCheckout = () => {
      alert("Apple Pay / Google Pay simulated successful payment!");
      onClear();
      onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] animate-fade-in"
        ></div>
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-[#121212] z-[70] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col border-l border-white/10 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div>
                <h2 className="text-2xl font-serif text-soosoo-gold">Your Cart</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{cartItems.length} items</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Items List */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <p className="text-gray-400 font-serif text-xl">Your basket is empty</p>
                </div>
            ) : (
                cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 items-start bg-white/5 p-4 rounded-lg border border-white/5">
                        {/* Quantity Controls */}
                        <div className="flex flex-col items-center bg-black/40 rounded border border-white/10">
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:text-soosoo-gold text-gray-400">+</button>
                            <span className="font-mono text-sm font-bold text-white px-2">{item.quantityMultiplier}</span>
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:text-red-400 text-gray-400">−</button>
                        </div>

                        <div className="flex-grow">
                            <h4 className="text-white font-medium">{item.item}</h4>
                            <p className="text-gray-500 text-xs">{item.amount}</p>
                            <span className="text-[10px] text-soosoo-gold uppercase tracking-wider bg-soosoo-gold/10 px-2 py-0.5 rounded mt-1 inline-block">{item.recipeTitle}</span>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="text-white font-mono text-sm">${((item.priceEstimate || 0) * item.quantityMultiplier).toFixed(2)}</span>
                            <button onClick={() => onRemove(item.id)} className="text-gray-600 hover:text-red-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
            <div className="p-6 bg-[#0a0a0a] border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xl font-serif text-white mb-4">
                    <span>Total Estimated</span>
                    <span className="text-soosoo-gold">${totalCost.toFixed(2)}</span>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => handleShareCart('whatsapp')} className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                     </button>
                     <button onClick={() => handleShareCart('sms')} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        SMS
                     </button>
                </div>

                {/* Checkout (Apple Pay Simulator) */}
                <button 
                    onClick={handleCheckout}
                    className="w-full bg-white hover:bg-gray-100 text-black py-4 rounded text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition"
                >
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512"><path d="M369.3 268.4c4.6-101.9 83.9-140.7 87.8-142.7-47.5-68.9-121.3-78.3-147.2-79.3-62.3-6.4-122 36.6-153.5 36.6-32.3 0-80.4-35.8-132.3-34.9-67.9 1-131 39.5-166.4 100.2-70.9 122.5-18.1 303.4 50.8 403.4 33.7 49 74.3 104.2 127 102.3 50.8-2 70.3-32.6 132.3-32.6 61.4 0 79.1 32.6 132.8 31.6 54.8-1.1 89.4-49.8 123-98.3 38.6-56.1 54.5-110.2 55.4-113-1.2-.6-106-40.8-111.4-159.2zM337.3 84.1c27.8-33.6 46.5-80.4 41.3-126.9-26.7 1.1-59.1 17.8-78.3 40.2-24.1 27.5-45.2 71.9-39.6 117.8 29.8 2.3 60.1-15.1 76.6-31.1z"/></svg>
                     Pay with Apple Pay
                </button>
            </div>
        )}
      </div>
    </>
  );
};
