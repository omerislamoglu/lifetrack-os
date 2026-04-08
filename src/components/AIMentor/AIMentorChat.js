import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, RotateCcw, Copy, Check, BarChart2, Map, Rocket, Target } from 'lucide-react';
import { createMentorChat } from '../../aiService';
import './AIMentorChat.css';

const ReactMarkdown = React.lazy(() => import('react-markdown'));

// ─── Chip prompts ────────────────────────────────────────────────────────────
const CHIPS = {
  tr: [
    { text: 'Bu haftaki performansımı analiz et', icon: <BarChart2 size={14} /> },
    { text: 'React hooks konusunda yol haritası çiz', icon: <Map size={14} /> },
    { text: 'Motivasyonumu nasıl artırabilirim?', icon: <Rocket size={14} /> },
    { text: 'Bugünkü en önemli 3 önceliğim ne olmalı?', icon: <Target size={14} /> },
  ],
  en: [
    { text: 'Analyze my performance this week', icon: <BarChart2 size={14} /> },
    { text: 'Create a React hooks learning roadmap', icon: <Map size={14} /> },
    { text: 'How can I boost my motivation?', icon: <Rocket size={14} /> },
    { text: 'What should be my top 3 priorities today?', icon: <Target size={14} /> },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
let messageIdCounter = 100;
const newId = () => ++messageIdCounter;

/**
 * Compute a brief weekly summary from historyData for the system prompt.
 */
function buildWeekSummary(historyData) {
  const keys = Object.keys(historyData || {}).sort().slice(-7);
  let totalStudy = 0, totalCode = 0, totalSport = 0;

  keys.forEach((dateKey) => {
    const acts = historyData[dateKey];
    if (!Array.isArray(acts)) return;
    acts.forEach((a) => {
      const name = (a.name || '').toLowerCase();
      if (name.includes('ders') || name.includes('study')) totalStudy += a.value || 0;
      else if (name.includes('kod') || name.includes('code')) totalCode += a.value || 0;
      else if (name.includes('spor') || name.includes('sport')) totalSport += a.value || 0;
    });
  });

  // Very rough trend: compare last 3 days avg vs 4 days before
  const recentKeys = keys.slice(-3);
  const olderKeys = keys.slice(-6, -3);
  const avg = (arr) => {
    if (!arr.length) return 0;
    return arr.reduce((s, k) => {
      const acts = historyData[k] || [];
      return s + acts.reduce((ss, a) => ss + (a.value || 0), 0);
    }, 0) / arr.length;
  };
  const recentAvg = avg(recentKeys);
  const olderAvg = avg(olderKeys);
  const trend =
    recentAvg > olderAvg * 1.05
      ? 'improving'
      : recentAvg < olderAvg * 0.95
      ? 'declining'
      : 'stable';

  return { totalStudy: Math.round(totalStudy), totalCode: Math.round(totalCode), totalSport: Math.round(totalSport), trend };
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="mentor-typing-dots">
      <span /><span /><span />
    </div>
  );
}

// ─── Single message bubble ───────────────────────────────────────────────────
function MessageBubble({ msg, accentColor, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`mentor-bubble-row ${isUser ? 'user' : 'ai'}`}
    >
      {!isUser && (
        <div
          className="mentor-avatar"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}
        >
          <Sparkles size={14} color="#fff" />
        </div>
      )}

      <div
        className={`mentor-bubble ${isUser ? 'mentor-bubble-user' : 'mentor-bubble-ai'}`}
        style={
          isUser
            ? { background: accentColor }
            : { borderColor: `${accentColor}33` }
        }
      >
        {isUser ? (
          <p className="mentor-bubble-text">{msg.content}</p>
        ) : msg.content === '' && isStreaming ? (
          <TypingDots />
        ) : (
          <Suspense fallback={<p className="mentor-bubble-text">{msg.content}</p>}>
            <div className="markdown-body mentor-markdown">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </Suspense>
        )}

        {/* Copy button for AI messages */}
        {!isUser && msg.content && (
          <button
            className="mentor-copy-btn"
            onClick={handleCopy}
            title="Kopyala"
            aria-label="Mesajı kopyala"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AIMentorChat({
  user,
  historyData = {},
  language = 'tr',
  accentColor = '#3b82f6',
}) {
  const userName =
    user?.displayName ||
    localStorage.getItem('temp_username') ||
    (language === 'tr' ? 'Kullanıcı' : 'User');

  const weekSummary = buildWeekSummary(historyData);
  const chips = CHIPS[language] || CHIPS.tr;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  // Keep the Gemini chat session alive for this mount
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialise chat session once
  useEffect(() => {
    chatRef.current = createMentorChat({ userName, language, weekSummary });
    // Greeting message
    const greeting =
      language === 'tr'
        ? `Merhaba **${userName}**! Ben LifeTrack Guide, senin AI mentorunum.\n\nSana bu hafta nasıl daha verimli olabileceğini anlatabilir, React/yazılım sorunlarında yardım edebilir ya da hedeflerine ulaşmana destek olabilirim.\n\nAşağıdaki konulardan birini seçebilir veya aklındaki soruyu yazabilirsin!`
        : `Hello **${userName}**! I'm LifeTrack Guide, your AI mentor.\n\nI can help you be more productive this week, answer React/software questions, or support you in reaching your goals.\n\nPick a topic below or just type your question!`;
    setMessages([{ id: newId(), role: 'model', content: greeting }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || isStreaming) return;
      setInput('');
      setError('');

      // Add user message
      const userMsg = { id: newId(), role: 'user', content: trimmed };
      // Placeholder for streaming AI response
      const aiMsgId = newId();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: aiMsgId, role: 'model', content: '' },
      ]);
      setIsStreaming(true);

      try {
        await chatRef.current.sendMessageStream(trimmed, (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        });
      } catch (err) {
        console.error('[AIMentor] Stream error:', err);
        const errMsg =
          language === 'tr'
            ? 'Üzgünüm, şu an bağlanamıyorum. Lütfen tekrar dene.'
            : 'Sorry, I could not connect right now. Please try again.';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: errMsg } : m
          )
        );
        setError(errMsg);
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, language]
  );

  const handleReset = () => {
    chatRef.current = createMentorChat({ userName, language, weekSummary });
    const greeting =
      language === 'tr'
        ? `Sohbet sıfırlandı! Yeni bir konuya başlayabiliriz.`
        : `Chat reset! We can start a new topic.`;
    setMessages([{ id: newId(), role: 'model', content: greeting }]);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const placeholderTR = 'Bir şey sor…';
  const placeholderEN = 'Ask something…';
  const placeholder = language === 'tr' ? placeholderTR : placeholderEN;
  const sendLabel = language === 'tr' ? 'Gönder' : 'Send';
  const resetLabel = language === 'tr' ? 'Sıfırla' : 'Reset';

  return (
    <div className="mentor-chat-container">
      {/* ── Header ── */}
      <div className="mentor-chat-header" style={{ borderColor: `${accentColor}44` }}>
        <div className="mentor-chat-header-left">
          <div
            className="mentor-header-icon"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h3 className="mentor-chat-title" style={{ color: accentColor }}>
              LifeTrack Guide
            </h3>
            <p className="mentor-chat-subtitle">
              {language === 'tr'
                ? 'AI Mentorun • Haftalık analizin hazır'
                : 'Your AI Mentor • Weekly analysis ready'}
            </p>
          </div>
        </div>
        <button
          className="mentor-reset-btn"
          onClick={handleReset}
          title={resetLabel}
          aria-label={resetLabel}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* ── Quick Chip Row (only when few messages) ── */}
      <AnimatePresence>
        {messages.length <= 2 && (
          <motion.div
            className="mentor-chip-row"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {chips.map((chip, idx) => (
              <button
                key={idx}
                className="mentor-chip"
                style={{ borderColor: `${accentColor}55`, color: accentColor, display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => sendMessage(chip.text)}
                disabled={isStreaming}
              >
                {chip.text}
                {chip.icon}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <div className="mentor-messages">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            accentColor={accentColor}
            isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="mentor-input-bar" style={{ borderColor: `${accentColor}33` }}>
        <textarea
          ref={inputRef}
          className="mentor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isStreaming}
        />
        <motion.button
          className="mentor-send-btn"
          style={{ background: accentColor }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || isStreaming}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={sendLabel}
        >
          <Send size={18} color="#fff" />
        </motion.button>
      </div>

      {error && <p className="mentor-error">{error}</p>}
    </div>
  );
}
