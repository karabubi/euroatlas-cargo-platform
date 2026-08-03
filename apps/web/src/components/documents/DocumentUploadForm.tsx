'use client';

import {
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { documentCategoryLabels } from '@/lib/document-utils';
import { uploadShipmentDocument } from '@/lib/documents-api';
import {
  documentCategories,
  type DocumentCategory,
  type ShipmentDocument,
} from '@/types/document';

type DocumentUploadFormProps = {
  shipmentId: string;
  onUploaded: (document: ShipmentDocument) => void;
};

const MAXIMUM_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export default function DocumentUploadForm({
  shipmentId,
  onUploaded,
}: DocumentUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<DocumentCategory>('BILL_OF_LADING');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  function resetForm() {
    setTitle('');
    setCategory('BILL_OF_LADING');
    setDescription('');
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccessMessage('');

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Please enter a document title.');
      return;
    }

    if (!file) {
      setError('Please select a document file.');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(
        'Only PDF, JPG, PNG and WebP files are allowed.',
      );
      return;
    }

    if (file.size > MAXIMUM_FILE_SIZE) {
      setError(
        'The selected file is larger than 10 MB.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedDocument =
        await uploadShipmentDocument({
          shipmentId,
          title: cleanTitle,
          category,
          description:
            description.trim() || undefined,
          file,
        });

      onUploaded(uploadedDocument);
      resetForm();

      setSuccessMessage(
        'Document uploaded successfully.',
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The document could not be uploaded.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-950">
          Upload document
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          Add a PDF or image to this shipment.
          Maximum file size: 10 MB.
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Title
          </span>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            maxLength={120}
            placeholder="Commercial Invoice"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Category
          </span>

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as DocumentCategory,
              )
            }
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {documentCategories.map(
              (categoryValue) => (
                <option
                  key={categoryValue}
                  value={categoryValue}
                >
                  {
                    documentCategoryLabels[
                      categoryValue
                    ]
                  }
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-700">
          Description
        </span>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          maxLength={500}
          rows={3}
          placeholder="Optional document description"
          disabled={isSubmitting}
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-700">
          File
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(event) => {
            setError('');
            setSuccessMessage('');

            const selectedFile =
              event.target.files?.[0] ?? null;

            setFile(selectedFile);
          }}
          disabled={isSubmitting}
          className="mt-2 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      {file && (
        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">
          Selected: {file.name}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? 'Uploading...'
          : 'Upload Document'}
      </button>
    </form>
  );
}
