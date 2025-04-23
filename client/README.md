# COLLIDER - Techno Club Website

A modern web application for a techno club, featuring event management, equipment rentals, resident artists, spaces, and more.

## Features

- Responsive design for all device sizes
- Multilingual support (EN, RU, UA)
- Admin dashboard for content management
- Event management with calendar and details
- Equipment rental system
- Resident artists profiles
- Venue spaces overview
- Promotion services
- Contact and inquiry forms
- Error boundary for graceful error handling

## Tech Stack

- **Frontend**:
  - React 18
  - React Router 6
  - Context API for state management
  - i18next for internationalization
  - CSS modules for styling

- **Backend**:
  - Node.js with Express
  - MongoDB with Mongoose
  - JWT authentication
  - File uploads with Multer
  - Error handling middleware

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm или yarn
- MongoDB (local или MongoDB Atlas - не обязательно для разработки)

### Установка

1. Установка зависимостей для клиента и сервера:
   ```
   # Установка зависимостей клиента
   npm install --legacy-peer-deps
   
   # Установка зависимостей сервера
   cd server
   npm install
   cd ..
   ```

2. Настройка переменных окружения:
   - Файл `.env` уже создан в корневой директории клиента
   - Файл `.env` уже создан в директории сервера

3. Запуск для разработки:
   ```
   # Запустить и клиент, и сервер одновременно
   npm run dev
   
   # Или запустить их по отдельности:
   # Сервер API
   npm run dev:server
   
   # Клиент React
   npm run dev:client
   ```
   
### Доступ к административной панели

После запуска сервера будет автоматически создан администраторский аккаунт, если он еще не существует:

- URL: http://localhost:3000/admin/login
- Логин: admin
- Пароль: admin123

**ВАЖНО:** В продакшн-версии рекомендуется сразу сменить пароль администратора.

### Docker Deployment

The project includes Docker configuration for easy deployment:

1. Make sure Docker and Docker Compose are installed
2. Place SSL certificates in the `ssl` directory
3. Run the following command from the project root:
   ```
   docker-compose up -d
   ```

This will build and start both frontend and backend containers.

## Available Scripts

In the project directory, you can run:

### Frontend

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `docker-compose up -d` - Starts the containerized application

### Backend

- `npm start` - Starts the server
- `npm run dev` - Starts the server with nodemon for development
- `npm test` - Runs unit tests
- `npm run test:api` - Runs API integration tests
- `npm run test:all` - Runs all tests
- `npm run seed` - Seeds the database with initial data

## Testing

The project includes both unit and integration tests:

### Frontend Tests
- Component tests with React Testing Library

### Backend Tests
- Unit tests for utilities and models
- API integration tests for endpoints
- HTTP request examples in `.http` files for manual testing

To run all tests:
```
# In client directory
npm test

# In server directory
npm run test:all
```

## Error Handling

The application uses ErrorBoundary to catch and display React errors. This prevents the entire application from breaking when an error occurs in individual components.

```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Project Structure

- `client/` - React frontend
  - `public/` - Static assets
  - `src/` - Source code
    - `components/` - Reusable UI components
    - `contexts/` - React Context providers
    - `pages/` - Page components
    - `services/` - API services
    - `styles/` - Global CSS
    - `utils/` - Utility functions

- `server/` - Express backend
  - `config/` - Configuration files
  - `controllers/` - Request handlers
  - `middleware/` - Express middleware
  - `models/` - Mongoose models
  - `routes/` - API routes
  - `test/` - Test files
  - `utils/` - Utility functions

## Security Considerations

- HTTPS enforcement in production
- JWT tokens for authentication
- Content Security Policy implementation
- Rate limiting for API requests
- MongoDB sanitization to prevent injection
- XSS protection measures