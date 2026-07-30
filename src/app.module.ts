import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatientModule } from './patient/patient.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { VisitModule } from './visit/visit.module';
import { DoctorModule } from './doctor/doctor.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    AuthModule,
    PatientModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL as string),
    AuthModule,
    RedisModule,
    VisitModule,
    DoctorModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}