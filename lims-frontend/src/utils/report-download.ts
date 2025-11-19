import { reportsService } from '@/services/api/reports.service';

/**
 * Download a report PDF file
 * @param reportId - The ID of the report to download
 * @returns Promise that resolves when download is complete
 */
export async function downloadReport(reportId: string): Promise<void> {
  try {
    const blob = await reportsService.downloadReport(reportId);
    
    // Get report details to determine filename
    const report = await reportsService.getReportById(reportId);
    const filename = `${report.reportNumber}.pdf`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
}

/**
 * Open report PDF in a new tab
 * @param reportId - The ID of the report to open
 */
export async function openReportInNewTab(reportId: string): Promise<void> {
  try {
    const blob = await reportsService.downloadReport(reportId);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: URL will be revoked when the tab is closed or after a delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error opening report:', error);
    throw error;
  }
}



