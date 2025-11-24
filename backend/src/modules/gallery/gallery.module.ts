import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { Gallery, GallerySchema } from './schemas/gallery.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Person, PersonSchema } from '../person/schemas/person.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Gallery.name, schema: GallerySchema },
            { name: Person.name, schema: PersonSchema },
        ]),
        CloudinaryModule,
    ],
    controllers: [GalleryController],
    providers: [GalleryService],
})
export class GalleryModule {}
