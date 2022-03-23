import { Module } from '@nestjs/common';

import { ApiController } from './controller/api.controller';
import { ApiService } from './service/api.service';

@Module({
    providers: [ApiService],
    exports: [ApiService],
    controllers: [ApiController],
})
export class ApiModule {}
