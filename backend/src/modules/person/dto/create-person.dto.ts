import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsBoolean, IsString, IsDate, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Gender } from '../../../constants';

export class CreatePersonDto {
    @ApiProperty({ required: true, description: 'Citizen id (unique)' })
    @IsNotEmpty({ message: 'CCCD is required' })
    @IsString()
    cccd: string;

    @ApiProperty({ required: true, description: 'The name of the person' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    name: string;

    @ApiProperty({ required: false, description: 'The avatar of the person' })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiProperty({ required: true, description: 'The gender of the person', enum: Gender })
    @IsNotEmpty({ message: 'Gender is required' })
    @Transform(({ value }) => {
        // Convert string to number if needed
        if (value === 'MALE' || value === 0) return Gender.MALE;
        if (value === 'FEMALE' || value === 1) return Gender.FEMALE;
        return value;
    })
    @IsEnum(Gender, { message: 'Gender must be 0 (MALE) or 1 (FEMALE)' })
    gender: Gender;

    @ApiProperty({ required: false, description: 'The date of birth of the person' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    birth?: Date;

    @ApiProperty({ required: false, description: 'The date of death of the person' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    death?: Date;

    @ApiProperty({ required: false, default: false, description: 'Is the person dead?' })
    @IsOptional()
    @IsBoolean()
    isDead?: boolean;

    @ApiProperty({ required: false, description: 'The address of the person' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ required: false, description: 'The description of the person' })
    @IsOptional()
    @IsString()
    desc?: string;
}
