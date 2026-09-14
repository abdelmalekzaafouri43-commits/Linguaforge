import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Sparkles, 
  Download, 
  Printer, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  BookOpen,
  HelpCircle,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Mic,
  MicOff
} from "lucide-react";
import { Worksheet, getThemeColors, WorksheetGeneratorProps, Language } from "../types";

const STORAGE_KEY = "worksheet_generator_data";

// Language mapping for Web Speech API
const SPEECH_LANG_MAP: Record<Language, string> = {
  "English": "en-US",
  "Spanish": "es-ES",
  "French": "fr-FR",
  "German": "de-DE",
  "Japanese": "ja-JP",
  "Korean": "ko-KR",
  "Italian": "it-IT",
  "Mandarin": "zh-CN",
  "Arabic": "ar-SA"
};

export default function WorksheetGenerator({
  language,
  level,
  theme,
  mode,
  onAddXP,
  isFullView,
  setIsFullView
}: WorksheetGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Load autosaved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { topic: savedTopic, worksheet: savedWorksheet, language: savedLang, level: savedLevel } = JSON.parse(savedData);
        
        // Only restore if the language and level match the current session
        if (savedTopic) setTopic(savedTopic);
        if (savedWorksheet && savedLang === language && savedLevel === level) {
          setWorksheet(savedWorksheet);
        }
      } catch (err) {
        console.error("Failed to restore worksheet autosave", err);
      }
    }
  }, [language, level]);

  // Save data whenever topic or worksheet changes
  useEffect(() => {
    const dataToSave = {
      topic,
      worksheet,
      language,
      level
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [topic, worksheet, language, level]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[language] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setTopic(prev => prev ? `${prev} ${transcript}` : transcript);
      }
    };

    recognition.start();
  }, [isListening, language]);

  const colors = getThemeColors(theme);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);
    setWorksheet(null);

    try {
      const response = await fetch("/api/generate-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, level, topic }),
      });

      if (!response.ok) throw new Error("Failed to generate worksheet");

      const data = await response.json();
      setWorksheet({
        ...data,
        id: `ws-${Date.now()}`,
        language,
        level,
        createdAt: new Date().toLocaleDateString()
      });
      onAddXP(50); // Reward for generating a study resource
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden transition-colors ${colors.bg}`}>
      {/* Header - Glassmorphism */}
      <div className={`p-8 border-b shrink-0 flex items-center justify-between transition-all sticky top-0 z-[60] backdrop-blur-xl ${
        mode === "dark" 
          ? "border-slate-800/50 bg-slate-900/60" 
          : "border-slate-100/50 bg-white/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]"
      }`}>
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <FileText className={`w-8 h-8 ${colors.text}`} />
            Worksheet Gen
          </h2>
          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${mode === "dark" ? "text-slate-500" : "text-slate-400"}`}>
            Custom practice &bull; {language} ({level})
          </p>
        </div>

        {worksheet && (
          <div className="flex items-center gap-3 print:hidden relative z-[70]">
            <button
              onClick={() => setIsFullView?.(!isFullView)}
              className={colors.secondary + " px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer pointer-events-auto shadow-md"}
              title={isFullView ? "Exit Full View" : "Expand Preview"}
            >
              {isFullView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullView ? "Minimize" : "Expand"}
            </button>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={colors.secondary + " px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer pointer-events-auto"}
            >
              {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswers ? "Hide Keys" : "Show Keys"}
            </button>
            <button
              onClick={handlePrint}
              className={colors.primary + " px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer pointer-events-auto"}
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide print:overflow-visible print:p-0 relative z-10">
        {/* Background Decor - Visual Depth */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700 pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-12 print:max-w-none print:m-0 print:space-y-0 relative z-20">
          
          {/* Generation Form - Enhanced Glassmorphism & Enlarged */}
          {!worksheet && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-20 rounded-[64px] border text-center transition-all backdrop-blur-3xl relative overflow-hidden ${
                mode === "dark" 
                  ? "bg-slate-900/40 border-white/5" 
                  : "bg-white/40 border-white/40 shadow-[0_30px_80px_rgba(0,0,0,0.04)]"
              }`}
            >
              {/* Inner Glass Glow */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className={`w-32 h-32 rounded-[40px] mx-auto mb-12 flex items-center justify-center transition-transform hover:rotate-6 shadow-2xl ${colors.bg}`}>
                <Sparkles className={`w-16 h-16 ${colors.text}`} />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-5xl font-black mb-6 tracking-tight">Design a practice session</h3>
                <p className={`text-lg mb-14 max-w-xl mx-auto font-medium leading-relaxed ${mode === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Specify a scenario, grammar point, or vocabulary topic, and our AI tutor will craft a high-quality academic worksheet for you.
                </p>
                
                <div className={`flex flex-col sm:flex-row gap-5 max-w-3xl mx-auto p-3 rounded-[32px] backdrop-blur-xl border transition-all ${
                  mode === "dark" 
                    ? "bg-slate-950/40 border-white/10 shadow-inner focus-within:bg-slate-950/60" 
                    : "bg-white/80 border-slate-200 shadow-sm focus-within:bg-white focus-within:shadow-md"
                }`}>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    placeholder="e.g. Discussing environmental issues in French..."
                    className={`flex-1 px-8 py-6 rounded-2xl focus:outline-none focus:ring-0 transition-all text-2xl font-bold bg-transparent ${
                      mode === "dark" ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                  <button
                    onClick={toggleListening}
                    className={`p-4 rounded-2xl transition-all relative group ${
                      isListening 
                        ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse" 
                        : "hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    }`}
                    title={isListening ? "Stop Dictation" : "Start Dictation"}
                  >
                    {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    
                    {/* Pulsing ring when listening */}
                    {isListening && (
                      <span className="absolute inset-0 rounded-2xl border-4 border-rose-500 animate-ping opacity-25" />
                    )}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!topic.trim() || isGenerating}
                    className={`px-12 py-6 rounded-2xl font-black text-2xl transition-all shadow-2xl active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer pointer-events-auto ${colors.primary}`}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State - Glass Refinement */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative mb-10">
                <div className={`w-28 h-28 rounded-full border-4 border-t-transparent animate-spin ${
                  theme === "orange" ? "border-orange-500" :
                  theme === "sapphire" ? "border-indigo-600" :
                  theme === "emerald" ? "border-emerald-600" : "border-blue-600"
                }`} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Loader2 className={`w-10 h-10 animate-spin-slow ${colors.text}`} />
                </div>
              </div>
              <h3 className="text-2xl font-black mb-3">Forging your practice...</h3>
              <p className={`text-base font-medium ${mode === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                Structuring exercises for {language} {level}
              </p>
            </div>
          )}

          {/* Worksheet View */}
          {worksheet && (
            <div className="flex flex-col items-center">
              <motion.div
                key={worksheet.id}
                initial={{ opacity: 0, y: 20, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.22, 1, 0.36, 1] // Custom quint ease for a premium feel
                }}
                className="w-full max-w-[210mm] min-h-[297mm] transition-all print:w-[210mm] print:min-h-[297mm] print:m-0 print:border-none print:shadow-none overflow-hidden relative bg-white text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.1)]"
                style={{
                  padding: "15mm",
                  boxSizing: "border-box"
                }}
              >
                {/* 1. UNIT / LESSON HEADER */}
                <div className="flex justify-between items-start mb-12 relative">
                  <div className="flex items-center gap-6">
                    <div className="bg-[#1e3a8a] text-white px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px] shadow-lg">
                      <span className="text-xs font-bold uppercase tracking-widest mb-1">Unit</span>
                      <span className="text-4xl font-black">1</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#1e3a8a] text-3xl font-black tracking-tight">Lesson 1</span>
                      <div className="h-1.5 w-full bg-[#1e3a8a] rounded-full mt-1" />
                    </div>
                  </div>
                  <div className="bg-[#dcf0f9] text-[#1e3a8a] px-8 py-3 rounded-2xl font-black text-base shadow-sm border border-[#b9e2f5]">
                    {worksheet.topic}
                  </div>
                </div>

                {/* 2. MAIN TITLE */}
                <div className="mb-12">
                  <h1 className="text-[#1e3a8a] text-6xl font-black tracking-tighter leading-none mb-8">
                    {worksheet.title}
                  </h1>
                </div>

                {/* 3. LESSON OBJECTIVES BOX & COMIC ILLUSTRATION ROW */}
                <div className="grid grid-cols-5 gap-8 mb-14 min-h-[280px]">
                  <div className="col-span-3 bg-[#dcf0f9] border-2 border-[#b9e2f5] rounded-[32px] p-10 relative shadow-inner">
                    <div className="absolute -top-4 left-10 bg-[#1e3a8a] text-white p-2.5 rounded-2xl shadow-lg">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-[#1e3a8a] font-black text-2xl mb-6 flex items-center gap-3">
                      Lesson objectives
                    </h3>
                    <div className="text-slate-900 text-base space-y-3 leading-relaxed font-bold">
                      {worksheet.readingPassage.text.split('\n').map((line, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-[#1e3a8a] font-black text-xl leading-none">•</span>
                          <span>{line.replace(/^[•*-]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 rounded-[32px] overflow-hidden border-4 border-slate-100 flex items-center justify-center bg-slate-50 relative group shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
                    <img 
                      src={`https://api.aistudio.google.com/static/images/placeholders/language_tutor_${language.toLowerCase()}.png`} 
                      alt="Lesson visual"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543269664-7eef42226a21?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                  </div>
                </div>

                {/* 4. NUMBERED SECTIONS (The Content) */}
                <div className="space-y-10">
                  {worksheet.sections.map((section, sIdx) => (
                    <div key={sIdx} className="relative">
                      {/* Section Header Ribbon */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#1e3a8a] text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                          {sIdx + 1}
                        </div>
                        <div className="bg-[#93c5fd] text-[#1e3a8a] px-6 py-2 rounded-r-full font-bold text-lg flex-1 shadow-sm">
                          {section.title}
                        </div>
                      </div>

                      {/* Section Body */}
                      <div className="ml-12">
                        {section.instructions && (
                          <p className="text-[#1e3a8a] font-bold mb-4 italic text-sm">
                            {section.instructions}
                          </p>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          {section.exercises.map((exercise, eIdx) => (
                            <div key={eIdx} className="relative group">
                              {exercise.type === 'vocabulary' || exercise.type === 'example' ? (
                                <div className="flex items-start gap-3">
                                  <span className="text-[#1e3a8a] font-black tracking-widest text-sm mt-1">
                                    {String.fromCharCode(65 + eIdx)}.
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-slate-900 text-lg leading-relaxed font-medium">
                                      {exercise.question.split(' ').map((word, wIdx) => {
                                        const isHighlighted = word.length > 4 && wIdx % 3 === 0;
                                        return (
                                          <span key={wIdx} className={isHighlighted ? "text-[#2563eb] font-bold" : ""}>
                                            {word}{' '}
                                          </span>
                                        );
                                      })}
                                    </p>
                                    {exercise.answer && showAnswers && (
                                      <div className="mt-1 text-emerald-600 text-xs font-bold print:hidden">
                                        [{exercise.answer}]
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                  <div className="flex gap-3">
                                    <span className="text-slate-400 font-bold">{eIdx + 1}.</span>
                                    <div className="flex-1 space-y-3">
                                      <p className="font-bold text-slate-900">{exercise.question}</p>
                                      
                                      {exercise.options && exercise.options.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                          {exercise.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2 text-sm text-slate-900 font-bold border-b border-slate-200 pb-1">
                                              <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold">
                                                {String.fromCharCode(97 + oIdx)}
                                              </div>
                                              {opt}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="mt-2 h-0.5 w-full border-b border-dashed border-slate-300" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. FOOTER */}
                <div className="mt-auto pt-12 border-t-2 border-slate-100 relative">
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-black text-[#1e3a8a] mb-1">Ezzine Horchani</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                      <span>Senior AI Educator</span>
                      <span className="opacity-20">|</span>
                      <span>TESOL Certified</span>
                      <span className="opacity-20">|</span>
                      <span>Google Certified</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 text-3xl font-black text-[#1e3a8a]">1</div>
                </div>

                {/* Answer Key for Printing */}
                <div className="hidden print:block mt-20 pt-10 border-t-4 border-double border-slate-200 break-before-page">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-[#1e3a8a] text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-xl">
                      K
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-[#1e3a8a]">Answer Key</h3>
                  </div>
                  <div className="bg-slate-100 p-10 rounded-3xl whitespace-pre-wrap text-sm leading-relaxed font-mono border-2 border-slate-200 text-slate-900 font-bold">
                    {worksheet.answerKey}
                  </div>
                </div>
              </motion.div>

              {/* Reset / New Button - Glassmorphism & Fixed Clickability */}
              <div className="w-full max-w-4xl p-12 flex flex-col items-center gap-8 print:hidden relative z-[80]">
                <div className="flex items-center gap-4 relative z-[90]">
                  <button
                    onClick={handlePrint}
                    className={colors.primary + " px-12 py-5 rounded-3xl font-black text-xl flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"}
                  >
                    <Printer className="w-7 h-7" />
                    Print Worksheet
                  </button>
                  
                  <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={colors.secondary + " px-12 py-5 rounded-3xl font-black text-xl flex items-center gap-4 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto backdrop-blur-md bg-white/40 dark:bg-slate-800/40"}
                  >
                    {showAnswers ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                    {showAnswers ? "Hide Keys" : "Show Keys"}
                  </button>

                  {isFullView && (
                    <button
                      onClick={() => setIsFullView?.(false)}
                      className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-xl flex items-center gap-4 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
                    >
                      <Minimize2 className="w-7 h-7" />
                      Exit Full View
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setWorksheet(null);
                    setTopic("");
                  }}
                  className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all group cursor-pointer pointer-events-auto py-3 px-6 rounded-xl hover:bg-slate-500/10 ${
                    mode === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
                  Discard & Create New
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
