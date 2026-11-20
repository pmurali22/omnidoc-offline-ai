import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, FileText, Trash2, ArrowDown } from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  onClearChat: () => void;
  isStreaming: boolean;
  activeDocCount: number;
}

const SAMPLE_QUESTIONS = [
  'What are the uptime SLA guarantees and penalties for chronic downtime?',
  'What security compliance standards and zero-server audits were verified?',
  'Compare the payment terms and milestones with the SLA termination rights.',
  'What actions or deadlines must be completed before Q1 2026?'
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isStreaming,
  activeDocCount
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming || activeDocCount === 0) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSampleClick = (q: string) => {
    if (isStreaming || activeDocCount === 0) return;
    onSendMessage(q);
  };

  return (
    <div className="flex flex-col h-[650px] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Chat header */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200">Interactive Multi-Document Q&A</h3>
            <p className="text-[10px] text-slate-400">
              Grounded across <span className="text-indigo-400 font-semibold">{activeDocCount} active documents</span> • Strict citations
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            disabled={isStreaming}
            className="flex items-center space-x-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 text-xs rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Clear chat conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-slate-200">Ask Any Question Across All Uploaded Files</h4>
              <p className="text-xs text-slate-400 mt-1">
                The local vector search engine retrieves the most relevant paragraphs from all active PDFs and grounds answers with exact page citations.
              </p>
            </div>

            {/* Sample Question Chips */}
            <div className="w-full max-w-lg space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Suggested Cross-Document Questions
              </span>
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(q)}
                  className="w-full p-2.5 text-left text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{q}</span>
                  <Send className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-slate-850 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="space-y-2">
                    <MarkdownRenderer
                      content={msg.content}
                      onCitationClick={(c) => setActiveSnippet(c)}
                    />
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
                    )}

                    {/* Citations badges container */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">
                          Sources:
                        </span>
                        {msg.citations.map((c, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSnippet(`[${c.fileName} • Page ${c.pageNumber}]: "${c.snippet}"`)}
                            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-indigo-300 text-[10px] font-medium border border-slate-700 flex items-center space-x-1"
                          >
                            <FileText className="w-2.5 h-2.5 text-indigo-400" />
                            <span>{c.fileName} (P.{c.pageNumber})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}

                <div className="mt-1 flex items-center justify-end space-x-2 text-[10px] opacity-60">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Active Snippet Viewer */}
      {activeSnippet && (
        <div className="px-4 py-2 bg-indigo-950/70 border-t border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate italic">{activeSnippet}</span>
          </div>
          <button
            onClick={() => setActiveSnippet(null)}
            className="ml-2 text-indigo-400 hover:text-white font-semibold text-[10px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isStreaming || activeDocCount === 0}
            placeholder={
              activeDocCount === 0
                ? 'Please check at least one PDF above to begin querying...'
                : 'Ask a question across all active documents (e.g. Compare deadlines and SLA remedies)...'
            }
            className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming || activeDocCount === 0}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};
