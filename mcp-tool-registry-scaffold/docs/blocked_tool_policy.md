# Blocked Tool Policy

Always-blocked tools are registered *on purpose*, even though they can never
run. Registering them by name means:

1. A future agent that requests one gets a clear, logged, named block — not an
   ambiguous "unknown tool" error.
2. The block list is testable: the suite proves every one is blocked in every mode.
3. The boundary is documented for clients and audits.

These tools are blocked because they touch real people, real money, real
records, or unbounded capability: outbound contact (SMS/email), payroll, POS
data, vendor orders, payments, employee records, public case studies,
record deletion, live channel/CRM/POS/payroll connections, and unrestricted
shell or web access.

No mode, approval, or override can enable an always-blocked tool in v0.1. The
policy engine checks the category before the approval logic ever runs.
