import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../iam/users/users.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    let isPasswordValid = false;
    try {
      if (user.password && user.password.startsWith('$argon2')) {
        isPasswordValid = await argon2.verify(user.password, pass);
      } else {
        isPasswordValid = user.password === pass;
      }
    } catch {
      isPasswordValid = user.password === pass;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id };
    const token = this.jwtService.sign(payload);

    let organizationId = user.organizationId;
    let email = user.email;
    let firstName = user.firstName;
    let lastName = user.lastName;

    if (!organizationId && user.id && user.id !== "1") {
      const dbUser = await this.usersService.findById(user.id);
      if (dbUser) {
        organizationId = dbUser.organizationId;
        email = dbUser.email;
        firstName = dbUser.firstName;
        lastName = dbUser.lastName;
      }
    }

    return {
      access_token: token,
      token,
      organizationId: organizationId || 'f3281531-1153-4a8f-92b1-5f2b5f2efb60',
      user: {
        userId: user.id,
        organizationId: organizationId || 'f3281531-1153-4a8f-92b1-5f2b5f2efb60',
        email,
        firstName,
        lastName,
      },
    };
  }
}
