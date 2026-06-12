-- McPherson AI agent memory layer: initial schema
-- All IDs are UUID strings generated in Python.
-- PRAGMA foreign_keys = ON is set per-connection in src/db.py.

CREATE TABLE IF NOT EXISTS stores (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    location      TEXT,
    concept_type  TEXT,
    status        TEXT DEFAULT 'active',
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS store_users (
    id            TEXT PRIMARY KEY,
    store_id      TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    display_name  TEXT,
    role          TEXT CHECK(role IN ('owner','gm','manager','dm','blake','other')),
    contact_hint  TEXT,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_notes (
    id          TEXT PRIMARY KEY,
    store_id    TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shift_date  TEXT NOT NULL,
    daypart     TEXT,
    category    TEXT,
    summary     TEXT NOT NULL,
    severity    TEXT CHECK(severity IN ('low','medium','high')) DEFAULT 'medium',
    source      TEXT DEFAULT 'operator',
    confidence  TEXT DEFAULT 'medium',
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_ups (
    id            TEXT PRIMARY KEY,
    store_id      TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    detail        TEXT,
    owner_role    TEXT,
    due_date      TEXT,
    status        TEXT CHECK(status IN ('open','done','parked')) DEFAULT 'open',
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at  TEXT
);

CREATE TABLE IF NOT EXISTS handoffs (
    id                TEXT PRIMARY KEY,
    store_id          TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shift_date        TEXT NOT NULL,
    from_daypart      TEXT,
    to_daypart        TEXT,
    prep_status       TEXT,
    equipment_issues  TEXT,
    followups         TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waste_logs (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    log_date        TEXT NOT NULL,
    item            TEXT NOT NULL,
    amount          TEXT,
    reason          TEXT,
    estimated_cost  REAL,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receiving_logs (
    id                TEXT PRIMARY KEY,
    store_id          TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    log_date          TEXT NOT NULL,
    vendor            TEXT,
    issue_type        TEXT,
    detail            TEXT,
    estimated_cost    REAL,
    credit_requested  INTEGER DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS labor_notes (
    id               TEXT PRIMARY KEY,
    store_id         TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    week_start       TEXT,
    note_type        TEXT,
    detail           TEXT,
    estimated_hours  REAL,
    estimated_cost   REAL,
    created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_summaries (
    id                    TEXT PRIMARY KEY,
    store_id              TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    week_start            TEXT NOT NULL,
    summary               TEXT NOT NULL,
    open_followups_count  INTEGER DEFAULT 0,
    patterns              TEXT,
    recommended_actions   TEXT,
    created_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pilot_proof_events (
    id                 TEXT PRIMARY KEY,
    store_id           TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    event_date         TEXT NOT NULL,
    event_type         TEXT,
    detail             TEXT,
    before_after_note  TEXT,
    value_estimate     TEXT,
    created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_events (
    id              TEXT PRIMARY KEY,
    store_id        TEXT REFERENCES stores(id) ON DELETE SET NULL,
    event_name      TEXT NOT NULL,
    skill_name      TEXT,
    prompt_version  TEXT,
    trace_id        TEXT,        -- reserved for future Langfuse correlation
    status          TEXT,
    metadata_json   TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
