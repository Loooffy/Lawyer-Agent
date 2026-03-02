import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ArrowLeft, Send, Info, ShieldAlert, Scale, User, Sparkles } from 'lucide-react';
import { lawyers, presetQuestions, Lawyer } from './data';
import { generateLawyerResponse } from './services/ai';
import ReactMarkdown from 'react-markdown';

// --- Components ---

const IntroSection = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-3xl mx-auto text-center py-12 px-6"
  >
    <div className="mb-6 flex justify-center">
      <div className="p-4 bg-stone-100 rounded-full">
        <Scale className="w-12 h-12 text-stone-700" />
      </div>
    </div>
    <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 mb-6 leading-tight">
      正義的多重觀點：<br />
      <span className="italic text-stone-600">性別與法律</span>
    </h1>
    <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-2xl mx-auto">
      透過對話，探索性別平等與性暴力案件的複雜性。
      選擇一位法律人設，了解從體制改革到程序正義等不同的法律哲學。
    </p>
    
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-10 text-left max-w-xl mx-auto">
      <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
        <Info className="w-4 h-4" /> 使用說明
      </h3>
      <ul className="space-y-2 text-stone-600 text-sm">
        <li className="flex gap-2">
          <span className="bg-stone-100 text-stone-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
          選擇一位您感興趣的律師觀點。
        </li>
        <li className="flex gap-2">
          <span className="bg-stone-100 text-stone-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
          使用預設問題或提出您自己的問題。
        </li>
        <li className="flex gap-2">
          <span className="bg-stone-100 text-stone-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
          AI 專注於相關主題。無關的提問將被引導回正題。
        </li>
      </ul>
    </div>

    <button 
      onClick={onStart}
      className="cursor-pointer bg-stone-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
    >
      開始對話
    </button>
  </motion.div>
);

const LawyerGrid = ({ onSelect }: { onSelect: (lawyer: Lawyer) => void }) => (
  <div className="max-w-6xl mx-auto px-6 py-12">
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-8 text-center"
    >
      <h2 className="text-2xl font-serif text-stone-900">選擇法律觀點</h2>
      <p className="text-stone-500 mt-2">今天您想與誰對話？</p>
    </motion.div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lawyers.map((lawyer, index) => (
        <motion.button
          key={lawyer.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(lawyer)}
          className="cursor-pointer bg-white p-6 rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all text-left group flex flex-col h-full"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-serif font-bold ${lawyer.avatar}`}>
              {lawyer.name.split(' ')[1][0]}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <h3 className="font-serif text-xl text-stone-900 mb-1">{lawyer.name}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">{lawyer.title}</p>
          <p className="text-sm text-stone-600 leading-relaxed mb-4 flex-grow">{lawyer.philosophy}</p>
          <div className="pt-4 border-t border-stone-100 mt-auto">
            <span className="text-xs text-stone-400 font-medium">性格特質：{lawyer.personality}</span>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  suggestions?: string[];
}

const ChatInterface = ({ lawyer, onBack }: { lawyer: Lawyer; onBack: () => void }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert internal message format to Gemini API history format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const { text: responseText, suggestions } = await generateLawyerResponse(text, lawyer.systemInstruction, history);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText, suggestions }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "抱歉，目前連線出現問題，請稍後再試。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="cursor-pointer p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm ${lawyer.avatar}`}>
              {lawyer.name.split(' ')[1][0]}
            </div>
            <div>
              <h2 className="font-medium text-stone-900">{lawyer.name}</h2>
              <p className="text-xs text-stone-500">{lawyer.title}</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-stone-400 bg-stone-50 px-3 py-1 rounded-full">
          <ShieldAlert className="w-3 h-3" />
          <span>AI 生成內容 • 請查核重要資訊</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-center mb-8">
              <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-600">
                您現在正在與 <span className="font-medium text-stone-900">{lawyer.name}</span> 對話。
                <br />
                <span className="text-sm opacity-75">「{lawyer.philosophy}」</span>
              </p>
            </div>
            
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 text-center">建議主題</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="cursor-pointer text-left p-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-stone-900 text-white rounded-br-none' 
                  : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
              }`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
            
            {/* Suggestions */}
            {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-3 space-y-2 w-full max-w-[85%] md:max-w-[70%]">
                <p className="text-xs font-medium text-stone-400 ml-1 uppercase tracking-wider">建議提問</p>
                <div className="flex flex-wrap gap-2">
                  {msg.suggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(suggestion)}
                      disabled={isLoading}
                      className="cursor-pointer text-left px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-full transition-colors border border-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-stone-200 p-4">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="請在此輸入您的問題..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-stone-900 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-stone-400 mt-2">
          這是一個 AI 模擬系統。提供的資訊僅供教育用途，不構成法律建議。
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'intro' | 'selection' | 'chat'>('intro');
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);

  const handleStart = () => setView('selection');
  
  const handleSelectLawyer = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setView('chat');
  };

  const handleBack = () => {
    setView('selection');
    setSelectedLawyer(null);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <AnimatePresence mode="wait">
        {view === 'intro' && (
          <motion.div 
            key="intro"
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center"
          >
            <IntroSection onStart={handleStart} />
          </motion.div>
        )}

        {view === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <LawyerGrid onSelect={handleSelectLawyer} />
          </motion.div>
        )}

        {view === 'chat' && selectedLawyer && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="min-h-screen"
          >
            <ChatInterface lawyer={selectedLawyer} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
