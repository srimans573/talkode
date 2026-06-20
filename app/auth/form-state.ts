type AuthField = "email" | "password";

export type AuthFormState = {
  fieldErrors?: Partial<Record<AuthField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialAuthState: AuthFormState = {
  status: "idle",
};
