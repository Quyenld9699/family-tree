import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';

const server = express();

const createNestServer = async (expressInstance) => {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    app.setGlobalPrefix('api/v1', { exclude: [''] });

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        credentials: true,
    });

    const config = new DocumentBuilder().setTitle('API Documentation').setDescription('Documentation for the API').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.init();
};

createNestServer(server)
    .then(() => console.log('Nest Ready'))
    .catch((err) => console.error('Nest broken', err));

export default server;
