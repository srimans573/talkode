type AuthField =
  | "companyName"
  | "email"
  | "fullName"
  | "password"
  | "role";

export type AuthFormState = {
  fieldErrors?: Partial<Record<AuthField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialAuthState: AuthFormState = {
  status: "idle",
};
