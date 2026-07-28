import { IsEnum, IsString, Length } from "class-validator";
import { Role } from "../role/role.enum";

export class LoginDto {
  @IsString()
  @Length(10, 10)
  mobile: string;

  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role;
}