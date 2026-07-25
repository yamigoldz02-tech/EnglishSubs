const fs = require('fs');

const dict = {
  // Modals & UI
  "Словарь": "Dictionary",
  "Правила": "Rules",
  "Тренировка": "Training",
  "Заметки": "Notes",
  "Облако": "Cloud Sync",
  "Справочник правил": "Grammar Rules",
  "Интерактивный видеокурс English Galaxy": "Interactive English Galaxy Course",
  "Мои заметки": "My Notes",
  "Принудительная синхронизация с облаком": "Force cloud sync",
  "Мой словарь": "My Dictionary",
  "Настройки приложения": "App Settings",
  
  // Folders and Dictionaries
  "Все папки": "All Folders",
  "Новые слова": "New Words",
  "Повторение": "Review",
  "Изученные": "Learned",
  "Скрыто": "Hidden",
  "Управление папками": "Manage Folders",
  
  // Dashboard & Navigation
  "Моя активность": "My Activity",
  "Достижения": "Achievements",
  "Поиск песни или артиста": "Search song or artist",
  "Очистить поиск": "Clear search",
  
  // Modals Generic
  "Отмена": "Cancel",
  "Сохранить": "Save",
  "Удалить": "Delete",
  "Да": "Yes",
  "Нет": "No",
  "Закрыть": "Close",
  "Редактировать": "Edit",
  "Назад": "Back",
  
  // Dictionary / Flashcards
  "Снова": "Again",
  "Трудно": "Hard",
  "Хорошо": "Good",
  "Легко": "Easy",
  "Карточки": "Flashcards",
  "Перевод на русский": "Translation",
  "Слово на английском": "English Word",
  "Добавить фразу вручную": "Add phrase manually",
  "Добавить слово вручную": "Add word manually",
  
  // Messages and Toasts
  "Успешно": "Success",
  "Добавлено": "Added",
  "Сохранено": "Saved",
  "Внимание": "Warning",
  "Ошибка": "Error"
};

const files = [
  'index.html',
  'app.js',
  'modules/dictionary-trainer.js',
  'modules/grammar-rules.js',
  'modules/notebook-module.js',
  'modules/galaxy-course.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [ru, en] of Object.entries(dict)) {
      // Standard string replacement for UI text (not inside variables/logic usually)
      content = content.split(ru).join(en);
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Translated: ' + file);
  }
}
