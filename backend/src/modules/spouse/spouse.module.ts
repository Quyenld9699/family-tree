import { Module } from '@nestjs/common';
import { SpouseService } from './spouse.service';
import { SpouseController } from './spouse.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Spouse, SpouseSchema } from './schemas/spouse.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Spouse.name, schema: SpouseSchema }])],
    controllers: [SpouseController],
    providers: [SpouseService],
})
export class SpouseModule {}
