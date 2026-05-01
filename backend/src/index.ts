import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createNodeMiddleware } from "@octokit/webhooks";
import { webhooks } from "./webhookHandler.js";

const appId = process.env.GITHUB_APP_ID;

if (!appId) {
  throw new Error("Missing required env var: GITHUB_APP_ID");
}

const app = express();
const port = 3000;

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", appId });
});

app.use(createNodeMiddleware(webhooks, { path: "/webhook" }));

app.listen(port, () => {
  console.log(`GitHub App backend running on http://localhost:${port}`);
});
