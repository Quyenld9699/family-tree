import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type GalleryDocument = HydratedDocument<Gallery>;

export enum GalleryType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
}

@Schema({ timestamps: true })
export class Gallery {
    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    publicId: string; // Cloudinary Public ID

    @Prop({ required: true, enum: GalleryType, default: GalleryType.IMAGE })
    type: GalleryType;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Person', default: null })
    personId: string | null;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Spouse', default: null })
    spouseId: string | null;

    @Prop()
    description: string;

    @Prop()
    eventDate: Date; // Ngày diễn ra sự kiện (ví dụ ngày cưới, ngày chụp ảnh)
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);
