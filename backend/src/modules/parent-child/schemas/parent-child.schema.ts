import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Person } from 'src/modules/person/schemas/person.schema';
import { Spouse } from 'src/modules/spouse/schemas/spouse.schema';

export type ParentChildDocument = HydratedDocument<ParentChild>;

@Schema({ timestamps: true })
export class ParentChild {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Spouse.name, required: true })
    parent: mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Person.name, required: true })
    child: mongoose.Schema.Types.ObjectId;

    @Prop({ default: false })
    isAdopted: boolean;
}

export const ParentChildSchema = SchemaFactory.createForClass(ParentChild);
