import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Gender } from 'src/constants';

export class CreatePersonDto {
    @ApiProperty({ description: 'Citizen id' })
    cccd?: string;

    @ApiProperty({ required: true, description: 'The name of the person' })
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @ApiProperty({ description: 'The avatar of the person' })
    avatar?: string;

    @ApiProperty({ required: true, description: 'The gender of the person' })
    @IsNotEmpty({ message: 'Gender is required' })
    gender: Gender;

    @ApiProperty({ description: 'The date of birth of the person' })
    birth?: Date;

    @ApiProperty({ description: 'The date of death of the person' })
    death?: Date;

    @ApiProperty({ default: false, description: 'Is the person dead?' })
    isDead: boolean;

    @ApiProperty({ description: 'The address of the person' })
    address?: string;

    @ApiProperty({ description: 'The description of the person' })
    desc?: string;
}
