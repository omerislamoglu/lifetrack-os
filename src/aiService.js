import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyDyhP1AAvzJP_k8VUyiiUyluw-w5Y0i0vU";

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateDailyAdvice = async (mood, todos) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Sen LifeTrack OS'in zeki yaşam koçusun. Kullanıcının moduna ve görevlerine bakarak ona Türkçe, kısa, samimi ve motive edici bir günlük tavsiye ver.",
    });

    const todoListText = todos && todos.length > 0 
      ? todos.map(t => `- ${t.text} (${t.completed ? 'Tamamlandı' : 'Bekliyor'})`).join('\n') 
      : 'Bugün için eklenmiş bir görev yok.';

    const prompt = `Bugünkü Ruh Halim: ${mood || 'Belirtilmedi'}\n\nBugünkü Görevlerim:\n${todoListText}\n\nLütfen bana bugüne özel bir tavsiye ver.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Tavsiyesi oluşturulurken hata:", error);
    return "Şu an AI mentora bağlanamıyorum, ama hedeflerine odaklanarak harika bir gün geçirebilirsin! 🚀";
  }
};

/**
 * Creates a persistent Gemini chat session for the AI Mentor panel.
 * Returns an object with a sendMessageStream() method.
 *
 * @param {object} opts
 * @param {string} opts.userName  - Display name of the user
 * @param {string} opts.language  - 'tr' or 'en'
 * @param {object} opts.weekSummary - { totalStudy, totalCode, totalSport, trend }
 */
export const createMentorChat = ({ userName = 'Kullanıcı', language = 'tr', weekSummary = {} }) => {
  const { totalStudy = 0, totalCode = 0, totalSport = 0, trend = 'stable' } = weekSummary;

  const systemPromptTR = `Sen LifeTrack Guide'sın — LifeTrack OS'in yapay zeka mentoru ve kişisel koçu.
Kullanıcının adı: ${userName}.
Bu haftanın özeti: Kodlama ${totalCode} satır, Ders ${totalStudy} saat, Spor ${totalSport} dakika. Trend: ${trend}.
Tonun motive edici, samimi ve çözüm odaklı olmalı. React, Next.js, OOP ve yazılım mimarisi konularında uzmansın.
Cevapların kısa ve öz olsun. Gerektiğinde Markdown kullan (başlık, liste, kod bloğu). Kullanıcıya ismiyle hitap et.`;

  const systemPromptEN = `You are LifeTrack Guide — the AI mentor and personal coach of LifeTrack OS.
User's name: ${userName}.
This week's summary: Coding ${totalCode} lines, Study ${totalStudy} hours, Sport ${totalSport} mins. Trend: ${trend}.
Be motivating, concise, and solution-focused. You are an expert in React, Next.js, OOP, and software architecture.
Keep answers short and precise. Use Markdown when needed (headings, lists, code blocks). Address the user by name.`;

  const systemPrompt = language === 'tr' ? systemPromptTR : systemPromptEN;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
  });

  // Inject persona as the first model history turn
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: language === 'tr' ? 'Merhaba, kimsin?' : 'Hello, who are you?' }],
      },
      {
        role: 'model',
        parts: [{ text: systemPrompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });

  /**
   * Send a message and stream back the response.
   * @param {string} message
   * @param {function} onChunk - called with each text chunk as it arrives
   * @returns {Promise<string>} full response text
   */
  const sendMessageStream = async (message, onChunk) => {
    const result = await chat.sendMessageStream(message);
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onChunk) onChunk(chunkText);
    }
    return fullText;
  };

  return { sendMessageStream };
};