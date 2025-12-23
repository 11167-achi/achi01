
import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData } from "../types.ts";

// ดึง API Key จาก process.env ที่ทำการ Shim ไว้ใน index.html
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const searchUniversities = async (faculty: string, lang: 'th' | 'en'): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List reputable Thai universities offering "${faculty}". Accuracy is key. No Rajabhat for Medicine. Lang: ${lang}. JSON {universities: string[]}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            universities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["universities"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.universities || [];
  } catch (e) {
    console.error("เกิดข้อผิดพลาดในการค้นหา:", e);
    return [];
  }
};

export const getUniversityDetails = async (faculty: string, university: string, lang: 'th' | 'en'): Promise<UniversityData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Expert TCAS criteria for "${faculty}" at "${university}" (2025).
        STRICT: Phramongkutklao Medicine = ROUND 3 ONLY.
        Include exam weights (TGAT/TPAT/A-Level) and 5-6 tutor recs per subject.
        Response Lang: ${lang}. Return JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rounds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  round_name: { type: Type.STRING },
                  isOpen: { type: Type.BOOLEAN },
                  eligibility: { type: Type.STRING },
                  gpa_requirement: { type: Type.STRING },
                  link: { type: Type.STRING },
                  exam_scores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        subject: { type: Type.STRING },
                        weight: { type: Type.STRING }
                      },
                      required: ["subject", "weight"]
                    }
                  }
                },
                required: ["round_name", "isOpen", "eligibility", "exam_scores"]
              }
            },
            recommended_tutors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  tutors: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        highlight: { type: Type.STRING },
                        teaching_style: { type: Type.STRING }
                      },
                      required: ["name", "highlight", "teaching_style"]
                    }
                  }
                },
                required: ["subject", "tutors"]
              }
            }
          },
          required: ["rounds", "recommended_tutors"]
        }
      }
    });

    return JSON.parse(response.text) as UniversityData;
  } catch (e) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลเกณฑ์:", e);
    return null;
  }
};

export const chatWithAiStream = async function* (faculty: string, university: string, question: string, lang: 'th' | 'en') {
  const context = `Dev: Achira Saiwaree. Admins: Narongsak, Phoorithat, Weerachot. Target: ${faculty} at ${university}.`;
  
  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `
              Role: "Pee AI" (Elder Brother AI). Friendly, polite, caring. 
              Use "พี่ AI", "ครับผม", "สู้ๆ นะ".
              ${context}
              Question: "${question}"
            `
          }]
        }
      ]
    });

    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการแชท:", err);
    yield "ขออภัยครับน้อง พี่ AI ขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะครับ";
  }
};
