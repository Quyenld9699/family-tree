import { Module, forwardRef } from '@nestjs/common';
import { SpouseService } from './spouse.service';
import { SpouseController } from './spouse.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Spouse, SpouseSchema } from './schemas/spouse.schema';
import { ParentChildModule } from '../parent-child/parent-child.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Spouse.name, schema: SpouseSchema }]), forwardRef(() => ParentChildModule)],
    controllers: [SpouseController],
    providers: [SpouseService],
    exports: [SpouseService],
})
export class SpouseModule {}
