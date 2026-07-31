import { Injectable } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Visit } from './entities/visit.entity';
import { Model } from 'mongoose';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class VisitService {
  constructor(@InjectModel(Visit.name) private readonly visitModel:Model<Visit>, private readonly redisService: RedisService){}
  async create(createVisitDto: CreateVisitDto) {
    const visit = await this.visitModel.create(createVisitDto);
    return {
      message: "Visit created successfully",
      data: visit
    };
  }

  async findAll() {
    const visit = await this.visitModel.find().populate(["patientId","doctorId"]);

    // Only cache when Redis is available
    if (this.redisService.isConnected()) {
      const redis = this.redisService.getClient();
      await redis.set('visit', JSON.stringify(visit), { EX: 300 }).catch(() => undefined);
    }

    return {
      message: "Visits fetched successfully",
      data: visit
    };
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
