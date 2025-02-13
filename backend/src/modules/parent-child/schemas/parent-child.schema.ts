import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Person } from 'src/modules/person/schemas/person.schema';

export type SpouseDocument = HydratedDocument<ParentChild>;

@Schema({ timestamps: true })
export class ParentChild {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Person.name, required: true })
    parent: mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Person.name, required: true })
    child: mongoose.Schema.Types.ObjectId;
}
export const ParentChildSchema = SchemaFactory.createForClass(ParentChild);
