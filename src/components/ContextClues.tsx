import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generateContent } from "../lib/gemini";
import { 
  Gamepad2, 
  HelpCircle, 
  Check, 
  X, 
  ArrowRight, 
  Award, 
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Language, ProficiencyLevel, GameChallenge } from "../types";

interface ContextCluesProps {
  language: Language;
  level: ProficiencyLevel;
  onAddXP: (xp: number) => void;
  onCompleteChallenge: () => void;
}

export default function ContextClues({
  language,
  level,
  onAddXP,
  onCompleteChallenge
}: ContextCluesProps) {
  const [challenge, setChallenge] = useState<GameChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load first challenge
  useEffect(() => {
    fetchNewChallenge();
  }, [language, level]);

  const fetchNewChallenge = async () => {
    setIsLoading(true);
    setError(null);
    setChallenge(null);
    setSelectedOption(null);
    setIsSubmitted(false);

    try {
      const data = await generateContent({
        contents: [{ role: "user", parts: [{ text: `Generate a fill-in-the-blank language challenge for ${language} at the ${level} level.` }] }],
        config: {
          systemInstruction: `Create an interactive fill-in-the-blank grammar or vocabulary question for a ${level} level student of ${language}.Make it interesting and context-rich. Provide a sentence in ${language} with a blank placeholder '______' representing a missing word.Provide 4 options, with exactly one being the correct word that fits grammatically and semantically.Provide the 0-indexed position of the correct option.Provide the English translation of the completed sentence.Provide a clear explanation of why the correct option fits and why other options are incorrect.Return the result strictly as a JSON object.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              sentenceWithBlank: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              correctOptionIndex: { type: "INTEGER" },
              translation: { type: "STRING" },
              explanation: { type: "STRING" },
            },
            required: ["sentenceWithBlank", "options", "correctOptionIndex", "translation", "explanation"],
          },
        }
      });

      setChallenge(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to get a challenge from the server. Verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    setIsSubmitted(true);
    const isCorrect = selectedOption === challenge?.correctOptionIndex;

    if (isCorrect) {
      onAddXP(20); // Award XP for a correct answer!
      onCompleteChallenge(); // Increment stats
    }
  };

  return (
    <div className="p-6 h-full bg-slate-50/50 overflow-y-auto flex items-center justify-center">
      <div className="max-w-xl w-full bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm shadow-slate-100">
        {/* Game Badge Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <Gamepad2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Context Clues Game</h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">{language} • {level}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100/50">
            <Award className="w-3.5 h-3.5" /> +20 XP Bonus
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Loading puzzle animation */
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="py-12 text-center flex flex-col items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-slate-800">Forging Interactive Question</h3>
              <p className="text-xs text-slate-400 font-medium max-w-[200px] mt-1">
                Generating custom context clues and spelling matrices with the Gemini engine...
              </p>
            </motion.div>
          ) : error ? (
            /* Error display card */
            <motion.div
              key="error"
              className="bg-red-50 text-red-700 border border-red-100 rounded-2xl p-4 text-xs font-medium flex flex-col gap-3 items-center text-center"
            >
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="flex-1 font-semibold leading-normal">{error}</p>
              <button
                onClick={fetchNewChallenge}
                className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-4 py-2 rounded-xl transition-all border border-red-200 uppercase text-[10px] tracking-wider cursor-pointer"
              >
                Retry Connection
              </button>
            </motion.div>
          ) : challenge ? (
            /* Interactive Challenge screen */
            <motion.div
              key="challenge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Challenge question sentence block */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Fill in the missing word</span>
                <p className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-snug">
                  {challenge.sentenceWithBlank}
                </p>
              </div>

              {/* Options Grid selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {challenge.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === challenge.correctOptionIndex;
                  
                  let optionStyle = "border-slate-150 hover:bg-slate-50 hover:border-slate-200 text-slate-700";
                  let BadgeIcon = null;

                  if (isSelected && !isSubmitted) {
                    optionStyle = "border-orange-500 bg-orange-50 text-orange-800";
                  } else if (isSubmitted) {
                    if (isCorrectAnswer) {
                      optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                      BadgeIcon = <Check className="w-4 h-4 text-emerald-600 shrink-0" />;
                    } else if (isSelected) {
                      optionStyle = "border-red-500 bg-red-50 text-red-800";
                      BadgeIcon = <X className="w-4 h-4 text-red-600 shrink-0" />;
                    } else {
                      optionStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-bold flex items-center justify-between transition-all duration-200 ${optionStyle} ${!isSubmitted ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span className="truncate">{option}</span>
                      {BadgeIcon}
                    </button>
                  );
                })}
              </div>

              {/* Submit / Proceed action panel */}
              <div className="pt-2">
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-3.5 px-6 rounded-2xl transition-all border border-orange-600 disabled:border-slate-200 text-xs uppercase cursor-pointer"
                  >
                    Check My Answer
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Explanation details card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Translation & Syntactic Insight</span>
                      <p className="text-xs text-slate-700 font-bold leading-normal">
                        "{challenge.translation}"
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-1.5 border-t border-slate-100/60 mt-1.5">
                        {challenge.explanation}
                      </p>
                    </div>

                    {/* Progress with next question */}
                    <button
                      onClick={fetchNewChallenge}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-1.5 text-xs uppercase cursor-pointer"
                    >
                      Next Challenge <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
