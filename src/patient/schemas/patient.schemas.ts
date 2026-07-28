import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true })
export class Patient {
    @Prop({ 
        required: true,
    })
    mobile: number;

    @Prop({ 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    })
    name: string;

    @Prop({ 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    })
    lastname: string;

    @Prop({ 
        required: true,
        min: 0,
        max: 150
    })
    age: number;

    @Prop({ 
        required: false,
        trim: true
    })
    fatherName?: string;

    @Prop({ 
        required: false,
        type: Date
    })
    dob?: Date;

    @Prop({ 
        required: false,
        trim: true
    })
    pin?: string;

    @Prop({ 
        required: false,
        trim: true
    })
    city?: string;

    @Prop({ 
        required: false,
        trim: true
    })
    state?: string;
    @Prop({
        default: null,
    })
    image: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);