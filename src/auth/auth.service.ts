import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Auth } from './schemas/auth.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthDto } from './dto/auth.dto';
import { SALT_ROUNDS } from 'src/constants/constants';
import { Request } from 'express';
import { SessionRequest } from 'src/types/express-session';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Auth.name) private authModel: Model<Auth>,
        private jwtService: JwtService) { }
    async userRegister(authDto: AuthDto) {
        const existingUser = await this.authModel.findOne({
            mobile: authDto.mobile,
        });
        if (existingUser) {
            throw new ConflictException('Mobile already exists');
        }

        const hash = await bcrypt.hash(authDto.password, SALT_ROUNDS);

        const createdUser = await this.authModel.create({
            ...authDto,
            password: hash
        })
        const { password, ...result } = createdUser.toObject();
        return result
    }

    async signIn(logonDto: LoginDto, req: SessionRequest) {

        const user = await this.authModel.findOne({
            mobile: logonDto.mobile,
        }).select('+password');
        if (!user) {
            throw new UnauthorizedException('Invalid mobile or password');
        }
        const isMatch = await bcrypt.compare(logonDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid mobile or password');
        }
        if (logonDto.role !== user.role) {
            throw new UnauthorizedException('Invalid role');
        }
        const { password, ...result } = user.toObject();
        const sessionUser = {
            id: result._id.toString(),
            mobile: result.mobile,
            role: result.role,
            name: result.name,
            email: result.email,
        };

        const payload = {
            sub: sessionUser.id,
            mobile: sessionUser.mobile,
            role: sessionUser.role,
        };
        req.session.user = {
            ...sessionUser
        };

        const accessToken = await this.jwtService.signAsync(payload)
        return {
            message: 'Login successful',
            accessToken,
            user: sessionUser
        }
    }
    async userProfile(userId: string) {
        const userProfile = await this.authModel.findById(userId);
        return userProfile
    }
}
