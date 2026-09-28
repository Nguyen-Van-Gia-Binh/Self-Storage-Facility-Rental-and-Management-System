# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project state

This is a **specification and planning repository**. It contains no source code, no build system and
no dependency manifest — only `README.md`, `CONTRIBUTING.md` and the documents under `docs/`.

There are therefore **no build, lint, test, or run commands**. Do not invent them, and do not
scaffold a project skeleton unless explicitly asked. The stack has been decided — Spring Boot (Java),
React, SQL Server, Flyway, JWT — but nothing has been scaffolded yet; scaffolding is tasks T1.16 and
T1.17 of Phase 1 in `docs/PLAN.md`. When implementation starts, setup/run instructions belong in
`README.md`, and the commands should then be added to this file.

The project runs 08/09/2026 – 16/11/2026 in five two-week phases. The current phase and its next
steps live in `docs/PLAN.md`, mirrored in README § "Trạng thái dự án" and § "Việc tiếp theo".

## Document architecture

`docs/TOPIC.md` is the **single source of truth** for the domain. `README.md` is a condensed mirror
of it — actor table, flow tables, status. Any change to actors, functions, or flows must be applied
to `docs/TOPIC.md` first and then reflected in `README.md`, or the two drift apart.

`docs/PLAN.md` is the **execution plan** — phases, tasks, assignees, deadlines, risks. It consumes
domain content rather than defining it: its tasks reference § 3 requirement codes and § 4–5 flows,
and its § 5 coverage map asserts that all 27 requirement codes are assigned to a phase. Adding a
requirement code to `docs/TOPIC.md` therefore breaks that assertion until the plan is updated too.
The plan is mirrored in a Notion page and task database (linked at the top of `docs/PLAN.md`), and
README § "Kế hoạch triển khai" carries a condensed copy of the roadmap and role tables — a change to
phases or tasks has to land in all three.

The core **specification and analysis layer** built on top of `docs/TOPIC.md` includes:

- `docs/DASHBOARD.md` is the **single working memory** and operational dashboard for current sprint focus,
  4 workstreams status, and a lean 3-line issue tracker.
- `docs/USER-STORIES-AND-USE-CASES.md` is the **unified requirements specification** consolidating:
  - Part 0: Mandatory rules and format for writing/updating stories and use cases.
  - Part 1: All User Stories & Acceptance Criteria across 5 actors (`SC-*`, `FS-*`, `FM-*`, `BM-*`, `SA-*`).
  - Part 2: Use case decomposition for all 7 business flows (`UC-F1-*` .. `UC-F7-*`) and foundational system flows (`UC-SYS-*`), along with the 27 requirements coverage matrix.
- `docs/BUSINESS-RULES.md` defines rules coded
  `BR-<GEN|RES|AVL|PRI|PAY|DEP|CAN|REN|OVD|RET|CHK|ACC|SUP>-<nn>`. Its § 2 parameter
  table is the single place numeric values live.

Legacy analysis files (`USE-CASES.md`, `USER-STORIES-*.md`, `REVIEW-CHECKLIST.md`, `OPEN-ISSUES.md`,
`DEMO-GUIDE.md`, `check-docs.sh`, etc.) have been moved to `docs/_archive/` for historical reference.

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

Diagrams are the exception: titles, labels, notes and comments in `docs/diagrams/*.puml` are written
in **English** (`docs/CONVENTIONS.md § 1`), still using the § 7 terms and unchanged `UC-*` / `BR-*` /
`US-*` codes. Diagrams created before this rule still carry Vietnamese labels.
