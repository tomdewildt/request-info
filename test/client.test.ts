import { beforeEach, describe, expect, test } from "vitest";
import { commentAndLabel, fetchTemplates, type GitHubClient } from "../src/client.js";

class FakeGitHubClient implements GitHubClient {
  createdComments: Array<{ issueNumber: number; body: string }> = [];
  existingComments: Array<{ body?: string | null }> = [];
  addedLabels: Array<{ issueNumber: number; labels: readonly string[] }> = [];
  removedLabels: Array<{ issueNumber: number; label: string }> = [];
  directories: Map<string, string[]> = new Map();
  files: Map<string, string> = new Map();

  async listComments(): Promise<ReadonlyArray<{ body?: string | null }>> {
    return this.existingComments;
  }

  async createComment(issueNumber: number, body: string): Promise<void> {
    this.createdComments.push({ issueNumber, body });
  }

  async addLabels(issueNumber: number, labels: readonly string[]): Promise<void> {
    this.addedLabels.push({ issueNumber, labels });
  }

  async removeLabel(issueNumber: number, label: string): Promise<void> {
    this.removedLabels.push({ issueNumber, label });
  }

  async getContent(path: string): Promise<string | null> {
    return this.files.get(path) ?? null;
  }

  async listDirectory(path: string): Promise<string[]> {
    return this.directories.get(path) ?? [];
  }
}

describe("commentAndLabel", () => {
  let client: FakeGitHubClient;
  const marker = "<!-- request-info-bot -->";
  const message = "Please add more info.";
  const label = "need-more-info";

  beforeEach(() => {
    client = new FakeGitHubClient();
  });

  test("posts comment with marker prefix and applies label on first run", async () => {
    await commentAndLabel(client, 42, marker, message, label);

    expect(client.createdComments).toEqual([{ issueNumber: 42, body: `${marker}\n${message}` }]);
    expect(client.addedLabels).toEqual([{ issueNumber: 42, labels: [label] }]);
  });

  test("skips comment when an existing comment already contains the marker", async () => {
    client.existingComments = [{ body: `${marker}\nold message` }];

    await commentAndLabel(client, 42, marker, message, label);

    expect(client.createdComments).toEqual([]);
  });

  test("still applies label when comment was skipped", async () => {
    client.existingComments = [{ body: `${marker}\nold message` }];

    await commentAndLabel(client, 42, marker, message, label);

    expect(client.addedLabels).toEqual([{ issueNumber: 42, labels: [label] }]);
  });

  test("treats unrelated comments without the marker as not duplicates", async () => {
    client.existingComments = [
      { body: "This comment is unrelated." },
      { body: null },
      { body: undefined },
    ];

    await commentAndLabel(client, 42, marker, message, label);

    expect(client.createdComments).toEqual([{ issueNumber: 42, body: `${marker}\n${message}` }]);
  });

  test("skips comment and only applies label when message is empty", async () => {
    await commentAndLabel(client, 42, marker, "", label);

    expect(client.createdComments).toEqual([]);
    expect(client.addedLabels).toEqual([{ issueNumber: 42, labels: [label] }]);
  });
});

describe("fetchTemplates", () => {
  let client: FakeGitHubClient;

  beforeEach(() => {
    client = new FakeGitHubClient();
  });

  test("fetches single issue template file", async () => {
    client.files.set(".github/ISSUE_TEMPLATE.md", "## Bug Report");

    const templates = await fetchTemplates(client, false);

    expect(templates).toEqual(["## Bug Report"]);
  });

  test("fetches templates from issue template directory", async () => {
    client.directories.set(".github/ISSUE_TEMPLATE", [
      ".github/ISSUE_TEMPLATE/bug.md",
      ".github/ISSUE_TEMPLATE/feature.md",
    ]);
    client.files.set(".github/ISSUE_TEMPLATE/bug.md", "## Bug");
    client.files.set(".github/ISSUE_TEMPLATE/feature.md", "## Feature");

    const templates = await fetchTemplates(client, false);

    expect(templates).toEqual(["## Bug", "## Feature"]);
  });

  test("combines single file and directory templates for issues", async () => {
    client.files.set(".github/ISSUE_TEMPLATE.md", "## Default");
    client.directories.set(".github/ISSUE_TEMPLATE", [".github/ISSUE_TEMPLATE/bug.md"]);
    client.files.set(".github/ISSUE_TEMPLATE/bug.md", "## Bug");

    const templates = await fetchTemplates(client, false);

    expect(templates).toEqual(["## Default", "## Bug"]);
  });

  test("fetches pull request template file", async () => {
    client.files.set(".github/PULL_REQUEST_TEMPLATE.md", "## PR Description");

    const templates = await fetchTemplates(client, true);

    expect(templates).toEqual(["## PR Description"]);
  });

  test("returns empty array when no templates exist", async () => {
    const templates = await fetchTemplates(client, false);

    expect(templates).toEqual([]);
  });

  test("skips files that return null content", async () => {
    client.directories.set(".github/ISSUE_TEMPLATE", [
      ".github/ISSUE_TEMPLATE/bug.md",
      ".github/ISSUE_TEMPLATE/missing.md",
    ]);
    client.files.set(".github/ISSUE_TEMPLATE/bug.md", "## Bug");

    const templates = await fetchTemplates(client, false);

    expect(templates).toEqual(["## Bug"]);
  });
});
