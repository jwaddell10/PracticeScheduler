import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface Practice {
  id: string;
  title?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  drills: string[];
  drillDuration?: number[];
  notes?: string;
  teamId: string;
}

export const exportPracticeToPDF = async (practice: Practice): Promise<void> => {
  try {
    // Format the date
    const practiceDate = new Date(practice.startTime);
    const formattedDate = practiceDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format the time
    const formattedTime = practiceDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Calculate total duration
    const totalDuration = practice.duration || 
      (practice.drillDuration ? practice.drillDuration.reduce((sum, dur) => sum + (dur || 0), 0) : 0);

    // Generate drill rows
    const drillRows = practice.drills.map((drill, index) => {
      const drillDuration = practice.drillDuration?.[index] || 0;
      return `
        <tr>
          <td style="text-align: center; padding: 6px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e0e0e0;">
            <div style="font-weight: 600; color: #2d3748; font-size: 11px;">${drill}</div>
            <div style="color: #4a5568; font-size: 10px; margin-top: 2px;">${drillDuration} min</div>
          </td>
          <td style="padding: 6px; border-bottom: 1px solid #e0e0e0; vertical-align: top;">
            <div style="border-bottom: 1px solid #e0e0e0; height: 16px; margin-bottom: 3px;"></div>
            <div style="border-bottom: 1px solid #e0e0e0; height: 16px; margin-bottom: 3px;"></div>
            <div style="border-bottom: 1px solid #e0e0e0; height: 16px; margin-bottom: 3px;"></div>
            <div style="border-bottom: 1px solid #e0e0e0; height: 16px; margin-bottom: 3px;"></div>
            <div style="border-bottom: 1px solid #e0e0e0; height: 16px; margin-bottom: 3px;"></div>
          </td>
        </tr>
      `;
    }).join('');

    // Generate additional notes lines
    const notesLines = Array(8).fill('<div style="border-bottom: 1px solid #e0e0e0; height: 16px; margin-bottom: 3px;"></div>').join('');

    // Current date for footer
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${practice.title || 'Practice'}</title>
          <style>
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: white;
              color: #2d3748;
              line-height: 1.4;
              font-size: 12px;
            }
            .document-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .practice-title {
              font-size: 24px;
              font-weight: 700;
              color: #22543d;
              margin-bottom: 8px;
            }
            .separator {
              height: 2px;
              background-color: #22543d;
              margin-bottom: 15px;
            }
            .practice-details {
              display: flex;
              justify-content: space-around;
              margin-bottom: 20px;
              font-size: 14px;
              color: #4a5568;
            }
            .detail-item {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .detail-icon {
              width: 16px;
              height: 16px;
              background-color: #22543d;
              border-radius: 50%;
              display: inline-block;
            }
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .main-table th {
              background-color: #f7fafc;
              padding: 8px 6px;
              text-align: left;
              font-weight: 600;
              color: #2d3748;
              border-bottom: 2px solid #e2e8f0;
            }
            .main-table td {
              padding: 6px;
              border-bottom: 1px solid #e0e0e0;
              vertical-align: top;
            }
            .notes-section {
              margin-bottom: 20px;
            }
            .notes-title {
              font-size: 14px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 10px;
            }
            .notes-lines {
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 10px;
              background-color: #f7fafc;
            }
            .footer {
              text-align: center;
              color: #718096;
              font-size: 12px;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <div class="header">
              <div class="practice-title">${practice.title || 'Practice'}</div>
              <div class="separator"></div>
              <div class="practice-details">
                <div class="detail-item">
                  <div class="detail-icon"></div>
                  <span>${formattedDate}</span>
                </div>
                <div class="detail-item">
                  <div class="detail-icon"></div>
                  <span>${formattedTime}</span>
                </div>
                <div class="detail-item">
                  <div class="detail-icon"></div>
                  <span>${totalDuration} minutes total</span>
                </div>
              </div>
            </div>

            <table class="main-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th style="width: 35%;">Drill Details</th>
                  <th style="width: 65%;">Coach Notes & Diagrams</th>
                </tr>
              </thead>
              <tbody>
                ${drillRows}
              </tbody>
            </table>

            <div class="notes-section">
              <div class="notes-title">Additional Notes:</div>
              <div class="notes-lines">
                ${notesLines}
              </div>
            </div>

            <div class="footer">
              Generated by Practice Pro • ${currentDate}
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    // Share the PDF using expo-sharing
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${practice.title || 'Practice'} Schedule`
      });
    } else {
      console.error('Sharing is not available on this device');
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
