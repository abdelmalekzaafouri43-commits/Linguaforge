import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Sparkles, 
  Volume2, 
  Check, 
  HelpCircle, 
  Plus, 
  AlertCircle,
  Eye,
  EyeOff,
  FileText
} from "lucide-react";
import { Language, ProficiencyLevel, ChatMessage, VocabWord, AppTheme, AppMode, getThemeColors } from "../types";

interface TutorChatProps {
  language: Language;
  level: ProficiencyLevel;
  theme: AppTheme;
  mode: AppMode;
  onAddXP: (xp: number) => void;
  onAddForgedWord: (word: VocabWord) => void;
  onNavigate?: (tab: string) => void;
}

export default function TutorChat({
  language,
  level,
  theme,
  mode,
  onAddXP,
  onAddForgedWord,
  onNavigate
}: TutorChatProps) {
  const colors = getThemeColors(theme);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedTranslations, setRevealedTranslations] = useState<Record<string, boolean>>({});
  const [addedVocab, setAddedVocab] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history for the specific language/level combination
  useEffect(() => {
    const key = `linguaforge_chat_${language}_${level}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Set initial welcome greeting from AI
      const initialGreeting: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: getWelcomeGreeting(language, level),
        translation: getWelcomeTranslation(language, level),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        corrections: [],
        vocabulary: []
      };
      setMessages([initialGreeting]);
    }
    setError(null);
  }, [language, level]);

  // Save messages to local storage whenever they change
  const saveMessages = (updated: ChatMessage[]) => {
    setMessages(updated);
    const key = `linguaforge_chat_${language}_${level}`;
    localStorage.setItem(key, JSON.stringify(updated));
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setError(null);
    const userMessageText = inputValue.trim();
    setInputValue("");

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, newUserMessage];
    saveMessages(updatedHistory);
    setIsLoading(true);

    try {
      // Map message history to Express body
      // We pass the last 12 messages to keep it responsive and stay within limits
      const apiMessages = updatedHistory.slice(-12).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          level,
          messages: apiMessages
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get reply from tutor.");
      }

      const tutorMessage: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        translation: data.translation,
        corrections: data.corrections || [],
        vocabulary: data.vocabulary || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveMessages([...updatedHistory, tutorMessage]);
      onAddXP(15); // Award XP for speaking in the chat!
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTranslation = (id: string) => {
    setRevealedTranslations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddWordToForge = (vocab: any) => {
    const vocabKey = `${vocab.word}-${vocab.translation}`;
    if (addedVocab[vocabKey]) return;

    const newWord: VocabWord = {
      word: vocab.word,
      pronunciation: vocab.type, // Use partOfSpeech or placeholder
      partOfSpeech: vocab.type,
      translation: vocab.translation,
      exampleOriginal: vocab.example,
      exampleTranslation: "Context word",
      mastery: "learning"
    };

    onAddForgedWord(newWord);
    setAddedVocab(prev => ({
      ...prev,
      [vocabKey]: true
    }));
    onAddXP(5); // Reward for forging a word
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your chat history for this language?")) {
      const initialGreeting: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: getWelcomeGreeting(language, level),
        translation: getWelcomeTranslation(language, level),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        corrections: [],
        vocabulary: []
      };
      saveMessages([initialGreeting]);
      setRevealedTranslations({});
      setAddedVocab({});
    }
  };

  return (
    <div className={`flex flex-col h-full transition-colors relative overflow-hidden ${colors.bg}`}>
      {/* Background Decor - Visual Depth */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -z-10 animate-pulse delay-700 pointer-events-none" />

      {/* Header Panel - Glassmorphism */}
      <div className={`border-b py-6 px-8 flex items-center justify-between transition-all sticky top-0 z-[60] backdrop-blur-xl ${
        mode === "dark" 
          ? "bg-slate-900/60 border-slate-800/50" 
          : "bg-white/70 border-slate-100/50 shadow-sm"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${colors.bg}`}>
            <Sparkles className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                theme === "orange" ? "bg-orange-500" :
                theme === "sapphire" ? "bg-indigo-600" :
                theme === "emerald" ? "bg-emerald-600" : "bg-blue-600"
              }`} />
              <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Tutor Chat</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{language} &bull; {level} Expert</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate("worksheet")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${
                mode === "dark"
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                  : "border-orange-100 bg-orange-50/50 text-orange-600 hover:bg-orange-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Forge Worksheet
            </button>
          )}
          <button 
            onClick={handleClearHistory}
            className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all border shadow-sm active:scale-95 ${
              mode === "dark"
                ? "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10">
        {messages.map((msg) => {
          const isAI = msg.role === "assistant";
          const showTranslation = revealedTranslations[msg.id];

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex flex-col ${isAI ? "items-start" : "items-end"} max-w-[90%] ${isAI ? "mr-auto" : "ml-auto"}`}
            >
              {/* Profile Bubble and Header */}
              <div className={`flex items-center gap-2 mb-2 px-2 ${isAI ? "flex-row" : "flex-row-reverse"}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                  {isAI ? `${language} AI` : "Student"}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 opacity-30" />
                <span className="text-[10px] text-slate-300 font-bold">{msg.timestamp}</span>
              </div>

              {/* Message Bubble - Glass Refinement */}
              <div 
                className={`p-6 rounded-[24px] relative transition-all shadow-xl backdrop-blur-sm ${
                  isAI 
                    ? `bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 border ${mode === 'dark' ? 'border-slate-800/50' : 'border-slate-100/50'} rounded-tl-sm` 
                    : `${colors.primary} text-white rounded-tr-sm shadow-indigo-500/10`
                }`}
              >
                <p className="text-[18px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Translation Display - Glass Style */}
                {isAI && msg.translation && (
                  <div className={`mt-4 pt-4 border-t ${mode === "dark" ? "border-slate-800/50" : "border-slate-100/50"}`}>
                    <button 
                      onClick={() => toggleTranslation(msg.id)}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 cursor-pointer transition-all ${
                        mode === "dark" ? "text-slate-500 hover:text-slate-300" : "text-orange-600 hover:text-orange-700"
                      }`}
                    >
                      {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showTranslation ? "Hide English" : "Reveal English"}
                    </button>
                    
                    <AnimatePresence>
                      {showTranslation && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className={`text-sm font-medium leading-relaxed italic ${
                            mode === "dark" ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {msg.translation}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Structured AI Insights (Grammar and Vocab widgets) - Glass Card Style */}
              {isAI && ((msg.corrections && msg.corrections.length > 0) || (msg.vocabulary && msg.vocabulary.length > 0)) && (
                <div className="mt-4 space-y-4 w-full">
                  {/* Grammatical Corrections feedback */}
                  {msg.corrections && msg.corrections.length > 0 && (
                    <div className={`border rounded-[24px] p-6 transition-all backdrop-blur-md ${
                      mode === "dark" 
                        ? "bg-rose-500/5 border-rose-500/10" 
                        : "bg-rose-50/30 border-rose-100/50 shadow-sm shadow-rose-100/10"
                    }`}>
                      <div className="flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <span>Grammar Insight</span>
                      </div>
                      <div className="space-y-6">
                        {msg.corrections.map((corr, idx) => (
                          <div key={idx} className="group">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="line-through text-slate-400 font-bold decoration-rose-500/40 text-lg opacity-60">{corr.original}</span>
                              <span className="text-emerald-500 font-black text-lg flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                {corr.corrected}
                              </span>
                            </div>
                            <p className={`text-sm font-medium leading-relaxed p-3 rounded-xl ${
                              mode === "dark" ? "bg-slate-800/40 text-slate-400" : "bg-white/50 text-slate-500"
                            }`}>
                              {corr.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary highlighted - Glass Grid */}
                  {msg.vocabulary && msg.vocabulary.length > 0 && (
                    <div className={`border rounded-[24px] p-6 transition-all backdrop-blur-md ${
                      mode === "dark" 
                        ? "bg-emerald-500/5 border-emerald-500/10" 
                        : "bg-emerald-50/30 border-emerald-100/50 shadow-sm shadow-emerald-100/10"
                    }`}>
                      <div className="flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span>Word Forge</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {msg.vocabulary.map((vocab, idx) => {
                          const vocabKey = `${vocab.word}-${vocab.translation}`;
                          const isForged = addedVocab[vocabKey];
                          return (
                            <div key={idx} className={`flex items-start justify-between gap-4 p-5 rounded-[20px] border transition-all group ${
                              mode === "dark" 
                                ? "bg-slate-800/40 border-slate-700/30 hover:border-emerald-500/30" 
                                : "bg-white/60 border-slate-100 shadow-sm hover:border-emerald-200"
                            }`}>
                              <div className="flex-1 min-w-0">
                                <span className="font-black text-slate-800 dark:text-white text-lg block truncate">{vocab.word}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{vocab.type}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <span className="text-[13px] text-emerald-600 font-black">{vocab.translation}</span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium italic block mt-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                  "{vocab.example}"
                                </span>
                              </div>

                              <button
                                onClick={() => handleAddWordToForge(vocab)}
                                disabled={isForged}
                                className={`h-12 w-12 rounded-[18px] border transition-all shrink-0 flex items-center justify-center active:scale-90 shadow-sm ${
                                  isForged 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                    : `${colors.primary} border-transparent cursor-pointer hover:shadow-lg`
                                }`}
                                title="Forge & Study"
                              >
                                {isForged ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-4 text-slate-400 text-xs font-black uppercase tracking-[0.15em] mr-auto ml-2 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200" />
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce delay-300" />
            </div>
            <span>Tutor is thinking...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-4 text-xs font-medium flex items-center gap-2.5 max-w-[80%] mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Box */}
      <div className={`p-8 border-t transition-all ${
        mode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-[0_-1px_3px_0_rgba(0,0,0,0.01)]"
      }`}>
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={`Reply in ${language} or ask for translation...`}
            className={`flex-1 text-[17px] py-4 px-6 rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium ${
              mode === "dark" 
                ? "bg-slate-800 border-slate-700 text-white focus:ring-slate-700/50" 
                : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-slate-200/50"
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`w-14 h-14 rounded-2xl transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center shrink-0 shadow-lg active:scale-95 ${colors.primary}`}
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-4">
          Powered by Gemini AI &bull; Speak naturally to improve faster
        </p>
      </div>
    </div>
  );
}

// Help helpers for beautiful default translations and greetings based on target language
function getWelcomeGreeting(language: Language, level: ProficiencyLevel): string {
  const g: Record<Language, Record<ProficiencyLevel, string>> = {
    English: {
      Beginner: "Hello! Welcome to English practice. How are you today? Let's talk about your favorite hobbies!",
      Intermediate: "Hello there! Glad to see you. Tell me, what exciting plans do you have for this week?",
      Advanced: "Hello and welcome. I would be delighted to delve into an insightful debate or discuss literature and arts today. What's on your mind?"
    },
    Spanish: {
      Beginner: "¡Hola! Bienvenidos. ¿Cómo estás hoy? ¡Hablemos de tus pasatiempos favoritos!",
      Intermediate: "¡Hola! Me alegro de verte. Cuéntame, ¿qué planes tienes para esta semana?",
      Advanced: "Estimado alumno, un placer saludarte. ¿Te gustaría debatir hoy sobre algún acontecimiento de actualidad o profundizar en un tema literario?"
    },
    French: {
      Beginner: "Bonjour ! Comment ça va aujourd'hui ? Parlons de ta routine quotidienne.",
      Intermediate: "Salut ! J'espère que tu vas bien. Quel est le dernier film ou livre qui t'a inspiré ?",
      Advanced: "Ravi de vous retrouver. Proposez-moi une thématique d'actualité pour lancer notre échange philosophique du jour."
    },
    German: {
      Beginner: "Hallo! Wie geht es dir heute? Lass uns über deine Hobbys sprechen.",
      Intermediate: "Hallo! Schön dich zu sehen. Wie war dein Wochenende? Hast du etwas Schönes gemacht?",
      Advanced: "Guten Tag. Ich freue mich auf unsere anspruchsvolle Diskussion heute. Über welches gesellschaftliche Thema möchten Sie sprechen?"
    },
    Japanese: {
      Beginner: "こんにちは！お元気ですか？今日は好きな食べ物について話しましょう！",
      Intermediate: "こんにちは！最近忙しかったですか？楽しみにしていたイベントなどはありましたか？",
      Advanced: "お久しぶりです。本日はどのような時事問題や抽象的なテーマについて議論を進めましょうか？"
    },
    Korean: {
      Beginner: "안녕하세요! 오늘 기분이 어떠세요? 취미에 대해 이야기해 봐요!",
      Intermediate: "안녕하세요! 잘 지내셨어요? 요즘 일상에 어떤 흥미로운 일이 있었나요?",
      Advanced: "반갑습니다. 오늘은 어떤 심도 있는 사회적 이슈나 학술적인 주제로 토론해 볼까요?"
    },
    Italian: {
      Beginner: "Ciao! Come stai oggi? Parliamo dei tuoi cibi italiani preferiti!",
      Intermediate: "Ciao! Che bello rivederti. Qual è l'ultimo viaggio interessante che hai fatto?",
      Advanced: "Benvenuto. Sarei lieto di affrontare una discussione approfondita sulla cultura, l'arte o la politica contemporanea oggi."
    },
    Mandarin: {
      Beginner: "你好！今天怎么样？我们来聊聊你的兴趣爱好吧！",
      Intermediate: "你好！最近在忙些什么？有什么好玩的事情跟我分享一下吗？",
      Advanced: "你好。今天您想就哪一个深层社会话题 or 文化现象展开我们的思辨性讨论呢？"
    },
    Arabic: {
      Beginner: "مرحباً! كيف حالك اليوم؟ لنصنع بعض الجمل البسيطة معاً!",
      Intermediate: "مرحباً بك! كيف قضيت عطلة نهاية الأسبوع؟ هل هناك أخبار جديدة؟",
      Advanced: "أهلاً بك. ما هو الموضوع الفكري أو الثقافي الذي تود التعمق في مناقشته اليوم باللغة الفصحى؟"
    }
  };
  return g[language]?.[level] || `Hello! Let's start practice in ${language}!`;
}

function getWelcomeTranslation(language: Language, level: ProficiencyLevel): string {
  const t: Record<Language, Record<ProficiencyLevel, string>> = {
    English: {
      Beginner: "English greetings: How are you today? Let's talk about hobbies!",
      Intermediate: "English greeting: Welcome! What are your plans for this week?",
      Advanced: "English greeting: Delighted to engage in a sophisticated conversation today."
    },
    Spanish: {
      Beginner: "Hello! Welcome. How are you today? Let's talk about your favorite hobbies!",
      Intermediate: "Hello! Glad to see you. Tell me, what plans do you have for this week?",
      Advanced: "Dear student, it is a pleasure to greet you. Would you like to debate current affairs today or delve deep into a literary topic?"
    },
    French: {
      Beginner: "Hello! How is it going today? Let's talk about your daily routine.",
      Intermediate: "Hi! I hope you're doing well. What was the last movie or book that inspired you?",
      Advanced: "Delighted to meet you. Propose a current topic to launch our philosophical exchange for the day."
    },
    German: {
      Beginner: "Hello! How are you doing today? Let's talk about your hobbies.",
      Intermediate: "Hello! Great to see you. How was your weekend? Did you do anything nice?",
      Advanced: "Good day. I look forward to our sophisticated discussion today. Which societal topic would you like to speak about?"
    },
    Japanese: {
      Beginner: "Hello! How are you? Let's talk about your favorite foods today!",
      Intermediate: "Hello! Have you been busy lately? Were there any events you were looking forward to?",
      Advanced: "Long time no see. What kind of current events or abstract themes shall we discuss today?"
    },
    Korean: {
      Beginner: "Hello! How are you today? Let's talk about hobbies!",
      Intermediate: "Hello! How have you been? Any interesting things happened in your life lately?",
      Advanced: "Welcome. What kind of in-depth social issue or academic topic shall we discuss today?"
    },
    Italian: {
      Beginner: "Hello! How are you today? Let's talk about your favorite Italian foods!",
      Intermediate: "Hello! Wonderful to see you again. What was the last interesting trip you took?",
      Advanced: "Welcome. I would be pleased to tackle an in-depth discussion about culture, art, or contemporary politics today."
    },
    Mandarin: {
      Beginner: "Hello! How are you? Let's chat about your hobbies today!",
      Intermediate: "Hello! What have you been busy with lately? Any fun news to share with me?",
      Advanced: "Hello. Which deep social topic or cultural phenomenon would you like to explore in our analytical discussion today?"
    },
    Arabic: {
      Beginner: "Hello! How are you today? Let's make some simple sentences together!",
      Intermediate: "Welcome! How did you spend your weekend? Any new updates?",
      Advanced: "Welcome. Which intellectual or cultural topic would you like to discuss in depth today?"
    }
  };
  return t[language]?.[level] || `Let's practice speaking ${language}!`;
}
