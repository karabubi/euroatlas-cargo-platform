import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from '../prisma/prisma.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [
    PrismaModule,

    ThrottlerModule.forRoot([
      {
        name: 'publicTracking',
        ttl: 60_000,
        limit: 30,
      },
    ]),
  ],

  controllers: [TrackingController],

  providers: [TrackingService, ThrottlerGuard],

  exports: [TrackingService],
})
export class TrackingModule {}
