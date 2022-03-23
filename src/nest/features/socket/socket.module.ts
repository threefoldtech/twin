import { Global, Module } from '@nestjs/common';

import { SocketService } from './service/socket.service';

@Global()
@Module({
    providers: [SocketService],
    exports: [SocketService],
})
export class SocketModule {}
