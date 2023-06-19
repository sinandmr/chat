import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './modules/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger();

  if (config.get('NODE_ENV') === 'development') app.enableCors();

  await app.listen(config.get('PORT'));

  logger.log(
    `Application is running on: http://localhost:${config.get('PORT')}`,
  );
};

void bootstrap();
