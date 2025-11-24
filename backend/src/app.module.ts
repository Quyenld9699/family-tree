import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { PersonModule } from './modules/person/person.module';
import { SpouseModule } from './modules/spouse/spouse.module';
import { ParentChildModule } from './modules/parent-child/parent-child.module';
import { GalleryModule } from './modules/gallery/gallery.module';

@Module({
    imports: [
        UserModule,
        PersonModule,
        SpouseModule,
        ParentChildModule,
        GalleryModule,
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
