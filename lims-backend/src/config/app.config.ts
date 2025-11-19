import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  uploadPath: process.env.UPLOAD_PATH || './uploads/reports',
  diagnosticCenter: {
    name: process.env.DIAGNOSTIC_CENTER_NAME || 'Diagnostic Center',
    address: process.env.DIAGNOSTIC_CENTER_ADDRESS,
    contact: process.env.DIAGNOSTIC_CENTER_CONTACT,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  throttle: {
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT, 10) || 5,
  },
}));
