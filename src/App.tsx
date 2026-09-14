import { useState, useEffect } from "react";
import { Language, ProficiencyLevel, VocabDeck, UserStats, VocabWord, AppTheme, AppMode } from "./types";
import Sidebar from "./components/Sidebar";
import TutorChat from "./components/TutorChat";
import VocabForge from "./components/VocabForge";
import GrammarSandbox from "./components/GrammarSandbox";
import ContextClues from "./components/ContextClues";
import WorksheetGenerator from "./components/WorksheetGenerator";

export default function App() {
  // Main target language and proficiency level selections
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("linguaforge_language") as Language) || "Spanish";
  });
  const [level, setLevel] = useState<ProficiencyLevel>(() => {
    return (localStorage.getItem("linguaforge_level") as ProficiencyLevel) || "Beginner";
  });

  // Theme & Dark/Light mode state
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem("linguaforge_theme") as AppTheme) || "orange";
  });
  const [mode, setMode] = useState<AppMode>(() => {
    return (localStorage.getItem("linguaforge_mode") as AppMode) || "light";
  });

  // Current active navigation tab
  const [activeTab, setActiveTab] = useState<"tutor" | "forge" | "sandbox" | "game" | "worksheet">("tutor");

  // Expand / Full View mode (hides sidebar)
  const [isFullView, setIsFullView] = useState(false);

  // Vocabulary Decks list state
  const [decks, setDecks] = useState<VocabDeck[]>([]);

  // Gamified XP, Streak, Stats state
  const [stats, setStats] = useState<UserStats>({
    xp: 0,
    streak: 1,
    wordsForged: 0,
    challengesCompleted: 0,
    lastActive: new Date().toDateString()
  });

  // Persist language/level changes
  useEffect(() => {
    localStorage.setItem("linguaforge_language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("linguaforge_level", level);
  }, [level]);

  // Persist theme/mode changes
  useEffect(() => {
    localStorage.setItem("linguaforge_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("linguaforge_mode", mode);
    const root = window.document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  // Load decks and stats on component mount
  useEffect(() => {
    const storedDecks = localStorage.getItem("linguaforge_decks");
    if (storedDecks) {
      setDecks(JSON.parse(storedDecks));
    }

    const storedStats = localStorage.getItem("linguaforge_stats");
    if (storedStats) {
      const parsed = JSON.parse(storedStats);
      
      // Calculate streak continuation
      const lastActiveDate = new Date(parsed.lastActive);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let newStreak = parsed.streak;
      if (diffDays === 1) {
        newStreak += 1; // Streak continues
      } else if (diffDays > 1) {
        newStreak = 1; // Streak reset
      }

      setStats({
        ...parsed,
        streak: newStreak,
        lastActive: today.toDateString()
      });
    }
  }, []);

  // Save stats helper
  const updateStats = (updater: (prev: UserStats) => UserStats) => {
    setStats((prev) => {
      const next = updater(prev);
      localStorage.setItem("linguaforge_stats", JSON.stringify(next));
      return next;
    });
  };

  // Callback to award XP
  const handleAddXP = (xpAmount: number) => {
    updateStats((prev) => ({
      ...prev,
      xp: prev.xp + xpAmount
    }));
  };

  // Callback to add a single vocabulary word into a "Forged Words" active deck
  const handleAddForgedWord = (word: VocabWord) => {
    setDecks((prevDecks) => {
      const deckName = "Tutor Chat Highlights";
      let existingDeck = prevDecks.find(d => d.name === deckName && d.language === language && d.level === level);

      let updatedDecks: VocabDeck[];

      if (existingDeck) {
        const isDuplicate = existingDeck.words.some(w => w.word.toLowerCase() === word.word.toLowerCase());
        if (isDuplicate) {
          updatedDecks = [...prevDecks];
        } else {
          const updatedWords = [word, ...existingDeck.words];
          const updatedDeck = { ...existingDeck, words: updatedWords };
          updatedDecks = prevDecks.map(d => d.id === existingDeck.id ? updatedDeck : d);
        }
      } else {
        const newHighlightsDeck: VocabDeck = {
          id: `deck-highlights-${Date.now()}`,
          name: deckName,
          language,
          level,
          words: [word],
          createdAt: new Date().toLocaleDateString()
        };
        updatedDecks = [newHighlightsDeck, ...prevDecks];
      }

      localStorage.setItem("linguaforge_decks", JSON.stringify(updatedDecks));
      
      updateStats((prev) => ({
        ...prev,
        wordsForged: prev.wordsForged + 1
      }));

      return updatedDecks;
    });
  };

  // Callback for game completed challenge increments
  const handleCompleteGameChallenge = () => {
    updateStats((prev) => ({
      ...prev,
      challengesCompleted: prev.challengesCompleted + 1
    }));
  };

  return (
    <div id="app" className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-200 print:h-auto print:w-auto print:overflow-visible ${
      mode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50/20 text-slate-800"
    }`}>
      {/* Dynamic Theme Styles Overrides Selector */}
      <style>{`
        /* Dynamic Theme Palette overrides for Sunset Orange, Sapphire, Emerald, Blue */
        ${theme === "sapphire" ? `
          .bg-orange-500 { background-color: #4f46e5 !important; }
          .hover\\:bg-orange-600:hover { background-color: #4338ca !important; }
          .text-orange-500 { color: #4f46e5 !important; }
          .text-orange-600 { color: #4f46e5 !important; }
          .text-orange-700 { color: #3730a3 !important; }
          .bg-orange-50 { background-color: rgba(79, 70, 229, 0.1) !important; }
          .border-orange-100 { border-color: rgba(79, 70, 229, 0.2) !important; }
          .border-orange-600 { border-color: #4338ca !important; }
          .focus\\:ring-orange-500\\/20:focus { --tw-ring-color: rgba(79, 70, 229, 0.2) !important; }
          .focus\\:border-orange-500:focus { border-color: #4f46e5 !important; }
          .shadow-orange-100 { --tw-shadow-color: rgba(79, 70, 229, 0.1) !important; }
        ` : ""}

        ${theme === "emerald" ? `
          .bg-orange-500 { background-color: #059669 !important; }
          .hover\\:bg-orange-600:hover { background-color: #047857 !important; }
          .text-orange-500 { color: #059669 !important; }
          .text-orange-600 { color: #059669 !important; }
          .text-orange-700 { color: #065f46 !important; }
          .bg-orange-50 { background-color: rgba(5, 150, 105, 0.1) !important; }
          .border-orange-100 { border-color: rgba(5, 150, 105, 0.2) !important; }
          .border-orange-600 { border-color: #047857 !important; }
          .focus\\:ring-orange-500\\/20:focus { --tw-ring-color: rgba(5, 150, 105, 0.2) !important; }
          .focus\\:border-orange-500:focus { border-color: #059669 !important; }
          .shadow-orange-100 { --tw-shadow-color: rgba(5, 150, 105, 0.1) !important; }
        ` : ""}

        ${theme === "blue" ? `
          .bg-orange-500 { background-color: #2563eb !important; }
          .hover\\:bg-orange-600:hover { background-color: #1d4ed8 !important; }
          .text-orange-500 { color: #2563eb !important; }
          .text-orange-600 { color: #2563eb !important; }
          .text-orange-700 { color: #1e40af !important; }
          .bg-orange-50 { background-color: rgba(37, 99, 235, 0.1) !important; }
          .border-orange-100 { border-color: rgba(37, 99, 235, 0.2) !important; }
          .border-orange-600 { border-color: #1d4ed8 !important; }
          .focus\\:ring-orange-500\\/20:focus { --tw-ring-color: rgba(37, 99, 235, 0.2) !important; }
          .focus\\:border-orange-500:focus { border-color: #2563eb !important; }
          .shadow-orange-100 { --tw-shadow-color: rgba(37, 99, 235, 0.1) !important; }
        ` : ""}

        /* Eyesafe Dark Mode Overrides for Full-App Compliance */
        ${mode === "dark" ? `
          .dark, .dark body {
            background-color: #030712 !important;
            color: #f3f4f6 !important;
          }
          
          /* Cards, Sidebar panels, Input sections, Chat panels */
          .dark .bg-white, .dark .bg-slate-50\\/50 {
            background-color: #0f172a !important; /* bg-slate-900 */
            color: #f3f4f6 !important;
          }

          .dark .bg-slate-50, .dark .bg-slate-100 {
            background-color: #1e293b !important; /* bg-slate-800 */
            color: #f3f4f6 !important;
          }

          .dark .border-slate-100, .dark .border-slate-50, .dark .border-slate-200 {
            border-color: #1e293b !important;
          }

          .dark .text-slate-800, .dark .text-slate-950, .dark .text-slate-900, .dark .text-slate-700 {
            color: #f3f4f6 !important;
          }

          .dark .text-slate-600, .dark .text-slate-500 {
            color: #9ca3af !important; /* text-slate-400 */
          }

          .dark .text-slate-400 {
            color: #6b7280 !important;
          }

          .dark input, .dark select, .dark textarea {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #ffffff !important;
          }

          /* Correct options, insights inside containers */
          .dark .bg-amber-50\\/50, .dark .bg-amber-50 {
            background-color: rgba(245, 158, 11, 0.08) !important;
            border-color: rgba(245, 158, 11, 0.15) !important;
            color: #fbbf24 !important;
          }

          .dark .text-amber-700 {
            color: #fbbf24 !important;
          }

          .dark .text-emerald-700 {
            color: #34d399 !important;
          }

          .dark .bg-emerald-50 {
            background-color: rgba(16, 185, 129, 0.08) !important;
            border-color: rgba(16, 185, 129, 0.15) !important;
          }

          .dark .shadow-sm, .dark .shadow-md, .dark .shadow-inner {
            box-shadow: none !important;
          }
        ` : ""}
      `}</style>

      {/* 1. Left Anchored Navigation Dashboard Sidebar */}
      {!isFullView && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsFullView(false); // Always exit full view on tab change
          }}
          language={language}
          setLanguage={setLanguage}
          level={level}
          setLevel={setLevel}
          stats={stats}
          theme={theme}
          setTheme={setTheme}
          mode={mode}
          setMode={setMode}
        />
      )}

      {/* 2. Main Content View workspace panel */}
      <main className="flex-1 h-full overflow-hidden relative print:h-auto print:overflow-visible">
        {activeTab === "tutor" && (
          <TutorChat
            language={language}
            level={level}
            theme={theme}
            mode={mode}
            onAddXP={handleAddXP}
            onAddForgedWord={handleAddForgedWord}
            onNavigate={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === "forge" && (
          <VocabForge
            language={language}
            level={level}
            decks={decks}
            setDecks={setDecks}
            theme={theme}
            mode={mode}
            onAddXP={handleAddXP}
          />
        )}

        {activeTab === "sandbox" && (
          <GrammarSandbox
            language={language}
            level={level}
            theme={theme}
            mode={mode}
            onAddXP={handleAddXP}
          />
        )}

        {activeTab === "game" && (
          <ContextClues
            language={language}
            level={level}
            onAddXP={handleAddXP}
            onCompleteChallenge={handleCompleteGameChallenge}
          />
        )}

        {activeTab === "worksheet" && (
          <WorksheetGenerator
            language={language}
            level={level}
            theme={theme}
            mode={mode}
            onAddXP={handleAddXP}
            isFullView={isFullView}
            setIsFullView={setIsFullView}
          />
        )}
      </main>
    </div>
  );
}
