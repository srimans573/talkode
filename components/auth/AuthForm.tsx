"use client";

import { useActionState } from "react";
import { signUp } from "@/app/auth/actions";
import {
  initialAuthState,
  type AuthFormState,
} from "@/app/auth/form-state";

type AuthFormProps = {
  notice?: {
    message: string;
    status: AuthFormState["status"];
  };
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-xs leading-5 text-red-700" role="alert">
      {message}
    </p>
  );
}

function Message({
  message,
  status,
}: {
  message?: string;
  status: AuthFormState["status"];
}) {
  if (!message || status === "idle") {
    return null;
  }

  return (
    <div
      className={cx(
        "border px-3 py-2 text-sm leading-6",
        status === "success"
          ? "border-[#6d9200] bg-[#f4ffd9] text-[#314200]"
          : "border-red-300 bg-red-50 text-red-800",
      )}
      role="status"
    >
      {message}
    </div>
  );
}

function TextInput({
  autoComplete,
  error,
  label,
  name,
  placeholder,
  type = "text",
}: {
  autoComplete: string;
  error?: string;
  label: string;
  name: "email" | "password";
  placeholder: string;
  type?: "email" | "password" | "text";
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium leading-none text-secondary"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cx(
          "h-9 w-full border bg-white px-3 text-[13px] text-secondary outline-none transition duration-150 placeholder:text-[#8a8f99]",
          error ? "border-red-400" : "border-line",
        )}
        id={name}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
      <div id={errorId}>
        <FieldError message={error} />
      </div>
    </div>
  );
}

function SubmitButton({
  children,
  pending,
}: {
  children: string;
  pending: boolean;
}) {
  return (
    <button
      className="flex h-9 w-full items-center justify-center bg-primary px-3 text-sm font-semibold text-secondary transition duration-150 hover:bg-[#d7ff5a] focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <span>{pending ? "Processing" : children}</span>
    </button>
  );
}

export function AuthForm({ notice }: AuthFormProps) {
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialAuthState,
  );

  const activeNotice = notice ?? signUpState;

  return (
    <section className="w-full max-w-85 border border-line bg-panel px-5 py-6">
      <div className="mb-5">
        <span className="text-base font-semibold text-secondary">chayote</span>
      </div>

      <div className="mb-4">
        <Message message={activeNotice.message} status={activeNotice.status} />
      </div>

      <form action={signUpAction} className="space-y-3.5">
        <TextInput
          autoComplete="email"
          error={signUpState.fieldErrors?.email}
          label="Email"
          name="email"
          placeholder="name@company.com"
          type="email"
        />
        <TextInput
          autoComplete="current-password"
          error={signUpState.fieldErrors?.password}
          label="Password"
          name="password"
          placeholder="Password"
          type="password"
        />
        <SubmitButton pending={signUpPending}>Sign up</SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-neutral">
        Create your recruiter account with email and password.
      </p>
    </section>
  );
}
