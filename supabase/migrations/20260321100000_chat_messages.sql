-- Chat Messages für BauGenius Chat-Agent
-- Persistiert Chat-Verlauf zwischen User und Claude Agent pro Projekt

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL DEFAULT '',
  tool_calls  JSONB,          -- Claude tool_use blocks (für assistant messages)
  tool_results JSONB,         -- tool results (für Anzeige im Frontend)
  metadata    JSONB DEFAULT '{}'::jsonb,  -- z.B. model, tokens, latency_ms
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id, created_at);
CREATE INDEX idx_chat_messages_user    ON chat_messages(user_id, created_at);

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read chat messages for projects they have access to
CREATE POLICY "chat_messages_select" ON chat_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can insert their own messages
CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role can insert assistant responses (Edge Function)
CREATE POLICY "chat_messages_service_insert" ON chat_messages
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "chat_messages_service_select" ON chat_messages
  FOR SELECT TO service_role
  USING (true);

-- Realtime aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

COMMENT ON TABLE chat_messages IS 'Chat-Verlauf zwischen User und BauGenius Agent, projektbezogen';
