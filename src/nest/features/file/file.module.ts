import { forwardRef, Module } from '@nestjs/common';

import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { FileController } from './file.controller';
import { FileGateway } from './file.gateway';
import { FileService } from './file.service';
import { FileSchedulingService } from './file-scheduling.service';

@Module({
    imports: [forwardRef(() => YggdrasilModule)],
    controllers: [FileController],
    providers: [FileService, FileSchedulingService, FileGateway],
    exports: [FileService, FileGateway],
})
export class FileModule {}
