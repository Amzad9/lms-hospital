import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schemas';
import { RedisModule } from 'src/redis/redis.module';


@Module({
    imports: [MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]), RedisModule],
    controllers: [PatientController],
    providers: [PatientService],
    exports: [PatientService]
})
export class PatientModule {}
