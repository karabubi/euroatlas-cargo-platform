import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { VehiclePhotosModule } from './vehicle-photos/vehicle-photos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TrackingModule } from './tracking/tracking.module';

import { DocumentsModule } from './documents/documents.module';
import { InvoicesModule } from './invoices/invoices.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    ShipmentsModule,
    VehiclesModule,
    VehiclePhotosModule,
    DashboardModule,
    TrackingModule,
    DocumentsModule,
    InvoicesModule,
  ],
})
export class AppModule {}
