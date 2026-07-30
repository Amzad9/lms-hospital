import { Module } from '@nestjs/common';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';
import mongoose from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Visit, VisitSchema } from './entities/visit.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Visit.name, schema:VisitSchema }])],
  controllers: [VisitController],
  providers: [VisitService],
})
export class VisitModule {}
