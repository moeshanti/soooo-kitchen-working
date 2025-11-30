import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { askMama } from '../services/geminiService';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'model', text: "Marhaba! Need help with a recipe? Ask Mama." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await askMama(userMsg.text);
    
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto bg-soosoo-charcoal rounded-none border border-soosoo-gold/30 shadow-2xl w-80 sm:w-96 mb-6 overflow-hidden animate-fade-in flex flex-col max-h-[500px]">
            <div className="bg-black/50 p-4 flex items-center gap-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full border border-soosoo-gold p-0.5">
                     <img src="https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?q=80&w=200&auto=format&fit=crop" className="w-full h-full rounded-full object-cover" alt="SooSoo" />
                </div>
                <div>
                    <h3 className="font-serif text-lg text-soosoo-gold italic">Ask Mama</h3>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Always Online</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="ml-auto text-gray-500 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-soosoo-black/80 h-80" ref={scrollRef}>
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 text-sm font-light leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-white/10 text-white border border-white/10' 
                                : 'bg-soosoo-gold/10 border border-soosoo-gold/20 text-soosoo-cream'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-soosoo-gold/10 border border-soosoo-gold/20 p-3 flex items-center gap-1">
                            <span className="w-1 h-1 bg-soosoo-gold rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-soosoo-gold rounded-full animate-bounce delay-75"></span>
                            <span className="w-1 h-1 bg-soosoo-gold rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-black border-t border-white/10 flex gap-2">
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about spices..."
                    className="flex-grow bg-white/5 border border-white/10 rounded-none px-4 py-2 text-sm text-white focus:outline-none focus:border-soosoo-gold placeholder-gray-600"
                />
                <button onClick={handleSend} className="bg-soosoo-gold text-black p-2 hover:bg-white transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-soosoo-gold text-black w-14 h-14 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-white transition-all transform hover:scale-110 flex items-center justify-center z-50"
      >
        {isOpen ? (
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
};