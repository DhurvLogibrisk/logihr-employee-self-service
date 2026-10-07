import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { processAssistantQuery, AssistantMessage, AssistantActionProposal } from '../services/geminiService';
import { apiService } from '../services/apiService';
import {
  Sparkles,
  X,
  Send,
  Mic,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  FileSpreadsheet,
  Clock,
  CheckSquare,
} from 'lucide-react';

export const AIAssistantModal: React.FC = () => {
  const { closeModal, language, showToast, refreshData, openModal } = useAppStore();

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text:
        language === 'gu'
          ? 'નમસ્તે પાર્થ! હું તમારો LogiHR AI સહાયક છું. તમે ગુજરાતી, હિન્દી કે અંગ્રેજીમાં પૂછી શકો છો:\n• "મારી કેટલી CL બાકી છે?"\n• "કાલનો ટાઇમશીટ ભરી દો: ૧૦ થી ૧ વાહન માસ્ટર, ૨ થી ૬ ટેસ્ટિંગ"\n• "આવતા શુક્રવારે રજા અરજી કરો"\n• "આજે કેટલા કલાક થયા?"'
          : language === 'hi'
          ? 'नमस्ते पार्थ! मैं आपका LogiHR AI सहायक हूँ। आप हिन्दी, गुजराती या अंग्रेज़ी में पूछ सकते हैं:\n• "मेरी कितनी CL बची है?"\n• "कल का टाइमशीट भर दो: 10 से 1 वाहन मास्टर, 2 से 6 टेस्टिंग"\n• "अगले शुक्रवार छुट्टी अप्लाई करो"\n• "आज कितने घंटे काम हुआ?"'
          : 'Hello Parth! I am your LogiHR AI Assistant. You can ask me in English, Gujarati, or Hindi:\n• "Mari kitni CL bachi chhe?" (Check leave balances)\n• "Kal no timesheet bhari do: 10 thi 1 vehicle master, 2 thi 6 testing"\n• "Apply leave for Friday"\n• "How many hours worked today?"\n• "Show pending approvals"',
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    setInput('');
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await processAssistantQuery(query, language);
      setMessages((prev) => [...prev, response]);
    } catch {
      showToast('Could not reach AI assistant service.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice speech simulation / Web Speech API
  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          handleSend(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        return;
      } catch {
        // Fallback
      }
    }

    // Friendly prompt fallback if speech recognition permission isn't available
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const voiceSample =
        language === 'gu'
          ? 'કાલનો ટાઇમશીટ ભરી દો: ૧૦ થી ૧ વાહન માસ્ટર'
          : 'Mari kitni CL bachi chhe?';
      setInput(voiceSample);
    }, 1200);
  };

  // Confirm execute proposal
  const handleConfirmAction = async (proposal: AssistantActionProposal) => {
    if (proposal.type === 'DRAFT_TIMESHEET') {
      await apiService.saveTodayTimesheet(proposal.payload);
      refreshData();
      showToast('AI Drafted Timesheet saved successfully! (7.0 hours)', 'success');
      closeModal();
    } else if (proposal.type === 'PREFILL_LEAVE') {
      openModal('add-leave', proposal.payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#243456] flex items-center justify-between bg-gradient-to-r from-[#18233e] to-[#121a2f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  LogiHR AI Assistant
                </h2>
                <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                  EN / GU / HI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Safe tool-calling · Explicit user confirmation required
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-[#18233e] text-slate-200 border border-[#243456] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                  {/* If action proposal included */}
                  {m.proposal && (
                    <div className="mt-3 bg-[#121a2f] border border-[#243456] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">
                          {m.proposal.title}
                        </span>
                        {m.proposal.requiresConfirmation && (
                          <span className="text-[9px] text-amber-400 uppercase font-bold bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                            Confirm Needed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono">
                        {m.proposal.description}
                      </p>

                      {/* Action confirmation button */}
                      {m.proposal.requiresConfirmation && (
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmAction(m.proposal!)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                          >
                            Confirm & Apply
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>LogiHR Assistant is thinking...</span>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-1.5 overflow-x-auto flex items-center gap-1.5 border-t border-[#243456]/40 scrollbar-none bg-[#0e1526]">
          {[
            'Mari kitni CL bachi chhe?',
            'Kal no timesheet bhari do: 10 thi 1 vehicle master',
            'Aavta Shukravar leave apply karo',
            'Aaje ketla kalak thaya?',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[10px] text-cyan-300 bg-[#18233e] hover:bg-[#243456] border border-[#243456] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#243456] bg-[#18233e] space-y-1.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleMicToggle}
              className={`p-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-[#121a2f] border-[#243456] text-slate-400 hover:text-white'
              }`}
              title="Voice Input (English, ગુજરાતી, हिन्दी)"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'gu'
                  ? 'ગુજરાતી, હિન્દી કે અંગ્રેજીમાં લખો...'
                  : 'Ask in English, ગુજરાતી, or हिन्दी...'
              }
              className="flex-1 bg-[#121a2f] border border-[#243456] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-slate-500 text-center">
            AI Assistant can make mistakes. All write actions require your explicit confirmation.
          </p>
        </div>
      </div>
    </div>
  );
};
