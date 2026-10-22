"use client"
import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../../lib/api-client';
import { 
  Bot, Send, Sparkles, TrendingUp, AlertTriangle, Layers, ArrowRight, 
  HelpCircle, RefreshCw, User, CheckCircle2, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'USER' | 'COPILOT';
  text: string;
  engine?: string;
  engineLabel?: string;
  metricsSnapshot?: any;
  quickActions?: Array<{ label: string; href: string }>;
  timestamp: string;
}

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'COPILOT',
      text: `স্বাগতম! আমি আপনার BusinessOS AI Copilot। 
দোকানের আজকের সেলস, বাকির হিসাব, লো-স্টক অ্যালার্ট বা সার্বিক ব্যবসায়িক লাভ নিয়ে আমাকে যেকোনো প্রশ্ন করতে পারেন।`,
      engine: 'AI_GEMINI',
      engineLabel: 'Google Gemini AI',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: 'View Sales History', href: '/admin/sales' },
        { label: 'Digital Baki Khata', href: '/admin/baki-khata' },
        { label: 'Sourcing Sheet', href: '/admin/sourcing-list' }
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleAsk = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isThinking) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const res = await api.post('/admin/ai-copilot/ask', { query: text });
      const copilotMsg: Message = {
        id: `cpl-${Date.now()}`,
        sender: 'COPILOT',
        text: res.data?.answer || 'I have analyzed your business snapshot.',
        engine: res.data?.engine,
        engineLabel: res.data?.engineLabel,
        metricsSnapshot: res.data?.metricsSnapshot,
        quickActions: res.data?.quickActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, copilotMsg]);
    } catch {
      toast.error('AI Copilot service is currently unavailable.');
    } finally {
      setIsThinking(false);
    }
  };

  const promptChips = [
    '📊 আজকের মোট সেলস ও কালেকশন কত?',
    '📒 টপ বাকি কাস্টমারদের লিস্ট দাও',
    '⚠️ কোন কোন প্রোডাক্টের স্টক শেষ?',
    '🛠️ কয়টা সার্ভিস জব পেন্ডিং আছে?',
    '💡 ব্যবসার লাভ বাড়াতে পরামর্শ দাও'
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              BusinessOS AI Copilot <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Online</span>
            </h1>
            <p className="text-xs text-slate-500">Autonomous business decision engine with live database insight</p>
          </div>
        </div>

        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear Chat
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4 custom-scrollbar">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex gap-3 ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'COPILOT' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-xl rounded-3xl p-4 sm:p-5 shadow-xs ${
              m.sender === 'USER' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none space-y-3'
            }`}>
              {m.sender === 'COPILOT' && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <Sparkles className="w-3 h-3" /> {m.engineLabel || 'Gemini 1.5 Pro AI'}
                  </span>
                  <span>{m.timestamp}</span>
                </div>
              )}

              {/* Message text with newline support */}
              <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>

              {/* Quick Actions if available */}
              {m.quickActions && m.quickActions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {m.quickActions.map((action, idx) => (
                    <Link
                      key={idx}
                      href={action.href}
                      className="px-3 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      {action.label} <ChevronRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {m.sender === 'USER' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></span>
              <span className="font-semibold ml-1">Analyzing database snapshot...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestion Chips */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(chip)}
            disabled={isThinking}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 text-xs font-semibold rounded-full whitespace-nowrap shadow-xs transition-all active:scale-95"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="pt-2 shrink-0"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask BusinessOS anything in Bangla or English (e.g. আজকের বিক্রয় কত? বা বকেয়া কত?)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isThinking}
            className="w-full h-13 pl-4 pr-14 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={isThinking || !inputQuery.trim()}
            className="absolute right-2.5 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-sm disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
