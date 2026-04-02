-- Add attachments to chat_messages
-- Ermöglicht das Hochladen von Fotos/PDFs für den Vision-Agent

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN chat_messages.attachments IS 'Liste von Anhängen (Bilder, PDFs) mit Typ und URL';
