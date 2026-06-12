import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Assistant Endpoint: "The Teacher"
app.post("/api/gemini/assistant", async (req, res) => {
  const { message, chatHistory } = req.body;
  
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "أنت المساعد الذكي 'الأستاذ' لتلاميذ البكالوريا شعبة الآداب والفلسفة في الجزائر (دورة 2027). " +
          "تكلم بمزيج بين اللغة العربية الفصحى واللهجة الجزائرية (الدارجة) لتكون قريباً من التلميذ. " +
          "مهمتك هي شرح الدروس، حل التمارين، تبسيط المقالات الفلسفية، والتحفيز اليومي. " +
          "كن دائماً مشجعاً ولطيفاً وتأكد من تقديم معلومات دقيقة وفق المنهاج الوزاري الجزائري.",
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Essay Correction Endpoint
app.post("/api/gemini/essay-check", async (req, res) => {
  const { essay, essayType } = req.body;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use flash preview for fast analysis
      contents: `حلل هذه المقالة الفلسفية المنتمية لنوع (${essayType}) وقيمها كأستاذ مصحح في البكالوريا الجزائرية. 
      اذكر نقاط القوة ونقاط الضعف (المنهجية، اللغة، الحجج) وقدم اقتراحات للتحسين. 
      المقالة:
      ${essay}`,
      config: {
        systemInstruction: "أنت أستاذ خبير في مادة الفلسفة للبكالوريا الجزائرية. " +
          "تقوم بتصحيح المقالات وفق معايير المفتشية العامة للبيداغوجيا.",
      }
    });
    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini Essay Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Exercise Solver Endpoint (Multimodal)
app.post("/api/gemini/solve-exercise", async (req, res) => {
  const { image, prompt } = req.body;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use flash preview for image analysis
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: image, // base64 string
          },
        },
        {
          text: prompt || "قم بحل التمارين الموجودة في هذه الصورة حلاً مفصلاً ودقيقاً، مع اتباع المنهجية المعتمدة في البكالوريا الجزائرية.",
        }
      ],
      config: {
        systemInstruction: "أنت أستاذ خبير متخصص في المنهاج التربوي الجزائري الرسمي لشهادة البكالوريا. " +
          "مهمتك هي تحليل صور التمارين (رياضيات، فلسفة، لغات، إلخ) وتقديم حلول نموذجية. " +
          "يجب أن يتضمن الحل: " +
          "1. تحليل السؤال وتحديد المطلوب بدقة. " +
          "2. الخطوات التفصيلية للحل مع ذكر القوانين والقواعد المستخدمة. " +
          "3. النتيجة النهائية بشكل واضح. " +
          "4. نصيحة أخيرة للطالب لتجنب الأخطاء الشائعة في هذا النوع من التمارين. " +
          "استخدم لغة عربية فصحى، ونظم الإجابة باستخدام عناوين واضحة وجداول إذا لزم الأمر.",
      }
    });
    res.json({ solution: response.text });
  } catch (error: any) {
    console.error("Gemini Solver Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Explaining a Mind-Map Subtopic
app.post("/api/gemini/explain-subtopic", async (req, res) => {
  const { topic, subtopic, subjectName, lessonTitle } = req.body;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `اشرح باختصار وبطريقة سهلة ومبسطة جداً ومناسبة لتلاميذ البكالوريا في الجزائر، هذا العنصر الفرعي في الدرس:
      الدرس: ${lessonTitle || ''}
      الموضوع الأساسي للخرائط الذهنية: ${topic}
      العنصر الفرعي المراد شرحه: ${subtopic}
      المادة الدراسية: ${subjectName || ''}

      أعطِ الشرح في فقرة واحدة قصيرة ومباشرة (3-4 أسطر كحد أقصى) مع ذكر مثال فلسفي أو تاريخي أو واقعي بسيط جداً إذا كان ملائماً. لا تذكر عبارات ترحيبية أو تمهيد، بل ادخل في صلب المعنى بشكل مباشر جداً.`,
      config: {
        systemInstruction: "أنت أستاذ ومصمم خرائط ذهنية متميز للبكالوريا الجزائرية، تبسط المفاهيم الفرعية بذكاء ووضوح شديد لتسهيل الحفظ السريع.",
      }
    });
    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Gemini Subtopic Explainer Error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
