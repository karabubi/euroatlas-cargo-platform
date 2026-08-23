CREATE TABLE "VehicleNumberCounter" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleNumberCounter_pkey"
      PRIMARY KEY ("year"),

    CONSTRAINT "VehicleNumberCounter_lastValue_check"
      CHECK ("lastValue" >= 0 AND "lastValue" <= 9999)
);

INSERT INTO "VehicleNumberCounter" (
    "year",
    "lastValue",
    "createdAt",
    "updatedAt"
)
SELECT
    CAST(SUBSTRING("vehicleNo" FROM 5 FOR 4) AS INTEGER),
    MAX(
      CAST(
        SUBSTRING("vehicleNo" FROM 10 FOR 4)
        AS INTEGER
      )
    ),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Vehicle"
WHERE "vehicleNo" ~ '^VEH-[0-9]{4}-[0-9]{4}$'
GROUP BY
    CAST(SUBSTRING("vehicleNo" FROM 5 FOR 4) AS INTEGER)
ON CONFLICT ("year")
DO UPDATE SET
    "lastValue" = GREATEST(
      "VehicleNumberCounter"."lastValue",
      EXCLUDED."lastValue"
    ),
    "updatedAt" = CURRENT_TIMESTAMP;
