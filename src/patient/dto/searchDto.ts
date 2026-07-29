import { IsOptional, IsString } from 'class-validator';

export class SearchPatientDto {
  @IsOptional()
  @IsString()
  search?: string;
}