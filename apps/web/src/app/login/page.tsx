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
    <main className="container flex min-h-screen flex-1 items-center justify-center">
      <section className="flex w-full max-w-sm flex-col gap-2 rounded-lg border bg-card shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Continue with GitHub to access your dashboard.
        </p>

        <Button className="w-full" onClick={handleGithubSignIn} disabled={isLoading}>
          {isLoading ? "Redirecting..." : "Continue with GitHub"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  );
}
