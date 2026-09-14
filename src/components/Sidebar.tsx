import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  MessageSquare, 
  Layers, 
  PenTool, 
  Gamepad2, 
  Sparkles, 
  Flame, 
  Award,
  Globe,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Palette,
  Settings
} from "lucide-react";
import { Language, ProficiencyLevel, UserStats, AppTheme, AppMode, getThemeColors } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  level: ProficiencyLevel;
  setLevel: (level: ProficiencyLevel) => void;
  stats: UserStats;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onOpenSettings?: () => void;
}

const LANGUAGES: Language[] = [
  "English", "Spanish", "French", "German", "Japanese", "Korean", "Italian", "Mandarin", "Arabic"
];

const LEVELS: ProficiencyLevel[] = ["Beginner", "Intermediate", "Advanced"];

export default function Sidebar({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  level,
  setLevel,
  stats,
  theme,
  setTheme,
  mode,
  setMode,
  onOpenSettings
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentLevelLabel = Math.floor(stats.xp / 100) + 1;
  const currentXpProgress = stats.xp % 100;

  // Retrieve active theme-specific colors
  const colors = getThemeColors(theme);

  const menuItems = [
    { id: "tutor", name: "AI Chat Tutor", icon: MessageSquare, desc: "Converse & correct" },
    { id: "forge", name: "Vocabulary Forge", icon: Layers, desc: "Study flashcards" },
    { id: "sandbox", name: "Grammar Sandbox", icon: PenTool, desc: "Analyze paragraphs" },
    { id: "worksheet", name: "Worksheet Gen", icon: FileText, desc: "Generate practice sheets" },
    { id: "game", name: "Context Clues", icon: Gamepad2, desc: "Fill-in-the-blank challenge" }
  ];

  const themes: { id: AppTheme; label: string; colorClass: string }[] = [
    { id: "orange", label: "Orange", colorClass: "bg-orange-500" },
    { id: "sapphire", label: "Sapphire", colorClass: "bg-indigo-600" },
    { id: "emerald", label: "Emerald", colorClass: "bg-emerald-600" },
    { id: "blue", label: "Blue", colorClass: "bg-blue-600" },
    { id: "ruby", label: "Ruby", colorClass: "bg-rose-600" }
  ];

  return (
    <motion.div 
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`border-r flex flex-col h-screen overflow-y-auto shrink-0 select-none overflow-x-hidden relative transition-colors duration-200 print:hidden ${
        mode === "dark" 
          ? "border-slate-800 bg-slate-900 text-slate-100" 
          : "border-slate-100 bg-white text-slate-800"
      }`}
    >
      {/* Top Header & Brand */}
      <div className={`p-6 border-b flex items-center justify-between ${
        mode === "dark" ? "border-slate-800" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors ${
            theme === "orange" ? "bg-orange-500 text-white" :
            theme === "sapphire" ? "bg-indigo-600 text-white" :
            theme === "emerald" ? "bg-emerald-600 text-white" : 
            theme === "ruby" ? "bg-rose-600 text-white" : "bg-blue-600 text-white"
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-xl font-bold tracking-tight leading-none whitespace-nowrap">LinguaForge</h1>
              <p className={`text-xs font-medium mt-0.5 whitespace-nowrap ${
                mode === "dark" ? "text-slate-500" : "text-slate-400"
              }`}>AI-Powered Language Forge</p>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                mode === "dark" ? "hover:bg-slate-800 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              }`}
              title="API Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              mode === "dark" ? "hover:bg-slate-800 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Target Language Selection & Settings Panel */}
      <div className={`p-5 border-b flex flex-col items-center ${
        mode === "dark" ? "border-slate-800/60" : "border-slate-50"
      }`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={() => setIsCollapsed(false)}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border ${
                mode === "dark" ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`} 
              title={`Language: ${language} (${level}) - Click to expand`}
            >
              <Globe className={`w-5 h-5 ${colors.text}`} />
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase leading-tight tracking-wider ${
              mode === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
            }`}>
              {language.slice(0, 2).toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="w-full">
            <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              mode === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>
              <Globe className="w-3.5 h-3.5" /> Forge Target
            </h3>
            
            <div className="space-y-3 w-full">
              {/* Language dropdown */}
              <div>
                <label className={`text-[11px] font-medium block mb-1 ${
                  mode === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>Target Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={`w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 transition-all font-medium ${
                    mode === "dark" 
                      ? "bg-slate-800 border border-slate-700 text-slate-100 focus:ring-slate-700" 
                      : "bg-slate-50 border border-slate-200 text-slate-700 focus:ring-slate-200"
                  }`}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Level selection buttons */}
              <div>
                <label className={`text-[11px] font-medium block mb-1 ${
                  mode === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>Proficiency Level</label>
                <div className={`grid grid-cols-3 gap-1 p-1 rounded-lg ${
                  mode === "dark" ? "bg-slate-800" : "bg-slate-100"
                }`}>
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`text-[11px] font-medium py-1.5 rounded-md transition-all ${
                        level === lvl
                          ? (mode === "dark" ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm")
                          : (mode === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800")
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Theme & Dark Mode Setup Section */}
      <div className={`p-5 border-b flex flex-col items-center ${
        mode === "dark" ? "border-slate-800/60" : "border-slate-50"
      }`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            {/* Quick Dark Mode toggle in collapsed state */}
            <button
              onClick={() => setMode(mode === "light" ? "dark" : "light")}
              className={`w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer hover:scale-105 transition-all ${
                mode === "dark" ? "bg-slate-800 border-slate-700 text-amber-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
              title={`Switch to ${mode === "light" ? "Dark Mode" : "Light Mode"}`}
            >
              {mode === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="w-full">
            <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              mode === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>
              <Palette className="w-3.5 h-3.5" /> Workspace Style
            </h3>

            {/* Theme circle selectors */}
            <div className="mb-4">
              <label className={`text-[11px] font-medium block mb-2 ${
                mode === "dark" ? "text-slate-400" : "text-slate-500"
              }`}>Accent Palette</label>
              <div className="flex items-center gap-3">
                {themes.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`w-7 h-7 rounded-full ${t.colorClass} relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer`}
                      title={t.label}
                    >
                      {isActive && (
                        <span className="absolute w-9 h-9 border-2 rounded-full animate-pulse transition-all" 
                          style={{
                            borderColor: theme === "orange" ? "#f97316" :
                                        theme === "sapphire" ? "#4f46e5" :
                                        theme === "emerald" ? "#10b981" :
                                        theme === "ruby" ? "#e11d48" : "#2563eb"
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark & Light toggle buttons */}
            <div>
              <label className={`text-[11px] font-medium block mb-1.5 ${
                mode === "dark" ? "text-slate-400" : "text-slate-500"
              }`}>Appearance Mode</label>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg ${
                mode === "dark" ? "bg-slate-800" : "bg-slate-100"
              }`}>
                <button
                  onClick={() => setMode("light")}
                  className={`text-[11px] font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    mode === "light"
                      ? "bg-white text-slate-800 shadow-sm"
                      : (mode === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800")
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Light
                </button>
                <button
                  onClick={() => setMode("dark")}
                  className={`text-[11px] font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    mode === "dark"
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  Dark
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Modules */}
      <div className="p-4 flex-1 space-y-1">
        {!isCollapsed && (
          <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-2 px-2 ${
            mode === "dark" ? "text-slate-500" : "text-slate-400"
          }`}>
            Learning Hub
          </h3>
        )}
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-95 ${
                isActive 
                  ? (mode === "dark" 
                    ? `bg-slate-800/80 backdrop-blur-md shadow-xl ring-1 ring-white/10` 
                    : `bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100`)
                  : "hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
              } ${
                isCollapsed ? "justify-center p-3" : "gap-4 p-3 text-left"
              }`}
              title={`${item.name} - ${item.desc}`}
            >
              {/* Dynamic theme accent sidebar item highlights */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute left-0 top-1/4 bottom-1/4 w-1.5 rounded-r-full ${colors.progress}`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              <div className={`p-2.5 rounded-xl transition-all shrink-0 ${
                isActive 
                  ? (mode === "dark" ? "bg-slate-800 text-white shadow-lg" : colors.bg + " " + colors.text + " shadow-sm") 
                  : (mode === "dark" ? "bg-slate-800/40 text-slate-400 group-hover:bg-slate-800 group-hover:text-slate-200" : "bg-slate-50 text-slate-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-slate-800")
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <span className={`text-[15px] block font-black tracking-tight leading-tight whitespace-nowrap transition-colors ${
                    isActive 
                      ? "text-slate-900 dark:text-white" 
                      : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
                  }`}>
                    {item.name}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest block mt-0.5 opacity-60 ${
                    mode === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}>
                    {item.desc.split(' ')[0]}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Gamified Progress HUD */}
      <div className={`p-5 border-t flex flex-col items-center ${
        mode === "dark" ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
      }`}>
        {isCollapsed ? (
          <div className="flex flex-col gap-3 items-center">
            {/* Streak compact indicator */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${
              mode === "dark" ? "bg-slate-800 border-amber-900/30 text-amber-500" : "bg-amber-50 border-amber-100 text-amber-600"
            }`} title={`${stats.streak} Day Streak`}>
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            
            {/* Level compact badge */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border font-bold text-xs ${colors.badge}`} title={`Lvl ${currentLevelLabel} (${currentXpProgress}/100 XP)`}>
              L{currentLevelLabel}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3 w-full">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.badge}`}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] font-semibold block uppercase tracking-wider leading-none ${
                    mode === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}>Level</span>
                  <span className="text-sm font-bold">Lvl {currentLevelLabel}</span>
                </div>
              </div>

              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                mode === "dark" ? "bg-amber-950/40 text-amber-400 border border-amber-900/30" : "bg-amber-50 text-amber-600 border border-amber-100"
              }`}>
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{stats.streak} Day Streak</span>
              </div>
            </div>

            {/* Level XP progress bar */}
            <div className="w-full">
              <div className={`flex justify-between text-[11px] font-medium mb-1 ${
                mode === "dark" ? "text-slate-400" : "text-slate-400"
              }`}>
                <span>XP Progress</span>
                <span>{currentXpProgress}/100 XP</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                mode === "dark" ? "bg-slate-800" : "bg-slate-200"
              }`}>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${colors.progress}`} 
                  style={{ width: `${currentXpProgress}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-center w-full">
              <div className={`p-2 rounded-lg border ${
                mode === "dark" ? "bg-slate-800/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <span className={`text-[10px] font-semibold block uppercase leading-tight ${
                  mode === "dark" ? "text-slate-500" : "text-slate-400"
                }`}>Forged</span>
                <span className="text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                  <BookOpen className={`w-3 h-3 ${colors.text}`} /> {stats.wordsForged}
                </span>
              </div>
              <div className={`p-2 rounded-lg border ${
                mode === "dark" ? "bg-slate-800/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <span className={`text-[10px] font-semibold block uppercase leading-tight ${
                  mode === "dark" ? "text-slate-500" : "text-slate-400"
                }`}>Solved</span>
                <span className="text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                  <Gamepad2 className="w-3 h-3 text-emerald-500" /> {stats.challengesCompleted}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
