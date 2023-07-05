import { AuthMiddleware } from '@/common/middlewares/auth.middleware';
import { ChatController } from '@/controllers/chat.controller';
import { ChatGateway } from '@/controllers/chat.gateway';
import { AuthService } from '@/services/auth.service';
import { ChatService } from '@/services/chat.service';
import { PrismaService } from '@/services/prisma.service';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, ChatGateway],

})

export class ChatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(ChatController)
  }
}
