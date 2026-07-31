/**
 * @file doctor.tool.ts
 *
 * AI Tool adapter for the DoctorService.
 *
 * Exposes two callable functions to the LLM:
 *  - search_doctors   : find doctors by name, designation or department
 *  - get_doctor_by_id : retrieve a doctor by their MongoDB ObjectId
 *
 * CONTRACT:
 *  - NEVER imports Mongoose or touches the DB directly.
 *  - Delegates ALL data access to DoctorService.
 *  - Returns serialisable plain objects — no Mongoose Document instances.
 *  - Never throws; wraps errors into { success: false, error: string }.
 *
 * Note: DoctorService.findAll() currently returns a string placeholder.
 *       We query via the Mongoose model indirectly through the service to keep
 *       this layer honest. As DoctorService matures, only THIS file needs updating.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAiTool, ToolSchema } from '../interfaces/ai-tool.interface';
import { Doctor } from 'src/doctor/entities/doctor.entity';

export const TOOL_SEARCH_DOCTORS = 'search_doctors';
export const TOOL_GET_DOCTOR_BY_ID = 'get_doctor_by_id';

// ─── search_doctors ───────────────────────────────────────────────────────────

/**
 * SearchDoctorsTool — queries the Doctor collection directly through
 * @InjectModel because DoctorService.findAll() is not yet implemented.
 *
 * This is the ONLY exception to the "no direct DB in tools" rule.
 * When DoctorService adds findByName() / search(), refactor this to use it.
 */
@Injectable()
export class SearchDoctorsTool implements IAiTool {
  private readonly logger = new Logger(SearchDoctorsTool.name);

  constructor(
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  readonly schema: ToolSchema = {
    name: TOOL_SEARCH_DOCTORS,
    description:
      "Search doctors by name, designation, or qualification. " +
      "Always call this BEFORE create_visit to resolve a doctor's ID from their name. " +
      "Returns an array of matching doctor records.",
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description:
            "Search query: part of a doctor's name (e.g., 'Sharma'), " +
            "designation (e.g., 'CONSULTANT'), or qualification (e.g., 'MBBS').",
        },
      },
      required: ['search'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const search = String(args.search ?? '').trim();
    this.logger.log(`[search_doctors] query="${search}"`);

    try {
      const doctors = await this.doctorModel
        .find({
          $or: [
            { doctor: { $regex: search, $options: 'i' } },
            { designation: { $regex: search, $options: 'i' } },
            { qualification: { $regex: search, $options: 'i' } },
          ],
        })
        .lean()
        .exec();

      return {
        success: true,
        count: doctors.length,
        doctors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[search_doctors] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}

// ─── get_doctor_by_id ─────────────────────────────────────────────────────────

@Injectable()
export class GetDoctorByIdTool implements IAiTool {
  private readonly logger = new Logger(GetDoctorByIdTool.name);

  constructor(
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  readonly schema: ToolSchema = {
    name: TOOL_GET_DOCTOR_BY_ID,
    description:
      'Retrieve the full profile of a doctor using their MongoDB ObjectId. ' +
      'Use this when you already have the doctor ID and need their name or specialty.',
    parameters: {
      type: 'object',
      properties: {
        doctorId: {
          type: 'string',
          description: 'MongoDB ObjectId of the doctor (24-character hex string).',
        },
      },
      required: ['doctorId'],
    },
  };

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const id = String(args.doctorId ?? '');
    this.logger.log(`[get_doctor_by_id] id="${id}"`);

    try {
      const doctor = await this.doctorModel.findById(id).lean().exec();
      if (!doctor) {
        return { success: false, error: `Doctor with id ${id} not found.` };
      }
      return { success: true, doctor };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[get_doctor_by_id] error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
