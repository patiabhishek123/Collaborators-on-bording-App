import { App } from "@octokit/app";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_PRIVATE_KEY;
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

if (!appId || !privateKey || !webhookSecret) {
  throw new Error(
    "Missing required env vars: GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET"
  );
}

// App instance used to bind webhook handling
export const githubApp = new App({
  appId,
  privateKey,
  webhooks: { secret: webhookSecret },
});

/**
 * Generates an installation access token for the given installation ID
 * using the GitHub App's private key via @octokit/auth-app, then returns
 * a fully-typed @octokit/rest Octokit instance authenticated with that token.
 *
 * Usage:
 *   const installationId = payload.installation?.id;   // from webhook payload
 *   const octokit = await getInstallationOctokit(installationId);
 *   const { data } = await octokit.pulls.listCommits({ owner, repo, pull_number });
 */
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const auth = createAppAuth({
    appId: appId!,
    privateKey: privateKey!,
  });

  // Exchange App credentials for an installation access token
  const { token } = await auth({
    type: "installation",
    installationId,
  });

  return new Octokit({ auth: token });
}
