import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gallery, GalleryDocument } from './schemas/gallery.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Person, PersonDocument } from '../person/schemas/person.schema';

@Injectable()
export class GalleryService {
    constructor(
        @InjectModel(Gallery.name) private galleryModel: Model<GalleryDocument>,
        @InjectModel(Person.name) private personModel: Model<PersonDocument>,
        private cloudinaryService: CloudinaryService,
    ) {}

    async uploadImage(file: Express.Multer.File, dto: any) {
        const result = await this.cloudinaryService.uploadImage(file);

        const newImage = new this.galleryModel({
            url: result.secure_url,
            publicId: result.public_id,
            type: 'IMAGE',
            personId: dto.personId || null,
            spouseId: dto.spouseId || null,
            description: dto.description || '',
            eventDate: dto.eventDate || new Date(),
        });

        const savedImage = await newImage.save();

        // Nếu setAsAvatar = true và có personId, update person avatar
        if ((dto.setAsAvatar === 'true' || dto.setAsAvatar === true) && dto.personId) {
            await this.personModel.findByIdAndUpdate(dto.personId, {
                avatar: savedImage.url,
            });
        }

        return savedImage;
    }

    async getImagesByPerson(personId: string) {
        return this.galleryModel.find({ personId }).sort({ createdAt: -1 }).exec();
    }

    async getImagesBySpouse(spouseId: string) {
        return this.galleryModel.find({ spouseId }).sort({ createdAt: -1 }).exec();
    }

    async deleteImage(id: string) {
        const image = await this.galleryModel.findById(id);
        if (image) {
            await this.cloudinaryService.deleteImage(image.publicId);
            await this.galleryModel.findByIdAndDelete(id);
        }
        return { message: 'Deleted successfully' };
    }
}
