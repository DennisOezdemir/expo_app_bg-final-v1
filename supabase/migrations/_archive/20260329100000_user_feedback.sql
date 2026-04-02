-- User Feedback Tabelle
CREATE TABLE IF NOT EXISTS user_feedback (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name   TEXT,
    user_role   TEXT,
    category    TEXT NOT NULL CHECK (category IN ('bug', 'verbesserung', 'sonstiges')),
    message     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'wont_fix')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fb_insert" ON user_feedback
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fb_select" ON user_feedback
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "fb_service" ON user_feedback
    FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON user_feedback TO authenticated;
GRANT ALL ON user_feedback TO service_role;
