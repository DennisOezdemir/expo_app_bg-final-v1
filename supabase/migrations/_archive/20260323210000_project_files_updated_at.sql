-- Fix: MX_08_File_Router crashed because project_files.updated_at column was missing
-- fn_route_file_to_folder() references updated_at in ON CONFLICT DO UPDATE
ALTER TABLE project_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
