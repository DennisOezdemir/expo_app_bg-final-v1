-- Push-Notifications: push_token + auth_id auf team_members
-- auth_id verknüpft team_member mit Supabase Auth User
-- push_token speichert den Expo Push Token (ExpoPushToken[xxx])

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index für schnelle Token-Abfrage per auth_id
CREATE INDEX IF NOT EXISTS idx_team_members_auth_id ON team_members(auth_id);

-- Index für schnelle Token-Abfrage per Rolle (z.B. alle GFs benachrichtigen)
CREATE INDEX IF NOT EXISTS idx_team_members_role_active ON team_members(role) WHERE active = true;

COMMENT ON COLUMN team_members.auth_id IS 'Verknüpfung mit auth.users für Push-Token-Zuordnung';
COMMENT ON COLUMN team_members.push_token IS 'Expo Push Token (ExpoPushToken[xxx]) für Push-Benachrichtigungen';
