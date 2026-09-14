export async function generateContent(payload: any) {
  const apiKey = localStorage.getItem("linguaforge_api_key");
  if (!apiKey) {
    throw new Error("API Key is missing. Please set your Gemini API Key in the Settings panel.");
  }
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: payload.contents,
      systemInstruction: payload.config?.systemInstruction ? { parts: [{ text: payload.config.systemInstruction }] } : undefined,
      generationConfig: {
        responseMimeType: payload.config?.responseMimeType,
        responseSchema: payload.config?.responseSchema
      }
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to generate content");
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response generated from the AI model.");
  }
  
  // Try parsing to JSON if schema is provided
  if (payload.config?.responseMimeType === "application/json") {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error("Failed to parse JSON response from the AI model.");
    }
  }
  
  return { text };
}
