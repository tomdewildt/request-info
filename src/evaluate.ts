export type EvaluateResult =
  | { flagged: false; reason: null }
  | { flagged: true; reason: "title" | "body" | "title_and_body" };

export function parseTitles(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export function renderMessage(template: string, author: string): string {
  return template.replace(/\{\{\s*author\s*\}\}/g, author);
}

function isBadTitle(
  title: string,
  defaultTitles: readonly string[],
  minTitleLength: number,
): boolean {
  if (defaultTitles.includes(title)) {
    return true;
  }
  if (minTitleLength > 0 && title.length < minTitleLength) {
    return true;
  }
  return false;
}

function isBadBody(body: string, templates: readonly string[]): boolean {
  if (body.length === 0) {
    return true;
  }
  const strippedBody = body.replace(/\s+/g, "");
  return templates.some((t) => t.replace(/\s+/g, "").includes(strippedBody));
}

export function evaluate(
  title: string,
  body: string | null | undefined,
  defaultTitles: readonly string[],
  minTitleLength: number = 0,
  templates: readonly string[] = [],
): EvaluateResult {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedBody = (body ?? "").trim();

  const titleIsBad = isBadTitle(normalizedTitle, defaultTitles, minTitleLength);
  const bodyIsBad = isBadBody(normalizedBody, templates);

  if (!titleIsBad && !bodyIsBad) {
    return { flagged: false, reason: null };
  }

  let reason: "title" | "body" | "title_and_body";
  if (titleIsBad && bodyIsBad) {
    reason = "title_and_body";
  } else if (titleIsBad) {
    reason = "title";
  } else {
    reason = "body";
  }

  return { flagged: true, reason };
}
