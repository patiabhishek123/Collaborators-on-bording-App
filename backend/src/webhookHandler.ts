import { Webhooks } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";

const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Missing required env var: GITHUB_WEBHOOK_SECRET");
}

export const webhooks = new Webhooks({
  secret: webhookSecret,
});

webhooks.onAny(({ id, name, payload }) => {
  const repoName = "repository" in payload ? payload.repository?.full_name : "unknown-repo";
  console.log(`[webhook] id=${id} event=${name} repo=${repoName}`);
});

webhooks.on("pull_request.opened", async ({ payload }) => {
  const prNumber = payload.pull_request.number;
  const repositoryName = payload.repository.full_name;
  const authorUsername = payload.pull_request.user.login;
  const installationToken = process.env.GITHUB_INSTALLATION_TOKEN;

  console.log(
    [
      "[pull_request.opened]",
      `PR Number: ${prNumber}`,
      `Repository: ${repositoryName}`,
      `Author: ${authorUsername}`,
    ].join(" ")
  );

  if (!installationToken) {
    console.warn("[pull_request.opened] Skipping commit fetch: GITHUB_INSTALLATION_TOKEN not set");
    return;
  }

  const octokit = new Octokit({ auth: installationToken });
  const [owner, repo] = repositoryName.split("/");

  try {
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
    });

    console.log(`[pull_request.opened] Fetched ${commits.length} commit(s) for PR #${prNumber}:`);
    for (const { sha, commit } of commits) {
      const shortSha = sha.slice(0, 7);
      const email = commit.author?.email ?? "unknown";
      const message = commit.message.split("\n")[0]; // first line only
      console.log(`  - SHA: ${shortSha} | Author: ${email} | Message: ${message}`);
    }
  } catch (err) {
    console.error("[pull_request.opened] Failed to fetch commits:", err);
  }
});

webhooks.onError((error) => {
  console.error("[webhook] error", error);
});
