import { useState, useEffect, Dispatch, SetStateAction, FormEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generateContent } from "../lib/gemini";
import { 
  Plus, 
  Layers, 
  RotateCw, 
  Check, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Award,
  AlertCircle
} from "lucide-react";
import { Language, ProficiencyLevel, VocabDeck, VocabWord, AppTheme, AppMode, getThemeColors } from "../types";

interface VocabForgeProps {
  language: Language;
  level: ProficiencyLevel;
  decks: VocabDeck[];
  setDecks: Dispatch<SetStateAction<VocabDeck[]>>;
  theme: AppTheme;
  mode: AppMode;
  onAddXP: (xp: number) => void;
}

export default function VocabForge({
  language,
  level,
  decks,
  setDecks,
  theme,
  mode,
  onAddXP
}: VocabForgeProps) {
  const colors = getThemeColors(theme);
  const [topicInput, setTopicInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current deck in active study mode
  const [activeDeck, setActiveDeck] = useState<VocabDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter decks by active target language
  const filteredDecks = decks.filter(d => d.language === language);

  const handleCreateDeck = async (e: FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await generateContent({
        contents: [{ role: "user", parts: [{ text: `Generate a vocabulary list for ${language} at the ${level} level. The topic is ${topicInput.trim()}.` }] }],
        config: {
          systemInstruction: `You are an expert ${language} tutor. Generate a vocabulary list of exactly 10 essential words or phrases based on the user's requested topic and proficiency level. Output exactly as a JSON array of objects.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                word: { type: "STRING" },
                pronunciation: { type: "STRING", description: "Phonetic pronunciation, romanization, furigana or pronunciation guide" },
                partOfSpeech: { type: "STRING", description: "Part of speech (noun, verb, adjective, expression, etc.)" },
                translation: { type: "STRING", description: "English translation of the word" },
                exampleOriginal: { type: "STRING", description: "A simple context sentence in the target language" },
                exampleTranslation: { type: "STRING", description: "English translation of the context sentence" },
              },
              required: ["word", "pronunciation", "partOfSpeech", "translation", "exampleOriginal", "exampleTranslation"]
            }
          }
        }
      });

      const newDeck: VocabDeck = {
        id: `deck-${Date.now()}`,
        name: topicInput.trim(),
        language,
        level,
        words: data.map((w: any) => ({ ...w, mastery: "learning" })),
        createdAt: new Date().toLocaleDateString()
      };

      const updatedDecks = [newDeck, ...decks];
      setDecks(updatedDecks);
      localStorage.setItem("linguaforge_decks", JSON.stringify(updatedDecks));
      setTopicInput("");
      onAddXP(30); // Bonus XP for forging a new learning deck!
      setActiveDeck(newDeck); // Go directly to study
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to forge deck. Please make sure the backend is active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDeck = (deckId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this study deck?")) {
      const updated = decks.filter(d => d.id !== deckId);
      setDecks(updated);
      localStorage.setItem("linguaforge_decks", JSON.stringify(updated));
      if (activeDeck?.id === deckId) {
        setActiveDeck(null);
      }
    }
  };

  const handleUpdateMastery = (rating: "learning" | "familiar" | "mastered") => {
    if (!activeDeck) return;

    // Update rating of active card
    const updatedWords = [...activeDeck.words];
    updatedWords[currentCardIndex] = {
      ...updatedWords[currentCardIndex],
      mastery: rating
    };

    const updatedDeck = { ...activeDeck, words: updatedWords };
    setActiveDeck(updatedDeck);

    // Persist changes in total decks
    const updatedDecks = decks.map(d => d.id === activeDeck.id ? updatedDeck : d);
    setDecks(updatedDecks);
    localStorage.setItem("linguaforge_decks", JSON.stringify(updatedDecks));

    onAddXP(5); // Small award for rating cards

    // Move to next card
    if (currentCardIndex < activeDeck.words.length - 1) {
      setTimeout(() => {
        setIsFlipped(false);
        setCurrentCardIndex(prev => prev + 1);
      }, 300);
    } else {
      // Finished deck!
      onAddXP(50); // Finish deck reward!
      alert("🎉 Deck session complete! You earned a +50 XP completion bonus!");
      setActiveDeck(null);
    }
  };

  return (
    <div className={`p-8 h-full overflow-y-auto transition-colors ${colors.bg}`}>
      <AnimatePresence mode="wait">
        {!activeDeck ? (
          /* Decks dashboard grid screen */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 max-w-5xl mx-auto"
          >
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Vocabulary Forge</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Study Decks &bull; {language}</p>
              </div>
            </div>

            {/* Deck Generator Builder form */}
            <div className={`p-10 rounded-[32px] border transition-all ${
              mode === "dark" 
                ? "bg-slate-900 border-slate-800 shadow-xl" 
                : "bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
            }`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:rotate-6 ${colors.bg}`}>
                  <Sparkles className={`w-7 h-7 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">AI Deck Smithy</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Forge cards from any topic instantly</p>
                </div>
              </div>
              
              <form onSubmit={handleCreateDeck} className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  disabled={isLoading}
                  placeholder='e.g., "Ordering Tapas at a restaurant", "Job interview terminology"'
                  className={`flex-1 px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 transition-all text-[17px] font-medium ${
                    mode === "dark" 
                      ? "bg-slate-800 border-slate-700 text-white focus:ring-slate-700/50" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-slate-200/50"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !topicInput.trim()}
                  className={`px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale ${colors.primary}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Forging...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Forge Deck
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-4 text-sm font-medium flex items-center gap-3 mt-6">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* List of custom decks */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Your {language} Decks ({filteredDecks.length})
              </h3>

              {filteredDecks.length === 0 ? (
                <div className="bg-white/80 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No custom decks in this language yet.</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Use the Deck Smithy above to forge a new deck on any topic you want to study!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDecks.map((deck) => {
                    const masteredCount = deck.words.filter(w => w.mastery === "mastered").length;
                    const familiarCount = deck.words.filter(w => w.mastery === "familiar").length;
                    const learningCount = deck.words.filter(w => w.mastery === "learning").length;
                    const completionPct = Math.round((masteredCount / deck.words.length) * 100);

                    return (
                      <div
                        key={deck.id}
                        onClick={() => {
                          setActiveDeck(deck);
                          setCurrentCardIndex(0);
                          setIsFlipped(false);
                        }}
                        className={`p-6 rounded-[28px] border transition-all group relative cursor-pointer active:scale-95 ${
                          mode === "dark" 
                            ? "bg-slate-900 border-slate-800 hover:bg-slate-800" 
                            : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${colors.badge}`}>{deck.level}</span>
                            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-3 leading-tight group-hover:text-orange-600 transition-colors">{deck.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-1 opacity-60">Created {deck.createdAt} &bull; {deck.words.length} Cards</span>
                          </div>

                          <button
                            onClick={(e) => handleDeleteDeck(deck.id, e)}
                            className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all active:scale-90"
                            title="Delete Deck"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Mastery breakdown bar */}
                        <div className="mt-5 space-y-2">
                          <div className="flex justify-between text-[11px] font-medium text-slate-400">
                            <span>Mastery Completion</span>
                            <span>{completionPct}%</span>
                          </div>
                          
                          {/* Segmented bar */}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(masteredCount / deck.words.length) * 100}%` }} title="Mastered" />
                            <div className="bg-amber-400 h-full" style={{ width: `${(familiarCount / deck.words.length) * 100}%` }} title="Familiar" />
                            <div className="bg-red-400 h-full" style={{ width: `${(learningCount / deck.words.length) * 100}%` }} title="Learning" />
                          </div>

                          {/* Legend counters */}
                          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 pt-1">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {masteredCount} Mastered</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {familiarCount} Familiar</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {learningCount} Learning</span>
                          </div>
                        </div>

                        {/* Hover CTA Indicator */}
                        <div className="absolute right-4 bottom-4 w-7 h-7 bg-slate-50 group-hover:bg-orange-500 group-hover:text-white rounded-lg flex items-center justify-center text-slate-400 transition-all border border-slate-100 group-hover:border-orange-600">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Active study mode canvas card screen */
          <motion.div
            key="study"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-xl mx-auto flex flex-col h-full min-h-[500px]"
          >
            {/* Upper Study Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button 
                  onClick={() => setActiveDeck(null)}
                  className="text-xs text-slate-400 hover:text-slate-800 font-bold transition-colors"
                >
                  ← Back to Deck List
                </button>
                <h3 className="text-base font-bold text-slate-800 mt-1">{activeDeck.name}</h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400">{currentCardIndex + 1} / {activeDeck.words.length} Cards</span>
                <div className="w-24 bg-slate-200 h-1 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all"
                    style={{ width: `${((currentCardIndex + 1) / activeDeck.words.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Flip Card Canvas Container */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 flex items-center justify-center cursor-pointer min-h-[300px] select-none"
            >
              {/* Modern CSS Perspective Flip implementation */}
              <div 
                className="w-full h-72 relative transition-all duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
              >
                {/* FRONT SIDE (Word & Phonetics) */}
                <div 
                  className="absolute inset-0 bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-100"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-4">
                    {activeDeck.words[currentCardIndex].partOfSpeech}
                  </span>
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">
                    {activeDeck.words[currentCardIndex].word}
                  </h2>
                  <p className="text-sm text-slate-400 italic mt-2 font-mono">
                    {activeDeck.words[currentCardIndex].pronunciation}
                  </p>

                  <div className="absolute bottom-6 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <RotateCw className="w-3.5 h-3.5" /> Click Card to Reveal Translation
                  </div>
                </div>

                {/* BACK SIDE (Definition & Context) */}
                <div 
                  className="absolute inset-0 bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-100"
                  style={{ 
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">English Meaning</span>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight mb-4">
                    {activeDeck.words[currentCardIndex].translation}
                  </h3>

                  {/* Context sentence widget */}
                  <div className="border-t border-slate-50 w-full pt-4 mt-2 max-w-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Context Example</span>
                    <p className="text-sm font-bold text-slate-700 leading-normal">
                      {activeDeck.words[currentCardIndex].exampleOriginal}
                    </p>
                    <p className="text-xs text-slate-400 font-semibold leading-normal mt-1">
                      {activeDeck.words[currentCardIndex].exampleTranslation}
                    </p>
                  </div>

                  <div className="absolute bottom-6 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <RotateCw className="w-3.5 h-3.5" /> Click Card to Flip Back
                  </div>
                </div>
              </div>
            </div>

            {/* Study rating panel (shows after first flip) */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">How familiar is this word?</span>
              <div className="grid grid-cols-3 gap-3 w-full">
                <button
                  onClick={() => handleUpdateMastery("learning")}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Still learning
                </button>
                <button
                  onClick={() => handleUpdateMastery("familiar")}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-3.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Familiar
                </button>
                <button
                  onClick={() => handleUpdateMastery("mastered")}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-3.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Mastered
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
