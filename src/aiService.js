import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = "AIzaSyDyhP1AAvzJP_k8VUyiiUyluw-w5Y0i0vU";

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