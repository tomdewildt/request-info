import { getOctokit } from "@actions/github";
import type { GitHubClient } from "./client.js";

export function createGitHubClient(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repo: string,
): GitHubClient {
  return {
    async listComments(number) {
      return octokit.paginate(octokit.rest.issues.listComments, {
        owner,
        repo,
        issue_number: number,
        per_page: 100,
      });
    },

    async createComment(number, body) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: number,
        body,
      });
    },

    async addLabels(number, labels) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: number,
        labels: [...labels],
      });
    },

    async removeLabel(number, labelName) {
      try {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: number,
          name: labelName,
        });
      } catch {
        // 404 expected when label is absent
      }
    },

    async getContent(path) {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        if (!Array.isArray(data) && data.type === "file" && data.content) {
          return Buffer.from(data.content, "base64").toString("utf-8");
        }
        return null;
      } catch {
        return null;
      }
    },

    async listDirectory(path) {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        if (Array.isArray(data)) {
          return data.filter((entry) => entry.type === "file").map((entry) => entry.path);
        }
        return [];
      } catch {
        return [];
      }
    },
  };
}
