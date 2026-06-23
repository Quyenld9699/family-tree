import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { EventCalendar } from '../constants';

export class CreateEventDto {
    @ApiProperty({ description: 'Tên sự kiện' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    desc?: string;

    @ApiProperty({ enum: EventCalendar, description: 'Âm hoặc dương lịch' })
    @IsEnum(EventCalendar)
    calendar: EventCalendar;

    @ApiProperty({ description: 'Ngày (1-31)' })
    @IsInt()
    @Min(1)
    @Max(31)
    day: number;

    @ApiProperty({ description: 'Tháng (1-12)' })
    @IsInt()
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ required: false, description: 'Tháng nhuận (chỉ âm lịch)' })
    @IsOptional()
    @IsBoolean()
    isLeapMonth?: boolean;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
