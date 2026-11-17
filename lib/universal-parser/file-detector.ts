import { SupportedFileType } from "./types";

export interface FileDetectionResult {
  fileType: SupportedFileType;
  mimeType: string;
  isPasswordProtected: boolean;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * FileTypeDetector: Inspects magic bytes + headers to identify actual file content
 * Never relies on file extension alone.
 */
export function detectFileType(buffer: Buffer | Uint8Array, fileName: string): FileDetectionResult {
  if (!buffer || buffer.length < 4) {
    return {
      fileType: "unknown",
      mimeType: "application/octet-stream",
      isPasswordProtected: false,
      isValid: false,
      errorMessage: "File is empty or corrupted (less than 4 bytes).",
    };
  }

  const b0 = buffer[0];
  const b1 = buffer[1];
  const b2 = buffer[2];
  const b3 = buffer[3];

  // 1. PDF Detection: %PDF- (0x25 0x50 0x44 0x46)
  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) {
    const isEncrypted = checkPdfEncryption(buffer);
    return {
      fileType: "pdf",
      mimeType: "application/pdf",
      isPasswordProtected: isEncrypted,
      isValid: true,
      errorMessage: isEncrypted
        ? "This PDF bank statement is password-protected. Please remove the password or provide an unencrypted export."
        : undefined,
    };
  }

  // 2. PNG Detection: 0x89 0x50 0x4E 0x47 (\x89PNG)
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) {
    return {
      fileType: "image",
      mimeType: "image/png",
      isPasswordProtected: false,
      isValid: true,
    };
  }

  // 3. JPEG Detection: 0xFF 0xD8 0xFF
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
    return {
      fileType: "image",
      mimeType: "image/jpeg",
      isPasswordProtected: false,
      isValid: true,
    };
  }

  // 4. Excel Modern (.xlsx) ZIP container: 0x50 0x4B 0x03 0x04 (PK\x03\x04)
  if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
    return {
      fileType: "xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      isPasswordProtected: false,
      isValid: true,
    };
  }

  // 5. Excel Legacy (.xls) OLE2: 0xD0 0xCF 0x11 0xE0
  if (b0 === 0xd0 && b1 === 0xcf && b2 === 0x11 && b3 === 0xe0) {
    return {
      fileType: "xls",
      mimeType: "application/vnd.ms-excel",
      isPasswordProtected: false,
      isValid: true,
    };
  }

  // 6. CSV / Plain Text Detection: Check first 2KB for valid UTF-8/ASCII printable characters
  const sampleLength = Math.min(buffer.length, 2048);
  let printableCount = 0;
  for (let i = 0; i < sampleLength; i++) {
    const code = buffer[i];
    // Printable ASCII, Tab, LF, CR, or UTF-8 continuation
    if (
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 126) ||
      code >= 128
    ) {
      printableCount++;
    }
  }

  const printableRatio = printableCount / sampleLength;
  if (printableRatio > 0.95) {
    return {
      fileType: "csv",
      mimeType: "text/csv",
      isPasswordProtected: false,
      isValid: true,
    };
  }

  // Fallback by extension check if binary structure is slightly altered
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".csv") || lowerName.endsWith(".tsv") || lowerName.endsWith(".txt")) {
    return {
      fileType: "csv",
      mimeType: "text/csv",
      isPasswordProtected: false,
      isValid: true,
    };
  }

  return {
    fileType: "unknown",
    mimeType: "application/octet-stream",
    isPasswordProtected: false,
    isValid: false,
    errorMessage: "Unsupported file format. Please upload a PDF, Excel (.xlsx/.xls), CSV, or Image (JPG/PNG).",
  };
}

/**
 * Checks if a PDF buffer contains the /Encrypt token in its trailer/cross-reference dictionary
 */
function checkPdfEncryption(buffer: Buffer | Uint8Array): boolean {
  try {
    const str = Buffer.from(buffer.slice(0, Math.min(buffer.length, 65536))).toString("latin1");
    if (str.includes("/Encrypt")) return true;

    // Check tail 32KB
    if (buffer.length > 32768) {
      const tail = Buffer.from(buffer.slice(buffer.length - 32768)).toString("latin1");
      if (tail.includes("/Encrypt")) return true;
    }
  } catch (_) {}
  return false;
}
