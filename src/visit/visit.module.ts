import { Module } from '@nestjs/common';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';
import mongoose from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Visit, VisitSchema } from './entities/visit.entity';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Visit.name, schema:VisitSchema }]), RedisModule],
  controllers: [VisitController],
  providers: [VisitService],
  exports: [VisitService],
})
export class VisitModule {}
