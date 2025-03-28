import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender } from 'src/constants';

export type UserDocument = HydratedDocument<Person>;

@Schema({ timestamps: true })
export class Person {
    @Prop({ unique: true, default: null })
    cccd: string | null;

    @Prop({ required: true })
    name: string;

    @Prop()
    avatar: string;

    @Prop({ required: true })
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
