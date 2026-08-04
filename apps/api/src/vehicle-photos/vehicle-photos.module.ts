import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { VehiclePhotosController } from './vehicle-photos.controller';
import { VehiclePhotosService } from './vehicle-photos.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclePhotosController],
  providers: [VehiclePhotosService],
})
export class VehiclePhotosModule {}
