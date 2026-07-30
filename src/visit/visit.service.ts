import { Injectable } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Visit } from './entities/visit.entity';
import { Model } from 'mongoose';

@Injectable()
export class VisitService {
  constructor(@InjectModel(Visit.name) private readonly visitModel:Model<Visit>){}
  async create(createVisitDto: CreateVisitDto) {
    const visit = await this.visitModel.create(createVisitDto);
    return {
      message: "Visit created successfully",
      data: visit
    };
  }

  findAll() {
    return `This action returns all visit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} visit`;
  }

  update(id: number, updateVisitDto: UpdateVisitDto) {
    return `This action updates a #${id} visit`;
  }

  remove(id: number) {
    return `This action removes a #${id} visit`;
  }
}
