import { Module } from '@nestjs/common';

import { EncryptionModule } from '../encryption/encryption.module';
import { LocationController } from './controller/location.controller';
import { LocationService } from './service/location.service';

@Module({
    imports: [EncryptionModule],
    providers: [LocationService],
    controllers: [LocationController],
    exports: [LocationService],
})
export class LocationModule {}
