import { validate } from 'class-validator';

import { ArrivalShipmentDto } from './dto/arrival-shipment.dto';
import { CustomsClearanceShipmentDto } from './dto/customs-clearance-shipment.dto';
import { DeliverShipmentDto } from './dto/deliver-shipment.dto';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { ReadyForDeliveryShipmentDto } from './dto/ready-for-delivery-shipment.dto';

function createDto<T extends object>(
  DtoClass: new () => T,
  values: Partial<T> | Record<string, unknown>,
): T {
  return Object.assign(new DtoClass(), values);
}

async function getErrorProperties(dto: object): Promise<string[]> {
  const errors = await validate(dto);

  return errors.map((error) => error.property);
}

describe('Shipment workflow DTO validation', () => {
  describe('DispatchShipmentDto', () => {
    it('accepts a valid dispatch payload', async () => {
      const dto = createDto(DispatchShipmentDto, {
        status: 'IN_TRANSIT',
        location: 'Hamburg Port, Germany',
        dispatchedBy: 'Port Operations',
        notes: 'Shipment departed successfully.',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('accepts LOADED as a valid dispatch status', async () => {
      const dto = createDto(DispatchShipmentDto, {
        status: 'LOADED',
        location: 'Hamburg Port, Germany',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects a missing location', async () => {
      const dto = createDto(DispatchShipmentDto, {
        status: 'IN_TRANSIT',
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('location');
    });

    it('rejects an invalid dispatch status', async () => {
      const dto = createDto(DispatchShipmentDto, {
        status: 'DELIVERED',
        location: 'Hamburg Port, Germany',
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('status');
    });
  });

  describe('ArrivalShipmentDto', () => {
    it('accepts a valid arrival payload', async () => {
      const dto = createDto(ArrivalShipmentDto, {
        location: 'Tripoli Port, Libya',
        receivedBy: 'Destination Operations',
        notes: 'Shipment received at destination.',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects a missing location', async () => {
      const dto = createDto(ArrivalShipmentDto, {});

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('location');
    });
  });

  describe('CustomsClearanceShipmentDto', () => {
    it('accepts a valid customs payload', async () => {
      const dto = createDto(CustomsClearanceShipmentDto, {
        location: 'Tripoli Customs Terminal, Libya',
        handledBy: 'Customs Operations',
        customsReference: 'CUS-TEST-001',
        notes: 'Customs processing started.',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects a missing location', async () => {
      const dto = createDto(CustomsClearanceShipmentDto, {});

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('location');
    });

    it('rejects a location longer than 200 characters', async () => {
      const dto = createDto(CustomsClearanceShipmentDto, {
        location: 'A'.repeat(201),
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('location');
    });

    it('rejects notes longer than 2000 characters', async () => {
      const dto = createDto(CustomsClearanceShipmentDto, {
        location: 'Tripoli Customs Terminal',
        notes: 'A'.repeat(2001),
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('notes');
    });
  });

  describe('ReadyForDeliveryShipmentDto', () => {
    it('accepts a valid ready-for-delivery payload', async () => {
      const dto = createDto(ReadyForDeliveryShipmentDto, {
        location: 'Tripoli Delivery Yard, Libya',
        releasedBy: 'Delivery Operations',
        releaseReference: 'REL-TEST-001',
        notes: 'Released for delivery.',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects a missing location', async () => {
      const dto = createDto(ReadyForDeliveryShipmentDto, {});

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('location');
    });

    it('rejects an overlong release reference', async () => {
      const dto = createDto(ReadyForDeliveryShipmentDto, {
        location: 'Tripoli Delivery Yard',
        releaseReference: 'R'.repeat(151),
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('releaseReference');
    });
  });

  describe('DeliverShipmentDto', () => {
    it('accepts a valid final-delivery payload', async () => {
      const dto = createDto(DeliverShipmentDto, {
        location: 'Tripoli Customer Delivery Point, Libya',
        deliveredTo: 'Authorized Customer',
        proofReference: 'POD-TEST-001',
        notes: 'Delivered in good condition.',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('accepts optional fields being omitted', async () => {
      const dto = createDto(DeliverShipmentDto, {
        location: 'Tripoli Customer Delivery Point',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects a missing location', async () => {
      const dto = createDto(DeliverShipmentDto, {});

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('location');
    });

    it('rejects an overlong proof reference', async () => {
      const dto = createDto(DeliverShipmentDto, {
        location: 'Tripoli Customer Delivery Point',
        proofReference: 'P'.repeat(151),
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('proofReference');
    });

    it('rejects notes longer than 2000 characters', async () => {
      const dto = createDto(DeliverShipmentDto, {
        location: 'Tripoli Customer Delivery Point',
        notes: 'N'.repeat(2001),
      });

      const properties = await getErrorProperties(dto);

      expect(properties).toContain('notes');
    });
  });
});
