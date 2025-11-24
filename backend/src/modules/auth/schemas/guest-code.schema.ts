import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GuestCodeDocument = HydratedDocument<GuestCode>;

@Schema({ timestamps: true })
export class GuestCode {
    @Prop({ required: true, unique: true })
    code: string;

    @Prop({ required: true })
    expiredAt: Date;

    @Prop()
    note: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const GuestCodeSchema = SchemaFactory.createForClass(GuestCode);
