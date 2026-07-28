import { Transform, Type } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from "class-validator";
import { Role } from "../role/role.enum";

export class AuthDto{

    @IsString()
    @IsNotEmpty()
    @Length(10, 10)

    mobile: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    @Transform(({ value }) => value?.trim())
    email: string

    @IsString()
    @IsEnum(Role, {
        message: 'Role must be one of: receptionist, admin, nurse, doctor',
      })
    @Transform(({ value }) => value?.trim())
    role: string
}

