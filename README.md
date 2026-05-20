# Request Info

[![License](https://img.shields.io/github/license/tomdewildt/request-info)](https://github.com/tomdewildt/request-info/blob/master/LICENSE)

A GitHub Action that flags issues and pull requests with missing or low-effort metadata, posts a single comment asking for more detail, and applies a configurable label.

# How To Run

Prerequisites:

- mise version `2025.1.0` or later
- node version `24.0.0` or later

### Development

1. Run `mise run init` to initialize the environment.
2. Run `mise run build` to bundle the action into `dist/index.js`.

# How To Use

```yaml
name: triage
on:
  issues:
    types: [opened, edited]
  pull_request_target:
    types: [opened, edited, synchronize]

permissions:
  issues: write
  pull-requests: write

jobs:
  request-info:
    runs-on: ubuntu-latest
    steps:
      - uses: tomdewildt/request-info@v1
        with:
          label: need-more-info
```

# Inputs

| Input              | Required | Default                        | Description                                                                       |
| ------------------ | -------- | ------------------------------ | --------------------------------------------------------------------------------- |
| `repo-token`       | no       | `${{ github.token }}`          | Token with `issues: write` and `pull-requests: write`.                            |
| `label`            | no       | `need-more-info`               | Label applied when the issue or pull request is flagged.                          |
| `message`          | no       | see `action.yml`               | Comment posted when flagged. Set to empty string to skip commenting.              |
| `marker`           | no       | `<!-- request-info-action -->` | HTML comment used for dedupe across re-runs.                                      |
| `default-titles`   | no       | `update, updates, ...`         | Newline- or comma-separated list of placeholder titles to flag. Case-insensitive. |
| `min-title-length` | no       | `8`                            | Minimum title length. Titles shorter than this are flagged.                       |
| `match-templates`  | no       | `true`                         | When enabled, flag bodies that match an unfilled issue or pull-request template.  |

# Outputs

| Output    | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `flagged` | `"true"` or `"false"` so downstream steps can branch.              |
| `reason`  | `"title"`, `"body"`, `"title_and_body"`, or `null` when not flagged. |

# References

[GitHub Actions Toolkit Docs](https://github.com/actions/toolkit)

[Creating a JavaScript Action Docs](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-javascript-action)

[Vite Docs](https://vite.dev/)

[Vitest Docs](https://vitest.dev/)
