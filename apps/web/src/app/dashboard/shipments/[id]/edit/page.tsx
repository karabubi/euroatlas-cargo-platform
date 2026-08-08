'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react';

import { apiFetch } from '@/lib/api';

type Shipment = {
  id: string;
  shipmentNo: string;
  customerId: string;
  status: string;

  originCountry: string;
  originCity: string | null;
  originPort: string | null;

  destinationCountry: string;
  destinationCity: string | null;
  destinationPort: string | null;

  bookingReference: string | null;
  containerNumber: string | null;
  shippingLine: string | null;
  vesselName: string | null;
  voyageNumber: string | null;

  estimatedDeparture: string | null;
  actualDeparture: string | null;
  estimatedArrival: string | null;
  actualArrival: string | null;

  description: string | null;
  notes: string | null;
  isActive: boolean;
};

type ShipmentForm = {
  shipmentNo: string;
  originCountry: string;
  originCity: string;
  originPort: string;
  destinationCountry: string;
  destinationCity: string;
  destinationPort: string;
  bookingReference: string;
  containerNumber: string;
  shippingLine: string;
  vesselName: string;
  voyageNumber: string;
  estimatedDeparture: string;
  actualDeparture: string;
  estimatedArrival: string;
  actualArrival: string;
  description: string;
  notes: string;
  isActive: boolean;
};

const initialForm: ShipmentForm = {
  shipmentNo: '',
  originCountry: '',
  originCity: '',
  originPort: '',
  destinationCountry: '',
  destinationCity: '',
  destinationPort: '',
  bookingReference: '',
  containerNumber: '',
  shippingLine: '',
  vesselName: '',
  voyageNumber: '',
  estimatedDeparture: '',
  actualDeparture: '',
  estimatedArrival: '',
  actualArrival: '',
  description: '',
  notes: '',
  isActive: true,
};

function toDateInput(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function nullableText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function nullableDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

export default function EditShipmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const shipmentId = params.id;

  const [form, setForm] = useState<ShipmentForm>(initialForm);
  const [shipmentStatus, setShipmentStatus] = useState('');
  const [customerId, setCustomerId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function loadShipment() {
      setIsLoading(true);
      setError('');

      try {
        const shipment = await apiFetch<Shipment>(
          `/shipments/${shipmentId}`,
        );

        if (isCancelled) {
          return;
        }

        setCustomerId(shipment.customerId);
        setShipmentStatus(shipment.status);

        setForm({
          shipmentNo: shipment.shipmentNo ?? '',
          originCountry: shipment.originCountry ?? '',
          originCity: shipment.originCity ?? '',
          originPort: shipment.originPort ?? '',
          destinationCountry: shipment.destinationCountry ?? '',
          destinationCity: shipment.destinationCity ?? '',
          destinationPort: shipment.destinationPort ?? '',
          bookingReference: shipment.bookingReference ?? '',
          containerNumber: shipment.containerNumber ?? '',
          shippingLine: shipment.shippingLine ?? '',
          vesselName: shipment.vesselName ?? '',
          voyageNumber: shipment.voyageNumber ?? '',
          estimatedDeparture: toDateInput(
            shipment.estimatedDeparture,
          ),
          actualDeparture: toDateInput(
            shipment.actualDeparture,
          ),
          estimatedArrival: toDateInput(
            shipment.estimatedArrival,
          ),
          actualArrival: toDateInput(
            shipment.actualArrival,
          ),
          description: shipment.description ?? '',
          notes: shipment.notes ?? '',
          isActive: shipment.isActive,
        });
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The shipment could not be loaded.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    if (shipmentId) {
      void loadShipment();
    }

    return () => {
      isCancelled = true;
    };
  }, [shipmentId]);

  function handleInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleActiveChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      isActive: event.target.checked,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccessMessage('');

    if (!form.shipmentNo.trim()) {
      setError('Shipment number is required.');
      return;
    }

    if (!form.originCountry.trim()) {
      setError('Origin country is required.');
      return;
    }

    if (!form.destinationCountry.trim()) {
      setError('Destination country is required.');
      return;
    }

    setIsSaving(true);

    try {
      await apiFetch<Shipment>(
        `/shipments/${shipmentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            shipmentNo: form.shipmentNo.trim(),
            customerId,
originCountry: form.originCountry.trim(),
            originCity: nullableText(form.originCity),
            originPort: nullableText(form.originPort),

            destinationCountry:
              form.destinationCountry.trim(),
            destinationCity:
              nullableText(form.destinationCity),
            destinationPort:
              nullableText(form.destinationPort),

            bookingReference:
              nullableText(form.bookingReference),
            containerNumber:
              nullableText(form.containerNumber),
            shippingLine:
              nullableText(form.shippingLine),
            vesselName:
              nullableText(form.vesselName),
            voyageNumber:
              nullableText(form.voyageNumber),

            estimatedDeparture:
              nullableDate(form.estimatedDeparture),
            actualDeparture:
              nullableDate(form.actualDeparture),
            estimatedArrival:
              nullableDate(form.estimatedArrival),
            actualArrival:
              nullableDate(form.actualArrival),

            description:
              nullableText(form.description),
            notes: nullableText(form.notes),
            isActive: form.isActive,
          }),
        },
      );

      setSuccessMessage('Shipment updated successfully.');

      window.setTimeout(() => {
        router.push(
          `/dashboard/shipments/${shipmentId}`,
        );
        router.refresh();
      }, 700);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The shipment could not be updated.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">
          Loading shipment...
        </p>
      </section>
    );
  }

  if (error && !form.shipmentNo) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <Link
          href="/dashboard/shipments"
          className="mt-6 inline-block rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white"
        >
          Back to Shipments
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Shipment management
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Edit shipment
          </h1>

          <p className="mt-2 text-slate-600">
            Update shipment route, shipping information,
            dates and notes.
          </p>
        </div>

        <Link
          href={`/dashboard/shipments/${shipmentId}`}
          className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <FormSection title="General information">
          <TextInput
            label="Shipment number"
            name="shipmentNo"
            value={form.shipmentNo}
            onChange={handleInputChange}
            required
          />

          <ReadOnlyInput
            label="Status"
            value={shipmentStatus || '—'}
          />

          <ReadOnlyInput
            label="Customer ID"
            value={customerId || '—'}
          />

          <label className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={handleActiveChange}
              className="h-5 w-5 rounded border-slate-300"
            />

            <span className="font-semibold text-slate-700">
              Active shipment
            </span>
          </label>
        </FormSection>

        <FormSection title="Origin">
          <TextInput
            label="Origin country"
            name="originCountry"
            value={form.originCountry}
            onChange={handleInputChange}
            required
          />

          <TextInput
            label="Origin city"
            name="originCity"
            value={form.originCity}
            onChange={handleInputChange}
          />

          <TextInput
            label="Origin port"
            name="originPort"
            value={form.originPort}
            onChange={handleInputChange}
          />
        </FormSection>

        <FormSection title="Destination">
          <TextInput
            label="Destination country"
            name="destinationCountry"
            value={form.destinationCountry}
            onChange={handleInputChange}
            required
          />

          <TextInput
            label="Destination city"
            name="destinationCity"
            value={form.destinationCity}
            onChange={handleInputChange}
          />

          <TextInput
            label="Destination port"
            name="destinationPort"
            value={form.destinationPort}
            onChange={handleInputChange}
          />
        </FormSection>

        <FormSection title="Shipping information">
          <TextInput
            label="Booking reference"
            name="bookingReference"
            value={form.bookingReference}
            onChange={handleInputChange}
          />

          <TextInput
            label="Container number"
            name="containerNumber"
            value={form.containerNumber}
            onChange={handleInputChange}
          />

          <TextInput
            label="Shipping line"
            name="shippingLine"
            value={form.shippingLine}
            onChange={handleInputChange}
          />

          <TextInput
            label="Vessel name"
            name="vesselName"
            value={form.vesselName}
            onChange={handleInputChange}
          />

          <TextInput
            label="Voyage number"
            name="voyageNumber"
            value={form.voyageNumber}
            onChange={handleInputChange}
          />
        </FormSection>

        <FormSection title="Dates">
          <DateInput
            label="Estimated departure"
            name="estimatedDeparture"
            value={form.estimatedDeparture}
            onChange={handleInputChange}
          />

          <DateInput
            label="Actual departure"
            name="actualDeparture"
            value={form.actualDeparture}
            onChange={handleInputChange}
          />

          <DateInput
            label="Estimated arrival"
            name="estimatedArrival"
            value={form.estimatedArrival}
            onChange={handleInputChange}
          />

          <DateInput
            label="Actual arrival"
            name="actualArrival"
            value={form.actualArrival}
            onChange={handleInputChange}
          />
        </FormSection>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Additional information
          </h2>

          <div className="mt-6 grid gap-6">
            <TextArea
              label="Description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
            />

            <TextArea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleInputChange}
            />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/dashboard/shipments/${shipmentId}`}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? 'Saving...'
              : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

type FormSectionProps = {
  title: string;
  children: React.ReactNode;
};

function FormSection({
  title,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">
        {title}
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

type InputProps = {
  label: string;
  name: keyof ShipmentForm;
  value: string;
  required?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function TextInput({
  label,
  name,
  value,
  required = false,
  onChange,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? ' *' : ''}
      </span>

      <input
        type="text"
        name={name}
        value={value}
        required={required}
        onChange={onChange}
        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function DateInput({
  label,
  name,
  value,
  onChange,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

type TextAreaProps = {
  label: string;
  name: keyof ShipmentForm;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => void;
};

function TextArea({
  label,
  name,
  value,
  onChange,
}: TextAreaProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        rows={5}
        onChange={onChange}
        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

type ReadOnlyInputProps = {
  label: string;
  value: string;
};

function ReadOnlyInput({
  label,
  value,
}: ReadOnlyInputProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">
        {label}
      </p>

      <div className="mt-2 min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
        {value}
      </div>
    </div>
  );
}
