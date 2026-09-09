# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This repository is in its initial/scaffolding stage — it currently contains no source code, package manifest, or build tooling. There are no build, lint, or test commands yet.

## Project Purpose

my-refrigerator — an app for checking what items are inside the fridge (per README.md).

## Frontend Conventions

When frontend code is added to this repo, follow `.claude/skills/frontend/SKILL.md`, which defines the intended stack and structure: Vue 3 (Composition API) + JavaScript, with `/components` and `/router` (router built via `createRouter()`), login/logout auth flow with route guards, and mobile-first responsive UI.

## Database Conventions

When database schema, migrations, or `src/repositories/`/`src/services/` data-access code is added to this repo, follow `.claude/skills/database/SKILL.md`, which defines the intended stack: Supabase (Postgres + Auth), schema/naming conventions, Row Level Security, and the rule that only `src/repositories/` may talk to Supabase directly, with `src/services/` calling repositories.

## Backend / Data Flow Conventions

When adding or editing a Pinia store action, wiring a store to a service function, or handling errors/validation around a form submission, follow `.claude/skills/backend/SKILL.md`, which defines the store↔service contract, error propagation (services throw, stores don't catch, components catch and render `errorMessage`), and where input validation/normalization belongs.

## Feature Conventions

When building or adding a new feature end-to-end, follow `.claude/skills/feature/SKILL.md`, which defines the parts a complete feature must have (View, Components, Store, Service, Repository, Types, Test) and the step-by-step order to build one (confirm requirements → analyze data structure → design UI → define Types → build Repository/Service → build Store/Components → wire up error/loading state → test).
