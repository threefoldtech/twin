import { Module } from '@nestjs/common';

import { LocationService } from './service/location.service';
import { LocationController } from './controller/location.controller';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
    imports: [EncryptionModule],
    providers: [LocationService],
    controllers: [LocationController],
})
export class LocationModule {}
