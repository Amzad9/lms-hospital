import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Status } from "src/common/enums/status.enum";
import { VisitType } from "src/common/enums/visit.enum";

export class CreateVisitDto {
    @IsNotEmpty()
    @IsMongoId()
    patientId: string;

    @IsNotEmpty()
    @IsMongoId()
    doctorId: string;

    @IsString()
    department: string;

    @IsOptional()
    @IsString()
    symptoms: string;

    @IsOptional()
    @IsEnum(VisitType)
    visitType?: VisitType;

    @IsOptional()
    @IsString()
    diagnosis: string;

    @IsOptional()
    @IsString()
    prescription: string;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;
    
    @IsString()
    type: string
}
