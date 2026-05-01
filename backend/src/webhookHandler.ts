import { githubApp, getInstallationOctokit } from "./githubApp.js";

export const webhooks = githubApp.webhooks;

webhooks.onAny(({ id, name, payload }) => {
  const repoName = "repository" in payload ? payload.repository?.full_name : "unknown-repo";
  console.log(`[webhook] id=${id} event=${name} repo=${repoName}`);
});

webhooks.on("pull_request.opened", async ({ payload }) => {
  const prNumber = payload.pull_request.number;
  const repositoryName = payload.repository.full_name;
  const authorUsername = payload.pull_request.user.login;
  // Installation ID ties this webhook event to a specific GitHub App installation
  const installationId = payload.installation?.id;

  console.log(
    [
      "[pull_request.opened]",
      `PR Number: ${prNumber}`,
      `Repository: ${repositoryName}`,
      `Author: ${authorUsername}`,
    ].join(" ")
  );

  if (!installationId) {
    console.warn("[pull_request.opened] Skipping commit fetch: installation ID missing from payload");
    return;
  }

  // Generates (and caches) an installation access token via GitHub App private key
  const octokit = await getInstallationOctokit(installationId);
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
