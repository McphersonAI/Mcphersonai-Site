# Governance Overview

The Governance Layer is the internal gate between "we built it" and "it is
allowed to run." It supports the path:

Operator Diagnostic → Written Assessment → Pilot Scope → Governed Pilot
Setup → Live Pilot → Weekly Proof Review

Five connected pieces form one loop:

1. **Governance Registry** — what exists, what it touches, who approved it.
2. **Kill Switch Config Layer** — whether anything is allowed to act, with
   deny-by-default flags, runtime guard, and blocked-action logging.
3. **AI Eval Pack** — fake safety cases proving behavior, not just code.
4. **Pilot Readiness Checklist** — the 21-section go-live gate ending in
   recorded Blake approval.
5. **Weekly Proof Templates** — honest proof with a hard public/private
   boundary.

Definition of done: repo initializes locally; fake registry loads; tiers and
statuses validate; kill switches and human-only mode work; blocked actions
are logged; eval runner passes all fake cases; checklist and proof templates
exist blank + fake-sample; docs explain boundaries; tests pass; no secrets;
no real data; zippable for the Proof Library; auditable by Claude Code.
