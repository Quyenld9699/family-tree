import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Person } from 'src/modules/person/schemas/person.schema';

export type SpouseDocument = HydratedDocument<Spouse>;

@Schema({ timestamps: true })
export class Spouse {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Person.name, required: true })
    husband: mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Person.name, required: true })
    wife: mongoose.Schema.Types.ObjectId;

    @Prop()
    husbandOrder?: number;

    @Prop()
    wifeOrder?: number;

    @Prop()
    marriageDate?: Date;

    @Prop()
    divorceDate?: Date;
}

export const SpouseSchema = SchemaFactory.createForClass(Spouse);
