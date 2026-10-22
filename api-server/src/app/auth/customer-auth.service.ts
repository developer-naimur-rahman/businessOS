import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomersService } from '../business-core/services/customers.service';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CustomerAuthService {
  constructor(
    private customersService: CustomersService,
    private jwtService: JwtService,
  ) {}

  private async getDefaultOrganizationId(): Promise<string> {
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Storefront organization not configured.');
    }
    return org.id;
  }

  async register(data: any) {
    const orgId = await this.getDefaultOrganizationId();
    
    // Check if email exists
    const existing = await prisma.customer.findFirst({
      where: { organizationId: orgId, email: data.email }
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await argon2.hash(data.password);
    
    const customer = await this.customersService.create(orgId, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      status: 'ACTIVE'
    });

    return this.login(customer);
  }

  async loginWithCredentials(emailOrPhone: string, pass: string): Promise<any> {
    const orgId = await this.getDefaultOrganizationId();
    const cleanPhone = (emailOrPhone || '').replace(/[^0-9]/g, '');
    
    const customer = await prisma.customer.findFirst({
      where: {
        organizationId: orgId,
        OR: [
          { email: emailOrPhone.trim().toLowerCase() },
          ...(cleanPhone.length >= 10 ? [{ phone: { contains: cleanPhone.slice(-10) } }] : [])
        ]
      }
    });

    if (!customer || !customer.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await argon2.verify(customer.password, pass);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(customer);
  }

  async login(customer: any) {
    const payload = { sub: customer.id, type: 'customer', orgId: customer.organizationId };
    return {
      access_token: this.jwtService.sign(payload),
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      }
    };
  }

  async getMe(customerId: string) {
    const orgId = await this.getDefaultOrganizationId();
    const customer = await prisma.customer.findFirst({
      where: { organizationId: orgId, id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true,
      }
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }
}
