export type AuthUserRole = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AuthUserRole;
  isActive: boolean;
}
