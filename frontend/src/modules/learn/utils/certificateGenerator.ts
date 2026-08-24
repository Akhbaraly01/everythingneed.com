// PDF Certificate Generator Utility
// Creates beautiful downloadable certificates for completed courses

interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certificateNumber: string;
  issueDate: Date;
  courseDuration?: string;
  grade?: string;
}

export const generateCertificatePDF = (data: CertificateData): void => {
  const {
    studentName,
    courseTitle,
    instructorName,
    certificateNumber,
    issueDate,
    courseDuration,
    grade
  } = data;

  const formattedDate = issueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create SVG-based certificate that can be converted to downloadable format
  const certificateSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <!-- Background with elegant gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFBF0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFF5E6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#B8860B;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#00000020"/>
    </filter>
  </defs>
  
  <!-- Main background -->
  <rect width="1000" height="700" fill="url(#bgGradient)"/>
  
  <!-- Decorative border -->
  <rect x="20" y="20" width="960" height="660" fill="none" stroke="url(#goldGradient)" stroke-width="4"/>
  <rect x="30" y="30" width="940" height="640" fill="none" stroke="url(#goldGradient)" stroke-width="1"/>
  
  <!-- Corner decorations -->
  <circle cx="50" cy="50" r="15" fill="url(#goldGradient)"/>
  <circle cx="950" cy="50" r="15" fill="url(#goldGradient)"/>
  <circle cx="50" cy="650" r="15" fill="url(#goldGradient)"/>
  <circle cx="950" cy="650" r="15" fill="url(#goldGradient)"/>
  
  <!-- Award ribbon/seal -->
  <circle cx="500" cy="100" r="45" fill="url(#goldGradient)" filter="url(#shadow)"/>
  <text x="500" y="108" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#FFFBF0" font-weight="bold">★</text>
  
  <!-- Header text -->
  <text x="500" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#8B4513" letter-spacing="8">CERTIFICATE</text>
  <text x="500" y="210" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#8B4513" letter-spacing="4">OF COMPLETION</text>
  
  <!-- Decorative line -->
  <line x1="200" y1="235" x2="800" y2="235" stroke="url(#goldGradient)" stroke-width="2"/>
  
  <!-- "This is to certify that" -->
  <text x="500" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#5D4E37">This is to certify that</text>
  
  <!-- Student name -->
  <text x="500" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#1a1a1a" font-weight="bold" font-style="italic">${escapeXml(studentName)}</text>
  
  <!-- Underline for name -->
  <line x1="250" y1="345" x2="750" y2="345" stroke="#B8860B" stroke-width="1"/>
  
  <!-- "has successfully completed" -->
  <text x="500" y="390" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#5D4E37">has successfully completed the course</text>
  
  <!-- Course title -->
  <text x="500" y="440" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#2C5530" font-weight="bold">"${escapeXml(courseTitle)}"</text>
  
  ${courseDuration ? `<text x="500" y="475" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">Duration: ${escapeXml(courseDuration)}</text>` : ''}
  ${grade ? `<text x="500" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">Grade: ${escapeXml(grade)}</text>` : ''}
  
  <!-- Decorative line -->
  <line x1="200" y1="520" x2="800" y2="520" stroke="url(#goldGradient)" stroke-width="1"/>
  
  <!-- Instructor and date section -->
  <text x="250" y="570" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#5D4E37">Instructor</text>
  <text x="250" y="595" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#1a1a1a" font-style="italic">${escapeXml(instructorName)}</text>
  <line x1="150" y1="575" x2="350" y2="575" stroke="#B8860B" stroke-width="1"/>
  
  <text x="500" y="570" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#5D4E37">Date Issued</text>
  <text x="500" y="595" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#1a1a1a">${formattedDate}</text>
  <line x1="400" y1="575" x2="600" y2="575" stroke="#B8860B" stroke-width="1"/>
  
  <text x="750" y="570" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#5D4E37">Certificate ID</text>
  <text x="750" y="595" text-anchor="middle" font-family="Courier New, monospace" font-size="12" fill="#666">${escapeXml(certificateNumber)}</text>
  <line x1="650" y1="575" x2="850" y2="575" stroke="#B8860B" stroke-width="1"/>
  
  <!-- Verification badge -->
  <rect x="420" y="620" width="160" height="30" rx="15" fill="#27ae60"/>
  <text x="500" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white" font-weight="bold">✓ VERIFIED</text>
</svg>
  `;

  // Convert SVG to downloadable file
  const blob = new Blob([certificateSVG], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Certificate-${certificateNumber}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to escape XML special characters
const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Generate certificate as HTML for printing
export const generateCertificateHTML = (data: CertificateData): string => {
  const {
    studentName,
    courseTitle,
    instructorName,
    certificateNumber,
    issueDate,
    courseDuration,
    grade
  } = data;

  const formattedDate = issueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: landscape; margin: 0; }
    body { 
      margin: 0; 
      padding: 40px;
      font-family: Georgia, serif;
      background: linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .certificate {
      background: linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 100%);
      border: 4px solid #B8860B;
      padding: 60px;
      max-width: 900px;
      text-align: center;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid #B8860B;
      pointer-events: none;
    }
    .seal {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #B8860B 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 30px;
      font-size: 40px;
      color: #FFFBF0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .header {
      letter-spacing: 8px;
      color: #8B4513;
      margin-bottom: 10px;
      font-size: 18px;
    }
    .subheader {
      letter-spacing: 4px;
      color: #8B4513;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, #B8860B 0%, #FFD700 50%, #B8860B 100%);
      width: 60%;
      margin: 20px auto;
    }
    .certify-text {
      color: #5D4E37;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .student-name {
      font-size: 36px;
      font-weight: bold;
      font-style: italic;
      color: #1a1a1a;
      border-bottom: 1px solid #B8860B;
      display: inline-block;
      padding: 0 40px 10px;
      margin-bottom: 30px;
    }
    .course-title {
      font-size: 28px;
      font-weight: bold;
      color: #2C5530;
      margin: 20px 0;
    }
    .details {
      color: #666;
      font-size: 12px;
      font-family: Arial, sans-serif;
      margin-top: 10px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
    }
    .footer-item {
      text-align: center;
      flex: 1;
    }
    .footer-label {
      color: #5D4E37;
      font-size: 14px;
      border-bottom: 1px solid #B8860B;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .footer-value {
      color: #1a1a1a;
      font-style: italic;
    }
    .verified-badge {
      background: #27ae60;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      display: inline-block;
      font-size: 12px;
      font-weight: bold;
      font-family: Arial, sans-serif;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="seal">★</div>
    <div class="header">CERTIFICATE</div>
    <div class="subheader">OF COMPLETION</div>
    <div class="divider"></div>
    <div class="certify-text">This is to certify that</div>
    <div class="student-name">${escapeHtml(studentName)}</div>
    <div class="certify-text">has successfully completed the course</div>
    <div class="course-title">"${escapeHtml(courseTitle)}"</div>
    ${courseDuration ? `<div class="details">Duration: ${escapeHtml(courseDuration)}</div>` : ''}
    ${grade ? `<div class="details">Grade: ${escapeHtml(grade)}</div>` : ''}
    <div class="divider"></div>
    <div class="footer">
      <div class="footer-item">
        <div class="footer-label">Instructor</div>
        <div class="footer-value">${escapeHtml(instructorName)}</div>
      </div>
      <div class="footer-item">
        <div class="footer-label">Date Issued</div>
        <div class="footer-value">${formattedDate}</div>
      </div>
      <div class="footer-item">
        <div class="footer-label">Certificate ID</div>
        <div class="footer-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${escapeHtml(certificateNumber)}</div>
      </div>
    </div>
    <div class="verified-badge">✓ VERIFIED</div>
  </div>
</body>
</html>
  `;
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Open print dialog with certificate
export const printCertificate = (data: CertificateData): void => {
  const html = generateCertificateHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
