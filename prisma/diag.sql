SELECT pid, state, query, wait_event_type, wait_event, now() - query_start AS duration
FROM pg_stat_activity
WHERE state <> 'idle' AND pid <> pg_backend_pid();
