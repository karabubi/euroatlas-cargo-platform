type TrackShipmentButtonProps = {
  shipmentNo: string;
  variant?: "primary" | "secondary";
};

export function TrackShipmentButton({
  shipmentNo,
  variant = "secondary",
}: TrackShipmentButtonProps) {
  const normalizedShipmentNo = shipmentNo.trim();

  if (!normalizedShipmentNo) {
    return null;
  }

  const href = `/track/${encodeURIComponent(normalizedShipmentNo)}`;

  const classes =
    variant === "primary"
      ? [
          "inline-flex",
          "items-center",
          "justify-center",
          "rounded-xl",
          "bg-slate-950",
          "px-5",
          "py-3",
          "font-semibold",
          "text-white",
          "transition",
          "hover:bg-slate-800",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-sky-500",
          "focus:ring-offset-2",
        ].join(" ")
      : [
          "inline-flex",
          "items-center",
          "justify-center",
          "rounded-xl",
          "border",
          "border-slate-300",
          "bg-white",
          "px-4",
          "py-2.5",
          "font-semibold",
          "text-slate-900",
          "transition",
          "hover:bg-slate-50",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-sky-500",
          "focus:ring-offset-2",
        ].join(" ");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={`Track shipment ${normalizedShipmentNo}`}
    >
      Track Shipment
    </a>
  );
}
