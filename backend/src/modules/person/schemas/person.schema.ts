import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender } from '../../../constants';

export type PersonDocument = HydratedDocument<Person>;

@Schema({ timestamps: true })
export class Person {
    @Prop({ required: true, unique: true })
    cccd: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    avatar: string;

    @Prop({ required: true, type: Number, enum: [Gender.MALE, Gender.FEMALE] })
    gender: Gender;

    @Prop({ default: null })
    birth: Date | null;

    @Prop({ default: null })
    death: Date | null;

    @Prop({ default: false })
    isDead: boolean;

    @Prop()
    address: string;

    @Prop()
    desc: string;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
