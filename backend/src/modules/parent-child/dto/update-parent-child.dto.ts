import { PartialType } from '@nestjs/mapped-types';
import { CreateParentChildDto } from './create-parent-child.dto';

export class UpdateParentChildDto extends PartialType(CreateParentChildDto) {}
