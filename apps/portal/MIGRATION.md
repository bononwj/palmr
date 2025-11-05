# Migration from Next.js to Vite + React

This document describes the migration from the Next.js-based `apps/web` to the Vite-based `apps/portal`.

## Changes Made

### 1. Build Tool & Framework
- **From**: Next.js 15 (SSR/SSG framework)
- **To**: Vite 5 (Static site builder)
- **Benefit**: Faster build times, simpler deployment, pure client-side rendering

### 2. Routing
- **From**: Next.js App Router (file-based routing)
- **To**: React Router v6 (programmatic routing)
- **Migration**: All routes configured in `src/router/index.tsx`

### 3. UI Library
- **From**: Radix UI components
- **To**: Ant Design 5
- **Benefit**: Complete UI component library with built-in theming

### 4. State Management
- **From**: Zustand + React Context
- **To**: Jotai (atomic state management)
- **Files**: `src/stores/auth.ts`, `src/stores/app-info.ts`, `src/stores/share.ts`, `src/stores/theme.ts`

### 5. Data Fetching
- **From**: Direct axios calls with manual state management
- **To**: TanStack Query (React Query)
- **Benefit**: Automatic caching, refetching, and error handling

### 6. Internationalization
- **From**: next-intl
- **To**: react-i18next
- **Files**: `src/i18n/config.ts`, `src/i18n/locales/*.json`

### 7. API Architecture
- **From**: Next.js API routes acting as proxy (`/api/(proxy)/*`)
- **To**: Direct API calls to backend
- **Benefit**: Simpler architecture, no proxy needed
- **Configuration**: Set `VITE_API_BASE_URL` environment variable

### 8. Theme Management
- **From**: next-themes
- **To**: Ant Design ConfigProvider + Jotai
- **Files**: `src/providers/ThemeProvider.tsx`, `src/stores/theme.ts`

## Removed Features

### Reverse Shares (接受文件功能)
- All `reverse-shares` related code has been removed
- Routes: `/r/:alias`, `/reverse-shares/*`
- API endpoints: All reverse-share endpoints
- Reason: Per requirements, file receiving functionality is not needed

## Key Files

### Configuration
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.env` - Environment variables

### Core Application
- `src/main.tsx` - Application entry point
- `src/router/index.tsx` - Route configuration
- `src/App.tsx` - Main app component (removed, using direct router)

### API Layer
- `src/api/client.ts` - Axios instance configuration
- `src/api/endpoints/` - API endpoint definitions
  - `auth.ts` - Authentication endpoints
  - `files.ts` - File management endpoints
  - `folders.ts` - Folder management endpoints
  - `shares.ts` - Share management endpoints
  - `app.ts` - App info and config endpoints

### State Management
- `src/stores/` - Jotai atoms
  - `auth.ts` - Authentication state
  - `app-info.ts` - Application info
  - `share.ts` - Share state
  - `theme.ts` - Theme state

### Pages
- `src/pages/Login.tsx` - Login page
- `src/pages/Dashboard.tsx` - Dashboard
- `src/pages/Files.tsx` - File management
- `src/pages/Shares.tsx` - Share management
- `src/pages/PublicShare.tsx` - Public share view
- `src/pages/AuthCallback.tsx` - OIDC callback
- `src/pages/NotFound.tsx` - 404 page

### Components
- `src/components/Layout/MainLayout.tsx` - Main app layout
- `src/components/FileIcon.tsx` - File type icons
- `src/components/EmptyState.tsx` - Empty state component

## Environment Variables

Required environment variables:

```env
VITE_API_BASE_URL=http://localhost:3333  # Backend API URL
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (port 3001)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Deployment

### Static Build
```bash
pnpm build
```

The build output will be in the `dist/` directory. This can be served by any static file server (Nginx, Apache, CDN, etc.).

### Configuration
- Update `VITE_API_BASE_URL` to point to your production API
- Ensure CORS is properly configured on the backend for the portal domain

### Nginx Example
```nginx
server {
    listen 80;
    server_name portal.example.com;
    root /var/www/portal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests if needed
    location /api {
        proxy_pass http://backend:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Migration Notes

1. **No Server-Side Rendering**: This is a pure client-side application. All data fetching happens in the browser.

2. **API Changes**: Direct API calls mean CORS must be properly configured on the backend.

3. **Authentication**: Uses cookie-based auth with the `token` cookie. The backend must set this cookie on login.

4. **File Upload**: Large file uploads use chunked upload mechanism from the original codebase.

5. **Internationalization**: Translation files are simplified. Full translations can be copied from `apps/web/messages/` if needed.

6. **Theme**: Ant Design's built-in theme system is used. Custom theme colors can be configured in `ThemeProvider`.

## Future Enhancements

- [ ] Add more comprehensive translations
- [ ] Implement file preview functionality
- [ ] Add progress indicators for file uploads
- [ ] Implement advanced search and filtering
- [ ] Add user profile management
- [ ] Implement admin panel features

