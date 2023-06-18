import { AppController } from '@/controllers/app.controller';
import { AppService } from '@/services/app.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from '@/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
