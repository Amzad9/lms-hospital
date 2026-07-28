import { 
    IsString, 
    IsNumber, 
    IsOptional, 
    IsDateString, 
    Min, 
    Max, 
    Length,
    IsNotEmpty,
    Matches
} from 'class-validator';

export class PatientDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{10}$/, {
        message: 'Mobile number must be exactly 10 digits',
    })
    mobile: number

    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @Length(2, 100)
    @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
    name: string;
    
    @IsString()
    @IsNotEmpty({ message: 'Last Name is required' })
    @Length(2, 100)
    lastname: string;

    @IsNumber()
    @IsNotEmpty({ message: 'Age is required' })
    @Min(0)
    @Max(150)
    age: number;

    @IsOptional()
    @IsString()
    @Length(2, 100)
    fatherName?: string;

    @IsOptional()
    @IsDateString()
    dob?: string;

    @IsOptional()
    @IsString()
    @Length(4, 10)
    @Matches(/^[0-9]+$/, { message: 'PIN must contain only numbers' })
    pin?: string;

    @IsOptional()
    @IsString()
    @Length(2, 50)
    state?: string;

    @IsOptional()
    @IsString()
    @Length(2, 50)
    city?: string;
    
    @IsOptional()
    image: string;
}