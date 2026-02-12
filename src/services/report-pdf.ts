import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Directory, Filesystem } from '@capacitor/filesystem';

export interface PdfExportResult {
  fileName: string;
  uri: string;
}

function ensurePdfExtension(fileName: string): string {
  if (fileName.toLowerCase().endsWith('.pdf')) {
    return fileName;
  }
  return `${fileName}.pdf`;
}

function arrayBufferToBase64(data: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(data);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
): Promise<PdfExportResult> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let position = 0;
  let remainingHeight = imgHeight;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  remainingHeight -= pdfHeight;

  while (remainingHeight > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    remainingHeight -= pdfHeight;
  }

  const pdfData = pdf.output('arraybuffer');
  const safeFileName = ensurePdfExtension(fileName);
  const base64Data = arrayBufferToBase64(pdfData);

  await Filesystem.writeFile({
    path: safeFileName,
    data: base64Data,
    directory: Directory.Documents,
  });

  const uriResult = await Filesystem.getUri({
    path: safeFileName,
    directory: Directory.Documents,
  });

  return {
    fileName: safeFileName,
    uri: uriResult.uri,
  };
}
