/**
 * @file patient.tool.ts
 *
 * AI Tool adapter for the PatientService.
 *
 * Exposes three callable functions to the LLM:
 *  - search_patients  : search by name or mobile number
 *  - create_patient   : register a new patient
 *  - get_patient_by_id: retrieve a patient by their MongoDB ObjectId
 *
 * CONTRACT:
 *  - NEVER imports Mongoose or touches the DB directly.
 *  - Delegates ALL data access to PatientService (already injected).
 *  - Returns serialisable plain objects — no Mongoose Document instances.
 *  - Never throws; wraps errors into { success: false, error: string }.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IAiTool, ToolSchema } from '../interfaces/ai-tool.interface';
import { PatientService } from 'src/patient/patient.service';

// ─── Tool name constants ──────────────────────────────────────────────────────
// Centralised so the registry and tools always refer to the same strings.
export const TOOL_SEARCH_PATIENTS = 'search_patients';
export const TOOL_CREATE_PATIENT = 'create_patient';
export const TOOL_GET_PATIENT_BY_ID = 'get_patient_by_id';

// ─── search_patients ──────────────────────────────────────────────────────────

@Injectable()
export class SearchPatientsTool implements IAiTool {
  private readonly logger = new Logger(SearchPatientsTool.name);

  constructor(private readonly patientService: PatientService) {}

  readonly schema: ToolSchema = {
    name: TOOL_SEARCH_PATIENTS,
    description:
      'Search patients by name (first or last) or mobile number. ' +
      'Always call this BEFORE create_patient to avoid duplicates. ' +
      'Returns an array of matching patient records.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description:
            "Search query: a patient's first name, last name, or 10-digit mobile number.",
        },
      },
      required: ['search'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const search = String(args.search ?? '').trim();
    this.logger.log(`[search_patients] query="${search}"`);

    try {
      const results = await this.patientService.searchPatients({ search });
      return {
        success: true,
        count: results.length,
        patients: results,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[search_patients] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}

// ─── create_patient ───────────────────────────────────────────────────────────

@Injectable()
export class CreatePatientTool implements IAiTool {
  private readonly logger = new Logger(CreatePatientTool.name);

  constructor(private readonly patientService: PatientService) {}

  readonly schema: ToolSchema = {
    name: TOOL_CREATE_PATIENT,
    description:
      'Register a brand-new patient in the hospital system. ' +
      'Only call this after search_patients confirms the patient does NOT already exist.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Patient's first name (letters and spaces only).",
        },
        lastname: {
          type: 'string',
          description: "Patient's last name.",
        },
        age: {
          type: 'number',
          description: "Patient's age in years (0–150).",
        },
        mobile: {
          type: 'string',
          description: '10-digit mobile number (digits only, no spaces or dashes).',
        },
        fatherName: {
          type: 'string',
          description: "Father's name (optional).",
        },
        city: {
          type: 'string',
          description: 'City of residence (optional).',
        },
        state: {
          type: 'string',
          description: 'State of residence (optional).',
        },
      },
      required: ['name', 'lastname', 'age', 'mobile'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    this.logger.log(
      `[create_patient] name="${args.name}" mobile="${args.mobile}"`,
    );

    try {
      const result = await this.patientService.createPatient({
        name: String(args.name),
        lastname: String(args.lastname),
        age: Number(args.age),
        mobile: Number(args.mobile),
        fatherName: args.fatherName ? String(args.fatherName) : undefined,
        city: args.city ? String(args.city) : undefined,
        state: args.state ? String(args.state) : undefined,
        image: '',
      });
      return { success: true, ...result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[create_patient] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}

// ─── get_patient_by_id ────────────────────────────────────────────────────────

@Injectable()
export class GetPatientByIdTool implements IAiTool {
  private readonly logger = new Logger(GetPatientByIdTool.name);

  constructor(private readonly patientService: PatientService) {}

  readonly schema: ToolSchema = {
    name: TOOL_GET_PATIENT_BY_ID,
    description:
      'Retrieve the full profile of a patient using their MongoDB ObjectId. ' +
      'Use this when you already have the patient ID and need their name or details.',
    parameters: {
      type: 'object',
      properties: {
        patientId: {
          type: 'string',
          description: 'MongoDB ObjectId of the patient (24-character hex string).',
        },
      },
      required: ['patientId'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const id = String(args.patientId ?? '');
    this.logger.log(`[get_patient_by_id] id="${id}"`);

    try {
      const patient = await this.patientService.getPatinetById(id);
      if (!patient) {
        return { success: false, error: `Patient with id ${id} not found.` };
      }
      return { success: true, patient };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[get_patient_by_id] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
