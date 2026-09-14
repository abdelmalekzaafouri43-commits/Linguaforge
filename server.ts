import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent for AI Studio telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to check for API Key
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY environment variable is not configured. Please add your Gemini API Key in Settings > Secrets.",
    });
  }
  next();
};

// Robust helper to generate content with exponential backoff and model fallback for 503 / high-demand scenarios
async function generateContentWithRetry(params: { contents: any; config: any }, retries = 4, initialDelay = 1000): Promise<any> {
  const modelsToTry = [
    "gemini-3.6-flash",       // Highly stable high-performance fallback
    "gemini-3.1-flash-lite",  // High-efficiency fallback
    "gemini-3.8-flash",       // Latest stable (swapped priority due to demand)
    "gemini-flash-latest"     // Generic alias
  ];

  let lastError: any = null;
  const failedModelsInThisRequest = new Set<string>();

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const modelName of modelsToTry) {
      if (failedModelsInThisRequest.has(modelName) && attempt > 1) continue;

      try {
        console.log(`[Gemini SDK] Requesting content with model ${modelName} (Attempt ${attempt}/${retries})`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName
        });
        
        if (!response || !response.text) {
          console.warn(`[Gemini SDK] Model ${modelName} returned an empty or invalid response.`);
          failedModelsInThisRequest.add(modelName);
          continue;
        }

        return response;
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || "";
        const status = error?.status || error?.code;
        
        console.warn(`[Gemini SDK] Model ${modelName} failed on attempt ${attempt} (Status: ${status}): ${errMsg}`);
        
        failedModelsInThisRequest.add(modelName);

        const isTransient = status === "RESOURCE_EXHAUSTED" || 
                            status === 429 || 
                            status === "UNAVAILABLE" || 
                            status === 503 ||
                            errMsg.includes("limit") || 
                            errMsg.includes("quota");

        if (!isTransient) {
          console.error(`[Gemini SDK] Non-transient error for ${modelName}.`);
        }
      }
    }

    if (attempt < retries) {
      let waitTime = initialDelay * Math.pow(2, attempt - 1);
      
      if (lastError?.details?.[0]?.retryDelay) {
        const suggestedWait = parseInt(lastError.details[0].retryDelay);
        if (!isNaN(suggestedWait)) {
          waitTime = Math.min(suggestedWait * 1000, 10000);
        }
      }

      console.log(`[Gemini SDK] All models failed or hit limits. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError || new Error("Failed to generate content after several retries and fallback models.");
}

// 1. AI Language Tutor Chat Endpoint
app.post("/api/tutor/chat", checkApiKey, async (req, res) => {
  try {
    const { language, level, messages } = req.body;

    if (!language || !level || !messages) {
      return res.status(400).json({ error: "Missing required parameters: language, level, messages" });
    }

    console.log(`[API] Chat request for ${language} (${level}) with ${messages.length} messages.`);

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));

    const response = await generateContentWithRetry({
      contents,
      config: {
        systemInstruction: `You are an encouraging and friendly native AI language tutor for ${language} at the ${level} proficiency level.
Your goal is to converse with the user naturally, while gently guiding them to learn.
Keep your response short (1-3 sentences) in the target language ${language}.
Analyze the user's last message for grammatical errors, spelling mistakes, or unnatural phrasing. Provide constructive corrections and explanations in English.
Provide 1-2 useful new words or idioms from your response or relevant to the current topic.

IMPORTANT: You must output your response in JSON format according to the following structure:
{
  "reply": "Your response in the target language (${language})",
  "translation": "The English translation of your reply",
  "corrections": [
    {
      "original": "The user's original phrase with errors",
      "corrected": "The corrected/improved version",
      "explanation": "Why this correction was made (brief)"
    }
  ],
  "vocabulary": [
    {
      "word": "New word/phrase",
      "type": "Part of speech (noun/verb/adj/etc)",
      "translation": "English translation",
      "example": "An example sentence in the target language (${language}) using this word"
    }
  ]
}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            translation: { type: Type.STRING },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  corrected: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["original", "corrected", "explanation"],
              },
            },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  type: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  example: { type: Type.STRING },
                },
                required: ["word", "type", "translation", "example"],
              },
            },
          },
          required: ["reply", "translation", "corrections", "vocabulary"],
        },
      },
    });

    const resultText = response.text;
    console.log(`[API] Received response from model: ${resultText.substring(0, 100)}...`);
    
    if (!resultText) {
      throw new Error("No response generated from the AI model.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in AI Tutor Chat API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 2. Vocabulary Forge Generator Endpoint
app.post("/api/forge/vocabulary", checkApiKey, async (req, res) => {
  try {
    const { language, level, topic } = req.body;

    if (!language || !level || !topic) {
      return res.status(400).json({ error: "Missing required parameters: language, level, topic" });
    }

    const response = await generateContentWithRetry({
      contents: `Generate a list of exactly 8 highly relevant vocabulary words or phrases in ${language} for a ${level} learner, on the topic: "${topic}".`,
      config: {
        systemInstruction: `Generate a list of exactly 8 highly relevant vocabulary words or phrases in ${language} for a ${level} learner, on the topic: "${topic}".
Include phonetic pronunciation/romanization/furigana (if helpful for the target language, e.g. for Japanese/Chinese/Arabic/Korean, or pronunciation guides for European languages), part of speech, English translation, and a contextual example sentence with its English translation.
Return the result strictly as a JSON array of objects.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              pronunciation: { type: Type.STRING, description: "Phonetic pronunciation, romanization, furigana or pronunciation guide" },
              partOfSpeech: { type: Type.STRING, description: "Part of speech (noun, verb, adjective, expression, etc.)" },
              translation: { type: Type.STRING, description: "English translation of the word" },
              exampleOriginal: { type: Type.STRING, description: "A simple context sentence in the target language" },
              exampleTranslation: { type: Type.STRING, description: "English translation of the context sentence" },
            },
            required: ["word", "pronunciation", "partOfSpeech", "translation", "exampleOriginal", "exampleTranslation"],
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from the AI model.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in Vocabulary Forge API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 3. Grammar Sandbox Assessment Endpoint
app.post("/api/sandbox/evaluate", checkApiKey, async (req, res) => {
  try {
    const { language, level, text } = req.body;

    if (!language || !level || !text) {
      return res.status(400).json({ error: "Missing required parameters: language, level, text" });
    }

    const response = await generateContentWithRetry({
      contents: `Evaluate the following text written by a ${level} level student in ${language}: "${text}"`,
      config: {
        systemInstruction: `Analyze and grade the following text written by a ${level} learner of ${language}.
Provide a score from 0 to 100 reflecting grammar, vocabulary choice, and spelling accuracy.
Provide friendly, comprehensive overall feedback in English.
Provide line-by-line grammatical, orthographical, or stylistic corrections.
Provide a polished, elegant, native-sounding "improved version" of the entire text.
Return the result strictly as a JSON object.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING, description: "The original phrase or sentence containing errors" },
                  corrected: { type: Type.STRING, description: "The corrected or improved version" },
                  explanation: { type: Type.STRING, description: "Explanation of the rule or why this sounds more natural" },
                },
                required: ["original", "corrected", "explanation"],
              },
            },
            improvedVersion: { type: Type.STRING, description: "The complete polished text" },
          },
          required: ["score", "feedback", "corrections", "improvedVersion"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from the AI model.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in Grammar Sandbox API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 4. Interactive Context Clues Game Challenge Endpoint
app.post("/api/game/challenge", checkApiKey, async (req, res) => {
  try {
    const { language, level } = req.body;

    if (!language || !level) {
      return res.status(400).json({ error: "Missing required parameters: language, level" });
    }

    const response = await generateContentWithRetry({
      contents: `Generate a fill-in-the-blank language challenge for ${language} at the ${level} level.`,
      config: {
        systemInstruction: `Create an interactive fill-in-the-blank grammar or vocabulary question for a ${level} level student of ${language}.
Make it interesting and context-rich. Provide a sentence in ${language} with a blank placeholder '______' representing a missing word.
Provide 4 options, with exactly one being the correct word that fits grammatically and semantically.
Provide the 0-indexed position of the correct option.
Provide the English translation of the completed sentence.
Provide a clear explanation of why the correct option fits and why other options are incorrect.
Return the result strictly as a JSON object.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentenceWithBlank: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctOptionIndex: { type: Type.INTEGER },
            translation: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["sentenceWithBlank", "options", "correctOptionIndex", "translation", "explanation"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from the AI model.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in Game Challenge API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 5. Worksheet Generator Endpoint
app.post("/api/generate-worksheet", checkApiKey, async (req, res) => {
  try {
    const { language, level, topic } = req.body;

    if (!language || !level || !topic) {
      return res.status(400).json({ error: "Missing required parameters: language, level, topic" });
    }

    const response = await generateContentWithRetry({
      contents: [{ role: "user", parts: [{ text: `Generate a high-quality language learning worksheet for ${language} at the ${level} level. The topic is ${topic}.` }] }],
      config: {
        systemInstruction: `You are an expert language teacher specializing in ${language} at the ${level} level.
Generate a comprehensive, visually structured worksheet.
The worksheet must include exactly these sections:
1. "Lesson Objectives": 3-5 clear learning goals (e.g., "talk about...", "describe...").
2. "Key Vocabulary": 6-8 essential words/phrases related to the topic, with English translations.
3. "Grammar Spotlight": A concise explanation of a relevant grammar point (e.g., a verb conjugation or sentence structure rule).
4. "Practical Examples": 4-5 natural sentences using the new vocabulary and grammar.
5. "Challenge Questions": 5 interactive exercises (Fill-in-the-blank, multiple choice, or translation).

Output strictly valid JSON structure mirroring the 'Worksheet' interface.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title like 'Meet My Friends' or 'At the Restaurant'" },
            topic: { type: Type.STRING, description: "The category/unit theme" },
            readingPassage: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "List of lesson objectives as a single formatted string or short paragraph" },
                translation: { type: Type.STRING, description: "English translation if needed" }
              },
              required: ["text", "translation"]
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "e.g., 'Vocabulary: Describing People', 'Grammar: The Verb To Be'" },
                  instructions: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "vocabulary, grammar, example, or challenge" },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        hint: { type: Type.STRING }
                      },
                      required: ["type", "question", "answer"]
                    }
                  }
                },
                required: ["title", "instructions", "exercises"]
              }
            },
            answerKey: { type: Type.STRING }
          },
          required: ["title", "topic", "readingPassage", "sections", "answerKey"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from the AI model.");
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("[Gemini API Error]:", error);
    res.status(500).json({ error: "Failed to generate worksheet. Please try again." });
  }
});

// Setup Vite Dev server or Serve static files in Production
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  // If dist/index.html does not exist, or we are explicitly not in production, use Vite middleware
  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log("[Server] Launching in live Development/Preview mode with Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Launching in Production mode serving built assets from /dist.");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
