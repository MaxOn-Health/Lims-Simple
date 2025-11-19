import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../../users/entities/user.entity';

interface StoredChallenge {
  challenge: string;
  userId: string;
  expiresAt: number;
}

@Injectable()
export class PasskeyService {
  private challenges: Map<string, StoredChallenge> = new Map();
  private readonly CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    // Clean up expired challenges every minute
    setInterval(() => this.cleanupExpiredChallenges(), 60 * 1000);
  }

  /**
   * Generate WebAuthn challenge for passkey setup
   */
  async generateChallenge(userId: string, userName: string, userDisplayName: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'DOCTOR') {
      throw new BadRequestException('Only doctors can set up passkeys');
    }

    const options = await generateRegistrationOptions({
      rpName: 'LIMS System',
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      userName,
      userDisplayName,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: user.passkeyCredentialId
        ? [
            {
              id: user.passkeyCredentialId,
            },
          ]
        : [],
      authenticatorSelection: {
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    // Store challenge
    const challengeId = `${userId}-${Date.now()}`;
    this.challenges.set(challengeId, {
      challenge: options.challenge,
      userId,
      expiresAt: Date.now() + this.CHALLENGE_TTL,
    });

    return {
      challengeId,
      options,
    };
  }

  /**
   * Verify passkey setup and store credential
   */
  async verifyPasskeySetup(
    userId: string,
    challengeId: string,
    credential: any,
    expectedChallenge: string,
  ) {
    const storedChallenge = this.challenges.get(challengeId);
    if (!storedChallenge) {
      throw new BadRequestException('Invalid or expired challenge');
    }

    if (storedChallenge.userId !== userId) {
      throw new BadRequestException('Challenge does not match user');
    }

    if (Date.now() > storedChallenge.expiresAt) {
      this.challenges.delete(challengeId);
      throw new BadRequestException('Challenge expired');
    }

    if (storedChallenge.challenge !== expectedChallenge) {
      throw new BadRequestException('Challenge mismatch');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
        expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
        requireUserVerification: true,
      });

      if (!verification.verified) {
        throw new BadRequestException('Passkey verification failed');
      }

      // Store credential ID and public key
      const credentialId = Buffer.from(credential.id, 'base64').toString('base64');
      const publicKey = JSON.stringify(verification.registrationInfo?.credentialPublicKey);

      user.passkeyCredentialId = credentialId;
      user.passkeyPublicKey = publicKey;
      await this.usersRepository.save(user);

      // Clean up challenge
      this.challenges.delete(challengeId);

      return {
        verified: true,
        credentialId,
      };
    } catch (error) {
      throw new BadRequestException(`Passkey verification failed: ${error.message}`);
    }
  }

  /**
   * Generate authentication challenge for signing
   */
  async generateAuthenticationChallenge(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passkeyCredentialId || !user.passkeyPublicKey) {
      throw new BadRequestException('User has not set up a passkey');
    }

    const options = await generateAuthenticationOptions({
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      allowCredentials: [
        {
          id: user.passkeyCredentialId,
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    });

    // Store challenge
    const challengeId = `auth-${userId}-${Date.now()}`;
    this.challenges.set(challengeId, {
      challenge: options.challenge,
      userId,
      expiresAt: Date.now() + this.CHALLENGE_TTL,
    });

    return {
      challengeId,
      options,
    };
  }

  /**
   * Verify passkey for signing
   */
  async verifyPasskeyForSigning(
    userId: string,
    challengeId: string,
    credential: any,
    expectedChallenge: string,
  ) {
    const storedChallenge = this.challenges.get(challengeId);
    if (!storedChallenge) {
      throw new BadRequestException('Invalid or expired challenge');
    }

    if (storedChallenge.userId !== userId) {
      throw new BadRequestException('Challenge does not match user');
    }

    if (Date.now() > storedChallenge.expiresAt) {
      this.challenges.delete(challengeId);
      throw new BadRequestException('Challenge expired');
    }

    if (storedChallenge.challenge !== expectedChallenge) {
      throw new BadRequestException('Challenge mismatch');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.passkeyCredentialId || !user.passkeyPublicKey) {
      throw new NotFoundException('User passkey not found');
    }

    try {
      const publicKey = JSON.parse(user.passkeyPublicKey);
      const credentialId = Buffer.from(user.passkeyCredentialId, 'base64');

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
        expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
        authenticator: {
          credentialID: user.passkeyCredentialId,
          credentialPublicKey: Buffer.from(publicKey),
          counter: 0,
        },
        requireUserVerification: true,
      });

      if (!verification.verified) {
        throw new BadRequestException('Passkey verification failed');
      }

      // Clean up challenge
      this.challenges.delete(challengeId);

      return {
        verified: true,
      };
    } catch (error) {
      throw new BadRequestException(`Passkey verification failed: ${error.message}`);
    }
  }

  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges() {
    const now = Date.now();
    for (const [id, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
      }
    }
  }
}
