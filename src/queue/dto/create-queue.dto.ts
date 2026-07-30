import { Type } from "class-transformer";
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Status } from "src/common/enums/status.enum";

export class CreateQueueDto {
    @IsMongoId()
    visitId: string;
    
    // @Type(() => Number)
    // @IsNumber()
    // qid?: number;

    @IsMongoId()
    patient: string

    @IsEnum(Status)
    status: Status

}
