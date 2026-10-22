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
    const cleanPhone = (data.phone || '').replace(/[^0-9]/g, '');
    
    // Check if email exists if provided
    if (data.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: { organizationId: orgId, email: data.email.trim().toLowerCase() }
      });
      if (existingEmail) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Check if phone exists if provided
    if (cleanPhone.length >= 10) {
      const existingPhone = await prisma.customer.findFirst({
        where: {
          organizationId: orgId,
          phone: { contains: cleanPhone.slice(-10) }
        }
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already registered. Please login with your PIN.');
      }
    }

    const emailToUse = data.email 
      ? data.email.trim().toLowerCase() 
      : (cleanPhone.length >= 10 ? `${cleanPhone}@customer.businessos.local` : `user_${Date.now()}@customer.businessos.local`);

    const hashedPassword = await argon2.hash(data.password);
    
    const customer = await this.customersService.create(orgId, {
      name: data.name,
      email: emailToUse,
      phone: data.phone || cleanPhone,
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

  async changePin(customerId: string, oldPin: string, newPin: string) {
    if (!newPin || newPin.length < 4) {
      throw new BadRequestException('New PIN must be at least 4 digits long.');
    }
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    if (!customer || !customer.password) {
      throw new NotFoundException('Customer profile not found.');
    }
    const isValid = await argon2.verify(customer.password, oldPin);
    if (!isValid) {
      throw new UnauthorizedException('Current PIN is incorrect.');
    }
    const hashed = await argon2.hash(newPin);
    await prisma.customer.update({
      where: { id: customerId },
      data: { password: hashed }
    });
    return { success: true, message: 'PIN changed successfully.' };
  }

  async resetPin(phone: string, verificationCode: string, newPin: string) {
    if (!newPin || newPin.length < 4) {
      throw new BadRequestException('New PIN must be at least 4 digits long.');
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const orgId = await this.getDefaultOrganizationId();
    const customer = await prisma.customer.findFirst({
      where: {
        organizationId: orgId,
        phone: { contains: cleanPhone.slice(-10) }
      }
    });
    if (!customer) {
      throw new NotFoundException('Account with this phone number was not found.');
    }
    // Verify verification code (e.g. 123456 or synthetic test bypass)
    if (verificationCode !== '123456') {
      throw new BadRequestException('Invalid or expired verification code.');
    }
    const hashed = await argon2.hash(newPin);
    await prisma.customer.update({
      where: { id: customer.id },
      data: { password: hashed }
    });
    return { success: true, message: 'PIN reset successfully. Please login with your new PIN.' };
  }
}

