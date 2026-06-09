import { createSign } from "node:crypto";
import { env } from "@/lib/env";

type GithubApiError = {
  message?: string;
};

type GithubInstallationTokenResponse = {
  token: string;
  expires_at: string;
  permissions: Record<string, string>;
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    clone_url: string;
  }>;
};

type GithubInstallationRepositoriesResponse = {
  total_count: number;
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    clone_url: string;
    html_url: string;
    default_branch: string;
  }>;
};

type GithubUserInstallationsResponse = {
  total_count: number;
  installations: Array<{
    id: number;
    repository_selection: string;
    account: {
      login: string;
      type: string;
    };
  }>;
};

const GITHUB_API_URL = "https://api.github.com";

function toBase64Url(value: string | Buffer): string {
  const base64 = Buffer.from(value).toString("base64");
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getRequiredGithubAppEnv() {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_SLUG || !env.GITHUB_APP_PRIVATE_KEY) {
    throw new Error(
      "Missing GitHub App env vars: GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY",
    );
  }

  return {
    appId: env.GITHUB_APP_ID,
    appSlug: env.GITHUB_APP_SLUG,
    privateKey: env.GITHUB_APP_PRIVATE_KEY,
  };
}

function getGithubAppPrivateKey(): string {
  return getRequiredGithubAppEnv().privateKey.replace(/\\n/g, "\n");
}

export function createGithubAppJwt(): string {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: getRequiredGithubAppEnv().appId,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(getGithubAppPrivateKey());
  const encodedSignature = toBase64Url(signature);

  return `${signingInput}.${encodedSignature}`;
}

async function githubRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as GithubApiError | null;
    throw new Error(
      errorBody?.message || `GitHub API request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

export function getGithubAppInstallUrl(): string {
  const { appSlug } = getRequiredGithubAppEnv();
  return `https://github.com/apps/${appSlug}/installations/new`;
}

export async function createGithubInstallationAccessToken(input: {
  installationId: string;
  repositories?: string[];
  repositoryIds?: number[];
}): Promise<GithubInstallationTokenResponse> {
  const appJwt = createGithubAppJwt();

  const body: {
    repositories?: string[];
    repository_ids?: number[];
  } = {};

  if (input.repositories?.length) {
    body.repositories = input.repositories;
  }

  if (input.repositoryIds?.length) {
    body.repository_ids = input.repositoryIds;
  }

  return githubRequest<GithubInstallationTokenResponse>(
    `/app/installations/${input.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
      },
      body: JSON.stringify(body),
    },
  );
}

export async function getGithubInstallationRepositories(installationId: string) {
  const token = await createGithubInstallationAccessToken({ installationId });

  const repos = await githubRequest<GithubInstallationRepositoriesResponse>(
    "/installation/repositories",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    },
  );

  return {
    installationId,
    tokenExpiresAt: token.expires_at,
    totalCount: repos.total_count,
    repositories: repos.repositories,
  };
}

export async function getGithubUserInstallations(userAccessToken: string) {
  const result = await githubRequest<GithubUserInstallationsResponse>(
    "/user/installations?per_page=100",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    },
  );

  return result.installations;
}

export function buildCloneUrl(fullName: string, token: string): string {
  return `https://x-access-token:${token}@github.com/${fullName}.git`;
}
