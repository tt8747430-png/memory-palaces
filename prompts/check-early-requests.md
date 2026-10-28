# Check the early requests still hold

## Goal

Confirm that what the owner asked for early on still holds, and fix any place where it has slipped. These are built today, so this is a regression check, not new work.

## Context

Read `CLAUDE.md` and load the `owner-way` skill.

## Task

1. **The concise answer style.** The owner asked: "Be extremely concise. Sacrifice grammar for the sake of concision." Put it at the top of `CLAUDE.md` and wherever answers are shaped. Built: it opens `CLAUDE.md` ("Answer style — overrides everything below"). Check it is still first, word for word, and that the `owner-way` skill's reporting rules agree with it.

Add a line here for each further early request the owner wants guarded, with where it lives now.

## Constraints

- Fix at the cause. Don't add a second mechanism beside the one named.

## Done means

Each request is confirmed, or fixed with a test or a doc change that holds it.

## Report

One line per request (holds, or fixed and how), then the commits.
