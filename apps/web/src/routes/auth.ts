import { Elysia, Context } from "elysia";
import { auth } from "@/lib/auth";

const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];

const betterAuthView = (context: Context) => {
  if (!BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const requestUrl = new URL(context.request.url);
  const isGithubAuthCallback = requestUrl.pathname.endsWith(
    "/auth/callback/github",
  );
  const hasGithubAppInstallParams =
    requestUrl.searchParams.has("installation_id") &&
    requestUrl.searchParams.has("setup_action");
  const hasState = requestUrl.searchParams.has("state");

  // GitHub App installation redirects can hit this path without OAuth state.
  // Avoid sending these through Better Auth callback handling.
  if (isGithubAuthCallback && hasGithubAppInstallParams && !hasState) {
    const redirectUrl = new URL("/dashboard", requestUrl.origin);

    const installationId = requestUrl.searchParams.get("installation_id");
    const setupAction = requestUrl.searchParams.get("setup_action");

    if (installationId) {
      redirectUrl.searchParams.set("installation_id", installationId);
    }

    if (setupAction) {
      redirectUrl.searchParams.set("setup_action", setupAction);
    }

    return Response.redirect(redirectUrl, 302);
  }

  return auth.handler(context.request);
};

export const authRoutes = new Elysia()
  .all("/auth/*", betterAuthView)
  .all("/auth", betterAuthView);
