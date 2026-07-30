import { Injectable } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Doctor } from './entities/doctor.entity';
import { Model } from 'mongoose';

@Injectable()
export class DoctorService {
  constructor(@InjectModel(Doctor.name) private readonly doctorModal: Model<Doctor> ){}

  async create(createDoctorDto: CreateDoctorDto) {
    const doctor = await this.doctorModal.create(
      {
        doctor: createDoctorDto.doctor,
        qualification: createDoctorDto.qualification,
        designation: createDoctorDto.designation,
      }
    );
    return {
      success: true,
      message: 'Doctor created successfully',
      data: doctor,
    };
  }

  findAll() {
    return `This action returns all doctor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} doctor`;
  }

  update(id: number, updateDoctorDto: UpdateDoctorDto) {
    return `This action updates a #${id} doctor`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctor`;
  }
}
