import { Module } from '@nestjs/common';

import { LocationService } from './service/location.service';
import { LocationController } from './controller/location.controller';

@Module({
    providers: [LocationService],
    controllers: [LocationController],
})
export class LocationModule {}
