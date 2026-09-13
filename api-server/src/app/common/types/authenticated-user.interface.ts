export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleIds: string[];
  permissions: string[];
}
