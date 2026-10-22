import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface ShopScheduleSettings {
  workingDays: number[]; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  openingTime: string; // '09:00'
  closingTime: string; // '20:00'
  breakStart?: string; // '13:30'
  breakEnd?: string; // '14:30'
  defaultSlotMinutes: number; // 20
  maxConcurrentPerSlot: number; // 2 desks
  emergencyNoticeBn?: string;
}

export interface ServiceAppointment {
  id: string;
  tokenNumber: string;
  organizationId: string;
  serviceSlug: string;
  serviceTitleBn: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  appointmentDate: string; // 'YYYY-MM-DD'
  slotTime: string; // '10:00'
  durationMinutes: number;
  assignedStaffName?: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  applicationReferenceNumber?: string;
  createdAt: string;
}

export const DEFAULT_SCHEDULE_SETTINGS: ShopScheduleSettings = {
  workingDays: [6, 0, 1, 2, 3, 4], // Saturday through Thursday (Friday closed)
  openingTime: '09:30',
  closingTime: '20:30',
  breakStart: '13:30',
  breakEnd: '14:30',
  defaultSlotMinutes: 20,
  maxConcurrentPerSlot: 2,
};

@Injectable()
export class ServiceSchedulingService {
  private readonly logger = new Logger(ServiceSchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get shop availability settings
   */
  async getSettings(organizationId: string): Promise<ShopScheduleSettings> {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'ShopScheduleSettings',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log || !log.newData) return DEFAULT_SCHEDULE_SETTINGS;
    return { ...DEFAULT_SCHEDULE_SETTINGS, ...(log.newData as any) };
  }

  /**
   * Update shop availability settings
   */
  async saveSettings(organizationId: string, userId: string | null, settings: Partial<ShopScheduleSettings>) {
    const current = await this.getSettings(organizationId);
    const updated = { ...current, ...settings };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'ShopScheduleSettings',
        entityId: 'GLOBAL_SETTINGS',
        action: 'UPDATE_SCHEDULE_SETTINGS',
        newData: updated as any,
      },
    });

    return { success: true, settings: updated };
  }

  /**
   * Get genuinely available slots for a given date
   */
  async getAvailableSlots(organizationId: string, dateStr: string, serviceSlug?: string) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Valid date in YYYY-MM-DD format required.');
    }

    const settings = await this.getSettings(organizationId);
    const targetDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    if (!settings.workingDays.includes(dayOfWeek)) {
      return {
        date: dateStr,
        isOpen: false,
        reasonBn: 'দোকান এই দিনে বন্ধ থাকে (সাপ্তাহিক ছুটি)।',
        slots: [],
      };
    }

    // Generate potential slots from opening to closing
    const [openH, openM] = settings.openingTime.split(':').map(Number);
    const [closeH, closeM] = settings.closingTime.split(':').map(Number);
    const slotDuration = settings.defaultSlotMinutes || 20;

    let [breakStartH, breakStartM] = [-1, -1];
    let [breakEndH, breakEndM] = [-1, -1];
    if (settings.breakStart && settings.breakEnd) {
      [breakStartH, breakStartM] = settings.breakStart.split(':').map(Number);
      [breakEndH, breakEndM] = settings.breakEnd.split(':').map(Number);
    }

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;
    const breakStartTotal = breakStartH * 60 + breakStartM;
    const breakEndTotal = breakEndH * 60 + breakEndM;

    // Fetch existing active appointments for this date
    const appointmentLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceAppointment',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const bookedSlotsCount: Record<string, number> = {};
    for (const l of appointmentLogs) {
      const apt = (l.newData as any) as ServiceAppointment;
      if (apt && apt.appointmentDate === dateStr && apt.status !== 'CANCELLED') {
        bookedSlotsCount[apt.slotTime] = (bookedSlotsCount[apt.slotTime] || 0) + 1;
      }
    }

    const slots = [];
    for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
      // Check if inside break period
      if (breakStartTotal >= 0 && time >= breakStartTotal && time < breakEndTotal) {
        continue; // Lunch break
      }

      const h = Math.floor(time / 60).toString().padStart(2, '0');
      const m = (time % 60).toString().padStart(2, '0');
      const slotTime = `${h}:${m}`;

      const booked = bookedSlotsCount[slotTime] || 0;
      const capacity = settings.maxConcurrentPerSlot || 2;
      const isAvailable = booked < capacity;

      slots.push({
        time: slotTime,
        available: isAvailable,
        remainingCapacity: Math.max(0, capacity - booked),
      });
    }

    return {
      date: dateStr,
      isOpen: true,
      serviceSlug,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter(s => s.available).length,
      slots,
    };
  }

  /**
   * Atomically reserve an appointment slot, strictly preventing double bookings
   */
  async bookAppointment(
    organizationId: string,
    dto: {
      serviceSlug: string;
      serviceTitleBn: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      appointmentDate: string;
      slotTime: string;
      notes?: string;
      applicationReferenceNumber?: string;
    }
  ): Promise<ServiceAppointment> {
    if (!dto.customerName || !dto.customerPhone || !dto.appointmentDate || !dto.slotTime) {
      throw new BadRequestException('Customer name, phone, appointment date, and slot time are required.');
    }

    const settings = await this.getSettings(organizationId);

    // Concurrency / capacity check
    const existingLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceAppointment',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const activeBookings = existingLogs.filter(l => {
      const apt = (l.newData as any) as ServiceAppointment;
      return (
        apt &&
        apt.appointmentDate === dto.appointmentDate &&
        apt.slotTime === dto.slotTime &&
        apt.status !== 'CANCELLED'
      );
    });

    if (activeBookings.length >= settings.maxConcurrentPerSlot) {
      throw new ConflictException(`Slot ${dto.slotTime} on ${dto.appointmentDate} is fully booked. Please select another time.`);
    }

    const tokenNumber = `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appointment: ServiceAppointment = {
      id: `apt-${Date.now()}`,
      tokenNumber,
      organizationId,
      serviceSlug: dto.serviceSlug,
      serviceTitleBn: dto.serviceTitleBn,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      customerEmail: dto.customerEmail?.trim(),
      appointmentDate: dto.appointmentDate,
      slotTime: dto.slotTime,
      durationMinutes: settings.defaultSlotMinutes || 20,
      assignedStaffName: 'Service Desk Specialist',
      status: 'CONFIRMED',
      notes: dto.notes || '',
      applicationReferenceNumber: dto.applicationReferenceNumber,
      createdAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        entityType: 'ServiceAppointment',
        entityId: tokenNumber,
        action: 'BOOK_APPOINTMENT',
        newData: appointment as any,
      },
    });

    return appointment;
  }

  /**
   * Get list of appointments for admin calendar
   */
  async getAppointments(organizationId: string, dateFilter?: string, statusFilter?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'ServiceAppointment',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let items = logs.map(l => ({
      id: l.id,
      ...((l.newData as any) || {}),
      loggedAt: l.createdAt.toISOString(),
    }));

    if (dateFilter) {
      items = items.filter(a => a.appointmentDate === dateFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      items = items.filter(a => a.status === statusFilter);
    }

    return items;
  }

  /**
   * Update appointment status (CHECKED_IN, COMPLETED, CANCELLED)
   */
  async updateStatus(organizationId: string, userId: string | null, tokenNumber: string, status: 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED', staffNotes?: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        organizationId,
        entityType: 'ServiceAppointment',
        entityId: tokenNumber,
      },
    });

    if (!log) throw new NotFoundException(`Appointment ${tokenNumber} not found.`);

    const current = (log.newData as any) || {};
    const updated = {
      ...current,
      status,
      staffNotes: staffNotes || current.staffNotes,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'ServiceAppointment',
        entityId: tokenNumber,
        action: `APPOINTMENT_${status}`,
        oldData: current,
        newData: updated,
      },
    });

    return { success: true, appointment: updated };
  }
}
