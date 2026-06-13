# .env File Policy

## Rules

1. `.env.example` is the ONLY `.env`-style file allowed in this repo or in
   GitHub. It contains placeholders only (Class 0).
2. `.env` is forbidden in GitHub.
3. `.env.local` is forbidden in GitHub.
4. `.env.production` is forbidden in GitHub.
5. `.env.pilot` is forbidden in GitHub.
6. Real `.env` files belong only on private local/deployment machines, in the
   correct environment (`pilot_prelaunch` or later, per the environment matrix).
7. Real `.env` files must never be included in reusable snapshots.
8. Real `.env` files must never be included in zip artifacts.
9. Real `.env` rotation must be documented with a key rotation record
   (`templates/key_rotation_record_blank.md`).

## Enforcement

- `.gitignore` blocks `.env` and `.env.*` (except `.env.example`).
- `scripts/scan_for_forbidden_files.py` fails on any forbidden `.env` variant.
- `scripts/package_env_pack_zip.py` excludes `.env` and `.env.*` from zips.
