import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordService {
  private readonly PASSWORD_HISTORY_LIMIT = 5;

  constructor(private configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('app.security.bcryptRounds') || 10;
    return bcrypt.hash(password, rounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password was used recently (prevent reuse of last N passwords)
   */
  async isPasswordInHistory(
    password: string,
    passwordHistory: string[],
  ): Promise<boolean> {
    if (!passwordHistory || passwordHistory.length === 0) {
      return false;
    }

    // Check against last N passwords
    const recentPasswords = passwordHistory.slice(-this.PASSWORD_HISTORY_LIMIT);
    
    for (const oldHash of recentPasswords) {
      const isMatch = await this.comparePassword(password, oldHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get password history limit
   */
  getPasswordHistoryLimit(): number {
    return this.PASSWORD_HISTORY_LIMIT;
  }
}

