"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { getShipments } from "@/lib/shipments-api";
import type { Shipment } from "@/types/shipment";
import type { CreateVehicleInput } from "@/types/vehicle";

type VehicleFormProps = {
  onSubmit: (
    data: CreateVehicleInput,
  ) => Promise<void> | void;
};

type VehicleFormState = {
  shipmentId: string;
  vin: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  purchasePrice: string;
  declaredValue: string;
  hasKeys: boolean;
  isRunning: boolean;
  hasDamage: boolean;
  damageDescription: string;
  notes: string;
};

const initialFormState: VehicleFormState = {
  shipmentId: "",
  vin: "",
  make: "",
  model: "",
  year: "",
  color: "",
  vehicleType: "",
  fuelType: "",
  transmission: "",
  purchasePrice: "",
  declaredValue: "",
  hasKeys: true,
  isRunning: true,
  hasDamage: false,
  damageDescription: "",
  notes: "",
};

function getCustomerName(shipment: Shipment): string {
  const customer = shipment.customer;

  if (!customer) {
    return "Unknown customer";
  }

  if (customer.companyName?.trim()) {
    return customer.companyName;
  }

  const fullName = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unknown customer";
}

function getShipmentLabel(shipment: Shipment): string {
  const customerName = getCustomerName(shipment);

  return [
    shipment.shipmentNo,
    customerName,
    `${shipment.originCountry} → ${shipment.destinationCountry}`,
  ].join(" — ");
}

function optionalText(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  return Number(value);
}

export default function VehicleForm({
  onSubmit,
}: VehicleFormProps) {
  const [form, setForm] =
    useState<VehicleFormState>(initialFormState);

  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [isLoadingShipments, setIsLoadingShipments] =
    useState(true);

  const [shipmentError, setShipmentError] =
    useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadShipments() {
      try {
        setShipmentError("");

        const data = await getShipments();

        if (isMounted) {
          setShipments(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setShipmentError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load shipments.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingShipments(false);
        }
      }
    }

    void loadShipments();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<K extends keyof VehicleFormState>(
    field: K,
    value: VehicleFormState[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function validateForm(): string | null {
    if (!form.shipmentId) {
      return "Please select a shipment.";
    }

    if (!form.make.trim()) {
      return "Make is required.";
    }

    if (!form.model.trim()) {
      return "Model is required.";
    }

    if (
      form.vin.trim() &&
      (form.vin.trim().length < 5 ||
        form.vin.trim().length > 40)
    ) {
      return "VIN must contain between 5 and 40 characters.";
    }

    if (form.year) {
      const year = Number(form.year);

      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 2100
      ) {
        return "Year must be between 1900 and 2100.";
      }
    }

    if (
      form.purchasePrice &&
      Number(form.purchasePrice) < 0
    ) {
      return "Purchase price cannot be negative.";
    }

    if (
      form.declaredValue &&
      Number(form.declaredValue) < 0
    ) {
      return "Declared value cannot be negative.";
    }

    if (
      form.hasDamage &&
      !form.damageDescription.trim()
    ) {
      return "Please describe the vehicle damage.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const input: CreateVehicleInput = {
      shipmentId: form.shipmentId,
      vin: optionalText(form.vin),
      make: form.make.trim(),
      model: form.model.trim(),
      year: optionalNumber(form.year),
      color: optionalText(form.color),
      vehicleType: optionalText(form.vehicleType),
      fuelType: optionalText(form.fuelType),
      transmission: optionalText(form.transmission),
      purchasePrice: optionalNumber(
        form.purchasePrice,
      ),
      declaredValue: optionalNumber(
        form.declaredValue,
      ),
      hasKeys: form.hasKeys,
      isRunning: form.isRunning,
      hasDamage: form.hasDamage,
      damageDescription: form.hasDamage
        ? optionalText(form.damageDescription)
        : undefined,
      notes: optionalText(form.notes),
    };

    try {
      setIsSubmitting(true);
      await onSubmit(input);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save vehicle.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  const labelClassName =
    "mb-2 block text-sm font-medium text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {shipmentError ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          {shipmentError}
        </div>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Shipment and identification
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="shipmentId"
              className={labelClassName}
            >
              Shipment *
            </label>

            <select
              id="shipmentId"
              value={form.shipmentId}
              onChange={(event) =>
                updateField(
                  "shipmentId",
                  event.target.value,
                )
              }
              disabled={
                isLoadingShipments ||
                Boolean(shipmentError)
              }
              className={`${inputClassName} bg-white disabled:cursor-not-allowed disabled:bg-slate-100`}
            >
              <option value="">
                {isLoadingShipments
                  ? "Loading shipments..."
                  : shipments.length === 0
                    ? "No shipments available"
                    : "Select a shipment"}
              </option>

              {shipments.map((shipment) => (
                <option
                  key={shipment.id}
                  value={shipment.id}
                >
                  {getShipmentLabel(shipment)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="vin"
              className={labelClassName}
            >
              VIN
            </label>

            <input
              id="vin"
              type="text"
              value={form.vin}
              onChange={(event) =>
                updateField(
                  "vin",
                  event.target.value.toUpperCase(),
                )
              }
              className={inputClassName}
              placeholder="WBA12345678901234"
              maxLength={40}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Vehicle information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="make"
              className={labelClassName}
            >
              Make *
            </label>

            <input
              id="make"
              type="text"
              value={form.make}
              onChange={(event) =>
                updateField("make", event.target.value)
              }
              className={inputClassName}
              placeholder="Toyota"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="model"
              className={labelClassName}
            >
              Model *
            </label>

            <input
              id="model"
              type="text"
              value={form.model}
              onChange={(event) =>
                updateField("model", event.target.value)
              }
              className={inputClassName}
              placeholder="Corolla"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="year"
              className={labelClassName}
            >
              Year
            </label>

            <input
              id="year"
              type="number"
              min="1900"
              max="2100"
              value={form.year}
              onChange={(event) =>
                updateField("year", event.target.value)
              }
              className={inputClassName}
              placeholder="2024"
            />
          </div>

          <div>
            <label
              htmlFor="color"
              className={labelClassName}
            >
              Color
            </label>

            <input
              id="color"
              type="text"
              value={form.color}
              onChange={(event) =>
                updateField("color", event.target.value)
              }
              className={inputClassName}
              placeholder="Black"
              maxLength={50}
            />
          </div>

          <div>
            <label
              htmlFor="vehicleType"
              className={labelClassName}
            >
              Vehicle type
            </label>

            <select
              id="vehicleType"
              value={form.vehicleType}
              onChange={(event) =>
                updateField(
                  "vehicleType",
                  event.target.value,
                )
              }
              className={`${inputClassName} bg-white`}
            >
              <option value="">Select vehicle type</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Coupe">Coupe</option>
              <option value="Convertible">
                Convertible
              </option>
              <option value="Pickup">Pickup</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Motorcycle">
                Motorcycle
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="fuelType"
              className={labelClassName}
            >
              Fuel type
            </label>

            <select
              id="fuelType"
              value={form.fuelType}
              onChange={(event) =>
                updateField(
                  "fuelType",
                  event.target.value,
                )
              }
              className={`${inputClassName} bg-white`}
            >
              <option value="">Select fuel type</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="LPG">LPG</option>
              <option value="Hydrogen">Hydrogen</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="transmission"
              className={labelClassName}
            >
              Transmission
            </label>

            <select
              id="transmission"
              value={form.transmission}
              onChange={(event) =>
                updateField(
                  "transmission",
                  event.target.value,
                )
              }
              className={`${inputClassName} bg-white`}
            >
              <option value="">
                Select transmission
              </option>
              <option value="Automatic">
                Automatic
              </option>
              <option value="Manual">Manual</option>
              <option value="Semi-Automatic">
                Semi-Automatic
              </option>
              <option value="CVT">CVT</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Financial information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="purchasePrice"
              className={labelClassName}
            >
              Purchase price
            </label>

            <input
              id="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice}
              onChange={(event) =>
                updateField(
                  "purchasePrice",
                  event.target.value,
                )
              }
              className={inputClassName}
              placeholder="15000.00"
            />
          </div>

          <div>
            <label
              htmlFor="declaredValue"
              className={labelClassName}
            >
              Declared value
            </label>

            <input
              id="declaredValue"
              type="number"
              min="0"
              step="0.01"
              value={form.declaredValue}
              onChange={(event) =>
                updateField(
                  "declaredValue",
                  event.target.value,
                )
              }
              className={inputClassName}
              placeholder="18000.00"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Vehicle condition
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={form.hasKeys}
              onChange={(event) =>
                updateField(
                  "hasKeys",
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-slate-700">
              Vehicle has keys
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={form.isRunning}
              onChange={(event) =>
                updateField(
                  "isRunning",
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-slate-700">
              Vehicle is running
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={form.hasDamage}
              onChange={(event) =>
                updateField(
                  "hasDamage",
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-slate-700">
              Vehicle has damage
            </span>
          </label>
        </div>

        {form.hasDamage ? (
          <div className="mt-6">
            <label
              htmlFor="damageDescription"
              className={labelClassName}
            >
              Damage description *
            </label>

            <textarea
              id="damageDescription"
              value={form.damageDescription}
              onChange={(event) =>
                updateField(
                  "damageDescription",
                  event.target.value,
                )
              }
              className={inputClassName}
              placeholder="Describe the location and extent of the damage."
              rows={4}
              maxLength={2000}
            />
          </div>
        ) : null}
      </section>

      <section>
        <label
          htmlFor="notes"
          className={labelClassName}
        >
          Notes
        </label>

        <textarea
          id="notes"
          value={form.notes}
          onChange={(event) =>
            updateField("notes", event.target.value)
          }
          className={inputClassName}
          placeholder="Additional vehicle or shipping information."
          rows={4}
          maxLength={3000}
        />
      </section>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            isLoadingShipments ||
            shipments.length === 0
          }
          className="rounded-lg bg-slate-900 px-6 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving vehicle..."
            : "Save Vehicle"}
        </button>
      </div>
    </form>
  );
}
