import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface RoleMatrixConfig {
  roles: {
    roleKey: string;
    displayName: string;
    description: string;
    permissions: string[];
  }[];
  allAvailableScopes: {
    scope: string;
    group: string;
    description: string;
  }[];
}

const DEFAULT_SCOPES = [
  { scope: 'pos.operate', group: 'POS & Retail', description: 'Can operate POS terminal and sell products' },
  { scope: 'pos.discount_override', group: 'POS & Retail', description: 'Can give manual discount above 15%' },
  { scope: 'cash_register.close', group: 'Cash & Till', description: 'Can open and close cash register drawers' },
  { scope: 'finance.view_pnl', group: 'Finance & Accounts', description: 'Can view true Profit & Loss and net margin' },
  { scope: 'finance.gl_entry', group: 'Finance & Accounts', description: 'Can create journal entries and payables' },
  { scope: 'products.edit_cost_price', group: 'Catalog & Inventory', description: 'Can edit supplier purchase cost prices' },
  { scope: 'inventory.adjust_stock', group: 'Catalog & Inventory', description: 'Can manually adjust warehouse stock quantities' },
  { scope: 'orders.book_courier', group: 'Logistics', description: 'Can book parcels to Steadfast & Pathao' },
  { scope: 'refunds.approve', group: 'RMA & Returns', description: 'Can approve cash/bKash refunds' },
  { scope: 'marketing.launch_campaigns', group: 'Marketing', description: 'Can send bulk SMS and promo blasts' },
  { scope: 'staff.manage_users', group: 'Security & Governance', description: 'Can add or deactivate staff accounts' },
];

const DEFAULT_ROLE_MATRIX = [
  {
    roleKey: 'SUPER_ADMIN',
    displayName: 'Super Admin (Owner)',
    description: 'Full unconstrained root access across all modules',
    permissions: ['*'],
  },
  {
    roleKey: 'STORE_MANAGER',
    displayName: 'Store Manager',
    description: 'Daily operational management, refunds, courier & cash reconciliation',
    permissions: [
      'pos.operate', 'pos.discount_override', 'cash_register.close',
      'finance.view_pnl', 'products.edit_cost_price', 'inventory.adjust_stock',
      'orders.book_courier', 'refunds.approve', 'marketing.launch_campaigns',
    ],
  },
  {
    roleKey: 'POS_CASHIER',
    displayName: 'POS Cashier / Counter Staff',
    description: 'Front-desk point of sale operations and customer receipts',
    permissions: ['pos.operate', 'cash_register.close'],
  },
  {
    roleKey: 'INVENTORY_CLERK',
    displayName: 'Warehouse & Inventory Clerk',
    description: 'Stock inward/outward verification and barcode tag printing',
    permissions: ['inventory.adjust_stock', 'products.edit_cost_price'],
  },
  {
    roleKey: 'DROPSHIP_OPERATOR',
    displayName: 'Dropshipping & Online Fulfillment Operator',
    description: 'Order dispatching, supplier notes, and courier parcel booking',
    permissions: ['orders.book_courier'],
  },
  {
    roleKey: 'ACCOUNTANT',
    displayName: 'Accountant & Auditor',
    description: 'Financial ledgers, supplier payables, P&L, and expense auditing',
    permissions: ['finance.view_pnl', 'finance.gl_entry'],
  },
];

@Injectable()
export class StaffAuditService {
  private readonly logger = new Logger(StaffAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRoleMatrix(organizationId: string): Promise<RoleMatrixConfig> {
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId },
    });
    const settings = (config?.globalSettings as any) || {};
    const savedRoles = settings.roleMatrix?.roles || DEFAULT_ROLE_MATRIX;

    return {
      roles: savedRoles,
      allAvailableScopes: DEFAULT_SCOPES,
    };
  }

  async saveRoleMatrix(organizationId: string, roles: any[]) {
    const existing = await this.prisma.storefrontConfig.findUnique({
      where: { organizationId },
    });
    const globalSettings = (existing?.globalSettings as any) || {};
    globalSettings.roleMatrix = { roles };

    await this.prisma.storefrontConfig.upsert({
      where: { organizationId },
      create: { organizationId, globalSettings },
      update: { globalSettings },
    });

    return { success: true, message: 'Role matrix updated successfully', roles };
  }

  async getAuditLogs(
    organizationId: string,
    filters?: { staffUserId?: string; module?: string; riskLevel?: string }
  ) {
    const where: any = { organizationId };

    if (filters?.staffUserId) {
      where.userId = filters.staffUserId;
    }
    if (filters?.module) {
      where.entityType = { contains: filters.module, mode: 'insensitive' };
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Anomaly Detection Algorithm
    const formatted = logs.map((log) => {
      const action = (log.action || '').toUpperCase();
      let riskLevel: 'NORMAL' | 'WARNING' | 'CRITICAL_ANOMALY' = 'NORMAL';
      let riskReason = '';

      if (
        action.includes('DELETE') || 
        action.includes('SHORTAGE') || 
        action.includes('OVERRIDE') ||
        (log.entityType === 'CashRegister' && action.includes('DISCREPANCY'))
      ) {
        riskLevel = 'CRITICAL_ANOMALY';
        riskReason = 'High financial or deletion risk detected';
      } else if (
        action.includes('REFUND') || 
        action.includes('ADJUST') || 
        action.includes('QC_FAIL') ||
        action.includes('CANCEL')
      ) {
        riskLevel = 'WARNING';
        riskReason = 'Operational adjustment or financial reversal';
      }

      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        actorName: log.user?.name || 'Super Admin (System)',
        actorEmail: log.user?.email || 'admin@businessos.local',
        userId: log.userId,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        ipAddress: log.ipAddress || '127.0.0.1 (Local Terminal)',
        riskLevel,
        riskReason,
        oldData: log.oldData,
        newData: log.newData,
      };
    });

    if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
      return formatted.filter((l) => l.riskLevel === filters.riskLevel);
    }

    return formatted;
  }
}
