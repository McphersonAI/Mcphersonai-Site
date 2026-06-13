# Key Rotation Checklist

Document every rotation with `templates/key_rotation_record_blank.md`.

## Steps

1. Identify the key (name, class, environment, where it is used).
2. Pause the affected service if needed.
3. Revoke the old key.
4. Create the new key.
5. Update the private deployment `.env` (never GitHub, never a snapshot).
6. Restart the affected service if needed.
7. Verify the service works with the new key.
8. Document the rotation in a key rotation record.
9. Confirm the old key no longer works.
10. Blake approval if the key is a production or pilot key (Class 2–3).

## Notes

- Rotation cadence per key type is a deferred decision
  (see `deferred_decisions.md`).
- A compromised key triggers `incident_mode`, not just rotation.
