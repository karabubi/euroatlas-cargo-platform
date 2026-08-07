import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

describe('Shipment workflow controller routing', () => {
  const dispatch = jest.fn();
  const markArrived = jest.fn();
  const arrival = jest.fn();
  const startCustomsClearance = jest.fn();
  const markReadyForDelivery = jest.fn();
  const markDelivered = jest.fn();

  const serviceMock = {
    dispatch,
    markArrived,
    arrival,
    startCustomsClearance,
    markReadyForDelivery,
    markDelivered,
  };

  let controller: ShipmentsController;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new ShipmentsController(
      serviceMock as unknown as ShipmentsService,
    );
  });

  it('forwards dispatch requests to ShipmentsService.dispatch', async () => {
    const dto = {
      status: 'IN_TRANSIT' as const,
      location: 'Hamburg Port, Germany',
      dispatchedBy: 'Port Operations',
      notes: 'Vehicle loaded and vessel departed.',
    };

    const expected = {
      message: 'Shipment dispatched successfully.',
    };

    dispatch.mockResolvedValue(expected);

    const result = await controller.dispatch('shipment-001', dto);

    expect(dispatch).toHaveBeenCalledTimes(1);

    expect(dispatch).toHaveBeenCalledWith('shipment-001', dto);

    expect(result).toBe(expected);
  });

  it('forwards customs-clearance requests to ShipmentsService.startCustomsClearance', async () => {
    const dto = {
      location: 'Tripoli Customs Terminal, Libya',
      handledBy: 'Customs Operations',
      customsReference: 'CUS-TEST-001',
      notes: 'Customs processing started.',
    };

    const expected = {
      message: 'Customs clearance started successfully.',
    };

    startCustomsClearance.mockResolvedValue(expected);

    const result = await controller.startCustomsClearance('shipment-002', dto);

    expect(startCustomsClearance).toHaveBeenCalledTimes(1);

    expect(startCustomsClearance).toHaveBeenCalledWith('shipment-002', dto);

    expect(result).toBe(expected);
  });

  it('forwards ready-for-delivery requests to ShipmentsService.markReadyForDelivery', async () => {
    const dto = {
      location: 'Tripoli Delivery Yard, Libya',
      releasedBy: 'Delivery Operations',
      releaseReference: 'REL-TEST-001',
      notes: 'Released from customs.',
    };

    const expected = {
      message: 'Shipment marked ready for delivery successfully.',
    };

    markReadyForDelivery.mockResolvedValue(expected);

    const result = await controller.markReadyForDelivery('shipment-003', dto);

    expect(markReadyForDelivery).toHaveBeenCalledTimes(1);

    expect(markReadyForDelivery).toHaveBeenCalledWith('shipment-003', dto);

    expect(result).toBe(expected);
  });

  it('forwards final-delivery requests to ShipmentsService.markDelivered', async () => {
    const dto = {
      location: 'Tripoli Customer Delivery Point, Libya',
      deliveredTo: 'Authorized Customer',
      proofReference: 'POD-TEST-001',
      notes: 'Delivered in good condition.',
    };

    const expected = {
      message: 'Shipment delivered successfully.',
    };

    markDelivered.mockResolvedValue(expected);

    const result = await controller.markDelivered('shipment-004', dto);

    expect(markDelivered).toHaveBeenCalledTimes(1);

    expect(markDelivered).toHaveBeenCalledWith('shipment-004', dto);

    expect(result).toBe(expected);
  });

  it('forwards arrival requests to ShipmentsService.markArrived', async () => {
    const dto = {
      location: 'Tripoli Port, Libya',
      receivedBy: 'Destination Operations',
      notes: 'Shipment received at destination port.',
    };

    const expected = {
      message: 'Shipment arrival recorded successfully.',
    };

    markArrived.mockResolvedValue(expected);

    const result = await controller.markArrived('shipment-arrival-001', dto);

    expect(markArrived).toHaveBeenCalledTimes(1);

    expect(markArrived).toHaveBeenCalledWith('shipment-arrival-001', dto);

    expect(result).toBe(expected);
  });
});
