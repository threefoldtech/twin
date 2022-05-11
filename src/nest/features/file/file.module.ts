import { forwardRef, Module } from '@nestjs/common';

import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileSchedulingService } from './fileScheduling.service';

@Module({
    imports: [forwardRef(() => YggdrasilModule)],
    controllers: [FileController],
    providers: [FileService, FileSchedulingService],
    exports: [FileService],
})
export class FileModule {}
