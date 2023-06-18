"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./modules/app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const logger = new common_1.Logger();
    if (config.get('NODE_ENV') === 'development')
        app.enableCors();
    await app.listen(config.get('PORT'));
    logger.log(`Application is running on: http://localhost:${config.get('PORT')}`);
}
void bootstrap();
