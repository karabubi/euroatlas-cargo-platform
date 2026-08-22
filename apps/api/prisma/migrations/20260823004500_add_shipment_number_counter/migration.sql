-- CreateTable
CREATE TABLE "ShipmentNumberCounter" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentNumberCounter_pkey"
        PRIMARY KEY ("year"),

    CONSTRAINT "ShipmentNumberCounter_lastValue_check"
        CHECK ("lastValue" >= 0 AND "lastValue" <= 9999)
);

-- Seed each year from shipment numbers that already exist.
INSERT INTO "ShipmentNumberCounter" (
    "year",
    "lastValue"
)
SELECT
    CAST(
        substring("shipmentNo" FROM '^EAC-([0-9]{4})-')
        AS INTEGER
    ) AS "year",

    MAX(
        CAST(
            substring("shipmentNo" FROM '([0-9]{4})$')
            AS INTEGER
        )
    ) AS "lastValue"

FROM "Shipment"

WHERE
    "shipmentNo" ~ '^EAC-[0-9]{4}-[0-9]{4}$'

GROUP BY
    CAST(
        substring("shipmentNo" FROM '^EAC-([0-9]{4})-')
        AS INTEGER
    )

ON CONFLICT ("year")
DO UPDATE SET
    "lastValue" = GREATEST(
        "ShipmentNumberCounter"."lastValue",
        EXCLUDED."lastValue"
    ),
    "updatedAt" = CURRENT_TIMESTAMP;
