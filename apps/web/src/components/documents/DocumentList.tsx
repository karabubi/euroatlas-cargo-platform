'use client';

import { useState } from 'react';

import {
  documentCategoryLabels,
  formatDocumentDate,
  formatFileSize,
  getDocumentFileType,
} from '@/lib/document-utils';
import {
  deleteShipmentDocument,
  downloadShipmentDocument,
} from '@/lib/documents-api';
import type { ShipmentDocument } from '@/types/document';

type DocumentListProps = {
  documents: ShipmentDocument[];
  onDeleted: (documentId: string) => void;
};

export default function DocumentList({
  documents,
  onDeleted,
}: DocumentListProps) {
  const [deletingDocumentId, setDeletingDocumentId] =
    useState<string | null>(null);

  const [downloadingDocumentId, setDownloadingDocumentId] =
    useState<string | null>(null);

  const [error, setError] = useState('');

  async function handleDownload(
    document: ShipmentDocument,
  ) {
    setError('');
    setDownloadingDocumentId(document.id);

    try {
      await downloadShipmentDocument(document);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The document could not be downloaded.',
      );
    } finally {
      setDownloadingDocumentId(null);
    }
  }

  async function handleDelete(
    document: ShipmentDocument,
  ) {
    const confirmed = window.confirm(
      `Delete "${document.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setDeletingDocumentId(document.id);

    try {
      await deleteShipmentDocument(document.id);
      onDeleted(document.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The document could not be deleted.',
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="font-semibold text-slate-700">
          No documents uploaded
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Upload the first document for this shipment.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {documents.map((document) => {
          const isDeleting =
            deletingDocumentId === document.id;

          const isDownloading =
            downloadingDocumentId === document.id;

          return (
            <article
              key={document.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {
                        documentCategoryLabels[
                          document.category
                        ]
                      }
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {getDocumentFileType(
                        document.mimeType,
                      )}
                    </span>
                  </div>

                  <h3 className="mt-3 break-words text-lg font-bold text-slate-950">
                    {document.title}
                  </h3>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {document.originalName}
                  </p>

                  {document.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {document.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>
                      {formatFileSize(document.size)}
                    </span>

                    <span>
                      Uploaded{' '}
                      {formatDocumentDate(
                        document.createdAt,
                      )}
                    </span>

                    {document.uploadedBy && (
                      <span>
                        By {document.uploadedBy}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void handleDownload(document)
                    }
                    disabled={
                      isDownloading || isDeleting
                    }
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDownloading
                      ? 'Downloading...'
                      : 'Download'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(document)
                    }
                    disabled={
                      isDeleting || isDownloading
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
