/**
 * @file queue.tool.ts
 *
 * AI Tool adapter for the QueueService.
 *
 * Exposes one callable function to the LLM:
 *  - create_queue: generate a queue token for a visit
 *
 * CONTRACT:
 *  - NEVER imports Mongoose or touches the DB directly.
 *  - Delegates ALL data access to QueueService.
 *  - Returns serialisable plain objects — no Mongoose Document instances.
 *  - Never throws; wraps errors into { success: false, error: string }.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IAiTool, ToolSchema } from '../interfaces/ai-tool.interface';
import { QueueService } from 'src/queue/queue.service';
import { Status } from 'src/common/enums/status.enum';

export const TOOL_CREATE_QUEUE = 'create_queue';

@Injectable()
export class CreateQueueTool implements IAiTool {
  private readonly logger = new Logger(CreateQueueTool.name);

  constructor(private readonly queueService: QueueService) {}

  readonly schema: ToolSchema = {
    name: TOOL_CREATE_QUEUE,
    description:
      'Generate a queue token for a hospital visit. ' +
      'Must be called AFTER create_visit — requires the visitId returned by it. ' +
      'Returns the queue record including qid (the sequential queue number).',
    parameters: {
      type: 'object',
      properties: {
        visitId: {
          type: 'string',
          description:
            'MongoDB ObjectId of the visit (the _id from the create_visit response).',
        },
        patientId: {
          type: 'string',
          description:
            'MongoDB ObjectId of the patient (same one used in create_visit).',
        },
      },
      required: ['visitId', 'patientId'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    this.logger.log(
      `[create_queue] visitId="${args.visitId}" patientId="${args.patientId}"`,
    );

    try {
      const result = await this.queueService.create({
        visitId: String(args.visitId),
        patient: String(args.patientId),
        status: Status.ACTIVE,
      });
      return { success: true, ...result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[create_queue] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
