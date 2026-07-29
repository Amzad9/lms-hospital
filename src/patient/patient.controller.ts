import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Res, UploadedFile, UploadedFiles, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientDto } from './dto/patient.dto';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'src/config/cloudinary.config';
import { storage } from 'src/cloudinary/cloudinary.storage';
import { SearchPatientDto } from './dto/searchDto';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createPatient(@Body() patientDto: PatientDto) {
    return this.patientService.createPatient(patientDto);
  }
  

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPatients() {
    return this.patientService.getAllPatients();
  }
  @Get('search')
  async searchPatients(@Query() query: SearchPatientDto) {
    console.log('Query:', query);
    return this.patientService.searchPatients(query);
  }
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
    }),
  )
  uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.patientService.uploadImage(id, file);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPatientById(@Param('id') id: string) {
    return this.patientService.getPatinetById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePatients(@Param('id') id: string) {
    return this.patientService.deletePatinet(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updatePatients(@Param('id') id: string, @Body() patientDto: PatientDto) {
    return this.patientService.updatePatinet(id, patientDto);
  }


}
