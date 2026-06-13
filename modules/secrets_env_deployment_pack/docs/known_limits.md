# Known Limits

- This is **not a live secret manager**. It defines rules; it does not store,
  inject, or manage real secrets.
- This is **not production deployment automation**. Nothing here deploys
  anything.
- This is **not cloud integration**. No cloud provider APIs are called.
- This is **not a legal compliance system**. It does not establish HIPAA, PCI,
  or other regulatory compliance.
- The pack is **fake-data-only** and contains **no real secrets**.
- The scans catch obvious patterns and forbidden names; they cannot guarantee
  detection of every possible secret. Manual review remains required.
- A future real secret manager (or VPS secret storage method) requires a
  separate scoping, audit, and Blake approval before adoption.
