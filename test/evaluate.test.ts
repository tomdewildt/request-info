import { describe, expect, test } from "vitest";
import { evaluate, parseTitles, renderMessage } from "../src/evaluate.js";

const DEFAULT_TITLES = ["update", "updates", "test", "issue", "debug", "demo"];

describe("parseTitles", () => {
  test("splits on newlines", () => {
    expect(parseTitles("fix\nwip")).toEqual(["fix", "wip"]);
  });

  test("splits on commas", () => {
    expect(parseTitles("fix, wip")).toEqual(["fix", "wip"]);
  });

  test("lowercases values", () => {
    expect(parseTitles("FIX, WIP")).toEqual(["fix", "wip"]);
  });

  test("trims whitespace around values", () => {
    expect(parseTitles("  fix  ,  wip  ")).toEqual(["fix", "wip"]);
  });

  test("drops empty entries", () => {
    expect(parseTitles("fix,,wip,\n\n")).toEqual(["fix", "wip"]);
  });

  test("returns empty array for empty input", () => {
    expect(parseTitles("")).toEqual([]);
  });
});

describe("renderMessage", () => {
  test("replaces author placeholder with username", () => {
    expect(renderMessage("Hello {{ author }}!", "octocat")).toBe("Hello octocat!");
  });

  test("handles placeholder without spaces", () => {
    expect(renderMessage("Hello {{author}}!", "octocat")).toBe("Hello octocat!");
  });

  test("replaces multiple occurrences", () => {
    expect(renderMessage("{{ author }} said {{ author }}", "octocat")).toBe("octocat said octocat");
  });

  test("returns message unchanged when no placeholder present", () => {
    expect(renderMessage("Hello world!", "octocat")).toBe("Hello world!");
  });
});

describe("evaluate", () => {
  test("returns not flagged when title and body are fine", () => {
    expect(evaluate("Real title", "Real body", DEFAULT_TITLES)).toEqual({
      flagged: false,
      reason: null,
    });
  });

  test("flags by title when title matches a default", () => {
    expect(evaluate("update", "Real body", DEFAULT_TITLES)).toEqual({
      flagged: true,
      reason: "title",
    });
  });

  test("flags by body when body is empty", () => {
    expect(evaluate("Real title", "", DEFAULT_TITLES)).toEqual({
      flagged: true,
      reason: "body",
    });
  });

  test("flags by title_and_body when title and body are title_and_body bad", () => {
    expect(evaluate("update", "", DEFAULT_TITLES)).toEqual({
      flagged: true,
      reason: "title_and_body",
    });
  });

  test("compares title case-insensitively after trimming", () => {
    expect(evaluate("  UPDATE  ", "ok", DEFAULT_TITLES)).toEqual({
      flagged: true,
      reason: "title",
    });
  });

  test("flags title shorter than min-title-length", () => {
    expect(evaluate("bug", "Real body", DEFAULT_TITLES, 8)).toEqual({
      flagged: true,
      reason: "title",
    });
  });

  test("does not flag title at or above min-title-length", () => {
    expect(evaluate("real bug", "Real body", DEFAULT_TITLES, 8)).toEqual({
      flagged: false,
      reason: null,
    });
  });

  test("skips min-title-length check when set to zero", () => {
    expect(evaluate("bug", "Real body", DEFAULT_TITLES, 0)).toEqual({
      flagged: false,
      reason: null,
    });
  });

  test("treats whitespace-only body as empty", () => {
    expect(evaluate("Real title", "   \n  ", DEFAULT_TITLES)).toEqual({
      flagged: true,
      reason: "body",
    });
  });

  test("treats null body as empty", () => {
    expect(evaluate("Real title", null, DEFAULT_TITLES)).toEqual({
      flagged: true,
      reason: "body",
    });
  });

  test("flags body that matches a template exactly", () => {
    const templates = ["## Description\n\n## Steps to Reproduce"];
    expect(
      evaluate(
        "Real title",
        "## Description\n\n## Steps to Reproduce",
        DEFAULT_TITLES,
        0,
        templates,
      ),
    ).toEqual({ flagged: true, reason: "body" });
  });

  test("flags body that is a subset of a template", () => {
    const templates = ["## Description\n\n## Steps to Reproduce\n\n## Expected"];
    expect(
      evaluate(
        "Real title",
        "## Description\n\n## Steps to Reproduce",
        DEFAULT_TITLES,
        0,
        templates,
      ),
    ).toEqual({ flagged: true, reason: "body" });
  });

  test("does not flag body with content beyond the template", () => {
    const templates = ["## Description"];
    expect(
      evaluate("Real title", "## Description\n\nActual content here", DEFAULT_TITLES, 0, templates),
    ).toEqual({ flagged: false, reason: null });
  });

  test("template matching ignores whitespace differences", () => {
    const templates = ["## Description\n\n\n## Steps"];
    expect(
      evaluate("Real title", "## Description\n## Steps", DEFAULT_TITLES, 0, templates),
    ).toEqual({
      flagged: true,
      reason: "body",
    });
  });
});
