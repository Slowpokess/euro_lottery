import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Отправляет запрос к Claude и возвращает ответ
 * @param {string} prompt - Ваш вопрос или задача
 * @param {string} systemPrompt - Инструкции для Claude
 * @returns {Promise<string>} - Ответ от Claude
 */
async function askClaude(prompt, systemPrompt = "") {
  try {
    const response = await client.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('Ошибка при запросе к Claude:', error);
    throw error;
  }
}

/**
 * Генерирует код по описанию
 * @param {string} description - Описание функциональности
 * @param {string} language - Язык программирования
 * @returns {Promise<string>} - Сгенерированный код
 */
async function generateCode(description, language = "javascript") {
  const systemPrompt = "Генерируй только код без пояснений. Код должен быть готов к использованию.";
  const prompt = `Создай код на ${language}, который: ${description}`;
  
  const code = await askClaude(prompt, systemPrompt);
  // Убираем маркеры форматирования кода, если они есть
  if (code.startsWith("```")) {
    const lines = code.split("\n");
    const cleanedCode = lines[0].includes(language) ? 
      lines.slice(1, -1).join("\n") : 
      lines.slice(1).join("\n").replace(/```$/, "");
    return cleanedCode;
  }
  
  return code;
}

export { askClaude, generateCode };