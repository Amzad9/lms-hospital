import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, mongo, Types } from 'mongoose';
import { Status } from 'src/common/enums/status.enum';
import { VisitType } from 'src/common/enums/visit.enum';

export type VisitDocument = HydratedDocument<Visit>

@Schema({ timestamps: true })
export class Visit {



    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    })
    doctorId: Types.ObjectId;

    @Prop({ required: true })
    department: string
    
    @Prop({ enum: VisitType, default: VisitType.OPD,})
    visitType: VisitType;

    @Prop()
    symptoms: string;

    @Prop()
    diagnosis: string;

    @Prop()
    prescription: string;

    @Prop({
        enum: Status,
        default: Status.ACTIVE,
    })
    status: Status;

    @Prop({ default: 'screening'})
    type: string
    
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    })
    patientId: Types.ObjectId;
}

export const  VisitSchema = SchemaFactory.createForClass(Visit)
