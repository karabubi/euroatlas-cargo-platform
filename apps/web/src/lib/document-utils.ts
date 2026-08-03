import type {
  DocumentCategory,
} from '@/types/document';

export const documentCategoryLabels: Record<
  DocumentCategory,
  string
> = {
  BILL_OF_LADING: 'Bill of Lading',
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  CUSTOMS_DOCUMENT: 'Customs Document',
  VEHICLE_DOCUMENT: 'Vehicle Document',
  INSURANCE_DOCUMENT: 'Insurance Document',
  PROOF_OF_DELIVERY: 'Proof of Delivery',
  OTHER: 'Other',
};

export function formatFileSize(
  bytes: number,
): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  const units = [
    'B',
    'KB',
    'MB',
    'GB',
  ];

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value =
    bytes / Math.pow(1024, unitIndex);

  return `${value.toFixed(
    unitIndex === 0 ? 0 : 1,
  )} ${units[unitIndex]}`;
}

export function formatDocumentDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getDocumentFileType(
  mimeType: string,
): string {
  if (mimeType === 'application/pdf') {
    return 'PDF';
  }

  if (mimeType.startsWith('image/')) {
    return 'Image';
  }

  return 'File';
}
