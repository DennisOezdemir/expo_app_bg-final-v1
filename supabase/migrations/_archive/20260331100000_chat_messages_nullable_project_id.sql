-- Fix: chat_messages.project_id muss nullable sein
-- Grund: "general" Chats ohne Projektbezug (z.B. HeuteScreen) setzen project_id = NULL
-- FK Constraint auf NOT NULL blockierte alle User-Message-Inserts bei project_id = NULL

-- 1. NOT NULL Constraint entfernen
ALTER TABLE chat_messages
  ALTER COLUMN project_id DROP NOT NULL;

-- 2. Index fuer project_id-basierte Queries neu bauen (partial index fuer projekt-chats)
DROP INDEX IF EXISTS idx_chat_messages_project;
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id, created_at)
  WHERE project_id IS NOT NULL;

-- 3. Index fuer allgemeine Chats (project_id IS NULL)
CREATE INDEX idx_chat_messages_general ON chat_messages(user_id, created_at)
  WHERE project_id IS NULL;

COMMENT ON COLUMN chat_messages.project_id IS 'Projekt-UUID, NULL fuer allgemeine Chats ohne Projektbezug';
