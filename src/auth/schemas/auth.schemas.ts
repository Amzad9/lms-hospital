import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../role/role.enum';

export type AuthDocument = HydratedDocument<Auth>;

@Schema({ timestamps: true })
export class Auth {
    @Prop({ 
        required: true,
    })
    mobile: string;

    @Prop({ 
        required: true,
    })
    password: string;

    @Prop({ 
        required: false,
        trim: true
    })
    name?: string;


    @Prop({ 
        required: false,
        trim: true
    })
    email?: string;

    @Prop({ 
        required: false,
        trim: true,
        default: Role.reception
    })
    role: string
}

export const AuthSchema = SchemaFactory.createForClass(Auth);