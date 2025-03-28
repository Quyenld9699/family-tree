import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import mongoose from 'mongoose';

export class CreateParentChildDto {
    @ApiProperty({ required: true, description: 'ID of the parent (Spouse relationship)' })
    @IsNotEmpty({ message: 'Parent ID is required' })
    @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId' })
    parent: mongoose.Schema.Types.ObjectId;

    @ApiProperty({ required: true, description: 'ID of the child' })
    @IsNotEmpty({ message: 'Child ID is required' })
    @IsMongoId({ message: 'Child ID must be a valid MongoDB ObjectId' })
    child: mongoose.Schema.Types.ObjectId;

    @ApiProperty({
        required: false,
        default: false,
        description: 'Whether the child is adopted',
    })
    @IsOptional()
    @IsBoolean()
    isAdopted?: boolean;
}
