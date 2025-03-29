import { Module } from '@nestjs/common';
import { ParentChildService } from './parent-child.service';
import { ParentChildController } from './parent-child.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ParentChild, ParentChildSchema } from './schemas/parent-child.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: ParentChild.name, schema: ParentChildSchema }])],
    controllers: [ParentChildController],
    providers: [ParentChildService],
    exports: [ParentChildService],
})
export class ParentChildModule {}
