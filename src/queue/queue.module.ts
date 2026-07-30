import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import mongoose, { Model } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Queue, QueueSchema } from './entities/queue.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: Queue.name, schema: QueueSchema}])],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
