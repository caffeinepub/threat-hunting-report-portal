import type { Report } from '@/backend';
import { mitreAttackData } from '@/data/mitreAttackData';

export async function generateReportPdf(report: Report): Promise<void> {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  const reportDate = new Date(Number(report.metadata.date) / 1000000).toLocaleDateString();
  
  // Build HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${report.metadata.title} - Threat Hunt Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 40px;
            max-width: 210mm;
            margin: 0 auto;
          }
          
          .header {
            background: #1a1a1a;
            color: white;
            padding: 30px;
            margin: -40px -40px 30px -40px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .header h2 {
            font-size: 20px;
            font-weight: 400;
            opacity: 0.9;
          }
          
          .metadata {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 30px;
            border-left: 4px solid #4a5568;
          }
          
          .metadata-item {
            margin-bottom: 5px;
          }
          
          .metadata-label {
            font-weight: 600;
            display: inline-block;
            width: 80px;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #4a5568;
          }
          
          .section-content {
            padding-left: 10px;
          }
          
          .threat-actor {
            background: #fff5f5;
            border-left: 4px solid #e53e3e;
            padding: 15px;
            margin-bottom: 15px;
          }
          
          .threat-actor-name {
            font-weight: 700;
            font-size: 16px;
            color: #c53030;
            margin-bottom: 8px;
          }
          
          .technique {
            background: #f0f9ff;
            border-left: 4px solid #3182ce;
            padding: 12px;
            margin-bottom: 12px;
          }
          
          .technique-id {
            font-family: 'Courier New', monospace;
            font-weight: 700;
            color: #2c5282;
            margin-bottom: 5px;
          }
          
          .technique-name {
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .technique-desc {
            font-size: 14px;
            color: #4a5568;
          }
          
          .ioc {
            background: #fffaf0;
            border-left: 4px solid #dd6b20;
            padding: 10px;
            margin-bottom: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #c05621;
          }
          
          .finding {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            margin-bottom: 15px;
          }
          
          .finding-number {
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          th, td {
            border: 1px solid #cbd5e0;
            padding: 10px;
            text-align: left;
          }
          
          th {
            background: #2d3748;
            color: white;
            font-weight: 600;
          }
          
          tr:nth-child(even) {
            background: #f7fafc;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #cbd5e0;
            text-align: center;
            font-size: 12px;
            color: #718096;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .header {
              margin: -20px -20px 20px -20px;
            }
            
            .no-print {
              display: none;
            }
            
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>THREAT HUNTING REPORT</h1>
          <h2>${escapeHtml(report.metadata.title)}</h2>
        </div>
        
        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Author:</span>
            <span>${escapeHtml(report.metadata.author)}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Date:</span>
            <span>${reportDate}</span>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">Executive Summary</h3>
          <div class="section-content">
            <p>${escapeHtml(report.executiveSummary)}</p>
          </div>
        </div>
        
        ${report.threatActors.length > 0 ? `
          <div class="section">
            <h3 class="section-title">Threat Actors</h3>
            <div class="section-content">
              ${report.threatActors.map(actor => `
                <div class="threat-actor">
                  <div class="threat-actor-name">${escapeHtml(actor.name)}</div>
                  <div>${escapeHtml(actor.description)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${report.mitreTechniques.length > 0 ? `
          <div class="section">
            <h3 class="section-title">MITRE ATT&CK Techniques</h3>
            <div class="section-content">
              ${report.mitreTechniques.map(techniqueId => {
                const technique = mitreAttackData.find(t => t.id === techniqueId);
                return `
                  <div class="technique">
                    <div class="technique-id">${escapeHtml(techniqueId)}</div>
                    <div class="technique-name">${escapeHtml(technique?.name || 'Unknown Technique')}</div>
                    <div class="technique-desc">${escapeHtml(technique?.description || 'No description available')}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        ${report.iocs.length > 0 ? `
          <div class="section">
            <h3 class="section-title">Indicators of Compromise (IOCs)</h3>
            <div class="section-content">
              ${report.iocs.map(ioc => `
                <div class="ioc">${escapeHtml(ioc)}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${report.findings.length > 0 ? `
          <div class="section">
            <h3 class="section-title">Detailed Findings</h3>
            <div class="section-content">
              ${report.findings.map((finding, index) => `
                <div class="finding">
                  <div class="finding-number">Finding ${index + 1}:</div>
                  <div>${escapeHtml(finding)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Generated by Threat Hunt Portal</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
          
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
