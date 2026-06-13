# Human-Only Mode

## Activation

`human_only` can be entered immediately, at any time, by Blake or by an
operator pause request, whenever the system should not execute agent/tool
behavior. Record the activation with
`templates/human_only_activation_record_blank.md`.

## Restrictions while active

- no tool execution
- no memory writes
- no outbound actions
- human review and manual operation only
- read-only inspection only if approved

## Reactivation

Reactivation out of `human_only` requires explicit Blake approval, documented
in the activation record (reactivation section). No automated process may
reactivate the system.
