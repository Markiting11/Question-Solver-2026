
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SolutionResponse, BilingualText, Language } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key || key === 'undefined' || key === 'your_gemini_api_key_here') {
    return null;
  }
  return key;
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Reusable schema part for bilingual text
const bilingualStringSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    en: { type: Type.STRING, description: "Content in English" },
    ur: { type: Type.STRING, description: "Content in Urdu (Nastaliq style phrasing)" }
  },
  required: ["en", "ur"]
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    simple: {
      ...bilingualStringSchema,
      description: "A simple, easy-to-understand explanation (3-4 lines).",
    },
    stepByStep: {
      ...bilingualStringSchema,
      description: "A detailed step-by-step breakdown using Markdown formatting.",
    },
    visual: {
      ...bilingualStringSchema,
      description: "Mermaid.js diagram syntax. 'en' uses English labels, 'ur' uses Urdu labels. IMPORTANT: Enclose ALL node labels in double quotes.",
    },
    short: {
      ...bilingualStringSchema,
      description: "A very short 1-2 line summary.",
    },
    detailed: {
      ...bilingualStringSchema,
      description: "A comprehensive explanation with concepts, reasoning, and context using Markdown.",
    },
    handwrittenNotes: {
      ...bilingualStringSchema,
      description: "A professional Student Notebook layout. Must use **bold** for headers/actions to trigger Red ink, and normal text for Blue ink.",
    },
    easyNotes: {
      ...bilingualStringSchema,
      description: "A VERY simple, simplified version of the notes for a young child (kid-friendly). Use extremely simple language, bullet points, and short sentences. Avoid complex jargon.",
    },
    subject: {
      ...bilingualStringSchema,
      description: "The detected subject of the question (e.g., Physics / طبیعیات).",
    },
  },
  required: ["simple", "stepByStep", "visual", "short", "detailed", "handwrittenNotes", "easyNotes", "subject"],
};

export const solveQuestion = async (
  text: string,
  imageFile: File | null,
  audioBlob: Blob | null,
  language: Language // Kept for API signature consistency, but we fetch both now
): Promise<SolutionResponse> => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
  }

  const parts: any[] = [];

  const prompt = `
    You are an expert tutor. Analyze the question and provide a comprehensive answer in the requested JSON format.
    
    CRITICAL INSTRUCTION: You must provide **BOTH** English and Urdu versions for every single field in the response.
    
    For the 'Urdu' (ur) fields:
    - Write in proper Urdu script.
    - Maintain the same detailed Markdown formatting as the English version.
    - For 'visual' (Mermaid), translate the node labels to Urdu but keep IDs in ASCII.

    **GLOBAL MATH FORMATTING RULES (Apply to ALL sections, especially Notes):**
    1. **Powers/Exponents**: ALWAYS use Unicode superscripts.
       - CORRECT: x², y³, 10⁻⁵, (a+b)²
       - WRONG: x^2, y^3, 10^-5
    2. **Multiplication**: ALWAYS use the '×' symbol.
       - CORRECT: 2 × 3, a × b
       - WRONG: 2 * 3, a * b, 2x3 (if it looks like variable x)

    For 'handwrittenNotes' (Study Notes - Student Notebook Style):
    - Mimic a formal handwritten solution in a student's notebook.
    - **LAYOUT RULES**:
      - **Write EVERY single step on a NEW LINE.**
      - **Use a bulleted list** for the steps to ensure clear separation.
      - **DO NOT put multiple steps on the same line.**
      - **Maximize vertical space** to make the notes look long and detailed.
    - **Formatting**: 
      - **Bold** for Headings/Steps (renders RED).
      - Normal text for Equations/Work (renders BLUE).
    - Example:
      - **Q1:** Solve x² - 4 = 0
      - **Factor:** (x - 2)(x + 2) = 0
      - **Answer:** x = 2, -2

    For 'easyNotes' (Easy Notes - Child Friendly):
    - Create a SEPARATE, very simplified version for a child (approx 10 years old).
    - Use "Original Handwriting" style language (casual, direct).
    - **NO EMOJIS.** Keep it clean.
    - Follow the Global Math Rules (Unicode powers & '×' symbol) strictly.
    - Layout: Simple bullet points or short paragraphs.

    For the 'visual' field (Mermaid.js):
    1. Create a valid Mermaid.js diagram (flowchart or sequence).
    2. CRITICAL: Enclose all node labels in double quotes. Example: id["Label"] is correct.
    3. Do not include markdown code fences.

    Question: ${text}
  `;
  
  parts.push({ text: prompt });

  if (imageFile) {
    const base64Image = await fileToBase64(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: base64Image,
      },
    });
  }

  if (audioBlob) {
    const base64Audio = await blobToBase64(audioBlob);
    parts.push({
      inlineData: {
        mimeType: "audio/mp3",
        data: base64Audio,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: `You are a helpful academic tutor. You always provide answers in both English and Urdu.`,
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from AI");

    return JSON.parse(responseText) as SolutionResponse;
  } catch (error) {
    console.error("Error solving question:", error);
    throw error;
  }
};

// Helper functions
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
