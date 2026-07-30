import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { DoctorDesignation } from '../dto/doctor-designation.dto';
import { DoctorQualification } from '../dto/doctor-qualification.dto';

export type DoctorDocument = HydratedDocument<Doctor>;


@Schema({ timestamps: true})
export class Doctor {
    @Prop({required: true})
    doctor: string

    @Prop({
        type: String,
        enum: DoctorQualification,
        required: true,
    })
    qualification: DoctorQualification
    
    @Prop({
        type: String,
        enum: DoctorDesignation,
        required: true,
    })
    designation: DoctorDesignation
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor)
