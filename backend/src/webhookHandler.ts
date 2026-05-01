import { Webhooks } from "@octokit/webhooks";

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

webhooks.on("pull_request.opened", ({ payload }) => {
  const prNumber = payload.pull_request.number;
  const repositoryName = payload.repository.full_name;
  const authorUsername = payload.pull_request.user.login;

  console.log(
    [
      "[pull_request.opened]",
      `PR Number: ${prNumber}`,
      `Repository: ${repositoryName}`,
      `Author: ${authorUsername}`,
    ].join(" ")
  );
});

webhooks.onError((error) => {
  console.error("[webhook] error", error);
});
