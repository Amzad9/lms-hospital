import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose, { HydratedDocument, Types } from "mongoose"
import { Status } from "src/common/enums/status.enum"
import { Patient } from "src/patient/schemas/patient.schemas"
import { Visit } from "src/visit/entities/visit.entity"

export type QueueDocument = HydratedDocument<Queue>
@Schema({ timestamps: true })
export class Queue {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Visit.name,
        required: true,
    })
    visitId: Types.ObjectId

    @Prop({ type : Number})
    qid: number

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Patient.name,
        required: true,
    })
    patient: Types.ObjectId
   
    @Prop({
        enum: Status,
        default: Status.ACTIVE
    })
    status: Status
}

export const QueueSchema = SchemaFactory.createForClass(Queue)
