"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type InstallUrlResponse = {
  installUrl: string;
};

type InstallationRepository = {
  id: number;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  cloneUrl: string;
};

type InstallationDetails = {
  id: number;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
  totalCount: number;
  repositories: InstallationRepository[];
};

type MyInstallationsResponse = {
  hasInstallations: boolean;
  installations: InstallationDetails[];
};

type ErrorResponse = {
  error?: string;
  message?: string;
};

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | ErrorResponse
    | null;

  if (!response.ok) {
    const message =
      (payload as ErrorResponse | null)?.message ||
      (payload as ErrorResponse | null)?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function DashboardClient() {
  const [installUrl, setInstallUrl] = useState("");
  const [installations, setInstallations] = useState<InstallationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [urlData, installationsData] = await Promise.all([
          fetchJson<InstallUrlResponse>("/api/github-app/install-url"),
          fetchJson<MyInstallationsResponse>(
            "/api/github-app/installations/me",
          ),
        ]);

        setInstallUrl(urlData.installUrl);
        setInstallations(installationsData.installations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto flex w-full max-w-4xl flex-1 flex-col gap-2 px-4 py-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Loading GitHub App integration...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto flex w-full max-w-4xl flex-1 flex-col gap-2 px-4 py-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-destructive">{error}</p>
      </main>
    );
  }

  const hasInstallations = installations.length > 0;

  return (
    <main className="container mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          GitHub App installation status and repository visibility.
        </p>
      </header>

      {!hasInstallations ? (
        <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium">Install your GitHub App</h2>
          <p className="text-muted-foreground">
            No installation found for your account yet. Install the app and
            select repositories.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild disabled={!installUrl}>
              <a href={installUrl || "#"} target="_blank" rel="noreferrer">
                Open install page
              </a>
            </Button>
            {installUrl ? <code className="text-xs">{installUrl}</code> : null}
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Installed repositories</h2>
          {installations.map((installation) => (
            <article
              key={installation.id}
              className="flex flex-col gap-2 rounded-lg border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Installation #{installation.id}</span>
                <span>Account: {installation.accountLogin}</span>
                <span>Selection: {installation.repositorySelection}</span>
              </div>

              {installation.repositories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No repositories available.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {installation.repositories.map((repo) => (
                    <li
                      key={repo.id}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span>{repo.fullName}</span>
                      <span className="text-muted-foreground">
                        {repo.private ? "private" : "public"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
