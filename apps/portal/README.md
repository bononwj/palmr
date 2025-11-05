# Palmr Portal

Static web portal for Palmr file management system.

## Tech Stack

- **Build Tool**: Vite
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **UI Library**: Ant Design
- **State Management**: Jotai
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Internationalization**: react-i18next
- **Styling**: Tailwind CSS + Ant Design

## Features

- User authentication (password + OIDC)
- File management (upload, download, organize)
- File sharing with password protection
- Dashboard with storage usage
- Multi-language support

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3333
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable components
├── pages/         # Page components
├── router/        # Route configuration
├── stores/        # Jotai atoms
├── hooks/         # Custom hooks
├── utils/         # Utility functions
├── locales/       # i18n translations
└── types/         # TypeScript types
```

