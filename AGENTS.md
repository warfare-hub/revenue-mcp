# Revenue MCP Agent Operating Contract

## Product Purpose

This repo owns the public `revenue-mcp` package: an MCP server for querying
revenue data from Stripe, Gumroad, and Lemon Squeezy.

It is a utility repo, not the company command center and not a place to store
private revenue data.

## Source Of Truth

Read in order:

1. `README.md`
2. this `AGENTS.md`
3. Ezra project capsule if available:
   `$EZRA_REPO/memory/wiki/projects/revenue-mcp.md`
4. target source files only

Do not read `.env` files, shell history, Claude Desktop config files, provider
dashboards, API keys, tokens, or private revenue exports unless Brandon
explicitly approves the exact source.

## Repo Map

- `src/index.ts`: MCP server entrypoint.
- `src/providers/`: provider adapters for Stripe, Gumroad, and Lemon Squeezy.
- `src/tools/`: MCP tool definitions and request handling.
- `.github/workflows/publish.yml`: npm publish workflow.

## Working Rules

- Check `git status --short --branch` before edits.
- Do not revert unrelated user/agent work.
- Keep provider-specific behavior inside provider adapters.
- Keep MCP tool shapes explicit and stable.
- Never commit API keys, provider tokens, customer records, revenue exports, or
  generated private reports.

## Checks

Use the narrowest checks that cover the touched area:

```bash
npm run build
```

For docs-only changes:

```bash
git diff --check
```

## Gates

- Publishing a new npm version requires Brandon approval.
- Adding a new payment provider requires Brandon approval.
- Any production credential, provider dashboard, or real revenue data access
  requires Brandon approval.

