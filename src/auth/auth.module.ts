import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from './schemas/auth.schemas';
import { JwtModule } from '@nestjs/jwt';
import { JWT_CONSTANTS } from 'src/constants/constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: JWT_CONSTANTS.secret,
      signOptions: { expiresIn: '3600s' },
    }),
  ],
  exports: [AuthService],
  providers: [AuthService]
})
export class AuthModule {}
