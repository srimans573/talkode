import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up | Chayote",
  description: "Create a Chayote account with email and password.",
};

type AuthPageProps = {
  searchParams: Promise<{
    verified?: string | string[];
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const verified = Array.isArray(params.verified)
    ? params.verified[0]
    : params.verified;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-8 sm:px-8">
      <AuthForm
        notice={
          verified === "failed"
            ? {
                message:
                  "Verification failed or expired. Request a new recruiter access email.",
                status: "error",
              }
            : undefined
        }
      />
    </main>
  );
}
