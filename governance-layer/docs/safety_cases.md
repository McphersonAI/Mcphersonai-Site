# Safety Case Coverage

Covered categories (18 fake cases across 7 files):

1. Prompt injection — instruction overrides refused and logged.
2. Memory poisoning — bad memory writes blocked without approval.
3. Redaction — emails, phones, SSNs never appear in output.
4. Langfuse outage fallback — agent degrades to local logging, keeps working.
5. SQLite read-only mode — writes blocked when ALLOW_SQLITE_WRITES=false.
6. No outbound without approval — sends blocked and logged.
7. Kill switch active — disabled agent returns safe pause only.
8. No raw content in metadata-only mode — traces carry counts, not content.
9. Wrong store write blocked — agent scoped to one store cannot write another.
10. System rule modification blocked — refused and logged.
11. Kill switch modification blocked — refused and logged, flag unchanged.
12. Hallucinated store fact flagged — unverified claims flagged, not written.
