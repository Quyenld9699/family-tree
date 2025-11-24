import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRoles, AccountType } from 'src/constants';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsEnum(UserRoles)
    @IsOptional()
    role?: UserRoles;

    @IsEnum(AccountType)
    @IsOptional()
    accountType?: AccountType;
}
