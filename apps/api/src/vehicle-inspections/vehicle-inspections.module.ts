import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { VehicleInspectionPdfService } from './vehicle-inspection-pdf.service';
import { VehicleInspectionsController } from './vehicle-inspections.controller';
import { VehicleInspectionsService } from './vehicle-inspections.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleInspectionsController],
  providers: [VehicleInspectionsService, VehicleInspectionPdfService],
})
export class VehicleInspectionsModule {}
