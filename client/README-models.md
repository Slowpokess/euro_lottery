# Модели данных для проекта

## Новые модели данных

### Модель Resident (Резидент)

Модель описывает постоянных резидентов пространства COLLIDER.

**Поля:**
- `name` (String): Название резидента
- `category` (String): Категория резидента (sound, light, visual, music, design, tech)
- `type` (String): Тип резидента (Звуковая студия, Художники по свету и т.д.)
- `image` (String): URL изображения резидента
- `description` (String): Описание резидента
- `contacts`: Объект контактной информации
  - `website` (String): Веб-сайт
  - `instagram` (String): Instagram
  - `email` (String): Email
- `status` (String): Статус резидента (active, inactive, pending)
- `featured` (Boolean): Выделенный резидент
- `createdAt` (Date): Дата создания записи
- `updatedAt` (Date): Дата обновления записи

**API Endpoints:**
- `GET /api/residents` - Получить все резиденты
- `GET /api/residents/:id` - Получить резидента по ID
- `POST /api/residents` - Создать нового резидента (admin)
- `PUT /api/residents/:id` - Обновить резидента (admin)
- `DELETE /api/residents/:id` - Удалить резидента (admin)
- `PUT /api/residents/:id/photo` - Загрузить фото резидента (admin)

### Модель Space (Пространство)

Модель описывает различные пространства, доступные для аренды или использования в COLLIDER.

**Поля:**
- `id` (String): Уникальный идентификатор пространства
- `name` (String): Название пространства
- `capacity` (String): Вместимость пространства
- `size` (String): Размер пространства
- `description` (String): Описание пространства
- `features` (Array): Массив особенностей и оборудования
- `images` (Array): Массив изображений пространства
- `pricing`: Объект с информацией о стоимости
  - `amount` (Number): Сумма
  - `period` (String): Период (hour, day, event)
  - `details` (Array): Детали того, что включено в аренду
- `status` (String): Статус пространства (available, unavailable, maintenance)
- `featured` (Boolean): Выделенное пространство
- `createdAt` (Date): Дата создания записи
- `updatedAt` (Date): Дата обновления записи

**API Endpoints:**
- `GET /api/spaces` - Получить все пространства
- `GET /api/spaces/:id` - Получить пространство по ID
- `GET /api/spaces/custom/:customId` - Получить пространство по пользовательскому ID
- `POST /api/spaces` - Создать новое пространство (admin)
- `PUT /api/spaces/:id` - Обновить пространство (admin)
- `DELETE /api/spaces/:id` - Удалить пространство (admin)
- `PUT /api/spaces/:id/image` - Загрузить изображение пространства (admin)

## Интеграция с фронтендом

1. **Контексты**
   - `ResidentsContext` - Контекст для управления данными о резидентах
   - `SpacesContext` - Контекст для управления данными о пространствах

2. **Сервисы API**
   - `residents.js` - Сервис для работы с API резидентов
   - `spaces.js` - Сервис для работы с API пространств

3. **Компоненты**
   - Обновлен компонент страницы `Residents.jsx`
   - Обновлен компонент страницы `Spaces.jsx`

## Инициализация данных

Созданы скрипты для заполнения базы данных начальными данными:

```bash
# Заполнить базу данных резидентов
npm run seed:residents

# Заполнить базу данных пространств
npm run seed:spaces

# Заполнить обе базы данных
npm run seed
```

Эти скрипты находятся в директории `server/utils/` и могут быть запущены из директории сервера.