import * as core from "@actions/core";
import * as github from "@actions/github";
import { commentAndLabel, fetchTemplates } from "./client.js";
import { evaluate, parseTitles, renderMessage } from "./evaluate.js";
import { createGitHubClient } from "./github.js";

export async function run(): Promise<void> {
  try {
    const token = core.getInput("repo-token", { required: true });
    const label = core.getInput("label");
    const message = core.getInput("message");
    const marker = core.getInput("marker");
    const defaultTitles = parseTitles(core.getInput("default-titles"));
    const minTitleLength = parseInt(core.getInput("min-title-length"), 10);
    const matchTemplates = core.getInput("match-templates") !== "false";

    const { context } = github;
    const item = context.payload.issue ?? context.payload.pull_request;
    if (!item) {
      core.info("No issue or pull request in payload; skipping.");
      core.setOutput("flagged", "false");
      core.setOutput("reason", null);
      return;
    }

    const isPR = !!context.payload.pull_request;
    const issueNumber = item.number as number;
    const title = (item.title as string | undefined) ?? "";
    const body = item.body as string | null | undefined;
    const author = (item.user?.login as string | undefined) ?? "";

    const octokit = github.getOctokit(token);
    const { owner, repo } = context.repo;
    const client = createGitHubClient(octokit, owner, repo);

    const templates = matchTemplates ? await fetchTemplates(client, isPR) : [];
    const result = evaluate(title, body, defaultTitles, minTitleLength, templates);

    if (!result.flagged) {
      await client.removeLabel(issueNumber, label);
      core.info("Title and body look fine; removed label if present.");
      core.setOutput("flagged", "false");
      core.setOutput("reason", null);
      return;
    }

    const renderedMessage = renderMessage(message, author);
    await commentAndLabel(client, issueNumber, marker, renderedMessage, label);

    core.info(`Flagged ${isPR ? "PR" : "issue"} #${issueNumber} (reason=${result.reason})`);
    core.setOutput("flagged", "true");
    core.setOutput("reason", result.reason);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
