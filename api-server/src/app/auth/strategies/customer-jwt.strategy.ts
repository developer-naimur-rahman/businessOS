import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomersService } from '../../business-core/services/customers.service';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(private customersService: CustomersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'customer') {
      throw new UnauthorizedException('Invalid token type');
    }
    
    // We don't have organizationId in payload, but customer ID is unique.
    // However, our CustomersService requires organizationId to findOne. 
    // We can just rely on the payload if we trust the token, but it's safer to verify.
    // Let's just pass the customer ID and let the controller handle org logic, or look it up.
    
    return {
      customerId: payload.sub,
      type: 'customer'
    };
  }
}
