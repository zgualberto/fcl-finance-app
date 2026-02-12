import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

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

function downloadPdfWeb(pdf: jsPDF, fileName: string): PdfExportResult {
  const safeFileName = ensurePdfExtension(fileName);
  pdf.save(safeFileName);
  return {
    fileName: safeFileName,
    uri: '',
  };
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

  // Check if running on native platform
  if (!Capacitor.isNativePlatform()) {
    return downloadPdfWeb(pdf, fileName);
  }

  try {
    const pdfData = pdf.output('arraybuffer');
    const safeFileName = ensurePdfExtension(fileName);
    const base64Data = arrayBufferToBase64(pdfData);

    // Check and request permissions
    console.log('Checking filesystem permissions...');
    const permissions = await Filesystem.checkPermissions();
    console.log('Permission result:', permissions);

    let hasPermission = false;

    if (permissions.publicStorage !== 'granted') {
      console.log('Requesting publicStorage permission...');
      const requestResult = await Filesystem.requestPermissions();
      console.log('Permission request result:', requestResult);
      hasPermission = requestResult.publicStorage === 'granted';
    } else {
      hasPermission = true;
    }

    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant permission in app settings.');
    }

    // Save to Downloads folder
    console.log('Writing to Downloads folder...');
    await Filesystem.writeFile({
      path: `Download/${safeFileName}`,
      data: base64Data,
      directory: Directory.External,
    });

    const uriResult = await Filesystem.getUri({
      path: `Download/${safeFileName}`,
      directory: Directory.External,
    });

    console.log('File saved to:', uriResult.uri);

    return {
      fileName: safeFileName,
      uri: uriResult.uri,
    };
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
}
