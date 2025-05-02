# Euro Lottery - Frontend

This is the frontend application for the Euro Lottery project. It's built with React and Redux, providing a user interface for purchasing lottery tickets, checking results, and managing user accounts.

## Features

- User authentication (login, registration, password reset)
- Lottery game listings with details
- Ticket purchase interface
- Draw results and winning ticket checking
- User account management (profile, tickets, wallet)
- Responsive design for mobile and desktop

## Setup and Running

### Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables by creating a `.env` file:
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

3. Start the development server:
```bash
npm start
```

### Production Build

```bash
npm run build
```

The production build will be in the `build` directory, ready to be served by any static web server.

## Project Structure

- `/src/layouts` - Page layout components
- `/src/pages` - Page components organized by feature
- `/src/store` - Redux store configuration and slices
- `/src/components` - Reusable UI components (if any)

## Testing

```bash
npm test
```

## Deployment

For deployment instructions, see the main project README.md file.