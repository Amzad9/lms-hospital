import { IsEnum, IsString } from "class-validator";
import { DoctorDesignation } from "./doctor-designation.dto";
import { DoctorQualification } from "./doctor-qualification.dto";

export class CreateDoctorDto {
  @IsString()
  doctor: string;

  @IsEnum(DoctorQualification)
  qualification: DoctorQualification;

  @IsEnum(DoctorDesignation)
  designation: DoctorDesignation;
}
