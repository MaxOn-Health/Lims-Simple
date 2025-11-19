# LIMS Backend API

Laboratory Information Management System - Backend API built with NestJS.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` file with your database credentials and other configuration

4. Create the PostgreSQL database:
```sql
CREATE DATABASE lims_db;
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Project Structure

```
src/
  common/          # Shared utilities (decorators, guards, interceptors, filters, pipes)
  config/          # Configuration files
  modules/         # Feature modules
    auth/          # Authentication module
    users/         # User management module
    packages/      # Package management module
    tests/         # Test management module
    patients/      # Patient management module
    assignments/   # Test assignment module
    results/       # Test results module
    blood-samples/ # Blood sample workflow module
    doctor-reviews/# Doctor review module
    reports/       # Report generation module
    audit/         # Audit logging module
  database/
    migrations/    # Database migrations
    seeds/         # Database seeds
```

## API Documentation

Once the application is running, Swagger documentation is available at:
- http://localhost:3000/api/docs

## Scripts

- `npm run build` - Build the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Environment Variables

See `.env.example` for all required environment variables.

## Database Migrations

- Generate migration: `npm run migration:generate -- MigrationName`
- Run migrations: `npm run migration:run`
- Revert migration: `npm run migration:revert`

## Development Guidelines

- Follow NestJS best practices
- Use TypeScript strictly
- Write self-documenting code
- Add comments for complex logic
- Follow naming conventions
- Write tests for each feature

## License

ISC

