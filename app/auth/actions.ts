"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthFormState } from "@/app/auth/form-state";
import { isAuthRole } from "@/lib/auth/roles";
import { getSiteUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type AuthField =
  | "companyName"
  | "email"
  | "fullName"
  | "password"
  | "role";

const PASSWORD_REQUIREMENT =
  "Use at least 12 characters with uppercase, lowercase, and a number.";

function readFormString(formData: FormData, key: AuthField) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function configurationError(): AuthFormState {
  return {
    message:
      "Supabase is not configured yet. Add the public project URL and publishable key.",
    status: "error",
  };
}

function validateCredentials(formData: FormData) {
  const email = readFormString(formData, "email").toLowerCase();
  const password = readFormString(formData, "password");
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  if (!validateEmail(email)) {
    fieldErrors.email = "Enter a valid work email.";
  }

  if (!password) {
    fieldErrors.password = "Enter your password.";
  }

  return {
    email,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
    password,
  };
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = validateCredentials(formData);

  if (!credentials.isValid) {
    return {
      fieldErrors: credentials.fieldErrors,
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return configurationError();
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.user) {
    return {
      message:
        "We could not authenticate that recruiter account. Check credentials and account status.",
      status: "error",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("recruiter_profiles")
    .select("role,status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !isAuthRole(profile.role) ||
    profile.status !== "active"
  ) {
    await supabase.auth.signOut();

    return {
      message:
        "Access is limited to active recruiter and manager accounts.",
      status: "error",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readFormString(formData, "email").toLowerCase();
  const password = readFormString(formData, "password");
  const fullName = readFormString(formData, "fullName");
  const companyName = readFormString(formData, "companyName");
  const roleValue = readFormString(formData, "role");
  const role = isAuthRole(roleValue) ? roleValue : undefined;
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  if (fullName.length < 2) {
    fieldErrors.fullName = "Enter your full name.";
  }

  if (companyName.length < 2) {
    fieldErrors.companyName = "Enter your company name.";
  }

  if (!validateEmail(email)) {
    fieldErrors.email = "Enter a valid work email.";
  }

  if (!validatePassword(password)) {
    fieldErrors.password = PASSWORD_REQUIREMENT;
  }

  if (!role) {
    fieldErrors.role = "Choose recruiter or manager access.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  if (!role) {
    return {
      fieldErrors: {
        role: "Choose recruiter or manager access.",
      },
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return configurationError();
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    options: {
      data: {
        company_name: companyName,
        full_name: fullName,
        role,
      },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/dashboard`,
    },
    password,
  });

  if (error) {
    return {
      message:
        "We could not create that recruiter account. Use a valid email and password.",
      status: "error",
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    message: "Check your inbox to verify your recruiter access.",
    status: "success",
  };
}
