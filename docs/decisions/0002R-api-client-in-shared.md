---
number: 0002
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-04, ca-20261101-15, commit 1bbadf3
---

# The API client lives in packages/shared; apps contain UI only

## Context

In the toggle-todo trial run, two subagents wrote identical API-calling functions in web and mobile, with no tests; the reviewer caught an unencoded `id` and a response that was only cast with `as`.

## Options

- Each app writes its own client: flexible, but duplicated code and duplicated bugs.
- A client generated from OpenAPI: robust, but one more tool.
- A hand-written client in shared, written once and tested with a fake `fetch`.

## Decision

The client lives in `packages/shared`: it parses responses with the schema, encodes every URL parameter, and has tests. Apps only call the client.

## Consequences

A contract change surfaces errors in all 4 packages. Apps no longer have their own `fetch`; `app-builder` and `code-reviewer` are told to check this.
