import { api } from "encore.dev/api";
import type { GeneratePDFRequest, GeneratePDFResponse } from "./types";
import { generateExport } from "./generate_export";

export const generatePDF = api<GeneratePDFRequest, GeneratePDFResponse>(
  { expose: true, method: "POST", path: "/journal/generate-pdf" },
  async (req) => {
    const { user_id, start_date, end_date, categories, include_conversations, recipient_name } = req;

    const exportData = await generateExport({
      user_id,
      start_date,
      end_date,
      categories,
      include_conversations
    });

    const html = generateHTMLReport(exportData, recipient_name);
    
    const pdf_base64 = Buffer.from(html).toString('base64');
    
    const startDateStr = start_date.toISOString().split('T')[0];
    const endDateStr = end_date.toISOString().split('T')[0];
    const filename = `wellness-report-${startDateStr}-to-${endDateStr}.html`;

    return {
      pdf_base64,
      filename
    };
  }
);

function generateHTMLReport(data: any, recipientName?: string): string {
  const startDate = new Date(data.date_range.start).toLocaleDateString();
  const endDate = new Date(data.date_range.end).toLocaleDateString();
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Wellness Journal Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
    }
    .recipient {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
    }
    .summary {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary h2 {
      margin-top: 0;
      color: #1e40af;
      font-size: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .summary-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-value {
      font-size: 24px;
      font-weight: 600;
      color: #1e40af;
      margin-top: 5px;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #1e40af;
      font-size: 22px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .entry {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .entry-category {
      font-weight: 600;
      color: #2563eb;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .entry-date {
      color: #64748b;
      font-size: 14px;
    }
    .entry-content {
      color: #475569;
    }
    .content-item {
      margin: 10px 0;
    }
    .content-label {
      font-weight: 600;
      color: #334155;
      font-size: 14px;
    }
    .content-value {
      margin-top: 5px;
      color: #475569;
    }
    .conversation {
      background: #f8fafc;
      border-left: 4px solid #8b5cf6;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .message {
      margin: 10px 0;
      padding: 10px;
      border-radius: 6px;
    }
    .message.user {
      background: #dbeafe;
      margin-left: 20px;
    }
    .message.assistant {
      background: #f3e8ff;
      margin-right: 20px;
    }
    .message-role {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
      text-align: center;
    }
    @media print {
      body {
        padding: 20px;
      }
      .entry, .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Wellness Journal Report</h1>
    <div class="meta">
      <strong>${data.user_name}</strong> • Generated on ${new Date(data.export_date).toLocaleDateString()} at ${new Date(data.export_date).toLocaleTimeString()}
    </div>
    <div class="meta">
      Report Period: ${startDate} - ${endDate}
    </div>
  </div>
`;

  if (recipientName) {
    html += `
  <div class="recipient">
    <strong>Prepared for:</strong> ${recipientName}
  </div>
`;
  }

  html += `
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Entries</div>
        <div class="summary-value">${data.summary.total_entries}</div>
      </div>
`;

  for (const [category, count] of Object.entries(data.summary.categories)) {
    html += `
      <div class="summary-item">
        <div class="summary-label">${category}</div>
        <div class="summary-value">${count}</div>
      </div>
`;
  }

  html += `
    </div>
  </div>
`;

  const entriesByCategory: Record<string, any[]> = {};
  data.entries.forEach((entry: any) => {
    if (!entriesByCategory[entry.category]) {
      entriesByCategory[entry.category] = [];
    }
    entriesByCategory[entry.category].push(entry);
  });

  for (const [category, entries] of Object.entries(entriesByCategory)) {
    html += `
  <div class="section">
    <h2>${category}</h2>
`;
    
    for (const entry of entries) {
      const date = new Date(entry.date);
      html += `
    <div class="entry">
      <div class="entry-header">
        <span class="entry-category">${category}</span>
        <span class="entry-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
      </div>
      <div class="entry-content">
`;

      for (const [key, value] of Object.entries(entry.content)) {
        if (value !== null && value !== undefined && value !== '') {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let formattedValue = value;
          
          if (Array.isArray(value)) {
            formattedValue = value.join(', ');
          } else if (typeof value === 'object') {
            formattedValue = JSON.stringify(value, null, 2);
          }

          html += `
        <div class="content-item">
          <div class="content-label">${formattedKey}:</div>
          <div class="content-value">${formattedValue}</div>
        </div>
`;
        }
      }

      html += `
      </div>
    </div>
`;
    }

    html += `
  </div>
`;
  }

  if (data.conversations && data.conversations.length > 0) {
    html += `
  <div class="section">
    <h2>Conversations</h2>
`;

    for (const conv of data.conversations) {
      const date = new Date(conv.date);
      html += `
    <div class="conversation">
      <div class="entry-header">
        <span class="entry-category">${conv.session_type} Conversation</span>
        <span class="entry-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
      </div>
`;

      for (const msg of conv.messages) {
        html += `
      <div class="message ${msg.role}">
        <div class="message-role">${msg.role}</div>
        <div>${msg.content}</div>
      </div>
`;
      }

      html += `
    </div>
`;
    }

    html += `
  </div>
`;
  }

  html += `
  <div class="footer">
    <p><strong>Confidential Health Information</strong></p>
    <p>This report contains sensitive health information. Please handle with appropriate privacy and security measures.</p>
    <p>Generated by Wellness Journal System</p>
  </div>
</body>
</html>`;

  return html;
}
