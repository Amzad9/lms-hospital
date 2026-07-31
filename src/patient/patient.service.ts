import { ConflictException, Injectable } from '@nestjs/common';
import { Patient } from './schemas/patient.schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PatientDto } from './dto/patient.dto';
import { createClient } from 'redis';
import { RedisService } from 'src/redis/redis.service';
import { SearchPatientDto } from './dto/searchDto';

@Injectable()
export class PatientService {
    constructor(@InjectModel(Patient.name) private patientModel: Model<Patient>,
        private readonly redisService: RedisService) { }
    async createPatient(patientDto: PatientDto) {
        // const existsPatient = await this.patientModel.findOne({
        //     mobile: patientDto.mobile,
        //   });

        //   if (existsPatient) {
        //     throw new ConflictException('Patient already exists');
        //   }

        const patient = await this.patientModel.create(patientDto);

        return {
            message: "Patient created successfully",
            data: patient
        }

    }

    async getAllPatients() {
        const cacheKey = 'patients';

        // Only use cache when Redis is actually connected
        if (this.redisService.isConnected()) {
            const redis = this.redisService.getClient();
            const cached = await redis.get(cacheKey).catch(() => null);
            if (cached) {
                console.log('✅ Data from Redis');
                return JSON.parse(cached);
            }
        }

        console.log('📦 Data from MongoDB');
        const patients = await this.patientModel.find().lean().exec();

        if (this.redisService.isConnected()) {
            const redis = this.redisService.getClient();
            await redis.set(cacheKey, JSON.stringify(patients), { EX: 300 }).catch(() => undefined);
        }

        return patients;
    }
    async getPatinetById(id: string) {
        const patientList = await this.patientModel.findById(id)
        return patientList;
    }

    async deletePatinet(id: string) {
        const deletedPatient = await this.patientModel.findOneAndDelete({ _id: id })
        return {
            message: "Patient Delete successfully",
            data: deletedPatient
        };
    }
    async updatePatinet(id: string, patientDto: PatientDto) {
        const existingPatient = await this.patientModel.findOne({
            name: patientDto.name,
            _id: { $ne: id },
        });
        if (existingPatient) {
            throw new ConflictException("Already exits")
        }
        const deletedPatient = await this.patientModel.findOneAndUpdate(
            { _id: id },
            patientDto,
            { returnDocument: 'after' },)

        return {
            message: "Patient updated successfully",
            data: deletedPatient
        };
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        const imageUrl = file.path;
        const imageName = file.originalname;
        const p = await this.patientModel.findByIdAndUpdate(
            id,
            { image: imageUrl},
            { new: true },
        );
        return p
    }

    async searchPatients(searchDto: SearchPatientDto) {
        const { search } = searchDto;
        const pipeline: any[] = [];
        if (search) {
          const conditions: any[] = [
            {
              name: {
                $regex: search,
                $options: 'i',
              },
            },
            {
              lastname: {
                $regex: search,
                $options: 'i',
              },
            },
          ];
      
          if (!isNaN(Number(search))) {
            conditions.push({
              mobile: Number(searchDto.search),
            });
          }
      
          pipeline.push({
            $match: {
              $or: conditions,
            },
          });
        }
      
        pipeline.push({
          $sort: {
            createdAt: -1,
          },
        });
       console.log(pipeline)
        return this.patientModel.aggregate(pipeline);
      }
}
