import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';

export class CreateSpouseDto {
    @ApiProperty({ required: true, description: 'ID of the husband in the relationship' })
    @IsNotEmpty({ message: 'Husband ID is required' })
    @IsMongoId({ message: 'Husband ID must be a valid MongoDB ObjectId' })
    husband: mongoose.Schema.Types.ObjectId;

    @ApiProperty({ required: true, description: 'ID of the wife in the relationship' })
    @IsNotEmpty({ message: 'Wife ID is required' })
    @IsMongoId({ message: 'Wife ID must be a valid MongoDB ObjectId' })
    wife: mongoose.Schema.Types.ObjectId;

    @ApiProperty({ required: false, description: 'Order number if the husband has multiple wives' })
    @IsOptional()
    husbandOrder?: number;

    @ApiProperty({ required: false, description: 'Order number if the wife has multiple husbands' })
    @IsOptional()
    wifeOrder?: number;

    @ApiProperty({ required: false, description: 'Date of marriage' })
    @IsOptional()
    @IsDate({ message: 'Marriage date must be a valid date' })
    @Type(() => Date)
    marriageDate?: Date;

    @ApiProperty({ required: false, description: 'Date of divorce if applicable' })
    @IsOptional()
    @IsDate({ message: 'Divorce date must be a valid date' })
    @Type(() => Date)
    divorceDate?: Date;
}
