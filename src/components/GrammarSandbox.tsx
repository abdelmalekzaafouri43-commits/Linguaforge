import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generateContent } from "../lib/gemini";
import { 
  PenTool, 
  Sparkles, 
  Award, 
  Check, 
  Copy, 
  AlertCircle,
  TrendingUp,
  FileText
} from "lucide-react";
import { Language, ProficiencyLevel, SandboxEvaluation, AppTheme, AppMode, getThemeColors } from "../types";

interface GrammarSandboxProps {
  language: Language;
  level: ProficiencyLevel;
  theme: AppTheme;
  mode: AppMode;
  onAddXP: (xp: number) => void;
}

export default function GrammarSandbox({
  language,
  level,
  theme,
  mode,
  onAddXP
}: GrammarSandboxProps) {
  const colors = getThemeColors(theme);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SandboxEvaluation | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEvaluate = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateContent({
        contents: [{ role: "user", parts: [{ text: `Analyze this ${language} text written by a ${level} student: "${inputText.trim()}"` }] }],
        config: {
          systemInstruction: `You are an expert ${language} tutor. Analyze the provided text for grammatical, orthographical, and stylistic accuracy.Provide friendly, comprehensive overall feedback in English.Provide line-by-line grammatical, orthographical, or stylistic corrections.Provide a polished, elegant, native-sounding "improved version" of the entire text.Return the result strictly as a JSON object.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              score: { type: "INTEGER" },
              feedback: { type: "STRING" },
              corrections: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    original: { type: "STRING", description: "The original phrase or sentence containing errors" },
                    corrected: { type: "STRING", description: "The corrected or improved version" },
                    explanation: { type: "STRING", description: "Explanation of the rule or why this sounds more natural" },
                  },
                  required: ["original", "corrected", "explanation"],
                },
              },
              improvedVersion: { type: "STRING", description: "The complete polished text" },
            },
            required: ["score", "feedback", "corrections", "improvedVersion"],
          },
        }
      });

      setResult(data);
      // Award XP based on grammar accuracy score!
      const xpAward = Math.max(20, Math.round(data.score / 2));
      onAddXP(xpAward);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze grammar. Please ensure the backend is connected.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className={`p-8 h-full overflow-y-auto transition-colors ${colors.bg}`}>
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Grammar Sandbox</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Structural Critique &bull; {language}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Input Area */}
          <div className={`lg:col-span-7 p-8 rounded-[32px] border transition-all flex flex-col gap-6 ${
            mode === "dark" 
              ? "bg-slate-900 border-slate-800 shadow-xl" 
              : "bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.bg}`}>
                <PenTool className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Writing Workspace</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refine your native expression</p>
              </div>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                rows={8}
                placeholder={`Type or paste your text here (e.g., Describe what you did today in ${language})...`}
                className={`w-full text-lg p-6 rounded-2xl focus:outline-none focus:ring-4 transition-all leading-relaxed font-medium resize-none ${
                  mode === "dark" 
                    ? "bg-slate-800 border-slate-700 text-white focus:ring-slate-700/50" 
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-slate-200/50 shadow-inner"
                }`}
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                  {inputText.trim().split(/\s+/).filter(Boolean).length} Words &bull; {language}
                </span>

                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className={`px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale ${colors.primary}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Critique Grammar
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-4 text-xs font-medium flex items-center gap-2.5 mt-2">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <div className="flex-1">{error}</div>
              </div>
            )}
          </div>

          {/* Right panel: Results Output Panel */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {isLoading ? (
                /* Loading State representation */
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`rounded-[32px] border p-10 text-center flex flex-col items-center justify-center min-h-[450px] transition-all ${
                    mode === "dark" 
                      ? "bg-slate-900 border-slate-800" 
                      : "bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  <div className="relative mb-6 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin" />
                    <PenTool className="w-8 h-8 text-orange-500 absolute" />
                  </div>
                  <h4 className="text-xl font-black tracking-tight">Forging Analysis</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[240px] mt-3 leading-relaxed">
                    Deconstructing syntax & semantics in {language}...
                  </p>
                </motion.div>
              ) : result ? (
                /* Analyzed evaluation result details */
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  {/* Score & overall feedback card */}
                  <div className={`p-8 rounded-[32px] border transition-all ${
                    mode === "dark" 
                      ? "bg-slate-900 border-slate-800" 
                      : "bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Critique Summary</span>
                      <div className={`text-xs font-black px-4 py-1.5 rounded-full border uppercase tracking-widest ${getScoreColor(result.score)} flex items-center gap-2 shadow-sm`}>
                        <Award className="w-4 h-4" /> Score: {result.score}
                      </div>
                    </div>
                    
                    <div className={`p-5 rounded-2xl border-l-4 italic font-medium leading-relaxed ${
                      mode === "dark" ? "bg-slate-800 border-orange-500 text-slate-300" : "bg-orange-50/50 border-orange-500 text-orange-900"
                    }`}>
                      "{result.feedback}"
                    </div>
                  </div>

                  {/* Polished Master version copyable card */}
                  <div className={`p-8 rounded-[32px] border transition-all ${
                    mode === "dark" 
                      ? "bg-slate-900 border-slate-800" 
                      : "bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Native Polish
                      </h4>
                      <button
                        onClick={() => handleCopyText(result.improvedVersion)}
                        className={`${colors.secondary} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-2`}
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <p className="text-xl font-black tracking-tight leading-relaxed">
                      {result.improvedVersion}
                    </p>
                  </div>

                  {/* Detailed line modifications */}
                  {result.corrections && result.corrections.length > 0 && (
                    <div className={`p-8 rounded-[32px] border transition-all ${
                      mode === "dark" 
                        ? "bg-slate-900 border-slate-800" 
                        : "bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
                    }`}>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                        Specific Corrections ({result.corrections.length})
                      </h4>

                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.corrections.map((corr, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border-l-2 transition-all ${
                            mode === "dark" ? "bg-slate-800 border-slate-700 hover:border-orange-500" : "bg-slate-50 border-slate-200 hover:border-orange-200"
                          }`}>
                            <div className="text-xs line-through text-red-400 font-bold mb-1">{corr.original}</div>
                            <div className="text-sm text-emerald-600 font-black mb-2 flex items-center gap-2">
                              <Check className="w-3 h-3" /> {corr.corrected}
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{corr.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Initial Idle State */
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-[32px] border border-dashed p-10 text-center min-h-[450px] flex flex-col items-center justify-center transition-all ${
                    mode === "dark" ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-slate-50/30"
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${mode === "dark" ? "bg-slate-800" : "bg-white shadow-sm"}`}>
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">Awaiting Submission</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mt-3 mx-auto leading-loose">
                    Submit text to initiate structural analysis
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
