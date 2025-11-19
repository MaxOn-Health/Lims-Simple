import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasscodeService {
  /**
   * Generate a random 6-digit passcode (100000-999999)
   */
  generatePasscode(): string {
    const min = 100000;
    const max = 999999;
    const passcode = Math.floor(Math.random() * (max - min + 1)) + min;
    return passcode.toString();
  }

  /**
   * Hash a passcode using bcrypt
   */
  async hashPasscode(passcode: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(passcode, saltRounds);
  }

  /**
   * Compare a plain passcode with a hashed passcode
   */
  async comparePasscode(passcode: string, hash: string): Promise<boolean> {
    return bcrypt.compare(passcode, hash);
  }
}





