import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type {
  ShipmentDocument,
  ShipmentDocumentResponse,
  UploadShipmentDocumentInput,
} from '@/types/document';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export function getShipmentDocuments(
  shipmentId: string,
): Promise<ShipmentDocumentResponse> {
  return apiFetch<ShipmentDocumentResponse>(
    `/documents/shipment/${shipmentId}`,
  );
}

export function uploadShipmentDocument(
  input: UploadShipmentDocumentInput,
): Promise<ShipmentDocument> {
  const formData = new FormData();

  formData.append('title', input.title);
  formData.append('category', input.category);
  formData.append(
    'description',
    input.description ?? '',
  );
  formData.append('file', input.file);

  return apiFetch<ShipmentDocument>(
    `/documents/shipment/${input.shipmentId}`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export function deleteShipmentDocument(
  documentId: string,
): Promise<{
  message: string;
  id: string;
}> {
  return apiFetch<{
    message: string;
    id: string;
  }>(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export async function downloadShipmentDocument(
  document: ShipmentDocument,
): Promise<void> {
  const token =
    typeof window !== 'undefined'
      ? getAccessToken()
      : null;

  if (!token) {
    throw new Error(
      'No authentication token was found. Please log in again.',
    );
  }

  const response = await fetch(
    `${API_URL}/documents/${document.id}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Download failed with status ${response.status}`,
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = objectUrl;
  link.download =
    document.originalName || document.title;

  window.document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}
