# LIMS Frontend

Frontend application for the Laboratory Information Management System.

## Status

Phase 1: Foundation & Authentication UI - ✅ Complete

## Technology Stack

- Next.js 14+ (App Router)
- TypeScript 5+
- Zustand for state management
- Axios for API client
- React Hook Form + Zod for forms
- Tailwind CSS + Headless UI for styling
- date-fns for date handling

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:3000` (or configure `NEXT_PUBLIC_API_URL`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── common/            # Reusable UI components
│   ├── guards/            # Route protection components
│   └── layouts/           # Layout components
├── services/              # API services
│   ├── api/               # API client and services
│   └── storage/           # Storage utilities
├── store/                 # Zustand stores
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Features Implemented (Phase 1)

- ✅ Project setup with Next.js 14+ and TypeScript
- ✅ API client with Axios and interceptors
- ✅ Token management (access & refresh tokens)
- ✅ Authentication store with Zustand
- ✅ Login form with validation
- ✅ Protected routes
- ✅ Error handling and error boundary
- ✅ Loading states
- ✅ Responsive design with Tailwind CSS

## Authentication Flow

1. User enters credentials on `/login`
2. Frontend calls `POST /auth/login`
3. Backend returns `accessToken`, `refreshToken`, and `user` data
4. Tokens are stored in localStorage
5. Access token is automatically added to API requests
6. On 401 errors, refresh token is used to get new access token
7. On logout, tokens are cleared and user is redirected to login

## Testing

Run tests with:
```bash
npm test
```

Test coverage includes:
- Login form validation
- Token storage operations
- Protected route redirects

## Next Steps

Phase 2 will include:
- User Management UI
- RBAC UI components
- Package & Test Management UI
