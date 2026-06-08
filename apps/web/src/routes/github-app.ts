import { Elysia } from "elysia";
import { tryCatch } from "@rover/utils";
import {
  buildCloneUrl,
  createGithubInstallationAccessToken,
  getGithubAppInstallUrl,
  getGithubInstallationRepositories,
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
