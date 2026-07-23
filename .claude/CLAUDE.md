# CLAUDE.md

## Purpose
This file defines repository-specific instructions for AI coding agents working in this project.

## Project Context
- Angular app focused on insights/reporting workflows.
- Prioritize correctness for charts, filtering, loading, and empty states.
- Maintain current UX behavior unless explicitly asked to change it.

## Stack and Tooling
- Angular + TypeScript
- Tailwind + Angular Material
- Chart.js and Ag-Grid
- Package manager: pnpm

## Repository Conventions
- Make minimal, targeted edits.
- Preserve existing component inputs/outputs and routing behavior.
- Keep templates readable; avoid broad reformatting.
- Reuse button styles across the site to keep the look consistent: main buttons should be dark blue background with white text. icon buttons for add, save, edit, delete, etc. should use the same icons and styles.
- Ensure that new style elements have both light mode and dark mode compatibility
- Consider section 508 accessibility rules and flag issues.
- Ensure text strings have existing translations. If no translations found, flag so they can be manually added. When asked for strings that do not have translations, print out a simple list without quotation marks or colons so it is easy to copy and paste the entries.
- this repo is the frontend for the seed repo located at ../seed ocally, or at https://github.com/seed-platform/seed.  That repo has v3 endpoints. Those endpoints should not be modified. First try to use them as is in the new UI; if it proves too difficult or an anti-pattern to do so, you can create new v4 endpoints to replicate the functionality as needed.

## Empty and Loading State Rules
- If no program is selected or found, show only the No Programs Found state.
- Do not show chart containers, chart grids, table sections, or loading indicators in no-program state.
- Loading indicators should appear only when a valid program is present and data is being fetched.

## Validation Requirements
- Lint all touched files.
- Run relevant tests for changed modules when available.
- If tests are missing, provide manual verification steps and expected outcomes.

## Change Boundaries
- Do not modify unrelated files.
- Do not add dependencies without clear need.
- Do not change API payload shapes without explicit approval.

## Response Expectations
- Summarize what changed and why.
- List files touched.
- Mention validation performed and any remaining risks.
- When prompted for a PR message, keep it brief to a title and an itemized list of changes
