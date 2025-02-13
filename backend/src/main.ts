import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT');

    app.useGlobalPipes(
        new ValidationPipe({
            //! setup global validation pipe
            whitelist: true, //TODO: remove any other fields that are not in the DTO
            forbidNonWhitelisted: true, //TODO: throw an error when any other fields that are not in the DTO
        }),
    );
    app.setGlobalPrefix('api/v1', { exclude: [''] });

    //Config Cors
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        credentials: true,
    });

    // Swagger setup
    const config = new DocumentBuilder().setTitle('API Documentation').setDescription('Documentation for the API').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document);

    await app.listen(port);
}
bootstrap();
