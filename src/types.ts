export type Language = "Spanish" | "French" | "German" | "Japanese" | "Korean" | "Italian" | "Mandarin" | "Arabic" | "English";
export type ProficiencyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface VocabWord {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  translation: string;
  exampleOriginal: string;
  exampleTranslation: string;
  mastery?: "learning" | "familiar" | "mastered";
}

export interface VocabDeck {
  id: string;
  name: string;
  language: Language;
  level: ProficiencyLevel;
  words: VocabWord[];
  createdAt: string;
}

export interface ChatCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ChatVocabulary {
  word: string;
  type: string;
  translation: string;
  example: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  translation?: string;
  corrections?: ChatCorrection[];
  vocabulary?: ChatVocabulary[];
  timestamp: string;
}

export interface SandboxCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface SandboxEvaluation {
  score: number;
  feedback: string;
  corrections: SandboxCorrection[];
  improvedVersion: string;
}

export interface GameChallenge {
  sentenceWithBlank: string;
  options: string[];
  correctOptionIndex: number;
  translation: string;
  explanation: string;
}

export interface UserStats {
  xp: number;
  streak: number;
  wordsForged: number;
  challengesCompleted: number;
  lastActive: string;
}

export type AppTheme = "orange" | "sapphire" | "emerald" | "blue" | "ruby";
export type AppMode = "light" | "dark";

export interface ThemeColors {
  primary: string;
  secondary: string;
  ghost: string;
  text: string;
  bg: string;
  surface: string;
  border: string;
  ring: string;
  accent: string;
  progress: string;
  badge: string;
  glow: string;
  shadow: string;
}

export function getThemeColors(theme: AppTheme): ThemeColors {
  switch (theme) {
    case "ruby":
      return {
        primary: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        secondary: "bg-white border-rose-100 text-rose-600 hover:bg-rose-50 shadow-sm transition-all active:scale-[0.98]",
        ghost: "text-rose-600 hover:bg-rose-50/80 transition-all",
        text: "text-rose-600 dark:text-rose-400",
        bg: "bg-slate-50/50 dark:bg-rose-950/10",
        surface: "bg-white dark:bg-slate-900 shadow-sm border-slate-200/60 dark:border-rose-950/30",
        border: "border-rose-100/80 dark:border-rose-950/30",
        ring: "focus:ring-rose-500/20 focus:border-rose-500",
        accent: "from-rose-600 to-red-600",
        progress: "bg-rose-600",
        badge: "bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-950/30",
        glow: "shadow-rose-100/50 dark:shadow-none",
        shadow: "shadow-[0_2px_15px_-3px_rgba(225,29,72,0.07),0_4_6px_-2px_rgba(225,29,72,0.02)]"
      };
    case "sapphire":
      return {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        secondary: "bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all active:scale-[0.98]",
        ghost: "text-indigo-600 hover:bg-indigo-50/80 transition-all",
        text: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-slate-50/50 dark:bg-indigo-950/10",
        surface: "bg-white dark:bg-slate-900 shadow-sm border-slate-200/60 dark:border-indigo-950/30",
        border: "border-indigo-100/80 dark:border-indigo-950/30",
        ring: "focus:ring-indigo-500/20 focus:border-indigo-500",
        accent: "from-indigo-600 to-purple-600",
        progress: "bg-indigo-600",
        badge: "bg-indigo-50 text-indigo-600 border-indigo-100/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-950/30",
        glow: "shadow-indigo-100/50 dark:shadow-none",
        shadow: "shadow-[0_2px_15px_-3px_rgba(79,70,229,0.07),0_4px_6px_-2px_rgba(79,70,229,0.02)]"
      };
    case "emerald":
      return {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        secondary: "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 shadow-sm transition-all active:scale-[0.98]",
        ghost: "text-emerald-600 hover:bg-emerald-50/80 transition-all",
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-slate-50/50 dark:bg-emerald-950/10",
        surface: "bg-white dark:bg-slate-900 shadow-sm border-slate-200/60 dark:border-emerald-950/30",
        border: "border-emerald-100/80 dark:border-emerald-950/30",
        ring: "focus:ring-emerald-500/20 focus:border-emerald-500",
        accent: "from-emerald-600 to-teal-600",
        progress: "bg-emerald-600",
        badge: "bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-950/30",
        glow: "shadow-emerald-100/50 dark:shadow-none",
        shadow: "shadow-[0_2px_15px_-3px_rgba(5,150,105,0.07),0_4px_6px_-2px_rgba(5,150,105,0.02)]"
      };
    case "blue":
      return {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        secondary: "bg-white border-blue-100 text-blue-600 hover:bg-blue-50 shadow-sm transition-all active:scale-[0.98]",
        ghost: "text-blue-600 hover:bg-blue-50/80 transition-all",
        text: "text-blue-600 dark:text-blue-400",
        bg: "bg-slate-50/50 dark:bg-blue-950/10",
        surface: "bg-white dark:bg-slate-900 shadow-sm border-slate-200/60 dark:border-blue-950/30",
        border: "border-blue-100/80 dark:border-blue-950/30",
        ring: "focus:ring-blue-500/20 focus:border-blue-500",
        accent: "from-blue-600 to-cyan-500",
        progress: "bg-blue-600",
        badge: "bg-blue-50 text-blue-600 border-blue-100/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-950/30",
        glow: "shadow-blue-100/50 dark:shadow-none",
        shadow: "shadow-[0_2px_15px_-3px_rgba(37,99,235,0.07),0_4px_6px_-2px_rgba(37,99,235,0.02)]"
      };
    case "orange":
    default:
      return {
        primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        secondary: "bg-white border-orange-100 text-orange-600 hover:bg-orange-50 shadow-sm transition-all active:scale-[0.98]",
        ghost: "text-orange-600 hover:bg-orange-50/80 transition-all",
        text: "text-orange-600 dark:text-orange-400",
        bg: "bg-slate-50/50 dark:bg-orange-950/10",
        surface: "bg-white dark:bg-slate-900 shadow-sm border-slate-200/60 dark:border-orange-950/30",
        border: "border-orange-100/80 dark:border-orange-950/30",
        ring: "focus:ring-orange-500/20 focus:border-orange-500",
        accent: "from-orange-500 to-amber-500",
        progress: "bg-orange-500",
        badge: "bg-orange-50 text-orange-600 border-orange-100/50 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-950/30",
        glow: "shadow-orange-100/50 dark:shadow-none",
        shadow: "shadow-[0_2px_15px_-3px_rgba(249,115,22,0.07),0_4px_6px_-2px_rgba(249,115,22,0.02)]"
      };
  }
}

export interface WorksheetExercise {
  type: "matching" | "multiple-choice" | "fill-in-the-blank" | "translation";
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
}

export interface WorksheetSection {
  title: string;
  instructions: string;
  exercises: WorksheetExercise[];
}

export interface Worksheet {
  id: string;
  title: string;
  language: Language;
  level: ProficiencyLevel;
  topic: string;
  readingPassage?: {
    text: string;
    translation: string;
  };
  sections: WorksheetSection[];
  answerKey: string; // Summarized answers for the whole sheet
  createdAt: string;
}

export interface WorksheetGeneratorProps {
  language: Language;
  level: ProficiencyLevel;
  theme: AppTheme;
  mode: AppMode;
  onAddXP: (xp: number) => void;
  isFullView?: boolean;
  setIsFullView?: (full: boolean) => void;
}
