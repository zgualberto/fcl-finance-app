import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PrintReportOptions {
  reportElement: HTMLElement;
  selectedMonth: string;
  shareTitle?: string;
  shareText?: string;
  dialogTitle?: string;
}

function buildTimestampWithSeconds(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

async function ensureReportsDirectory(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: 'reports',
      directory: Directory.Cache,
      recursive: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }
}

function renderCanvasToA4PdfBase64(canvas: HTMLCanvasElement): string {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imageData = canvas.toDataURL('image/png', 1.0);
  const imageHeight = (canvas.height * contentWidth) / canvas.width;

  let remainingHeight = imageHeight;
  let positionY = margin;

  pdf.addImage(imageData, 'PNG', margin, positionY, contentWidth, imageHeight, undefined, 'FAST');
  remainingHeight -= contentHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    positionY = margin - (imageHeight - remainingHeight);
    pdf.addImage(imageData, 'PNG', margin, positionY, contentWidth, imageHeight, undefined, 'FAST');
    remainingHeight -= contentHeight;
  }

  const pdfDataUri = pdf.output('datauristring');
  return pdfDataUri.split(',')[1] ?? '';
}

export async function printReportAsPdf(options: PrintReportOptions): Promise<void> {
  const {
    reportElement,
    selectedMonth,
    shareTitle = 'Financial Report',
    shareText = 'Financial Report',
    dialogTitle = 'Share Report',
  } = options;

  const canvas = await html2canvas(reportElement, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  const base64Pdf = renderCanvasToA4PdfBase64(canvas);
  const timestamp = buildTimestampWithSeconds(new Date());
  const fileName = `report-${selectedMonth}-${timestamp}.pdf`;
  const filePath = `reports/${fileName}`;

  await ensureReportsDirectory();

  await Filesystem.writeFile({
    path: filePath,
    data: base64Pdf,
    directory: Directory.Cache,
    recursive: true,
  });

  const fileUri = await Filesystem.getUri({
    path: filePath,
    directory: Directory.Cache,
  });

  await Share.share({
    title: shareTitle,
    text: shareText,
    url: fileUri.uri,
    dialogTitle,
  });
}
