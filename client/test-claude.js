import { askClaude, generateCode } from './utils/claude-helper.js';

// Для Node.js, убедитесь, что у вас есть "type": "module" в package.json
// или используйте CommonJS синтаксис с require()

async function testClaude() {
  try {
    // Спросить совет по коду
    const question = "Почему при запуске сервера и фронтенда при входе в админпанел с функцией настройки взаимодействия с контентом и динамическими элементами подразделов сайта при добавлении или исключении элементов видно действие в админ панели но без должного отображения на фронтенде? Как это исправить?";
    const answer = await askClaude(question);
    console.log("Ответ Claude:");
    console.log(answer);
    console.log("\n" + "-".repeat(50) + "\n");

    // Генерация кода для решения задачи
    const description = "Генерация и форматирование исходного проекта на react , внесение правок необходимых для выполнения задачи";
    const code = await generateCode(description, "javascript");
    console.log("Сгенерированный код:");
    console.log(code);
  } catch (error) {
    console.error("Произошла ошибка:", error);
  }
}

testClaude();