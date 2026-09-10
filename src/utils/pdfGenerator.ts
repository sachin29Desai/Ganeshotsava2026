import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

/**
 * Returns a standardized document title as requested:
 * "Ganeshotsava2026_ receipt_<flat>" (e.g. "Ganeshotsava2026_ receipt_J-1707")
 */
export function getReceiptDocumentTitle(
  isReceipt: boolean,
  rawNum?: string | number,
  rawFlat?: string | number,
  isSeva?: boolean
): string {
  const flatStr = String(rawFlat || '').trim();
  const numStr = String(rawNum || '').trim();
  const typePart = isReceipt ? (isSeva ? 'seva_receipt' : 'receipt') : 'invoice';

  const cleanFlat = flatStr.replace(/^flat\s*[-:]?\s*/i, '').trim();

  if (cleanFlat) {
    const sanitizedFlat = cleanFlat.replace(/[/\\?%*:|"<>]/g, '-').trim();
    return `Ganeshotsava2026_ ${typePart}_${sanitizedFlat}`;
  }

  if (numStr) {
    const sanitizedNum = numStr.replace(/[/\\?%*:|"<>]/g, '-').trim();
    return `Ganeshotsava2026_ ${typePart}_${sanitizedNum}`;
  }

  return `Ganeshotsava2026_ ${typePart}`;
}

/**
 * Returns a standardized filename using the document title:
 * e.g. "Ganeshotsava2026_ receipt_J-1707.pdf"
 */
export function getReceiptPdfFilename(
  isReceipt: boolean,
  rawNum?: string | number,
  rawFlat?: string | number,
  isSeva?: boolean
): string {
  const docTitle = getReceiptDocumentTitle(isReceipt, rawNum, rawFlat, isSeva);
  return `${docTitle}.pdf`;
}

/**
 * Triggers a direct browser download of a Blob as a file,
 * without opening any print modal or iframe.
 */
export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 1000);
}

/**
 * Generates a PDF Blob directly from an HTML element using html2canvas + jsPDF.
 * Never opens print windows or causes unresponsiveness.
 */
export async function generateReceiptPdfBlob(
  element: HTMLElement,
  options?: { quality?: number; scale?: number }
): Promise<Blob> {
  const scale = options?.scale || 2;
  const quality = options?.quality || 0.96;

  // Wait for all fonts and images inside the element to load completely
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors if any
    }
  }

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 800);
      });
    })
  );

  const setupClonedElement = (clonedDoc: Document) => {
    const clonedTarget = clonedDoc.getElementById('receipt-print-target');
    if (clonedTarget) {
      clonedTarget.style.width = '580px';
      clonedTarget.style.maxWidth = '580px';
      clonedTarget.style.minWidth = '580px';
      clonedTarget.style.boxSizing = 'border-box';
      clonedTarget.style.overflow = 'hidden';
      clonedTarget.style.position = 'relative';
      clonedTarget.style.margin = '0 auto';
      const watermark = clonedTarget.querySelector('.ganesha-watermark') as HTMLElement | null;
      if (watermark) {
        watermark.style.position = 'absolute';
        watermark.style.top = '0';
        watermark.style.left = '0';
        watermark.style.right = '0';
        watermark.style.bottom = '0';
        watermark.style.width = '100%';
        watermark.style.height = '100%';
        watermark.style.maxWidth = '100%';
        watermark.style.maxHeight = '100%';
        watermark.style.overflow = 'hidden';
        const img = watermark.querySelector('img') as HTMLElement | null;
        if (img) {
          img.style.display = 'block';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'fill';
          img.style.margin = '0';
          img.style.padding = '0';
        }
      }
    }
  };

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 6000,
      windowWidth: 750,
      onclone: setupClonedElement
    });
  } catch (err) {
    console.warn('html2canvas standard pass failed, retrying with lower scale:', err);
    canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 750,
      onclone: setupClonedElement
    });
  }

  // Create A4 PDF in portrait mode
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210; // mm
  const pageHeight = 297; // mm
  const margin = 10; // 10mm margin
  const printWidth = pageWidth - margin * 2;
  const printHeight = pageHeight - margin * 2;

  const contentHeight = (canvas.height * printWidth) / canvas.width;
  const posX = margin;
  // Center vertically if it fits on a single page, otherwise top-aligned
  const posY = contentHeight < printHeight ? margin + (printHeight - contentHeight) / 2 : margin;
  const targetHeight = Math.min(contentHeight, printHeight);

  const imgData = canvas.toDataURL('image/jpeg', quality);
  pdf.addImage(imgData, 'JPEG', posX, posY, printWidth, targetHeight, undefined, 'FAST');

  return pdf.output('blob');
}

export interface BulkPdfProgress {
  current: number;
  total: number;
  percent: number;
  currentItemName?: string;
}

/**
 * Generates a consolidated multi-page PDF Blob containing multiple receipts.
 * Designed for bulk saving to device without freezing the UI.
 */
export async function generateBulkReceiptsPdfBlob(
  elements: HTMLElement[],
  onProgress?: (progress: BulkPdfProgress) => void,
  options?: { scale?: number; quality?: number; twoPerPage?: boolean }
): Promise<Blob> {
  const scale = options?.scale || 1.6;
  const quality = options?.quality || 0.92;
  const twoPerPage = Boolean(options?.twoPerPage);

  if (!elements || elements.length === 0) {
    throw new Error('No receipt elements provided for bulk PDF generation.');
  }

  // Wait for fonts and images
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  // Wait for all images in elements
  const allImages = elements.flatMap(el => Array.from(el.querySelectorAll('img')));
  await Promise.all(
    allImages.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 800);
      });
    })
  );

  const setupClonedElement = (clonedDoc: Document) => {
    const clonedTargets = clonedDoc.querySelectorAll('.bulk-receipt-card');
    clonedTargets.forEach(target => {
      const el = target as HTMLElement;
      el.style.width = '580px';
      el.style.maxWidth = '580px';
      el.style.minWidth = '580px';
      el.style.boxSizing = 'border-box';
      el.style.overflow = 'hidden';
      el.style.position = 'relative';
      el.style.margin = '0 auto';
      const watermark = el.querySelector('.ganesha-watermark') as HTMLElement | null;
      if (watermark) {
        watermark.style.position = 'absolute';
        watermark.style.top = '0';
        watermark.style.left = '0';
        watermark.style.right = '0';
        watermark.style.bottom = '0';
        watermark.style.width = '100%';
        watermark.style.height = '100%';
        const img = watermark.querySelector('img') as HTMLElement | null;
        if (img) {
          img.style.display = 'block';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'fill';
        }
      }
    });
  };

  // Create A4 PDF in portrait mode
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210; // mm
  const pageHeight = 297; // mm
  const margin = twoPerPage ? 8 : 10;
  const printWidth = pageWidth - margin * 2;
  const printHeight = pageHeight - margin * 2;

  let pageOpen = false;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const itemName = el.getAttribute('data-rcpt-title') || `Receipt ${i + 1}`;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: elements.length,
        percent: Math.round(((i) / elements.length) * 100),
        currentItemName: itemName
      });
    }

    // Yield control so the UI can update
    await new Promise(r => setTimeout(r, 25));

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 5000,
        windowWidth: 720,
        onclone: setupClonedElement
      });
    } catch (err) {
      console.warn('html2canvas standard pass failed on item', i, err);
      canvas = await html2canvas(el, {
        scale: 1.3,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 720,
        onclone: setupClonedElement
      });
    }

    const imgData = canvas.toDataURL('image/jpeg', quality);

    if (!twoPerPage) {
      // 1 receipt per page
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      const contentHeight = (canvas.height * printWidth) / canvas.width;
      const targetHeight = Math.min(contentHeight, printHeight);
      const posY = contentHeight < printHeight ? margin + (printHeight - contentHeight) / 2 : margin;
      pdf.addImage(imgData, 'JPEG', margin, posY, printWidth, targetHeight, undefined, 'FAST');
    } else {
      // 2 receipts per page
      const isFirstOnPage = (i % 2 === 0);
      if (i > 0 && isFirstOnPage) {
        pdf.addPage('a4', 'portrait');
      }

      const halfHeight = (printHeight - 6) / 2;
      const contentHeight = (canvas.height * printWidth) / canvas.width;
      const targetHeight = Math.min(contentHeight, halfHeight);

      if (isFirstOnPage) {
        const posY = margin + (halfHeight - targetHeight) / 2;
        pdf.addImage(imgData, 'JPEG', margin, posY, printWidth, targetHeight, undefined, 'FAST');
      } else {
        // Second on page
        // Draw subtle dashed cutting separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(margin, margin + halfHeight + 3, pageWidth - margin, margin + halfHeight + 3);
        pdf.setLineDashPattern([], 0); // reset

        const posY = margin + halfHeight + 6 + (halfHeight - targetHeight) / 2;
        pdf.addImage(imgData, 'JPEG', margin, posY, printWidth, targetHeight, undefined, 'FAST');
      }
    }
  }

  if (onProgress) {
    onProgress({
      current: elements.length,
      total: elements.length,
      percent: 100,
      currentItemName: 'Complete'
    });
  }

  return pdf.output('blob');
}

/**
 * Triggers bulk direct printing of styled HTML receipts across multi-page A4 sheets
 */
export function triggerBulkDirectPrint(
  htmlContent: string,
  title = 'Ganeshotsava 2026 - Bulk Receipts'
): void {
  const oldFrame = document.getElementById('bulk-receipts-print-iframe');
  if (oldFrame) oldFrame.remove();

  const printFrame = document.createElement('iframe');
  printFrame.id = 'bulk-receipts-print-iframe';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.style.opacity = '0';
  printFrame.style.pointerEvents = 'none';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
  if (!frameDoc) return;

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
    .join('\n');

  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        ${styles}
        <style>
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #fff !important; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
          .font-serif { font-family: 'Playfair Display', Georgia, serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .font-signature { font-family: 'Great Vibes', 'Dancing Script', cursive; }
          
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          .bulk-print-page {
            page-break-after: always;
            break-after: page;
            margin: 0 auto;
            max-width: 620px;
            padding-top: 15px;
            padding-bottom: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: calc(100vh - 20mm);
          }
          
          .bulk-print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .bulk-receipt-card {
            width: 100% !important;
            max-width: 580px !important;
            margin: 0 auto !important;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  frameDoc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch (e) {
      console.error('Frame print failed:', e);
    }
  }, 700);
}

/**
 * Determines the filename for an individual receipt:
 * - If flat is present and not empty, uses flat name (e.g. "A-101.pdf" or "Tower 1 - 402.pdf")
 * - If flat is empty, uses contributor's name (e.g. "Sachin Desai.pdf")
 * - Sanitizes illegal characters for file systems
 * - Ensures unique filename if multiple receipts have the same flat/name
 */
export function getBulkIndividualReceiptFilename(
  item: { flat?: string; name?: string; rcptNo?: string; tokNo?: string; seva?: string; recordType?: string },
  usedNamesSet?: Set<string>,
  suffixRcptNoIfDuplicate = true
): string {
  const flatStr = (item.flat || '').trim();
  const nameStr = (item.name || '').trim();
  const rcptStr = (item.rcptNo || item.tokNo || '').trim();
  const sevaStr = (item.seva || '').trim();

  // If flat name is present, use flat; if flat is empty, use the name
  let base = flatStr ? flatStr : (nameStr || rcptStr || 'Receipt');
  if (sevaStr && (item.tokNo || item.recordType === 'seva')) {
    base = `${base}_${sevaStr}`;
  }

  // Clean and sanitize filename for operating systems
  base = base
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  let finalName = `${base}.pdf`;

  if (usedNamesSet) {
    const lower = finalName.toLowerCase();
    if (usedNamesSet.has(lower)) {
      if (suffixRcptNoIfDuplicate && rcptStr) {
        const cleanRcpt = rcptStr.replace(/[/\\?%*:|"<>]/g, '-').trim();
        finalName = `${base}_${cleanRcpt}.pdf`;
      }
      let counter = 2;
      while (usedNamesSet.has(finalName.toLowerCase())) {
        finalName = `${base} (${counter}).pdf`;
        counter++;
      }
    }
    usedNamesSet.add(finalName.toLowerCase());
  }

  return finalName;
}

export interface GeneratedReceiptFile {
  filename: string;
  blob: Blob;
  receiptNo: string;
  name: string;
  flat: string;
}

/**
 * Generates an array of individual high-resolution single-page PDF Blobs,
 * each named with the flat (or contributor name if flat is empty).
 */
export async function generateIndividualReceiptPdfBlobs(
  elements: HTMLElement[],
  items: Array<{ id?: string; flat?: string; name?: string; rcptNo?: string }>,
  onProgress?: (progress: BulkPdfProgress) => void,
  options?: { scale?: number; quality?: number }
): Promise<GeneratedReceiptFile[]> {
  const scale = options?.scale || 1.8;
  const quality = options?.quality || 0.94;

  if (!elements || elements.length === 0) {
    throw new Error('No receipt elements provided for individual PDF generation.');
  }

  // Ensure fonts and images are loaded
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const allImages = elements.flatMap(el => Array.from(el.querySelectorAll('img')));
  await Promise.all(
    allImages.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 600);
      });
    })
  );

  const results: GeneratedReceiptFile[] = [];
  const usedNamesSet = new Set<string>();

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const item = items[i] || {};
    const filename = getBulkIndividualReceiptFilename(item, usedNamesSet);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: elements.length,
        percent: Math.round(((i) / elements.length) * 100),
        currentItemName: filename
      });
    }

    // Yield control for browser UI updates
    await new Promise(r => setTimeout(r, 20));

    const pdfBlob = await generateReceiptPdfBlob(el, { scale, quality });

    results.push({
      filename,
      blob: pdfBlob,
      receiptNo: item.rcptNo || '',
      name: item.name || '',
      flat: item.flat || ''
    });
  }

  if (onProgress) {
    onProgress({
      current: elements.length,
      total: elements.length,
      percent: 100,
      currentItemName: 'Complete'
    });
  }

  return results;
}

/**
 * Packages multiple individual PDF Blobs into a ZIP archive
 */
export async function createZipFromReceiptPdfs(
  files: GeneratedReceiptFile[],
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  files.forEach(f => {
    zip.file(f.filename, f.blob);
  });

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    metadata => {
      if (onZipProgress) onZipProgress(Math.round(metadata.percent));
    }
  );
}

/**
 * Sequentially triggers individual file downloads for each PDF file to device
 */
export async function downloadFilesSequentially(
  files: GeneratedReceiptFile[],
  delayMs = 250,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    downloadBlobAsFile(files[i].blob, files[i].filename);
    if (onProgress) onProgress(i + 1, files.length);
    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

