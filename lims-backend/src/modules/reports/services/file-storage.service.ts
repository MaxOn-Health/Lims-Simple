import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private readonly uploadPath: string;
  private readonly logger = new Logger(FileStorageService.name);

  constructor(private configService: ConfigService) {
    this.uploadPath =
      configService.get<string>('app.uploadPath') ||
      path.join(process.cwd(), 'uploads', 'reports');

    // Ensure directory exists
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadPath}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create upload directory: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async savePdf(reportNumber: string, pdfBuffer: Buffer): Promise<string> {
    try {
      const filename = `${reportNumber}.pdf`;
      const filePath = path.join(this.uploadPath, filename);

      fs.writeFileSync(filePath, pdfBuffer);

      // Return relative path for storage in database
      const relativePath = path.join('uploads', 'reports', filename);
      this.logger.log(`Saved PDF: ${filePath}`);

      return relativePath;
    } catch (error) {
      this.logger.error(
        `Failed to save PDF: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  getPdfPath(relativePath: string): string {
    // Convert relative path to absolute path
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(process.cwd(), relativePath);
  }

  async deletePdf(relativePath: string): Promise<void> {
    try {
      const filePath = this.getPdfPath(relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted PDF: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete PDF: ${error.message}`,
        error.stack,
      );
      // Don't throw - deletion failure shouldn't break the flow
    }
  }

  fileExists(relativePath: string): boolean {
    const filePath = this.getPdfPath(relativePath);
    return fs.existsSync(filePath);
  }
}





