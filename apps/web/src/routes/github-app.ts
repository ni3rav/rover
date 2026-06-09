import { Elysia } from "elysia";
import { drizzle } from "@rover/db";
import { tryCatch } from "@rover/utils";
import { db } from "@/database";
import { account } from "@/database/schema";
import { auth } from "@/lib/auth";
import {
  buildCloneUrl,
  createGithubInstallationAccessToken,
  getGithubAppInstallUrl,
  getGithubInstallationRepositories,
  getGithubUserInstallations,
} from "@/lib/github-app";

type TokenBody = {
  repositories?: string[];
  repositoryIds?: number[];
};

export const githubAppRoutes = new Elysia({ prefix: "/github-app" })
  .get("/install-url", () => {
    return {
      installUrl: getGithubAppInstallUrl(),
    };
  })
  .get("/installations/me", async ({ request, set }) => {
    const { data: sessionData, error: sessionError } = await tryCatch(
      auth.api.getSession({
        headers: request.headers,
      }),
    );

    if (sessionError || !sessionData?.user?.id) {
      set.status = 401;
      return {
        error: "Unauthorized",
      };
    }

    const userId = sessionData.user.id;

    const { data: githubAccounts, error: accountError } = await tryCatch(
      db
        .select({
          accessToken: account.accessToken,
        })
        .from(account)
        .where(
          drizzle.and(
            drizzle.eq(account.userId, userId),
            drizzle.eq(account.providerId, "github"),
          ),
        )
        .limit(1),
    );

    if (accountError) {
      set.status = 500;
      return {
        error: "Failed to load linked GitHub account",
      };
    }

    const githubAccount = githubAccounts?.[0];

    if (!githubAccount?.accessToken) {
      set.status = 400;
      return {
        error: "No linked GitHub OAuth token found for this user",
      };
    }

    const { data: installations, error: installationsError } = await tryCatch(
      getGithubUserInstallations(githubAccount.accessToken),
    );

    if (installationsError) {
      set.status = 400;
      return {
        error: "Failed to load GitHub App installations for user",
        message:
          installationsError instanceof Error
            ? installationsError.message
            : "Unknown error",
      };
    }

    if (!installations?.length) {
      return {
        hasInstallations: false,
        installations: [],
      };
    }

    const { data: installationDetails, error: repositoriesError } = await tryCatch(
      Promise.all(
        installations.map(async (installation) => {
          const repos = await getGithubInstallationRepositories(String(installation.id));

          return {
            id: installation.id,
            accountLogin: installation.account.login,
            accountType: installation.account.type,
            repositorySelection: installation.repository_selection,
            totalCount: repos.totalCount,
            repositories: repos.repositories.map((repo) => ({
              id: repo.id,
              fullName: repo.full_name,
              private: repo.private,
              defaultBranch: repo.default_branch,
              cloneUrl: repo.clone_url,
            })),
          };
        }),
      ),
    );

    if (repositoriesError || !installationDetails) {
      set.status = 400;
      return {
        error: "Failed to load repositories for one or more installations",
        message:
          repositoriesError instanceof Error ? repositoriesError.message : "Unknown error",
      };
    }

    return {
      hasInstallations: installationDetails.length > 0,
      installations: installationDetails,
    };
  })
  .get("/installations/:installationId/repositories", async ({ params, set }) => {
    const { data, error } = await tryCatch(
      getGithubInstallationRepositories(params.installationId),
    );

    if (error) {
      set.status = 400;
      return {
        error: "Failed to fetch installation repositories",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }

    if (!data) {
      set.status = 500;
      return {
        error: "No installation repositories returned",
      };
    }

    return data;
  })
  .post("/installations/:installationId/access-token", async ({ params, body, set }) => {
    const input = (body ?? {}) as TokenBody;

    const { data, error } = await tryCatch(
      createGithubInstallationAccessToken({
        installationId: params.installationId,
        repositories: input.repositories,
        repositoryIds: input.repositoryIds,
      }),
    );

    if (error) {
      set.status = 400;
      return {
        error: "Failed to create installation access token",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }

    if (!data) {
      set.status = 500;
      return {
        error: "No installation access token returned",
      };
    }

    return {
      installationId: params.installationId,
      token: data.token,
      expiresAt: data.expires_at,
      permissions: data.permissions,
      repositories:
        data.repositories?.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          cloneUrl: repo.clone_url,
          authenticatedCloneUrl: buildCloneUrl(repo.full_name, data.token),
        })) ?? [],
    };
  });
