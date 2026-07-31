/**
 * @file visit.tool.ts
 *
 * AI Tool adapter for the VisitService.
 *
 * Exposes one callable function to the LLM:
 *  - create_visit: create a new hospital visit (OPD / IPD / EMERGENCY)
 *
 * CONTRACT:
 *  - NEVER imports Mongoose or touches the DB directly.
 *  - Delegates ALL data access to VisitService.
 *  - Returns serialisable plain objects — no Mongoose Document instances.
 *  - Never throws; wraps errors into { success: false, error: string }.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IAiTool, ToolSchema } from '../interfaces/ai-tool.interface';
import { VisitService } from 'src/visit/visit.service';
import { VisitType } from 'src/common/enums/visit.enum';
import { Status } from 'src/common/enums/status.enum';

export const TOOL_CREATE_VISIT = 'create_visit';

@Injectable()
export class CreateVisitTool implements IAiTool {
  private readonly logger = new Logger(CreateVisitTool.name);

  constructor(private readonly visitService: VisitService) {}

  readonly schema: ToolSchema = {
    name: TOOL_CREATE_VISIT,
    description:
      'Create a new hospital visit that links a patient to a doctor. ' +
      'Requires both patientId and doctorId obtained from prior tool calls. ' +
      'Returns the created visit document including its _id (visitId).',
    parameters: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description:
            'MongoDB ObjectId of the patient (returned by create_patient or search_patients).',
        },
        doctorId: {
          type: 'string',
          description:
            'MongoDB ObjectId of the doctor (returned by search_doctors or get_doctor_by_id).',
        },
        department: {
          type: 'string',
          description:
            "Hospital department name (e.g., 'Cardiology', 'General', 'Orthopedics').",
        },
        visitType: {
          type: 'string',
          enum: ['OPD', 'IPD', 'EMERGENCY'],
          description:
            "Type of visit. Defaults to 'OPD' if not specified by the user.",
        },
        symptoms: {
          type: 'string',
          description: "Presenting symptoms described by the patient (optional).",
        },
      },
      required: ['patientId', 'doctorId', 'department'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    this.logger.log(
      `[create_visit] patientId="${args.patientId}" doctorId="${args.doctorId}"`,
    );

    // Validate visitType enum — default to OPD
    const rawVisitType = String(args.visitType ?? 'OPD').toUpperCase();
    const visitType: VisitType =
      Object.values(VisitType).includes(rawVisitType as VisitType)
        ? (rawVisitType as VisitType)
        : VisitType.OPD;

    try {
      const result = await this.visitService.create({
        patientId: String(args.patientId),
        doctorId: String(args.doctorId),
        department: String(args.department),
        visitType,
        symptoms: args.symptoms ? String(args.symptoms) : '',
        diagnosis: '',
        prescription: '',
        status: Status.ACTIVE,
        type: 'screening',
      });
      return { success: true, ...result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[create_visit] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
