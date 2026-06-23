import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EventSourceType, EventCalendar } from '../constants';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
    @Prop({ required: true })
    title: string;

    @Prop()
    desc: string;

    @Prop({ required: true, enum: Object.values(EventSourceType), default: EventSourceType.MANUAL })
    sourceType: EventSourceType;

    @Prop({ type: Types.ObjectId, ref: 'Person', default: null })
    sourcePersonId: Types.ObjectId | null;

    @Prop({ required: true, enum: Object.values(EventCalendar) })
    calendar: EventCalendar;

    @Prop({ required: true, type: Number, min: 1, max: 31 })
    day: number;

    @Prop({ required: true, type: Number, min: 1, max: 12 })
    month: number;

    @Prop({ default: false })
    isLeapMonth: boolean;

    @Prop({ default: true })
    isActive: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Mỗi person tối đa 1 giỗ + 1 sinh nhật. Manual (sourcePersonId null) không bị ràng buộc.
EventSchema.index(
    { sourceType: 1, sourcePersonId: 1 },
    { unique: true, partialFilterExpression: { sourcePersonId: { $type: 'objectId' } } },
);
