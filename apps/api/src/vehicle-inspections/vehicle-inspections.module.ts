import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { VehicleInspectionsController } from './vehicle-inspections.controller';
import { VehicleInspectionsService } from './vehicle-inspections.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleInspectionsController],
  providers: [VehicleInspectionsService],
})
export class VehicleInspectionsModule {}
