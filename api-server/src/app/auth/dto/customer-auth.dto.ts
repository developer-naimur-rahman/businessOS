import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CustomerLoginDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password or PIN is required.' })
  @MinLength(4, { message: 'Password or PIN must be at least 4 characters long.' })
  password: string;
}

export class CustomerRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required.' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'A valid email address is required if provided.' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password or PIN is required.' })
  @MinLength(4, { message: 'Password or PIN must be at least 4 characters long.' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CustomerChangePinDto {
  @IsString()
  @IsNotEmpty({ message: 'Old PIN is required.' })
  oldPin: string;

  @IsString()
  @IsNotEmpty({ message: 'New PIN is required.' })
  @MinLength(4, { message: 'New PIN must be at least 4 characters long.' })
  newPin: string;
}

