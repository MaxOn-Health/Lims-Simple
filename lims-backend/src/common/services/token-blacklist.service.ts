import { Injectable } from '@nestjs/common';

/**
 * In-memory token blacklist for MVP
 * In production, use Redis or database table
 */
@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens: Set<string> = new Set();

  /**
   * Add token to blacklist
   */
  addToBlacklist(token: string, expiresIn: number): void {
    this.blacklistedTokens.add(token);
    
    // Remove from blacklist after expiration
    setTimeout(() => {
      this.blacklistedTokens.delete(token);
    }, expiresIn * 1000);
  }

  /**
   * Check if token is blacklisted
   */
  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Clear blacklist (useful for testing)
   */
  clear(): void {
    this.blacklistedTokens.clear();
  }
}

