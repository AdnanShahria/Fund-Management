# Project conventions

## Language and output style

Write everything produced in this project, files and messages alike, in plain simple language. Talk to the reader as you, warm and direct like a colleague, and present every step as a recommendation they may run or skip, never an order. Keep technical terms that carry real meaning, and explain each in plain words. 

Never use a dash or a hyphen as punctuation. That means no em dash, no en dash, and no hyphenated compounds. Write read only, not read-only. Write user facing, not user-facing. Write high level, not high-level. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.

## Engineering workflow

This repository uses the engineering workflow skills from JavaScript Mastery:

- `scope`: Turns a product idea into a living, coarse scope in `docs/scope/`.
- `architect`: Makes a load bearing decision and writes it as a spec in `docs/specs/`.
- `develop`: Builds a feature, UI or backend, from its spec.
- `check`: Confirms a change before merge with verification and second model review.
- `test`: Writes a test suite for code you just built or changed.
- `document`: Writes human facing documentation from git diffs.
- `sync`: Reconciles context files, scope, and specs after changes.
- `debug`: Finds and fixes the root cause of an issue.
- `audit`: Builds context files so every skill understands your stack and commands.

## Decision rules

- The engineer decides, the AI recommends. Any check or review is offered, never run or skipped on your behalf.
- Every user facing question carries exactly one recommended option with a one line why.
- State lives in files so nothing is trapped in chat.
