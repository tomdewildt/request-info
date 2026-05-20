export interface GitHubClient {
  listComments(issueNumber: number): Promise<ReadonlyArray<{ body?: string | null }>>;
  createComment(issueNumber: number, body: string): Promise<void>;
  addLabels(issueNumber: number, labels: readonly string[]): Promise<void>;
  removeLabel(issueNumber: number, label: string): Promise<void>;
  getContent(path: string): Promise<string | null>;
  listDirectory(path: string): Promise<string[]>;
}

export async function fetchTemplates(client: GitHubClient, isPR: boolean): Promise<string[]> {
  const singleFile = isPR ? ".github/PULL_REQUEST_TEMPLATE.md" : ".github/ISSUE_TEMPLATE.md";
  const directoryFiles = isPR ? [] : await client.listDirectory(".github/ISSUE_TEMPLATE");

  const contents = await Promise.all(
    [singleFile, ...directoryFiles].map((path) => client.getContent(path)),
  );

  return contents.filter((c): c is string => c !== null);
}

export async function commentAndLabel(
  client: GitHubClient,
  issueNumber: number,
  marker: string,
  message: string,
  label: string,
): Promise<void> {
  if (message) {
    const allComments = await client.listComments(issueNumber);
    const alreadyCommented = allComments.some((comment) => comment.body?.includes(marker));

    if (!alreadyCommented) {
      await client.createComment(issueNumber, `${marker}\n${message}`);
    }
  }

  await client.addLabels(issueNumber, [label]);
}
