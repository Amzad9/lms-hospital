import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PatientService } from './patient/patient.service';
import { AuthDto } from './auth/dto/auth.dto';
import { AuthService } from './auth/auth.service';
import { Roles } from './auth/role/roles.decorator';
import { Role } from './auth/role/role.enum';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/role/roles.guard';
import type { Request } from 'express';
import { LoginDto } from './auth/dto/login.dto';
import type { SessionRequest } from '././/types/express-session';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService, 
    private readonly patientService: PatientService,
    private readonly authService: AuthService) {}
    
  @Post('user')
  async getHello(@Body() authDto: AuthDto) {
    return await this.authService.userRegister(authDto);
  }

  @Post('login')
  async SignIn(@Body() logindto: LoginDto,
  @Req() req: Request,){
     return this.authService.signIn(logindto, req)
  }
  
  @Get('profile')
  getProfile(@Req() req: SessionRequest) {
    if (!req.session.user) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }
    return req.session.user;
  }
}
