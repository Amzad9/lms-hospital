import { Injectable } from '@nestjs/common';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Queue, QueueSchema } from './entities/queue.entity';
import { Model } from 'mongoose';

@Injectable()
export class QueueService {
  constructor(@InjectModel(Queue.name) private readonly queueModel: Model<Queue>){}
  async create(createQueueDto: CreateQueueDto) {
    const lastQueue = await this.queueModel
    .findOne()
    .sort({ createdAt: -1 });
    const qid = lastQueue ? lastQueue.qid + 1 : 1;
    const result = await this.queueModel.create({
      ...createQueueDto,
      qid
    })
    return {
      message: "Queue created successfully",
      data: result
    }
  }

  findAll() {
    return `This action returns all queue`;
  }

  findOne(id: number) {
    return `This action returns a #${id} queue`;
  }

  update(id: number, updateQueueDto: UpdateQueueDto) {
    return `This action updates a #${id} queue`;
  }

  remove(id: number) {
    return `This action removes a #${id} queue`;
  }
}
