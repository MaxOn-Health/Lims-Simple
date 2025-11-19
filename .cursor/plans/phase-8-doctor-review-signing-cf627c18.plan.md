<!-- cf627c18-ef13-4e12-a8da-8af5565cabcb 3d6b4a93-249d-42c7-a1b1-e3e2b418f64f -->
# Complete Phase 1: Foundation & Authentication UI for Next.js

## Overview

Expand Phase 1 with detailed Next.js 14+ App Router implementation, including code examples, file structures, configuration files, and step-by-step setup instructions.

## Implementation Details

### 1.1 Project Setup - Detailed Steps

- Add Next.js 14+ initialization commands
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Environment variables setup (.env.local, .env.example)
- Package.json with all dependencies
- Folder structure for App Router
- ESLint and Prettier configs
- Husky setup for pre-commit hooks

### 1.2 API Client Setup - Code Examples

- Axios instance configuration with interceptors
- React Query setup and configuration
- API base URL from environment
- Request interceptor code (add token)
- Response interceptor code (handle 401, refresh token)
- Error handling utilities
- Type definitions for API responses

### 1.3 Authentication UI - Next.js Components

- Login page component (app/login/page.tsx)
- Login form component with React Hook Form
- Logout component/button
- Middleware for route protection
- Redirect logic after login
- Loading states and error handling

### 1.4 Token Management - Implementation

- Token storage service (localStorage/cookies)
- Token expiration checking
- Auto-refresh logic
- Secure token handling
- Clear tokens on logout

### 1.5 Auth Store - Zustand Implementation

- Auth store with Zustand
- User state management
- Login/logout actions
- Token refresh action
- Persist to localStorage

### 1.6 Error Handling - Components

- Error boundary component
- Global error handler
- API error interceptor
- User-friendly error messages
- Toast notification system

### 1.7 Loading States - Components

- Global loading spinner
- Button loading component
- Page skeleton loaders
- Inline loading indicators

### 1.8 Form Validation - Zod Schemas

- Login form validation schema
- Email validation
- Password validation
- Integration with React Hook Form
- Error message display

### 1.9 Testing Setup

- Jest configuration for Next.js
- React Testing Library setup
- Test examples for auth components
- E2E test setup (Playwright)

## Files to Add/Expand

1. **Configuration Files:**

- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier configuration
- `tailwind.config.js` or MUI theme config

2. **API Client:**

- `src/lib/api/client.ts` - Axios instance
- `src/lib/api/interceptors.ts` - Request/response interceptors
- `src/lib/api/auth.service.ts` - Auth API calls

3. **Components:**

- `src/components/auth/LoginForm.tsx`
- `src/components/auth/LogoutButton.tsx`
- `src/components/common/LoadingSpinner.tsx`
- `src/components/common/ErrorBoundary.tsx`

4. **Pages (App Router):**

- `src/app/login/page.tsx`
- `src/app/(protected)/layout.tsx` - Protected route layout
- `src/middleware.ts` - Route protection middleware

5. **Store:**

- `src/store/auth.store.ts` - Zustand auth store

6. **Utils:**

- `src/utils/token.storage.ts` - Token management
- `src/utils/validation.ts` - Validation schemas

7. **Types:**

- `src/types/auth.types.ts` - Auth type definitions
- `src/types/api.types.ts` - API response types

## Code Examples to Include

- Next.js App Router page structure
- React Hook Form integration
- Zod validation schemas
- Zustand store implementation
- Axios interceptor setup
- Middleware for route protection
- Token storage utilities
- Error boundary implementation

## Next Steps

After completing Phase 1 documentation:

- Add detailed code snippets for each component
- Include configuration file examples
- Add troubleshooting section
- Include common issues and solutions
- Add deployment notes for Next.js

### To-dos

- [ ] Expand section 1.1 with Next.js project setup commands, configuration files (next.config.js, tsconfig.json), package.json dependencies, and folder structure