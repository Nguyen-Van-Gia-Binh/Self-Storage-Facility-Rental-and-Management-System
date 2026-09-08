# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a **specification-stage repository**. It contains no source code, no build system, no
dependency manifest, and no git history — only `README.md` and `docs/TOPIC.md`.

There are therefore **no build, lint, test, or run commands**. Do not invent them, and do not
scaffold a project skeleton unless explicitly asked. The technology stack is deliberately undecided
(README § "Trạng thái dự án" tracks this). When implementation starts, the stack decision and
setup/run instructions belong in `README.md`, and the commands should then be added to this file.

The planned next steps are listed in README § "Việc tiếp theo": decompose the 7 flows into use
cases/user stories, pin down business rules (deposit, renewal, cancellation, return, overdue), design
the data model, choose the stack, then document setup.

## Document architecture

`docs/TOPIC.md` is the **single source of truth** for the domain. `README.md` is a condensed mirror
of it — actor table, flow tables, status. Any change to actors, functions, or flows must be applied
to `docs/TOPIC.md` first and then reflected in `README.md`, or the two drift apart.

`docs/TOPIC.md` has an internal consistency structure that spans sections; changing one part usually
requires updating others:

- **§ 3** defines every function under a stable requirement code: `SC-*` (Storage Customer),
  `FS-*` (Facility Staff), `FM-*` (Facility Manager), `BM-*` (Business Operations Manager),
  `SA-*` (System Administrator). These codes are the join key for the whole document.
- **§ 4–5** define the 7 flows (1–5 main, 6–7 additional). Each flow lists its actors and a
  "Phạm vi liên quan" set of § 3 codes. Every code referenced there must exist in § 3.
- **§ 6** is an actor × flow matrix using ● (primary actor) / ○ (related actor). It must agree with
  the per-flow actor lists in § 4–5 — these are two views of the same fact.
- **§ 7** is the glossary; introduce a new domain noun there before using it elsewhere.

Do not renumber existing requirement codes or flow numbers — they are referenced across both files.
Append new codes instead.

### Sections that are not yours to rewrite

- **§ 8 (Phụ lục)** is the verbatim original assignment text in English. Treat it as read-only
  source material; never reword, "fix", or translate it.
- The note at the top of **§ 4** records that only the flow *names* came from the original
  assignment — the actor assignments and "Phạm vi liên quan" sets are inferred from § 3. Preserve
  that distinction between given and inferred content when editing.

## Writing conventions

Documentation prose is **Vietnamese**; domain terms stay in **English** and match § 7 exactly
(Facility, Storage Unit, Unit Type, Reservation, Deposit, Check-in / Handover, Access Code /
Access Card, Renewal, Overdue, Return, Usage Rate). Actor names are always written in English.
Headings that name a domain concept give the English term first with the Vietnamese gloss after
(e.g. "Storage Customer — Khách thuê kho"). Structured content is expressed as Markdown tables with
a code column where the § 3 / flow numbering applies.
