import { PartialType } from '@nestjs/mapped-types';
import { CreateSpouseDto } from './create-spouse.dto';

export class UpdateSpouseDto extends PartialType(CreateSpouseDto) {}
