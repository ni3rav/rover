"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });

    if (error) {
      setError(error.message || "Unable to sign in with GitHub.");
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-3xl flex-1 items-center justify-center px-4 py-10">
      <section className="flex w-full max-w-sm flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Continue with GitHub to access your dashboard.
        </p>

        <Button
          className="w-full"
          onClick={handleGithubSignIn}
          disabled={isLoading}
        >
          {isLoading ? "Redirecting..." : "Continue with GitHub"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  );
}
