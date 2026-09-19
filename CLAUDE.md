# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Three documents form the **analysis layer** built on top of `docs/TOPIC.md`. They consume domain
content rather than defining it, and they are joined by stable codes:

- `docs/USE-CASES.md` decomposes the 7 flows into use cases coded `UC-F<flow>-<nn>` (plus `UC-SYS-*`
  for the three foundational ones outside the flows). Its § 10 coverage map asserts that all 27
  requirement codes have at least one use case — adding a code to `TOPIC.md § 3` breaks that
  assertion. Its § 9 records a deliberate gap: `SA-01` and `SA-04` belong to no flow's "Phạm vi liên
  quan" in `TOPIC.md`, so they are handled as foundational use cases instead.
- `docs/USER-STORIES-SC.md`, `docs/USER-STORIES-FS-FM.md` and `docs/USER-STORIES-BM-SA.md` hold stories
  for Storage Customer (22 stories / 111 AC / 95 points), Facility Staff + Facility Manager
  (23 / 94 / 111), and Business Operations Manager + System Administrator (20 / 100 / 100).
  Stories use `US-<mã yêu cầu>.<nn>` and each file's stated totals must be recomputed when changed.
- `docs/BUSINESS-RULES.md` defines rules coded
  `BR-<GEN|RES|AVL|PRI|PAY|DEP|CAN|REN|OVD|RET|CHK|ACC|SUP>-<nn>`. Its § 2 parameter
  table is the single place numeric values live; the prose rules reference the config keys rather
  than repeating numbers. § 14 works those numbers into concrete money examples — changing a
  parameter means recomputing that table too.

`docs/diagrams/` contains the official activity and state machine diagrams in Draw.io format (`.drawio`),
including `activity-diagram-flow-1-storage-reservation.drawio`, `activity-diagram-flow-2-checkin-handover.drawio`,
`activity-diagram-flow-6-1-storage-renewal.drawio`, `activity-diagram-flow-6-2-overdue-handling.drawio`,
`activity-diagram-flow-4-business-operations.drawio`, `activity-diagram-flow-5-facility-staff-management.drawio`,
and `activity-diagram-flow-7-support-incident-handling.drawio`.
Legacy PlantUML diagrams (`.puml`) have been moved to `docs/diagrams/_archive/` for historical reference.

`docs/CONVENTIONS.md` (coding and REST API conventions) and `CONTRIBUTING.md` (Git workflow) describe
code that does not exist yet. Keep them aligned with `PLAN.md § 6`, which already fixed the branch
naming pattern, the one-reviewer rule and the Definition of Done.

`docs/check-docs.sh` enforces the cross-document invariants described above — run `bash
docs/check-docs.sh` from the repo root after editing any analysis document, and before claiming an
edit is complete. It has eight checks: dead relative links, `UC-*` / `BR-*` / requirement codes
referenced but never defined, requirement codes absent from the coverage map, counts disagreeing
between tables, task codes not in `PLAN.md`, and stated totals disagreeing with actual counts. Each
check has been verified to fail on injected bad input, not just to pass on good input — keep that
property when adding a check. It covers Layer 1 (consistency) only; semantic checks belong to the
human layers and should not be added to it.

`docs/REVIEW-CHECKLIST.md` defines the three-layer review process and the per-task stopping
conditions. `docs/OPEN-ISSUES.md` is its escape valve: unresolved findings are recorded there rather
than blocking a review from closing, and resolved entries move to its "Đã chốt" table rather than
being deleted. When a decision recorded there is settled, the corresponding document must be updated
in the same change.

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
