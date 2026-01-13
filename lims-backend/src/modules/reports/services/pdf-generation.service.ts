import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
  patient: {
    name: string;
    age: number;
    gender: string;
    contactNumber: string;
    email?: string;
    employeeId?: string;
    companyName?: string;
    patientId: string;
  };
  package?: {
    name: string;
    validityPeriod?: number;
  };
  testResults: Array<{
    testName: string;
    resultValues: Record<string, any>;
    normalRange?: {
      min?: number;
      max?: number;
      unit?: string;
    };
    status?: string;
    notes?: string;
  }>;
  doctorReview?: {
    remarks?: string;
    doctorName?: string;
    signedAt?: Date;
  };
  reportNumber: string;
  generatedAt: Date;
  isUnsignedPreview?: boolean;
}

@Injectable()
export class PdfGenerationService {
  private readonly diagnosticCenterName: string;
  private readonly diagnosticCenterAddress?: string;
  private readonly diagnosticCenterContact?: string;

  constructor(private configService: ConfigService) {
    const diagnosticCenterConfig = configService.get('app.diagnosticCenter');
    this.diagnosticCenterName =
      diagnosticCenterConfig?.name || 'Diagnostic Center';
    this.diagnosticCenterAddress = diagnosticCenterConfig?.address;
    this.diagnosticCenterContact = diagnosticCenterConfig?.contact;
  }

  async generatePdf(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        this.addHeader(doc, data.reportNumber, data.generatedAt);

        // Patient Information
        this.addPatientInformation(doc, data.patient);

        // Package Information
        if (data.package) {
          this.addPackageInformation(doc, data.package);
        }

        // Test Results
        this.addTestResults(doc, data.testResults);

        // Doctor Remarks
        if (data.doctorReview?.remarks) {
          this.addDoctorRemarks(doc, data.doctorReview.remarks);
        }

        // Add watermark for unsigned preview
        if (data.isUnsignedPreview) {
          this.addUnsignedWatermark(doc);
        }

        // Footer
        this.addFooter(doc, data.doctorReview, data.isUnsignedPreview);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addUnsignedWatermark(doc: typeof PDFDocument.prototype): void {
    doc.save();
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    
    doc.rotate(45, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.fontSize(60);
    doc.font('Helvetica-Bold');
    doc.fillColor('rgba(200, 200, 200, 0.3)');
    doc.text('UNSIGNED PREVIEW', 0, 0, {
      align: 'center',
      width: pageWidth,
    });
    doc.fillColor('black');
    doc.restore();
  }

  private addHeader(
    doc: typeof PDFDocument.prototype,
    reportNumber: string,
    generatedAt: Date,
  ): void {
    // Center name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(this.diagnosticCenterName, { align: 'center' })
      .moveDown(0.5);

    if (this.diagnosticCenterAddress) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(this.diagnosticCenterAddress, { align: 'center' })
        .moveDown(0.3);
    }

    if (this.diagnosticCenterContact) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(this.diagnosticCenterContact, { align: 'center' })
        .moveDown(1);
    }

    // Report number and date
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TEST REPORT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Report Number: ${reportNumber}`, { align: 'center' })
      .text(
        `Date Generated: ${generatedAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        { align: 'center' },
      )
      .moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addPatientInformation(
    doc: typeof PDFDocument.prototype,
    patient: ReportData['patient'],
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Patient Information', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    const patientInfo = [
      [`Name:`, patient.name],
      [`Age:`, `${patient.age} years`],
      [`Gender:`, patient.gender],
      [`Contact:`, patient.contactNumber],
    ];

    if (patient.email) {
      patientInfo.push([`Email:`, patient.email]);
    }
    if (patient.employeeId) {
      patientInfo.push([`Employee ID:`, patient.employeeId]);
    }
    if (patient.companyName) {
      patientInfo.push([`Company:`, patient.companyName]);
    }
    patientInfo.push([`Patient ID:`, patient.patientId]);

    let startY = doc.y;
    const lineHeight = 15;
    const col1Width = 120;
    const col2Width = 350;

    patientInfo.forEach(([label, value]) => {
      doc.text(label, 50, startY, { width: col1Width });
      doc.text(value || 'N/A', 50 + col1Width, startY, { width: col2Width });
      startY += lineHeight;
    });

    doc.y = startY;
    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addPackageInformation(
    doc: typeof PDFDocument.prototype,
    packageInfo: ReportData['package'],
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Package Information', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Package Name: ${packageInfo.name}`);

    if (packageInfo.validityPeriod) {
      doc.text(`Validity Period: ${packageInfo.validityPeriod} days`);
    }

    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addTestResults(
    doc: typeof PDFDocument.prototype,
    testResults: ReportData['testResults'],
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Test Results', { underline: true })
      .moveDown(0.5);

    testResults.forEach((result, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      // Special handling for audiometry tests
      if (result.testName.toLowerCase().includes('audiometry')) {
        this.addAudiometryResults(doc, result);
      } else if (result.testName.toLowerCase().includes('eye')) {
        this.addEyeTestResults(doc, result);
      } else {
        doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${result.testName}`).moveDown(0.3);

        doc.fontSize(10).font('Helvetica');

        // Result values
        if (result.resultValues && Object.keys(result.resultValues).length > 0) {
          Object.entries(result.resultValues).forEach(([field, value]) => {
            const displayValue =
              value !== null && value !== undefined ? String(value) : 'N/A';
            doc.text(`   ${field}: ${displayValue}`, { indent: 20 });
          });
        }

        // Normal range
        if (result.normalRange) {
          const { min, max, unit } = result.normalRange;
          let rangeText = '   Normal Range: ';
          if (min !== undefined && max !== undefined) {
            rangeText += `${min} - ${max}`;
          } else if (min !== undefined) {
            rangeText += `≥ ${min}`;
          } else if (max !== undefined) {
            rangeText += `≤ ${max}`;
          }
          if (unit) {
            rangeText += ` ${unit}`;
          }
          doc.text(rangeText, { indent: 20 });
        }

        // Status
        if (result.status) {
          const statusColor = result.status === 'Normal' ? 'green' : 'red';
          doc
            .fillColor(statusColor)
            .text(`   Status: ${result.status}`, { indent: 20 })
            .fillColor('black');
        }

        // Notes
        if (result.notes) {
          doc.text(`   Notes: ${result.notes}`, { indent: 20 });
        }
      }

      doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addAudiometryResults(
    doc: typeof PDFDocument.prototype,
    result: ReportData['testResults'][0],
  ): void {
    const frequencies = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
    
    doc.fontSize(14).font('Helvetica-Bold').text('FINAL REPORT', { align: 'right' }).moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text(result.testName).moveDown(0.5);

    // Extract audiometry values
    const rightValues: Record<number, number> = {};
    const leftValues: Record<number, number> = {};
    
    frequencies.forEach((freq) => {
      const rightKey = `right_${freq}`;
      const leftKey = `left_${freq}`;
      if (result.resultValues[rightKey] !== undefined) {
        rightValues[freq] = Number(result.resultValues[rightKey]);
      }
      if (result.resultValues[leftKey] !== undefined) {
        leftValues[freq] = Number(result.resultValues[leftKey]);
      }
    });

    // Calculate average hearing loss for each ear
    const rightAvg = Object.values(rightValues).length > 0
      ? Math.round(Object.values(rightValues).reduce((a, b) => a + b, 0) / Object.values(rightValues).length)
      : null;
    const leftAvg = Object.values(leftValues).length > 0
      ? Math.round(Object.values(leftValues).reduce((a, b) => a + b, 0) / Object.values(leftValues).length)
      : null;

    // Create two-column table layout
    const tableStartY = doc.y;
    const tableWidth = 500;
    const colWidth = tableWidth / 2;
    const rowHeight = 18;
    const headerHeight = 30;

    // RIGHT Ear Table Header (Red background simulation with text color)
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('red')
      .text('RIGHT', 50, tableStartY, { width: colWidth, align: 'center' })
      .fillColor('black');

    // LEFT Ear Table Header (Blue background simulation with text color)
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('blue')
      .text('LEFT', 50 + colWidth, tableStartY, { width: colWidth, align: 'center' })
      .fillColor('black');

    let currentY = tableStartY + headerHeight;

    // Column headers
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('HZ', 50, currentY, { width: 60 });
    doc.text('SOUND (DB)', 110, currentY, { width: colWidth - 60 });
    doc.text('HZ', 50 + colWidth, currentY, { width: 60 });
    doc.text('SOUND (DB)', 50 + colWidth + 60, currentY, { width: colWidth - 60 });
    currentY += rowHeight;

    // Draw table rows
    doc.fontSize(9).font('Helvetica');
    frequencies.forEach((freq) => {
      const rightValue = rightValues[freq] !== undefined ? rightValues[freq] : '';
      const leftValue = leftValues[freq] !== undefined ? leftValues[freq] : '';

      // RIGHT ear row
      doc.text(String(freq), 50, currentY, { width: 60 });
      doc.text(rightValue !== '' ? String(rightValue) : '', 110, currentY, { width: colWidth - 60 });

      // LEFT ear row
      doc.text(String(freq), 50 + colWidth, currentY, { width: 60 });
      doc.text(leftValue !== '' ? String(leftValue) : '', 50 + colWidth + 60, currentY, { width: colWidth - 60 });

      currentY += rowHeight;
    });

    doc.y = currentY + 10;

    // Provisional Diagnosis
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').text('Provisional Diagnosis').moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    if (rightAvg !== null) {
      doc.text(`A.C (DB): Right ${rightAvg}, Left ${leftAvg !== null ? leftAvg : 'N/A'}`);
    }
    doc.text('B.C:');

    // Hearing Loss Classification
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');
    doc.text('Normal Hearing: -10 - 25 db HL');
    doc.text('Mild Hearing loss: 30 - 45 db HL');
    doc.text('Moderate Hearing loss: 50 - 65 db HL');
    doc.text('Severe Hearing Loss: 70 - 85 db HL');
    doc.text('Profound Hearing Loss: >90 db HL');

    // Remarks
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica-Bold').text('Remarks:').moveDown(0.2);
    doc.fontSize(9).font('Helvetica');
    
    const getHearingStatus = (avg: number | null): string => {
      if (avg === null) return '';
      if (avg >= -10 && avg <= 25) return 'HEARING SENSITIVITY WITHIN NORMAL LIMITS';
      if (avg >= 26 && avg <= 45) return 'MILD HEARING LOSS';
      if (avg >= 46 && avg <= 65) return 'MODERATE HEARING LOSS';
      if (avg >= 66 && avg <= 85) return 'SEVERE HEARING LOSS';
      return 'PROFOUND HEARING LOSS';
    };

    if (rightAvg !== null) {
      doc.text(`RIGHT: ${getHearingStatus(rightAvg)}`);
    }
    if (leftAvg !== null) {
      doc.text(`LEFT: ${getHearingStatus(leftAvg)}`);
    }

    // Notes
    if (result.notes) {
      doc.moveDown(0.5);
      doc.text(`Notes: ${result.notes}`);
    }
  }

  private addEyeTestResults(
    doc: typeof PDFDocument.prototype,
    result: ReportData['testResults'][0],
  ): void {
    doc.fontSize(14).font('Helvetica-Bold').text('EYE EXAMINATION REPORT', { align: 'center' }).moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text(result.testName).moveDown(0.5);

    // Extract eye test values
    const resultValues = result.resultValues || {};

    // Helper functions to get values
    const getVisionValue = (visionType: string, eye: string, glassType: string): string => {
      const key = `${visionType}_vision_${eye}_${glassType}`;
      const value = resultValues[key];
      return value !== null && value !== undefined && value !== '' ? String(value) : '';
    };

    const getEyeParameterValue = (parameter: string, eye: string): string => {
      const key = `${parameter}_${eye}`;
      const value = resultValues[key];
      return value !== null && value !== undefined && value !== '' ? String(value) : '';
    };

    const getEyeHealthValue = (field: string): string => {
      const value = resultValues[field];
      if (value === null || value === undefined || value === '') {
        return 'NORMAL';
      }
      return String(value).toUpperCase() || 'NORMAL';
    };

    // Eye Health Status
    doc.fontSize(10).font('Helvetica-Bold').text('Eye Health Status').moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text(`Eye lids: ${getEyeHealthValue('eye_lids')}`);
    doc.text(`Conjunctiva: ${getEyeHealthValue('conjunctiva')}`);
    doc.text(`CORNEA: ${getEyeHealthValue('cornea')}`);
    doc.text(`Pupil: ${getEyeHealthValue('pupil')}`);
    doc.text(`Colour vision: ${getEyeHealthValue('colour_blindness')}`);
    doc.moveDown(0.5);

    // Vision Tables
    const tableStartY = doc.y;
    const tableWidth = 480;
    const rowHeight = 15;
    const colWidth = tableWidth / 3;

    // Distance Vision Table
    doc.fontSize(10).font('Helvetica-Bold').text('Distance Vision').moveDown(0.3);
    
    let currentY = doc.y;
    
    // Table header
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0066cc');
    doc.text('Distance vision', 50, currentY, { width: colWidth });
    doc.text('WITHOUT GLASS', 50 + colWidth, currentY, { width: colWidth });
    doc.text('WITH GLASS', 50 + colWidth * 2, currentY, { width: colWidth });
    doc.fillColor('black');
    currentY += rowHeight;

    // Table rows
    doc.fontSize(9).font('Helvetica');
    ['right', 'left'].forEach((eye) => {
      const eyeLabel = eye === 'right' ? 'RIGHT' : 'LEFT';
      doc.text(eyeLabel, 50, currentY, { width: colWidth });
      doc.text(getVisionValue('distance', eye, 'without_glass') || '', 50 + colWidth, currentY, { width: colWidth });
      doc.text(getVisionValue('distance', eye, 'with_glass') || '', 50 + colWidth * 2, currentY, { width: colWidth });
      currentY += rowHeight;
    });

    doc.y = currentY + 5;

    // Near Vision Table
    doc.fontSize(10).font('Helvetica-Bold').text('Near Vision').moveDown(0.3);
    
    currentY = doc.y;
    
    // Table header
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0066cc');
    doc.text('Near vision', 50, currentY, { width: colWidth });
    doc.text('WITHOUT GLASS', 50 + colWidth, currentY, { width: colWidth });
    doc.text('WITH GLASS', 50 + colWidth * 2, currentY, { width: colWidth });
    doc.fillColor('black');
    currentY += rowHeight;

    // Table rows
    doc.fontSize(9).font('Helvetica');
    ['right', 'left'].forEach((eye) => {
      const eyeLabel = eye === 'right' ? 'RIGHT' : 'LEFT';
      doc.text(eyeLabel, 50, currentY, { width: colWidth });
      doc.text(getVisionValue('near', eye, 'without_glass') || '', 50 + colWidth, currentY, { width: colWidth });
      doc.text(getVisionValue('near', eye, 'with_glass') || '', 50 + colWidth * 2, currentY, { width: colWidth });
      currentY += rowHeight;
    });

    doc.y = currentY + 5;

    // Subjective Refraction Table
    doc.fontSize(10).font('Helvetica-Bold').text('Subjective Refraction:').moveDown(0.3);
    
    const paramColWidth = tableWidth / 6;
    const parameters = ['SPH', 'CYL', 'AXIS', 'ADD', 'VISION'];
    const paramKeys = ['sph', 'cyl', 'axis', 'add', 'vision'];

    currentY = doc.y;
    
    // Table header
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0066cc');
    doc.text('', 50, currentY, { width: paramColWidth });
    parameters.forEach((param, idx) => {
      doc.text(param, 50 + paramColWidth * (idx + 1), currentY, { width: paramColWidth });
    });
    doc.fillColor('black');
    currentY += rowHeight;

    // Table rows
    doc.fontSize(9).font('Helvetica');
    ['right', 'left'].forEach((eye) => {
      const eyeLabel = eye === 'right' ? 'RIGHT' : 'LEFT';
      doc.text(eyeLabel, 50, currentY, { width: paramColWidth });
      paramKeys.forEach((param, idx) => {
        doc.text(getEyeParameterValue(param, eye) || '', 50 + paramColWidth * (idx + 1), currentY, { width: paramColWidth });
      });
      currentY += rowHeight;
    });

    doc.y = currentY + 10;

    // Impression
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    const normalVision = resultValues.normal_vision;
    const nearNormalVision = resultValues.near_normal_vision;
    let impression = 'Visual acuity Normal';
    
    if (normalVision) {
      impression = 'Visual acuity Normal';
    } else if (nearNormalVision) {
      impression = 'Visual acuity Near normal';
    }

    doc.text(`Impression: ${impression}`);

    // Notes
    if (result.notes) {
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Notes: ${result.notes}`);
    }
  }

  private addDoctorRemarks(doc: typeof PDFDocument.prototype, remarks: string): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Doctor Remarks', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    const lines = remarks.split('\n');
    lines.forEach((line) => {
      doc.text(line, { indent: 20 });
    });

    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addFooter(
    doc: typeof PDFDocument.prototype,
    doctorReview?: ReportData['doctorReview'],
    isUnsignedPreview?: boolean,
  ): void {
    // Move to bottom of page
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    if (doc.y < footerY) {
      doc.y = footerY;
    } else {
      doc.addPage();
      doc.y = pageHeight - 100;
    }

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    if (doctorReview?.doctorName) {
      doc.fontSize(10).font('Helvetica-Bold').text(`Doctor: ${doctorReview.doctorName}`);
    }

    if (doctorReview?.signedAt) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Signed Date: ${doctorReview.signedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
        );
    }

    // Handle unsigned preview
    if (isUnsignedPreview) {
      doc.fontSize(10).font('Helvetica-Bold')
         .fillColor('#ff6600')
         .text('Report Pending Doctor Review', { align: 'left' })
         .fillColor('black');

      doc.fontSize(9).font('Helvetica-Oblique')
         .fillColor('#999999')
         .text('Unsigned Preview', { align: 'right' })
         .fillColor('black');
    } else if (doctorReview?.signedAt) {
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Digitally Signed', { align: 'right' });
    } else if (!doctorReview?.doctorName) {
      doc.fontSize(10).font('Helvetica-Bold')
         .fillColor('#ff6600')
         .text('Report Pending Doctor Review', { align: 'left' })
         .fillColor('black');

      doc.fontSize(9).font('Helvetica-Oblique')
         .fillColor('#999999')
         .text('Unsigned Preview', { align: 'right' })
         .fillColor('black');
    }
  }
}

