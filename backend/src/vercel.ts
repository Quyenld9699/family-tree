import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';

let app;

const bootstrap = async () => {
    if (!app) {
        const expressApp = express();
        app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );
        app.setGlobalPrefix('api/v1', { exclude: [''] });

        app.enableCors({
            origin: ['https://dong-ho-le-dinh.vercel.app', 'http://localhost:3000'],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });

        const config = new DocumentBuilder().setTitle('API Documentation').setDescription('Documentation for the API').setVersion('1.0').build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document);

        await app.init();
        return expressApp;
    }
    return app.getHttpAdapter().getInstance();
};

export default async (req, res) => {
    const instance = await bootstrap();
    return instance(req, res);
};
