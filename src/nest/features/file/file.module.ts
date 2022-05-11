import { forwardRef, Module } from '@nestjs/common';

import { YggdrasilModule } from '../yggdrasil/yggdrasil.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
    imports: [forwardRef(() => YggdrasilModule)],
    controllers: [FileController],
    providers: [FileService],
    exports: [FileService],
})
export class FileModule {}
