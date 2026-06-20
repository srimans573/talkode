export const AUTH_ROLES = ["recruiter", "manager"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export const ROLE_LABELS: Record<AuthRole, string> = {
  recruiter: "Recruiter",
  manager: "Manager",
};

export function isAuthRole(value: unknown): value is AuthRole {
  return AUTH_ROLES.includes(value as AuthRole);
}
