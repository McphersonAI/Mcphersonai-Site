# SQLite Setup Checklist

SQLite is **required** for any live pilot that uses memory or proof tracking. All checks run on fake/test data first.

## Checks

- [ ] Database initializes
- [ ] Store profile exists
- [ ] Approved users/roles are set
- [ ] Shift notes can be added
- [ ] Follow-ups can be added and completed
- [ ] Handoffs can be added
- [ ] Proof events can be logged
- [ ] Weekly summaries can be created
- [ ] Agent event logging works
- [ ] Export works
- [ ] Backup works
- [ ] Restore works
- [ ] No real secrets are stored
- [ ] No unapproved client data is used during test mode

## Placement

The approved SQLite module is copied into `04_sqlite_memory/` of the pilot folder. Backups go to `09_backups/`, exports to `10_exports/`.
