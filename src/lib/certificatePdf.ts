import { jsPDF } from 'jspdf';

export interface CertificatePdfData {
  studentName: string;
  eventTitle: string;
  eventDate: string;
  department: string;
  coordinatorName: string;
  verificationCode: string;
}

/**
 * Generates and downloads a professional academic PDF certificate with branding and embedded QR.
 */
export const generateCertificatePdf = async (cert: CertificatePdfData, collegeName: string) => {
  // Create PDF landscape, A4 (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth(); // 297
  const height = doc.internal.pageSize.getHeight(); // 210

  // 1. Draw elegant borders and backgrounds
  // Border 1: Outer dark navy border
  doc.setDrawColor(15, 23, 42); // slate-900 (#0f172a)
  doc.setLineWidth(1.5);
  doc.rect(8, 8, width - 16, height - 16);

  // Border 2: Inner gold border
  doc.setDrawColor(217, 119, 6); // amber-600 (#d97706)
  doc.setLineWidth(0.8);
  doc.rect(11, 11, width - 22, height - 22);

  // Draw elegant corner ornaments
  doc.setFillColor(15, 23, 42);
  doc.triangle(11, 11, 25, 11, 11, 25, 'F');
  doc.triangle(width - 11, 11, width - 25, 11, width - 11, 25, 'F');
  doc.triangle(11, height - 11, 25, height - 11, 11, height - 25, 'F');
  doc.triangle(width - 11, height - 11, width - 25, height - 11, width - 11, height - 25, 'F');

  // 2. Add CampusConnect branding header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229); // Indigo-600 (#4f46e5)
  doc.text('CAMPUSCONNECT ACADEMIC REGISTRY', width / 2, 24, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('STATE-ACCREDITED STUDENT DEVELOPMENT FRAMEWORK', width / 2, 29, { align: 'center' });

  // Draw separator line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(40, 34, width - 40, 34);

  // 3. College Name & Heading
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(collegeName.toUpperCase(), width / 2, 45, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('This is to certify that the digital academic credential has been awarded to', width / 2, 55, { align: 'center' });

  // 4. Student Full Name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text(cert.studentName.toUpperCase(), width / 2, 72, { align: 'center' });

  // Thin underline for the name
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - 50, 76, width / 2 + 50, 76);

  // 5. Course of event participation text
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('for successful completion of the campus academic activity', width / 2, 86, { align: 'center' });

  // 6. Event Name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(`"${cert.eventTitle.toUpperCase()}"`, width / 2, 100, { align: 'center' });

  // 7. Event Date & Details
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`held on ${cert.eventDate} under the department of`, width / 2, 112, { align: 'center' });

  // Department name
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(cert.department.toUpperCase(), width / 2, 122, { align: 'center' });

  // 8. Signatures & QR Code Footer Area
  const footerY = 142;

  // Draw coordinator authority signature
  // Draw simulated signature graphics
  doc.setFont('Times-Roman', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(79, 70, 229);
  doc.text(cert.coordinatorName, width - 65, footerY + 10, { align: 'center' });

  // Draw signature line
  doc.setDrawColor(148, 163, 184); // Slate-400
  doc.setLineWidth(0.5);
  doc.line(width - 95, footerY + 14, width - 35, footerY + 14);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('ISSUING COORDINATOR', width - 65, footerY + 19, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(cert.department.toUpperCase(), width - 65, footerY + 23, { align: 'center' });

  // Left Side: Verification Code details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CREDENTIAL ID / SECURE BLOCK', 35, footerY + 5);

  doc.setFont('Courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(cert.verificationCode, 35, footerY + 11);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued On: ${new Date().toLocaleDateString()}`, 35, footerY + 16);
  doc.text('Verify status with QR or Registry Link', 35, footerY + 20);

  // Center: QR Code Verification
  const verifyUrl = `${window.location.origin}/verify/${cert.verificationCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  try {
    const qrImg = await loadQrImage(qrUrl);
    doc.addImage(qrImg, 'PNG', width / 2 - 15, footerY, 30, 30);
  } catch (err) {
    console.error("Failed to load QR code for PDF, creating PDF without QR:", err);
  }

  // Draw tiny info text under QR code
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('SCAN TO VERIFY', width / 2, footerY + 34, { align: 'center' });

  // Save/Download the PDF
  const filename = `Certificate_${cert.studentName.replace(/\s+/g, '_')}_${cert.verificationCode}.pdf`;
  doc.save(filename);
};

// Helper to load image as HTMLImageElement
const loadQrImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important to bypass CORS
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};
