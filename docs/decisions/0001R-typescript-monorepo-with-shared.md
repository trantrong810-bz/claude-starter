---
number: 0001
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-03, ca-20261101-04, commit 1eb4579
---

# TypeScript monorepo across all three layers, with shared types in packages/shared

## Context

A full-stack project (backend, web, mobile) built by one person on one machine. Claude needs to see the whole system and notice right away when the API contract drifts between layers.

## Options

- A repo per layer: well separated, but Claude cannot see the shared contract, and an API change touches several repos.
- A monorepo with a Java backend and an OpenAPI-generated client: fits Java experience, but two languages and an extra codegen step.
- A TypeScript monorepo across all three layers (Next.js, Expo, Node) + `packages/shared`: one language, types shared directly.

## Decision

A pnpm + Turborepo monorepo, strict TypeScript in all three layers, with Zod schemas in `packages/shared` as the single source of truth for the contract.

## Consequences

A contract change makes typecheck fail everywhere it matters. A Java backend remains possible but would have to go contract-first with OpenAPI.
