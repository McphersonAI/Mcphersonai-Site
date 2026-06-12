-- McPherson AI agent memory layer: indexes

CREATE INDEX IF NOT EXISTS idx_shift_notes_store_date      ON shift_notes(store_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_store_status     ON follow_ups(store_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_events_trace          ON agent_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_pilot_proof_store_date      ON pilot_proof_events(store_id, event_date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_store_week ON weekly_summaries(store_id, week_start);
