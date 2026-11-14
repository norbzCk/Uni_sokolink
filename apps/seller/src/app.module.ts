import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServiceAuthGuard } from '@sokolink/platform';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ReadinessService } from './readiness.service';
import { SellerModule } from './seller/seller.module';

@Module({
  imports: [PrismaModule, SellerModule],
  controllers: [HealthController],
  providers: [ReadinessService, { provide: APP_GUARD, useClass: ServiceAuthGuard }],
})
export class AppModule {}
