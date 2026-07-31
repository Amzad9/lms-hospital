/**
 * @file tool-registry.service.ts
 *
 * Central registry that holds every AI Tool available to the agent.
 *
 * Responsibilities:
 *  - Accept all IAiTool instances via constructor injection (NestJS DI).
 *  - Provide lookup by tool name (used by ToolExecutorService).
 *  - Provide the full list of ToolSchema objects (sent to OpenAI with every request).
 *
 * Adding a new tool:
 *  1. Create the tool class in src/ai/tools/.
 *  2. Inject it here in the constructor.
 *  3. Add it to the `this.tools` array in the constructor body.
 *  No other file needs to change.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IAiTool, ToolSchema } from '../interfaces/ai-tool.interface';
import { SearchPatientsTool, CreatePatientTool, GetPatientByIdTool } from '../tools/patient.tool';
import { CreateVisitTool } from '../tools/visit.tool';
import { CreateQueueTool } from '../tools/queue.tool';
import { SearchDoctorsTool, GetDoctorByIdTool } from '../tools/doctor.tool';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);

  /** Map from tool name → tool instance for O(1) lookup */
  private readonly registry = new Map<string, IAiTool>();

  constructor(
    // Patient tools
    private readonly searchPatientsTool: SearchPatientsTool,
    private readonly createPatientTool: CreatePatientTool,
    private readonly getPatientByIdTool: GetPatientByIdTool,
    // Visit tools
    private readonly createVisitTool: CreateVisitTool,
    // Queue tools
    private readonly createQueueTool: CreateQueueTool,
    // Doctor tools
    private readonly searchDoctorsTool: SearchDoctorsTool,
    private readonly getDoctorByIdTool: GetDoctorByIdTool,
  ) {}

  /**
   * Populate the registry map after all tools are injected.
   * onModuleInit ensures DI is complete before we read tool.schema.name.
   */
  onModuleInit(): void {
    const tools: IAiTool[] = [
      this.searchPatientsTool,
      this.createPatientTool,
      this.getPatientByIdTool,
      this.createVisitTool,
      this.createQueueTool,
      this.searchDoctorsTool,
      this.getDoctorByIdTool,
    ];

    for (const tool of tools) {
      this.registry.set(tool.schema.name, tool);
      this.logger.log(`Registered tool: ${tool.schema.name}`);
    }

    this.logger.log(`Tool registry ready — ${this.registry.size} tools loaded`);
  }

  /**
   * Retrieve a tool by its registered name.
   * Returns null if no tool with that name is registered
   * (callers must handle this gracefully — unknown tool calls from the LLM are possible).
   */
  getTool(name: string): IAiTool | null {
    return this.registry.get(name) ?? null;
  }

  /**
   * Returns the JSON Schema array sent to OpenAI with every chat completion request.
   * The model reads these to decide which tool to call and how to populate arguments.
   */
  getAllSchemas(): ToolSchema[] {
    return Array.from(this.registry.values()).map((t) => t.schema);
  }

  /**
   * Returns all registered tool names (useful for logging / debugging).
   */
  getRegisteredNames(): string[] {
    return Array.from(this.registry.keys());
  }
}
