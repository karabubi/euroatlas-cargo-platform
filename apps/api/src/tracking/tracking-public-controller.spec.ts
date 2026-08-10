import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants';

import { ThrottlerGuard } from '@nestjs/throttler';

import { TrackingController } from './tracking.controller';

describe('Public tracking controller security', () => {
  it('protects the public tracking route with ThrottlerGuard', () => {
    const guards =
      Reflect.getMetadata(
        GUARDS_METADATA,
        TrackingController.prototype.findPublicByShipmentNo,
      ) ?? [];

    expect(guards).toContain(ThrottlerGuard);
  });

  it('does not apply ThrottlerGuard to the generic findOne route', () => {
    const guards =
      Reflect.getMetadata(
        GUARDS_METADATA,
        TrackingController.prototype.findOne,
      ) ?? [];

    expect(guards).not.toContain(ThrottlerGuard);
  });
});
