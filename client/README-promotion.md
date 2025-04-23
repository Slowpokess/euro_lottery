# Реализация модели Promotion

В данном проекте была реализована полная модель "Promotion" для сайта COLLIDER, включающая в себя:

## Серверная часть

### Модели данных
1. **Promotion** - модель для услуг промоушена
   - Поля: title, description, image, category, features, pricing, status, featured, order
   - Поддерживает различные категории услуг: organization, promotion, technical, production, consulting, other

2. **PromotionContact** - модель для заявок на услуги промоушена
   - Поля: name, email, phone, company, eventType, message, budget, eventDate, attendees, servicesNeeded, status, notes
   - Отслеживание статуса заявки: new, contacted, in-progress, completed, cancelled

### API Endpoints
- **GET /api/promotions** - получение списка услуг промоушена
- **GET /api/promotions/:id** - получение информации о конкретной услуге
- **POST /api/promotions** - создание новой услуги (admin)
- **PUT /api/promotions/:id** - обновление услуги (admin)
- **DELETE /api/promotions/:id** - удаление услуги (admin)
- **PUT /api/promotions/:id/photo** - загрузка фото для услуги (admin)

- **GET /api/promotion-contacts** - получение списка заявок (admin)
- **GET /api/promotion-contacts/:id** - получение информации о конкретной заявке (admin)
- **POST /api/promotion-contacts** - создание новой заявки (public)
- **PUT /api/promotion-contacts/:id** - обновление статуса заявки (admin)
- **DELETE /api/promotion-contacts/:id** - удаление заявки (admin)

## Клиентская часть

### Контексты и сервисы
1. **PromotionsContext** - контекст для управления состоянием услуг промоушена
   - Действия: fetchPromotions, fetchPromotionById, addPromotion, editPromotion, removePromotion
   - Состояния: promotions, currentPromotion, loading, error

2. **PromotionContactsContext** - контекст для управления состоянием заявок
   - Действия: fetchContacts, fetchContactById, submitContact, updateContact, removeContact
   - Состояния: contacts, currentContact, loading, error, success

### Страницы и компоненты
1. **Пользовательские страницы**
   - Обновлена страница **Promotion.jsx** для отображения услуг с сервера
   - Добавлена форма для отправки заявок на услуги промоушена
   - Реализовано уведомление пользователя об успешной отправке заявки

2. **Админ-панель**
   - Создан раздел **Admin/Promotion** с табами для управления услугами и заявками
   - Компонент **PromotionForm.jsx** для создания и редактирования услуг
   - Компонент **PromotionContactDetail.jsx** для просмотра и обновления статуса заявок
   - Добавлена возможность изменения порядка отображения услуг
   - Добавлена возможность написания заметок по заявкам

### Интеграция
- Добавлен пункт "Промоушн" в меню админ-панели
- Добавлена кнопка быстрого доступа на дашборде
- Интеграция с системой уведомлений для отображения результатов действий

## Инициализация данных
В проекте добавлен сид-скрипт для заполнения базы данных начальными услугами промоушена:

```bash
# Заполнить базу данных услугами промоушена
npm run seed:promotions
```

## Стилизация
Добавлены стили для:
- Отображения услуг на публичной странице
- Формы контакта с полями для различных типов данных
- Админ-панели с табличным отображением данных
- Детального просмотра заявок с информацией о клиенте
- Адаптивной верстки для мобильных устройств

## Дополнительные возможности
- Фильтрация услуг по категориям
- Сортировка услуг по порядку отображения
- Выделение рекомендуемых услуг
- Выбор бюджета и необходимых услуг в форме
- Система отслеживания статуса заявок