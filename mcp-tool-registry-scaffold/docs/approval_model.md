# Approval Model

## v0.1 (fake approvals)

All approvals live in `data/fake_approvals.json` and are explicitly fictional.
An approval is valid only if ALL of these hold:

1. The approval's `tool_name` matches the requested tool exactly.
2. The current mode is in the approval's `modes` list.
3. The approval is not expired (`expires_at` in the future; unparseable dates fail closed as expired).
4. The approver carries a Blake marker (`FAKE_BLAKE_APPROVAL` in v0.1).
5. The approval is flagged `fictional: true` (v0.1 rejects anything else).

The sample file deliberately includes a valid approval, an expired approval, a
wrong-tool approval, and a wrong-mode approval so the rejection paths are tested.

## Future (real Blake approval)

The future model keeps the same shape: explicit per-tool, per-mode, expiring
approvals, issued by Blake, recorded with timestamps and audit trail. There is
no default-approve path, no admin override, and no auto-approval — the policy
engine must never gain one.
