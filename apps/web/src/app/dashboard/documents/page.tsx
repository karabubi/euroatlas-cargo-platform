'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  deleteShipmentDocument,
  downloadShipmentDocument,
} from '@/lib/documents-api';
import {
  documentCategories,
  type DocumentCategory,
  type ShipmentDocument,
} from '@/types/document';
import { apiFetch } from '@/lib/api';

type DocumentWithShipment = ShipmentDocument & {
  shipment?: {
    id: string;
    shipmentNo: string;
  };
};

const categoryLabels: Record<DocumentCategory, string> = {
  BILL_OF_LADING: 'Bill of Lading',
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  CUSTOMS_DOCUMENT: 'Customs Document',
  VEHICLE_DOCUMENT: 'Vehicle Document',
  INSURANCE_DOCUMENT: 'Insurance Document',
  PROOF_OF_DELIVERY: 'Proof of Delivery',
  OTHER: 'Other',
};

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getFileType(document: ShipmentDocument): string {
  if (document.mimeType === 'application/pdf') {
    return 'PDF';
  }

  if (document.mimeType.startsWith('image/')) {
    return 'Image';
  }

  return 'File';
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export default function DocumentsPage() {
  const [documents, setDocuments] =
    useState<DocumentWithShipment[]>([]);

  const [search, setSearch] =
    useState('');

  const [category, setCategory] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const loadDocuments = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data =
          await apiFetch<DocumentWithShipment[]>(
            '/documents',
          );

        setDocuments(data);
        setError('');
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            'Documents could not be loaded.',
          ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Initial synchronization with the documents API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const cleanSearch =
      search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesCategory =
        !category ||
        document.category === category;

      const searchableValue = [
        document.title,
        document.originalName,
        document.description ?? '',
        document.category,
        document.shipment?.shipmentNo ?? '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !cleanSearch ||
        searchableValue.includes(cleanSearch);

      return matchesCategory && matchesSearch;
    });
  }, [category, documents, search]);

  const totalFileSize = useMemo(
    () =>
      documents.reduce(
        (total, document) =>
          total + document.size,
        0,
      ),
    [documents],
  );

  const pdfCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.mimeType ===
          'application/pdf',
      ).length,
    [documents],
  );

  const shipmentCount = useMemo(
    () =>
      new Set(
        documents
          .map(
            (document) =>
              document.shipmentId,
          )
          .filter(Boolean),
      ).size,
    [documents],
  );

  async function handleDownload(
    document: DocumentWithShipment,
  ) {
    setDownloadingId(document.id);
    setError('');
    setSuccessMessage('');

    try {
      await downloadShipmentDocument(document);

      setSuccessMessage(
        `${document.originalName} downloaded successfully.`,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'The document could not be downloaded.',
        ),
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(
    document: DocumentWithShipment,
  ) {
    const confirmed = window.confirm(
      `Delete "${document.title}" permanently?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(document.id);
    setError('');
    setSuccessMessage('');

    try {
      await deleteShipmentDocument(document.id);

      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (currentDocument) =>
            currentDocument.id !== document.id,
        ),
      );

      setSuccessMessage(
        `${document.title} was deleted.`,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'The document could not be deleted.',
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch('');
    setCategory('');
  }

  const filtersAreActive =
    Boolean(search.trim()) ||
    Boolean(category);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600">
            Document Management
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Documents
          </h1>

          <p className="mt-3 text-lg text-slate-600">
            Manage shipment files, customs documents,
            invoices and delivery records.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadDocuments(true)}
            disabled={isRefreshing}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <Link
            href="/dashboard/shipments"
            className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Open Shipments
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Documents"
          value={String(documents.length)}
        />

        <SummaryCard
          label="PDF Files"
          value={String(pdfCount)}
        />

        <SummaryCard
          label="Shipments"
          value={String(shipmentCount)}
        />

        <SummaryCard
          label="Total Storage"
          value={formatFileSize(totalFileSize)}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block font-semibold text-slate-800">
              Search
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Title, filename, shipment..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold text-slate-800">
              Category
            </span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">
                All categories
              </option>

              {documentCategories.map(
                (documentCategory) => (
                  <option
                    key={documentCategory}
                    value={documentCategory}
                  >
                    {
                      categoryLabels[
                        documentCategory
                      ]
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersAreActive}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Document records
            </h2>

            <p className="mt-1 text-slate-600">
              {filteredDocuments.length}{' '}
              document
              {filteredDocuments.length === 1
                ? ''
                : 's'}{' '}
              found
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-7 py-16 text-center text-slate-600">
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="px-7 py-16 text-center">
            <h3 className="text-xl font-bold text-slate-950">
              No documents found
            </h3>

            <p className="mt-2 text-slate-600">
              Upload documents from a shipment details
              page.
            </p>

            <Link
              href="/dashboard/shipments"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              View Shipments
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>
                    Document
                  </TableHeading>

                  <TableHeading>
                    Category
                  </TableHeading>

                  <TableHeading>
                    Shipment
                  </TableHeading>

                  <TableHeading>
                    Type
                  </TableHeading>

                  <TableHeading>
                    Size
                  </TableHeading>

                  <TableHeading>
                    Uploaded
                  </TableHeading>

                  <TableHeading>
                    Actions
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map(
                  (document) => (
                    <tr
                      key={document.id}
                      className="transition hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="max-w-[280px]">
                          <p className="font-bold text-slate-950">
                            {document.title}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {document.originalName}
                          </p>

                          {document.description ? (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                              {
                                document.description
                              }
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                          {
                            categoryLabels[
                              document.category
                            ]
                          }
                        </span>
                      </TableCell>

                      <TableCell>
                        {document.shipment ? (
                          <Link
                            href={`/dashboard/shipments/${document.shipment.id}`}
                            className="font-semibold text-sky-700 hover:underline"
                          >
                            {
                              document.shipment
                                .shipmentNo
                            }
                          </Link>
                        ) : (
                          <span className="text-slate-500">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {getFileType(document)}
                      </TableCell>

                      <TableCell>
                        {formatFileSize(
                          document.size,
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          document.createdAt,
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleDownload(
                                document,
                              )
                            }
                            disabled={
                              downloadingId ===
                              document.id
                            }
                            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {downloadingId ===
                            document.id
                              ? 'Downloading...'
                              : 'Download'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                document,
                              )
                            }
                            disabled={
                              deletingId ===
                              document.id
                            }
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId ===
                            document.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-4 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-6 py-5 align-top text-slate-700">
      {children}
    </td>
  );
}
