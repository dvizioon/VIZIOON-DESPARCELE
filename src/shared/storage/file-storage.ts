export interface StoredFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface FileStorage {
  save(file: StoredFile, folder: string): Promise<string>;
  remove(storedUrl: string): Promise<void>;
}

export const RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type ReceiptMimeType = (typeof RECEIPT_MIME_TYPES)[number];

export function isReceiptMimeType(value: string): value is ReceiptMimeType {
  return (RECEIPT_MIME_TYPES as readonly string[]).includes(value);
}
