import { useState, useRef, useEffect } from 'react';
import { askStan, isAIConfigured, getMockResponse, clearConversationMemory } from '../../shared/services/stanService';

const StanChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'stan',
      content: "Hey! I'm Stan, your AI partner management assistant. Ask me anything about your partners, prospects, economics, or pipeline. I can also help you draft emails, prepare for meetings, and spot trends in your data.\n\nTry asking:\n• \"Which partners haven't been contacted in 30 days?\"\n• \"What's our total MRR from Gold tier partners?\"\n• \"Summarize our prospect pipeline\"",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const aiConfigured = isAIConfigured();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setError(null);
    setInput('');

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let response;
      if (aiConfigured) {
        response = await askStan(question);
      } else {
        await new Promise(r => setTimeout(r, 800));
        response = getMockResponse('chat');
      }
      const stanMsg = {
        id: `stan_${Date.now()}`,
        role: 'stan',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, stanMsg]);
    } catch (err) {
      setError(err.message);
      const errorMsg = {
        id: `error_${Date.now()}`,
        role: 'stan',
        content: `I ran into an issue: ${err.message}\n\nPlease check your Gemini API key in the Integrations module and try again.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    clearConversationMemory();
    setMessages([{
      id: 'welcome_new',
      role: 'stan',
      content: "Conversation cleared! I'm ready for a fresh start. What would you like to know?",
      timestamp: new Date().toISOString()
    }]);
    setError(null);
  };

  const quickQuestions = [
    "Which partners need follow-up?",
    "Summarize our pipeline",
    "Show partner health overview",
    "What renewals are coming up?"
  ];

  const formatMessage = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list_${elements.length}`} className="my-2 ml-4 space-y-1">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#ADC837] mt-1 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="font-bold text-[#02475A] text-base mt-3 mb-1">
            {trimmed.replace(/^#+\s*/, '')}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h4 key={idx} className="font-semibold text-[#404041] text-sm mt-2 mb-1">
            {trimmed.replace(/^#+\s*/, '')}
          </h4>
        );
      } else if (trimmed.match(/^\*\*(.+)\*\*$/)) {
        flushList();
        elements.push(
          <p key={idx} className="font-semibold text-[#02475A] mt-2 mb-1">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
        const content = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        const processed = parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="text-[#02475A]">{part.replace(/\*\*/g, '')}</strong>;
          }
          return part;
        });
        currentList.push(processed);
      } else if (trimmed === '') {
        flushList();
        elements.push(<div key={idx} className="h-2" />);
      } else {
        flushList();
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        const processed = parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="text-[#02475A]">{part.replace(/\*\*/g, '')}</strong>;
          }
          return part;
        });
        elements.push(<p key={idx} className="my-1">{processed}</p>);
      }
    });

    flushList();
    return elements;
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ADC837] to-[#02475A] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-[#404041] font-semibold text-sm">Stan AI Assistant</h3>
            <p className="text-xs">
              {aiConfigured ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                  Connected to Gemini
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                  Demo Mode — Configure API key in Integrations
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="text-xs text-gray-400 hover:text-[#02475A] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#02475A] text-white rounded-br-md'
                  : msg.isError
                  ? 'bg-red-50 border border-red-200 text-[#404041] rounded-bl-md'
                  : 'bg-white border border-gray-200 text-[#404041] rounded-bl-md shadow-sm'
              }`}
            >
              {msg.role === 'stan' && (
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[#ADC837] font-bold text-xs">STAN</span>
                  <span className="text-gray-400 text-xs">{formatTime(msg.timestamp)}</span>
                </div>
              )}
              <div className="text-sm leading-relaxed">
                {msg.role === 'stan' ? formatMessage(msg.content) : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="text-right mt-1">
                  <span className="text-white/60 text-xs">{formatTime(msg.timestamp)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[#ADC837] font-bold text-xs">STAN</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#ADC837] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-[#ADC837] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-[#ADC837] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>Analyzing your data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 bg-white">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-[#404041] hover:border-[#ADC837] hover:text-[#02475A] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Stan anything about your partners..."
              rows={1}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-[#404041] text-sm placeholder-gray-400 focus:outline-none focus:border-[#ADC837] focus:ring-1 focus:ring-[#ADC837]/30 resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? 'bg-[#ADC837] hover:bg-[#9ab82f] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default StanChat;