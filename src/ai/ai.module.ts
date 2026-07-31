/**
 * @file ai.module.ts
 *
 * NestJS feature module for the entire AI layer.
 *
 * Wiring responsibility:
 *  - Imports domain modules so their services can be injected into tools.
 *  - Imports the Doctor Mongoose model directly (because DoctorService.findAll
 *    is not yet implemented; doctor.tool.ts queries via @InjectModel).
 *  - Loads the openAiConfig factory via ConfigModule.forFeature so it is
 *    available as configService.get('openai.*') throughout this module.
 *  - Declares all providers in dependency order (tools → registry → executor
 *    → planner → graph → service → controller).
 *
 * When you extend the agent, only this file and tool-registry.service.ts change.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// ── Domain modules that expose services via exports ───────────────────────────
import { PatientModule } from 'src/patient/patient.module';
import { VisitModule } from 'src/visit/visit.module';
import { QueueModule } from 'src/queue/queue.module';
import { DoctorModule } from 'src/doctor/doctor.module';

// ── Mongoose schema needed directly by doctor tools ───────────────────────────
import { Doctor, DoctorSchema } from 'src/doctor/entities/doctor.entity';

// ── OpenAI config factory ──────────────────────────────────────────────────────
import openAiConfig from './config/openai.config';

// ── AI layer services ──────────────────────────────────────────────────────────
import { OpenAiService } from './llm/openai.service';
import { MemoryService } from './memory/memory.service';
import { ToolRegistryService } from './registry/tool-registry.service';
import { ToolExecutorService } from './executor/tool-executor.service';
import { PlannerService } from './planner/planner.service';
import { HospitalGraph } from './graph/hospital.graph';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

// ── Tool classes ───────────────────────────────────────────────────────────────
import {
  SearchPatientsTool,
  CreatePatientTool,
  GetPatientByIdTool,
} from './tools/patient.tool';
import { CreateVisitTool } from './tools/visit.tool';
import { CreateQueueTool } from './tools/queue.tool';
import { SearchDoctorsTool, GetDoctorByIdTool } from './tools/doctor.tool';

@Module({
  imports: [
    // Load the openai config factory into this module's ConfigService scope
    ConfigModule.forFeature(openAiConfig),

    // Domain modules — their exported services become injectable here
    PatientModule,    // exports PatientService
    VisitModule,      // exports VisitService
    QueueModule,      // exports QueueService
    DoctorModule,     // exports DoctorService

    // Doctor model needed by SearchDoctorsTool / GetDoctorByIdTool
    MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }]),
  ],

  controllers: [AiController],

  providers: [
    // ── Infrastructure ──────────────────────────────────────────────────
    OpenAiService,
    MemoryService,

    // ── Tools ───────────────────────────────────────────────────────────
    SearchPatientsTool,
    CreatePatientTool,
    GetPatientByIdTool,
    CreateVisitTool,
    CreateQueueTool,
    SearchDoctorsTool,
    GetDoctorByIdTool,

    // ── Registry / Executor / Planner ────────────────────────────────────
    ToolRegistryService,
    ToolExecutorService,
    PlannerService,

    // ── LangGraph orchestration ──────────────────────────────────────────
    HospitalGraph,

    // ── Public service ───────────────────────────────────────────────────
    AiService,
  ],
})
export class AiModule {}
