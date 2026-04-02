


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'Migration 024: Product Pool & Material System - 2026-01-12';



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE TYPE "public"."approval_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REVISED',
    'EXPIRED'
);


ALTER TYPE "public"."approval_status" OWNER TO "postgres";


CREATE TYPE "public"."approval_type" AS ENUM (
    'PROJECT_START',
    'INSPECTION_ASSIGN',
    'MATERIAL_ORDER',
    'SUBCONTRACTOR_ORDER',
    'SCHEDULE',
    'COMPLETION',
    'INVOICE',
    'INSPECTION',
    'SITE_INSPECTION',
    'DUPLICATE_CHECK'
);


ALTER TYPE "public"."approval_type" OWNER TO "postgres";


CREATE TYPE "public"."assignment_status" AS ENUM (
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'VERIFIED'
);


ALTER TYPE "public"."assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."change_order_reason" AS ENUM (
    'ADDITIONAL_WORK',
    'MODIFIED_WORK',
    'UNFORESEEN',
    'CLIENT_REQUEST',
    'PLANNING_ERROR',
    'OTHER'
);


ALTER TYPE "public"."change_order_reason" OWNER TO "postgres";


CREATE TYPE "public"."change_order_status" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'INVOICED',
    'CANCELLED',
    'PENDING_APPROVAL',
    'PENDING_CUSTOMER',
    'APPROVED_BY_CUSTOMER',
    'REJECTED_BY_CUSTOMER'
);


ALTER TYPE "public"."change_order_status" OWNER TO "postgres";


CREATE TYPE "public"."client_type" AS ENUM (
    'PRIVATE',
    'COMMERCIAL',
    'HOUSING_COMPANY',
    'PROPERTY_MANAGER',
    'INSURANCE',
    'SYSTEM'
);


ALTER TYPE "public"."client_type" OWNER TO "postgres";


CREATE TYPE "public"."defect_severity" AS ENUM (
    'minor',
    'medium',
    'critical'
);


ALTER TYPE "public"."defect_severity" OWNER TO "postgres";


CREATE TYPE "public"."defect_status" AS ENUM (
    'open',
    'in_progress',
    'pending_review',
    'resolved',
    'rejected',
    'closed'
);


ALTER TYPE "public"."defect_status" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'EMAIL_RECEIVED',
    'WHATSAPP_RECEIVED',
    'ATTACHMENT_EXTRACTED',
    'PROJECT_CREATED',
    'PROJECT_STATUS_CHANGED',
    'PROJECT_UPDATED',
    'DRIVE_FOLDER_CREATED',
    'FILE_UPLOADED',
    'FILE_MOVED',
    'MAGICPLAN_EXPORT_RECEIVED',
    'MAGICPLAN_MATCHED',
    'MAGICPLAN_STORED',
    'PROTOCOL_CREATED',
    'PROTOCOL_COMPLETED',
    'APPROVAL_REQUESTED',
    'APPROVAL_REMINDED',
    'APPROVAL_DECIDED',
    'MATERIAL_SUGGESTED',
    'MATERIAL_ORDERED',
    'MATERIAL_DELIVERED',
    'NOTIFICATION_SENT',
    'NOTIFICATION_FAILED',
    'ERROR_OCCURRED',
    'RETRY_SCHEDULED',
    'RETRY_SUCCEEDED',
    'RETRY_FAILED',
    'PURCHASE_INVOICE_CREATED',
    'PURCHASE_INVOICE_APPROVED',
    'PURCHASE_INVOICE_PAID',
    'SUPPLIER_PRICE_UPDATED',
    'SUPPLIER_ARTICLE_CREATED',
    'DRIVE_YEAR_READY',
    'DRIVE_TREE_CREATED',
    'DRIVE_SETUP_COMPLETE',
    'WORKFLOW_ERROR',
    'OFFER_CREATED',
    'OFFER_POSITIONS_EXTRACTED',
    'PDF_PARSED',
    'DOC_CLASSIFIED',
    'DOC_SKIPPED',
    'DOC_NEEDS_REVIEW',
    'MATERIALS_PLANNED',
    'MATERIALS_NEED_ASSIGNMENT',
    'INSPECTION_PROTOCOL_CREATED',
    'INSPECTION_PROTOCOL_COMPLETED',
    'INSPECTION_REQUIRES_SUPPLEMENT',
    'ZB_PROGRESS_SYNCED',
    'CHANGE_ORDER_CREATED',
    'CHANGE_ORDER_SUBMITTED',
    'CHANGE_ORDER_CUSTOMER_APPROVED',
    'CHANGE_ORDER_CUSTOMER_REJECTED',
    'EMAIL_PENDING_APPROVAL',
    'EMAIL_APPROVED',
    'EMAIL_REJECTED',
    'EMAIL_SENT',
    'DOC_CLASSIFIED_INVOICE_IN',
    'DOC_CLASSIFIED_CREDIT_NOTE',
    'DOC_CLASSIFIED_REMINDER',
    'DOC_CLASSIFIED_PROJECT_ORDER',
    'DOC_CLASSIFIED_DEFECT_LIST',
    'DOC_CLASSIFIED_SUPPLEMENT',
    'POSITION_ASSIGNED',
    'ASSIGNMENT_STATUS_CHANGED',
    'ASSIGNMENT_VERIFIED',
    'DOC_CLASSIFIED_MAGICPLAN',
    'ATTACHMENTS_STORED',
    'ROOM_MEASUREMENTS_UPDATED',
    'PACKING_LIST_REVIEW_REQUESTED',
    'PACKING_LIST_REVIEWED',
    'BANK_TRANSACTION_CREATED',
    'BANK_IMPORT_COMPLETED',
    'PROJECT_FILES_READY',
    'OFFER_GENERATION_REQUESTED',
    'OFFER_GENERATED',
    'SALES_INVOICE_GENERATION_REQUESTED',
    'SALES_INVOICE_GENERATED',
    'ATTACHMENTS_STORED_INVOICE',
    'MATERIALS_CALCULATED',
    'SCHEDULE_GENERATED',
    'PAYMENT_REMINDER_SENT',
    'PURCHASE_ORDER_CREATED',
    'PURCHASE_ORDER_SENT',
    'MONTEUR_AUFTRAG_CREATED',
    'DOC_CLASSIFIED_BID_REQUEST',
    'INSPECTION_FINALIZED',
    'APPROVAL_APPROVED',
    'APPROVAL_DISPATCHED',
    'PROJECT_POSITIONS_CONFIRMED',
    'MATERIAL_LIST_GENERATED',
    'LEXWARE_CONTACT_READY',
    'LEXWARE_CONTACT_NEEDED',
    'LEXWARE_PUSH_COMPLETED',
    'LEXWARE_PUSH_FAILED',
    'LEXWARE_PAYMENT_RECEIVED',
    'LEXWARE_PAYMENT_CHANGED',
    'LEXWARE_INVOICE_CHANGED',
    'LEXWARE_VOUCHER_CHANGED',
    'LEXWARE_INVOICE_SYNCED',
    'MATERIALS_ORDER_SENT',
    'SCHEDULE_PROPOSED',
    'SCHEDULE_CONFIRMED',
    'AUTO_PLAN_COMPLETED',
    'MATERIAL_ORDER_APPROVED',
    'SCHEDULE_APPROVED',
    'GODMODE_LEARNING_COMPLETED',
    'AGENT_TASK_REQUESTED',
    'CATALOG_LOOKUP',
    'LV_PARSED',
    'OFFER_CALCULATED',
    'OFFER_PDF_GENERATED',
    'OFFER_ATTACHED',
    'DUPLICATE_CHECK_REQUESTED',
    'FILE_ROUTED',
    'FILE_ROUTE_FAILED',
    'GODMODE_PHASE_LEARNING',
    'INVOICE_EXTRACTED',
    'INVOICE_EXTRACTION_FAILED',
    'INVOICE_FORWARDED_TO_LEXWARE',
    'INVOICE_FORWARD_FAILED',
    'INVOICE_NOTIFICATION_SENT',
    'INVOICE_FILED',
    'INVOICE_FILING_FAILED',
    'INVOICE_MATCH_FAILED',
    'OFFER_LONGTEXT_SESSION_STARTED',
    'OFFER_LONGTEXT_BATCH_COMPLETED',
    'OFFER_LONGTEXT_APPROVED',
    'OFFER_LONGTEXT_LEARNING_COMPLETED'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE TYPE "public"."expense_category" AS ENUM (
    'MATERIAL',
    'SUBCONTRACTOR',
    'VEHICLE_FUEL',
    'VEHICLE_RENTAL',
    'VEHICLE_REPAIR',
    'ENTERTAINMENT',
    'SOFTWARE',
    'INSURANCE',
    'OFFICE',
    'DISPOSAL',
    'OTHER'
);


ALTER TYPE "public"."expense_category" OWNER TO "postgres";


CREATE TYPE "public"."invoice_source_type" AS ENUM (
    'SCAN',
    'EMAIL',
    'UPLOAD',
    'API',
    'SUPERCHAT'
);


ALTER TYPE "public"."invoice_source_type" OWNER TO "postgres";


CREATE TYPE "public"."labor_group" AS ENUM (
    'HELFER',
    'GESELLE',
    'MEISTER',
    'AZUBI'
);


ALTER TYPE "public"."labor_group" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
    'NEW',
    'QUALIFIED',
    'DISQUALIFIED',
    'CONVERTED'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."offer_status" AS ENUM (
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED'
);


ALTER TYPE "public"."offer_status" OWNER TO "postgres";


CREATE TYPE "public"."packing_item_type" AS ENUM (
    'material',
    'tool',
    'consumable'
);


ALTER TYPE "public"."packing_item_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_match_status" AS ENUM (
    'SUGGESTED',
    'CONFIRMED',
    'REJECTED'
);


ALTER TYPE "public"."payment_match_status" OWNER TO "postgres";


CREATE TYPE "public"."pipeline_run_status" AS ENUM (
    'running',
    'completed',
    'stopped',
    'failed'
);


ALTER TYPE "public"."pipeline_run_status" OWNER TO "postgres";


CREATE TYPE "public"."pipeline_step_status" AS ENUM (
    'running',
    'completed',
    'stopped',
    'failed',
    'skipped'
);


ALTER TYPE "public"."pipeline_step_status" OWNER TO "postgres";


CREATE TYPE "public"."position_type" AS ENUM (
    'STANDARD',
    'EVENTUAL',
    'ALTERNATIVE'
);


ALTER TYPE "public"."position_type" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'INTAKE',
    'DRAFT',
    'ACTIVE',
    'INSPECTION',
    'PLANNING',
    'IN_PROGRESS',
    'COMPLETION',
    'BILLING',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
    'ARCHIVED'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."protocol_type" AS ENUM (
    'ERSTBEGEHUNG',
    'ZWISCHENBEGEHUNG',
    'ABNAHME',
    'MATERIAL',
    'NACHTRAG'
);


ALTER TYPE "public"."protocol_type" OWNER TO "postgres";


CREATE TYPE "public"."purchase_invoice_status" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'PAID',
    'DISPUTED',
    'CANCELLED'
);


ALTER TYPE "public"."purchase_invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."purchase_order_status" AS ENUM (
    'DRAFT',
    'SENT',
    'CONFIRMED',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE "public"."purchase_order_status" OWNER TO "postgres";


CREATE TYPE "public"."purchase_unit" AS ENUM (
    'STUECK',
    'PACKUNG',
    'PALETTE',
    'METER',
    'QM',
    'KG',
    'LITER',
    'SATZ',
    'PAUSCHAL'
);


ALTER TYPE "public"."purchase_unit" OWNER TO "postgres";


CREATE TYPE "public"."receipt_queue_status" AS ENUM (
    'PENDING',
    'PROCESSING',
    'DONE',
    'ERROR',
    'SKIPPED'
);


ALTER TYPE "public"."receipt_queue_status" OWNER TO "postgres";


CREATE TYPE "public"."sales_invoice_status" AS ENUM (
    'DRAFT',
    'SENT',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'APPROVED',
    'REJECTED',
    'PAIDOFF',
    'VOIDED',
    'OPEN'
);


ALTER TYPE "public"."sales_invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."sales_invoice_type" AS ENUM (
    'ABSCHLAG',
    'TEIL',
    'SCHLUSS',
    'GUTSCHRIFT',
    'ABSCHLAG_LEXWARE'
);


ALTER TYPE "public"."sales_invoice_type" OWNER TO "postgres";


CREATE TYPE "public"."supplier_type" AS ENUM (
    'GROSSHANDEL',
    'BAUMARKT',
    'FACHHANDEL',
    'HERSTELLER',
    'ONLINE',
    'SONSTIGE'
);


ALTER TYPE "public"."supplier_type" OWNER TO "postgres";


CREATE TYPE "public"."trade_type" AS ENUM (
    'Sanitär',
    'Maler',
    'Elektro',
    'Fliesen',
    'Trockenbau',
    'Sonstiges',
    'Tischler',
    'Heizung',
    'Boden',
    'Maurer',
    'Reinigung'
);


ALTER TYPE "public"."trade_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."trade_type" IS 'Gewerke-Typen für Positionen und Subunternehmer';



CREATE TYPE "public"."transaction_type" AS ENUM (
    'CREDIT',
    'DEBIT',
    'TRANSFER',
    'FEE'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."workflow_step_status" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'DONE',
    'FAILED',
    'DEAD_LETTER'
);


ALTER TYPE "public"."workflow_step_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_defect_comment"("p_defect_id" "uuid", "p_comment" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM defects WHERE id = p_defect_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Mangel nicht gefunden: %', p_defect_id;
  END IF;

  INSERT INTO defect_comments (defect_id, comment)
  VALUES (p_defect_id, p_comment)
  RETURNING json_build_object(
    'id', id, 'comment', comment, 'created_at', created_at
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."add_defect_comment"("p_defect_id" "uuid", "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_packing_list_suggestions"("p_project_id" "uuid", "p_suggestions" "jsonb") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_suggestion JSONB;
  v_added INT := 0;
BEGIN
  FOR v_suggestion IN SELECT * FROM jsonb_array_elements(p_suggestions)
  LOOP
    INSERT INTO project_packing_list (
      project_id,
      item_type,
      item_name,
      quantity,
      unit,
      source,
      ai_suggested,
      ai_reason,
      confirmed
    ) VALUES (
      p_project_id,
      (v_suggestion->>'item_type')::packing_item_type,
      v_suggestion->>'item_name',
      COALESCE((v_suggestion->>'quantity')::NUMERIC, 1),
      COALESCE(v_suggestion->>'unit', 'Stück'),
      'ai_suggested',
      true,
      v_suggestion->>'reason',
      false  -- AI suggestions need confirmation
    )
    ON CONFLICT (project_id, item_type, item_name) DO NOTHING;
    
    v_added := v_added + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'suggestions_added', v_added
  );
END;
$$;


ALTER FUNCTION "public"."add_packing_list_suggestions"("p_project_id" "uuid", "p_suggestions" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_packing_list_suggestions"("p_project_id" "uuid", "p_suggestions" "jsonb") IS 'AI agent adds suggested items to packing list. Items are marked ai_suggested=true and confirmed=false.';



CREATE OR REPLACE FUNCTION "public"."aggregate_project_materials"("p_project_id" "uuid") RETURNS TABLE("product_id" "uuid", "product_name" "text", "material_type" "text", "is_consumable" boolean, "total_quantity" numeric, "quantity_unit" "text", "position_count" integer, "estimated_cost" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH material_data AS (
    SELECT 
      pm.product_id,
      p.name as product_name,
      pm.material_type,
      COALESCE(p.is_consumable, TRUE) as is_consumable,
      pm.quantity,
      pm.quantity_unit,
      p.last_price_net_eur
    FROM project_materials pm
    LEFT JOIN products p ON p.id = pm.product_id
    WHERE pm.project_id = p_project_id
  )
  SELECT 
    md.product_id,
    md.product_name,
    md.material_type,
    md.is_consumable,
    CASE 
      WHEN md.is_consumable THEN SUM(md.quantity)  -- Summieren
      ELSE 1::numeric                               -- 1x pro Projekt
    END as total_quantity,
    md.quantity_unit,
    COUNT(*)::integer as position_count,
    CASE 
      WHEN md.is_consumable THEN SUM(md.quantity) * MAX(md.last_price_net_eur)
      ELSE MAX(md.last_price_net_eur)
    END as estimated_cost
  FROM material_data md
  GROUP BY md.product_id, md.product_name, md.material_type, md.is_consumable, md.quantity_unit
  ORDER BY md.is_consumable DESC, position_count DESC;
END;
$$;


ALTER FUNCTION "public"."aggregate_project_materials"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."aggregate_project_tools"("p_project_id" "uuid") RETURNS TABLE("tool_name" "text", "position_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRIM(unnest(string_to_array(op.tools_note, ','))) as tool_name,
    COUNT(*)::integer as position_count
  FROM offer_positions op
  JOIN offers o ON o.id = op.offer_id
  WHERE o.project_id = p_project_id
    AND op.tools_note IS NOT NULL
    AND op.tools_note != ''
  GROUP BY TRIM(unnest(string_to_array(op.tools_note, ',')))
  ORDER BY position_count DESC;
END;
$$;


ALTER FUNCTION "public"."aggregate_project_tools"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_change_order"("p_change_order_id" "uuid", "p_approved_by" "text" DEFAULT 'Auftraggeber'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_co RECORD;
  v_positions_count INT;
BEGIN
  -- Nachtrag laden
  SELECT id, change_order_number, project_id, status, amount_gross, title, offer_id
  INTO v_co
  FROM change_orders WHERE id = p_change_order_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Nachtrag nicht gefunden');
  END IF;

  IF v_co.status NOT IN ('SUBMITTED', 'PENDING_CUSTOMER') THEN
    RETURN json_build_object('success', false, 'error',
      'Nachtrag kann nur aus Status SUBMITTED/PENDING_CUSTOMER genehmigt werden (aktuell: ' || v_co.status || ')');
  END IF;

  -- Status ändern
  UPDATE change_orders
  SET status = 'APPROVED_BY_CUSTOMER',
      approved_at = NOW(),
      approved_by = p_approved_by,
      customer_response_at = NOW(),
      updated_at = NOW()
  WHERE id = p_change_order_id;

  -- Positionen buchen (falls offer_id gesetzt)
  IF v_co.offer_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_positions_count
    FROM book_change_order_to_positions(p_change_order_id);
  ELSE
    v_positions_count := 0;
  END IF;

  -- Event loggen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (
    v_co.project_id,
    'CHANGE_ORDER_CUSTOMER_APPROVED',
    'baugenius',
    json_build_object(
      'change_order_id', p_change_order_id,
      'change_order_number', v_co.change_order_number,
      'approved_by', p_approved_by,
      'positions_created', v_positions_count
    )::JSONB
  );

  -- Activity loggen
  INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
  VALUES (
    v_co.project_id,
    'change_order',
    'Nachtrag ' || v_co.change_order_number || ' genehmigt',
    'Genehmigt von ' || p_approved_by || '. ' ||
    CASE WHEN v_positions_count > 0
      THEN v_positions_count || ' Positionen gebucht.'
      ELSE 'Keine Positionen gebucht (kein Angebot verknüpft).'
    END,
    json_build_object('change_order_id', p_change_order_id, 'positions_created', v_positions_count)::JSONB,
    'system'
  );

  RETURN json_build_object(
    'success', true,
    'change_order_number', v_co.change_order_number,
    'approved_by', p_approved_by,
    'positions_created', v_positions_count,
    'message', 'Nachtrag ' || v_co.change_order_number || ' genehmigt' ||
      CASE WHEN v_positions_count > 0
        THEN ' – ' || v_positions_count || ' Positionen gebucht'
        ELSE '' END
  );
END;
$$;


ALTER FUNCTION "public"."approve_change_order"("p_change_order_id" "uuid", "p_approved_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_change_order"("p_change_order_id" "uuid", "p_approved_by" "text") IS 'Nachtrag genehmigen: SUBMITTED → APPROVED_BY_CUSTOMER, optional Positionen buchen.';



CREATE OR REPLACE FUNCTION "public"."approve_project_schedule"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_assignments_created INT;
BEGIN
  UPDATE projects
  SET status = 'IN_PROGRESS', updated_at = now()
  WHERE id = p_project_id AND status = 'PLANNING';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Project not in PLANNING status');
  END IF;

  INSERT INTO project_assignments (
    project_id, team_member_id, start_date, end_date,
    hours_planned, role_in_project, status
  )
  SELECT
    sp.project_id, sp.assigned_team_member_id,
    sp.start_date, sp.end_date,
    sp.estimated_hours, sp.trade, 'planned'
  FROM schedule_phases sp
  WHERE sp.project_id = p_project_id
    AND sp.assigned_team_member_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_assignments_created = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'assignments_created', v_assignments_created
  );
END;
$$;


ALTER FUNCTION "public"."approve_project_schedule"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."attach_offer_to_project"("p_project_id" "uuid", "p_offer_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_project RECORD;
  v_offer_id UUID;
  v_offer_number TEXT;
  v_idem_key TEXT;
  v_existing_offer_id UUID;
BEGIN
  v_idem_key := p_offer_data->>'idempotency_key';
  IF v_idem_key IS NOT NULL THEN
    SELECT id INTO v_existing_offer_id
    FROM offers
    WHERE internal_notes LIKE '%idem:' || v_idem_key || '%'
      AND project_id = p_project_id
      AND deleted_at IS NULL;

    IF v_existing_offer_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'offer_id', v_existing_offer_id,
        'message', 'Angebot existiert bereits (Idempotenz)',
        'idempotent_skip', true
      );
    END IF;
  END IF;

  SELECT id, project_number, status
  INTO v_project
  FROM projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF v_project.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Projekt nicht gefunden: ' || p_project_id
    );
  END IF;

  INSERT INTO offers (project_id, status, internal_notes)
  VALUES (
    p_project_id, 'ACCEPTED',
    COALESCE(p_offer_data->>'catalog_type', '')
      || ' | Quelle: ' || COALESCE(p_offer_data->>'source_pdf_path', 'unbekannt')
      || CASE WHEN v_idem_key IS NOT NULL THEN ' | idem:' || v_idem_key ELSE '' END
  )
  RETURNING id, offer_number INTO v_offer_id, v_offer_number;

  INSERT INTO events (project_id, event_type, payload, source_system, source_flow, dedupe_key)
  VALUES (
    p_project_id, 'OFFER_ATTACHED',
    jsonb_build_object(
      'offer_id', v_offer_id, 'offer_number', v_offer_number,
      'catalog_type', p_offer_data->>'catalog_type', 'attached_to_existing', true
    ),
    'supabase_fn', 'fn_attach_offer_to_project',
    'offer_attach_' || COALESCE(v_idem_key, gen_random_uuid()::text)
  );

  RETURN jsonb_build_object(
    'success', true, 'offer_id', v_offer_id, 'offer_number', v_offer_number,
    'project_id', p_project_id, 'project_number', v_project.project_number,
    'message', 'Angebot ' || v_offer_number || ' an Projekt ' || v_project.project_number || ' angehaengt'
  );
END;
$$;


ALTER FUNCTION "public"."attach_offer_to_project"("p_project_id" "uuid", "p_offer_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."attach_offer_to_project"("p_project_id" "uuid", "p_offer_data" "jsonb") IS 'Legt neues Angebot (Status ACCEPTED) an bestehendem Projekt an. Idempotent via idempotency_key.';



CREATE OR REPLACE FUNCTION "public"."auto_create_alias"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Nur wenn catalog_position_v2_id neu gesetzt wird
  IF NEW.catalog_position_v2_id IS NOT NULL 
     AND (OLD.catalog_position_v2_id IS NULL OR OLD.catalog_position_v2_id != NEW.catalog_position_v2_id) 
  THEN
    INSERT INTO catalog_aliases (catalog_position_v2_id, alias_title)
    VALUES (NEW.catalog_position_v2_id, NEW.title)
    ON CONFLICT (alias_title) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_alias"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_match_bank_transactions"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_matched INT := 0;
  v_tx RECORD;
  v_invoice RECORD;
BEGIN
  -- Finde exakte Matches (Betrag + Lieferant)
  FOR v_tx IN 
    SELECT bt.* 
    FROM bank_transactions bt
    WHERE bt.is_matched = FALSE AND bt.amount < 0
  LOOP
    -- Suche passende Rechnung
    SELECT pi.* INTO v_invoice
    FROM purchase_invoices pi
    JOIN suppliers s ON s.id = pi.supplier_id
    WHERE pi.paid_at IS NULL
      AND ABS(v_tx.amount) = pi.total_gross
      AND (
        LOWER(v_tx.counterpart_name) LIKE '%' || LOWER(SPLIT_PART(s.name, ' ', 1)) || '%'
        OR v_tx.reference_text LIKE '%' || pi.invoice_number || '%'
      )
    LIMIT 1;
    
    IF FOUND THEN
      -- Match!
      PERFORM mark_invoice_paid(v_invoice.id, ABS(v_tx.amount), v_tx.booking_date::timestamptz, v_tx.id);
      v_matched := v_matched + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'matched_count', v_matched);
END;
$$;


ALTER FUNCTION "public"."auto_match_bank_transactions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_match_bank_transactions"() IS 'Versucht automatisches Matching von Bank-Transaktionen zu Rechnungen';



CREATE OR REPLACE FUNCTION "public"."auto_plan_full"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_project RECORD; v_run_id UUID;
    v_zeitpruefer_result JSONB;
    v_plausibility_result JSONB; v_material_result JSONB; v_schedule_result JSONB;
    v_einsatz_input JSONB;
    v_approval_schedule_id UUID; v_approval_material_id UUID;
    v_material_summary JSONB; v_problems JSONB := '[]'::JSONB; v_need RECORD;
BEGIN
    SELECT id, name, status, planned_start, planned_end INTO v_project FROM projects WHERE id = p_project_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden'); END IF;

    BEGIN v_run_id := fn_pipeline_start(p_project_id);
    EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM); END;

    -- Agent 2: Zeitprüfer — enriches positions mit labor_minutes
    v_zeitpruefer_result := fn_agent_zeitpruefer(v_run_id, jsonb_build_object('project_id', p_project_id));

    -- Agent 3: Plausibilität — jetzt MIT labor_minutes aus Zeitprüfer
    v_plausibility_result := fn_agent_plausibility(v_run_id,
        jsonb_build_object('project_id', p_project_id, 'positions', v_zeitpruefer_result->'positions'));

    IF (v_plausibility_result->>'stop')::BOOLEAN = true THEN
        PERFORM fn_pipeline_complete(v_run_id, jsonb_build_object('stopped_at', 'plausibility', 'reason', v_plausibility_result->>'stop_reason'));
        RETURN jsonb_build_object('success', false, 'error', 'Plausibilitäts-Check gestoppt: ' || v_plausibility_result->>'stop_reason',
            'pipeline_run_id', v_run_id, 'plausibility', v_plausibility_result);
    END IF;

    -- Agent 4: Material
    v_material_result := fn_agent_material(v_run_id, jsonb_build_object('project_id', p_project_id));

    -- Agent 5: Einsatzplaner
    IF v_project.planned_start IS NOT NULL AND v_project.planned_end IS NOT NULL THEN
        v_einsatz_input := jsonb_build_object('project_id', p_project_id, 'trade_sequence', v_plausibility_result->'trade_sequence');
        v_schedule_result := fn_agent_einsatzplaner(v_run_id, v_einsatz_input);
    ELSE
        v_schedule_result := jsonb_build_object('success', false, 'error', 'Kein Start-/Enddatum');
    END IF;

    -- Approvals
    IF (v_schedule_result->>'success')::BOOLEAN = true AND (v_schedule_result->>'phases_created')::INT > 0 THEN
        INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
        VALUES (p_project_id, 'SCHEDULE', 'PENDING', 'system_auto_plan',
            (v_schedule_result->>'phases_created') || ' Phasen geplant, ' || (v_schedule_result->>'assigned_count') || ' Monteure zugewiesen'
            || CASE WHEN jsonb_array_length(COALESCE(v_plausibility_result->'warnings', '[]'::JSONB)) > 0 THEN ' ⚠️' ELSE '' END,
            jsonb_build_object('phases', v_schedule_result->'phases_created', 'assigned', v_schedule_result->'assigned_count',
                'unassigned', v_schedule_result->'unassigned_trades', 'assignments', v_schedule_result->'assignments',
                'plausibility_warnings', v_plausibility_result->'warnings',
                'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte',
                    'fallback', v_zeitpruefer_result->'formula_fallback', 'no_data', v_zeitpruefer_result->'no_data'),
                'pipeline_run_id', v_run_id))
        RETURNING id INTO v_approval_schedule_id;
    END IF;

    IF (v_material_result->>'success')::BOOLEAN = true AND (v_material_result->>'needs_created')::INT > 0 THEN
        SELECT jsonb_agg(sub.trade_summary) INTO v_material_summary FROM (
            SELECT jsonb_build_object('trade', trade, 'count', COUNT(*), 'problems', COUNT(*) FILTER (WHERE problem IS NOT NULL)) AS trade_summary
            FROM project_material_needs WHERE project_id = p_project_id AND source = 'auto_plan' AND status = 'planned' GROUP BY trade
        ) sub;

        FOR v_need IN SELECT trade, needed_by, problem, COUNT(*) AS cnt, SUM(total_quantity) AS total_qty
            FROM project_material_needs WHERE project_id = p_project_id AND source = 'auto_plan' AND problem IS NOT NULL
            GROUP BY trade, needed_by, problem
        LOOP v_problems := v_problems || jsonb_build_object('trade', v_need.trade, 'problem', v_need.problem, 'count', v_need.cnt, 'needed_by', v_need.needed_by); END LOOP;

        INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
        VALUES (p_project_id, 'MATERIAL_ORDER', 'PENDING', 'system_auto_plan',
            (v_material_result->>'needs_created') || ' Materialpositionen, ' || (v_material_result->>'needs_without_mapping') || ' ohne Mapping',
            jsonb_build_object('needs_created', v_material_result->'needs_created', 'needs_without_mapping', v_material_result->'needs_without_mapping',
                'trades_summary', COALESCE(v_material_summary, '[]'::JSONB), 'problems', v_problems, 'pipeline_run_id', v_run_id))
        RETURNING id INTO v_approval_material_id;
    END IF;

    UPDATE pipeline_runs SET approval_schedule_id = v_approval_schedule_id, approval_material_id = v_approval_material_id WHERE id = v_run_id;

    PERFORM fn_pipeline_complete(v_run_id, jsonb_build_object(
        'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte',
            'fallback', v_zeitpruefer_result->'formula_fallback', 'updated_db', v_zeitpruefer_result->'updated_in_db'),
        'plausibility', jsonb_build_object('trade_count', v_plausibility_result->'trade_count',
            'total_positions', v_plausibility_result->'total_positions', 'total_hours', v_plausibility_result->'total_project_hours',
            'warnings_count', jsonb_array_length(COALESCE(v_plausibility_result->'warnings', '[]'::JSONB))),
        'schedule', jsonb_build_object('phases_created', v_schedule_result->'phases_created', 'assigned_count', v_schedule_result->'assigned_count'),
        'material', jsonb_build_object('needs_created', v_material_result->'needs_created')));

    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES ('AUTO_PLAN_COMPLETED', p_project_id, 'db', 'auto_plan_full_v3',
        jsonb_build_object('pipeline_run_id', v_run_id, 'schedule', v_schedule_result, 'material', v_material_result,
            'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte', 'fallback', v_zeitpruefer_result->'formula_fallback'),
            'plausibility_warnings', v_plausibility_result->'warnings',
            'approval_schedule_id', v_approval_schedule_id, 'approval_material_id', v_approval_material_id));

    RETURN jsonb_build_object('success', true, 'project_name', v_project.name, 'pipeline_run_id', v_run_id,
        'schedule', v_schedule_result, 'material', v_material_result,
        'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte',
            'formula_fallback', v_zeitpruefer_result->'formula_fallback', 'no_data', v_zeitpruefer_result->'no_data',
            'updated_in_db', v_zeitpruefer_result->'updated_in_db'),
        'plausibility', jsonb_build_object('trade_count', v_plausibility_result->'trade_count',
            'total_positions', v_plausibility_result->'total_positions', 'total_hours', v_plausibility_result->'total_project_hours',
            'warnings', v_plausibility_result->'warnings'),
        'approval_schedule_id', v_approval_schedule_id, 'approval_material_id', v_approval_material_id, 'problems', v_problems);
END;
$$;


ALTER FUNCTION "public"."auto_plan_full"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_plan_materials"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_project RECORD;
  v_pos RECORD;
  v_mapping RECORD;
  v_needs_created INT := 0;
  v_needs_skipped INT := 0;
  v_problems TEXT[] := '{}';
  v_trades_found TEXT[] := '{}';
  v_existing INT;
  v_qty NUMERIC;
  v_multiplier NUMERIC;
  v_room_name TEXT;
  v_phase_id UUID;
  v_needed_by DATE;
  v_need_id UUID;
  v_room_qty NUMERIC;
  v_was_insert BOOLEAN;
BEGIN
  SELECT id, name, status, planned_start, planned_end
  INTO v_project FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  SELECT COUNT(*) INTO v_existing
  FROM project_material_needs 
  WHERE project_id = p_project_id AND status = 'planned' AND source = 'auto_plan';

  IF v_existing > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Material-Planung existiert bereits (' || v_existing || ' Positionen).',
      'existing_count', v_existing
    );
  END IF;

  FOR v_pos IN
    SELECT 
      op.id AS pos_id, op.catalog_code, op.title AS pos_title,
      op.quantity AS pos_qty, op.unit AS pos_unit,
      op.trade::text AS trade_name, op.trade_id, op.section_id,
      os.title AS section_title, os.room_measurement_id, o.id AS offer_id
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN offer_sections os ON os.id = op.section_id
    WHERE o.project_id = p_project_id
      AND op.deleted_at IS NULL
      AND (op.position_type IS NULL OR op.position_type != 'ALTERNATIVE')
    ORDER BY op.trade, os.section_number, op.position_number
  LOOP
    IF v_pos.trade_name IS NOT NULL AND NOT v_pos.trade_name = ANY(v_trades_found) THEN
      v_trades_found := array_append(v_trades_found, v_pos.trade_name);
    END IF;

    v_room_name := NULL;
    IF v_pos.room_measurement_id IS NOT NULL THEN
      SELECT room_name INTO v_room_name
      FROM project_room_measurements WHERE id = v_pos.room_measurement_id;
    END IF;
    IF v_room_name IS NULL AND v_pos.section_title IS NOT NULL THEN
      v_room_name := v_pos.section_title;
    END IF;

    v_phase_id := NULL; v_needed_by := NULL;
    IF v_pos.trade_id IS NOT NULL THEN
      SELECT id, start_date INTO v_phase_id, v_needed_by
      FROM schedule_phases
      WHERE project_id = p_project_id AND trade_id = v_pos.trade_id
        AND status IN ('proposed', 'planned', 'in_progress')
      ORDER BY start_date ASC LIMIT 1;
    END IF;
    IF v_phase_id IS NULL AND v_pos.trade_name IS NOT NULL THEN
      SELECT id, start_date INTO v_phase_id, v_needed_by
      FROM schedule_phases
      WHERE project_id = p_project_id AND trade = v_pos.trade_name
        AND status IN ('proposed', 'planned', 'in_progress')
      ORDER BY start_date ASC LIMIT 1;
    END IF;

    -- Material-Mappings für diese Position
    FOR v_mapping IN
      SELECT cmm.material_name, cmm.default_qty, cmm.unit, cmm.gewerk,
             cmm.multiplier_field, cmm.multiplier_factor, cmm.product_pool_id,
             cmm.catalog_position_nr
      FROM catalog_material_mapping cmm
      WHERE cmm.catalog_position_nr = v_pos.catalog_code AND cmm.is_active = true
    LOOP
      v_multiplier := COALESCE(v_mapping.multiplier_factor, 1);
      
      IF v_mapping.multiplier_field IS NOT NULL AND v_pos.room_measurement_id IS NOT NULL THEN
        SELECT 
          CASE v_mapping.multiplier_field
            WHEN 'floor_area_m2' THEN prm.floor_area_m2
            WHEN 'wall_area_m2' THEN prm.wall_area_m2
            WHEN 'ceiling_area_m2' THEN prm.ceiling_area_m2
            WHEN 'floor_perimeter_m' THEN prm.floor_perimeter_m
            WHEN 'perimeter_m' THEN prm.perimeter_m
            ELSE NULL
          END INTO v_room_qty
        FROM project_room_measurements prm WHERE prm.id = v_pos.room_measurement_id;

        IF v_room_qty IS NOT NULL THEN
          v_qty := v_room_qty * v_multiplier * COALESCE(v_mapping.default_qty, 1);
        ELSE
          v_qty := COALESCE(v_mapping.default_qty, 1) * COALESCE(v_pos.pos_qty, 1) * v_multiplier;
          v_problems := array_append(v_problems, 
            'Aufmaß-Feld "' || v_mapping.multiplier_field || '" fehlt für ' || v_mapping.material_name);
        END IF;
      ELSE
        v_qty := COALESCE(v_mapping.default_qty, 1) * COALESCE(v_pos.pos_qty, 1) * v_multiplier;
      END IF;

      -- UPSERT: Gleiches Material im gleichen Raum → aggregieren
      INSERT INTO project_material_needs (
        project_id, trade, material_type, label,
        total_quantity, quantity_unit,
        room, source_position_nr, catalog_position_nr,
        schedule_phase_id, needed_by,
        multiplier_used, source, status, problem
      ) VALUES (
        p_project_id,
        COALESCE(v_mapping.gewerk, v_pos.trade_name, 'Sonstiges'),
        v_mapping.material_name, v_mapping.material_name,
        CEIL(v_qty),
        COALESCE(v_mapping.unit, v_pos.pos_unit, 'Stk'),
        v_room_name, v_pos.catalog_code, v_mapping.catalog_position_nr,
        v_phase_id, v_needed_by,
        v_multiplier, 'auto_plan', 'planned',
        CASE WHEN v_mapping.multiplier_field IS NOT NULL AND v_pos.room_measurement_id IS NULL 
          THEN 'aufmass_fehlt' ELSE NULL END
      )
      ON CONFLICT (project_id, label, COALESCE(room, '__all__'))
      DO UPDATE SET
        total_quantity = project_material_needs.total_quantity + EXCLUDED.total_quantity,
        updated_at = now()
      RETURNING (xmax = 0) INTO v_was_insert;

      IF v_was_insert THEN
        v_needs_created := v_needs_created + 1;
      END IF;
    END LOOP;

    -- Keine Mappings? Platzhalter mit UPSERT
    IF NOT EXISTS (
      SELECT 1 FROM catalog_material_mapping 
      WHERE catalog_position_nr = v_pos.catalog_code AND is_active = true
    ) AND v_pos.catalog_code IS NOT NULL THEN
      v_needs_skipped := v_needs_skipped + 1;

      INSERT INTO project_material_needs (
        project_id, trade, material_type, label,
        total_quantity, quantity_unit,
        room, source_position_nr,
        schedule_phase_id, needed_by,
        source, status, problem
      ) VALUES (
        p_project_id,
        COALESCE(v_pos.trade_name, 'Sonstiges'),
        'Unbekannt (' || COALESCE(v_pos.catalog_code, '?') || ')',
        COALESCE(v_pos.pos_title, 'Position ohne Mapping'),
        COALESCE(v_pos.pos_qty, 1),
        COALESCE(v_pos.pos_unit, 'Stk'),
        v_room_name, v_pos.catalog_code,
        v_phase_id, v_needed_by,
        'auto_plan', 'planned', 'mapping_fehlt'
      )
      ON CONFLICT (project_id, label, COALESCE(room, '__all__'))
      DO UPDATE SET
        total_quantity = project_material_needs.total_quantity + EXCLUDED.total_quantity,
        updated_at = now()
      RETURNING (xmax = 0) INTO v_was_insert;

      IF v_was_insert THEN
        v_needs_created := v_needs_created + 1;
      END IF;
    END IF;
  END LOOP;

  -- Termin-Probleme markieren
  UPDATE project_material_needs
  SET problem = COALESCE(problem, 'termin_fehlt')
  WHERE project_id = p_project_id
    AND source = 'auto_plan' AND status = 'planned'
    AND schedule_phase_id IS NULL AND problem IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'project_name', v_project.name,
    'needs_created', v_needs_created,
    'needs_without_mapping', v_needs_skipped,
    'trades', to_jsonb(v_trades_found),
    'problems', to_jsonb(v_problems)
  );
END;
$$;


ALTER FUNCTION "public"."auto_plan_materials"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_plan_project"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_project RECORD;
  v_trade RECORD;
  v_phase_order INT;
  v_duration INT;
  v_member_id UUID;
  v_member_name TEXT;
  v_start DATE;
  v_end DATE;
  v_total_days INT;
  v_phase_start DATE;
  v_phase_end DATE;
  v_phases_created INT := 0;
  v_assigned_count INT := 0;
  v_unassigned TEXT[] := '{}';
  v_assignments JSONB := '[]'::jsonb;
  v_busy_count INT;
  v_min_busy INT;
  v_best_member_id UUID;
  v_best_member_name TEXT;
  v_defaults RECORD;
  v_existing INT;
  v_phase_num INT := 0;
  v_day_offset INT := 0;
BEGIN
  SELECT id, planned_start, planned_end, status
  INTO v_project FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  IF v_project.planned_start IS NULL OR v_project.planned_end IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt hat kein Start-/Enddatum');
  END IF;

  SELECT COUNT(*) INTO v_existing
  FROM schedule_phases WHERE project_id = p_project_id AND status = 'proposed';

  IF v_existing > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vorschläge existieren bereits. Bitte erst freigeben oder verwerfen.');
  END IF;

  v_start := v_project.planned_start;
  v_end := v_project.planned_end;
  v_total_days := GREATEST((v_end - v_start) + 1, 1);

  FOR v_trade IN
    SELECT t.id AS trade_id, t.name AS trade_name, COUNT(*) AS pos_count
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    JOIN trades t ON t.id = op.trade_id
    WHERE o.project_id = p_project_id AND op.trade_id IS NOT NULL
    GROUP BY t.id, t.name
    ORDER BY t.sort_order
  LOOP
    v_phase_num := v_phase_num + 1;

    SELECT * INTO v_defaults FROM schedule_defaults WHERE trade_id = v_trade.trade_id;

    IF v_defaults IS NOT NULL AND v_defaults.default_phase_order < 99 THEN
      v_phase_order := v_defaults.default_phase_order;
    ELSE
      v_phase_order := v_phase_num;
    END IF;

    IF v_defaults IS NOT NULL AND v_defaults.avg_duration_days IS NOT NULL AND v_defaults.observation_count > 0 THEN
      v_duration := CEIL(v_defaults.avg_duration_days);
    ELSE
      v_duration := GREATEST(CEIL(v_total_days::numeric / GREATEST(v_phase_num, 3)), 3);
    END IF;

    -- FIX: phase_start wird auf project_end gekappt
    v_phase_start := LEAST(v_start + v_day_offset, v_end);
    v_phase_end := LEAST(v_phase_start + v_duration - 1, v_end);
    v_day_offset := v_day_offset + v_duration;

    v_best_member_id := NULL;
    v_best_member_name := NULL;

    -- Stufe 1: Default-Monteur
    IF v_defaults IS NOT NULL AND v_defaults.default_team_member_id IS NOT NULL THEN
      SELECT id, tm.name INTO v_member_id, v_member_name
      FROM team_members tm
      WHERE tm.id = v_defaults.default_team_member_id AND tm.active = true;

      IF FOUND THEN
        SELECT COUNT(*) INTO v_busy_count
        FROM schedule_phases sp
        WHERE sp.assigned_team_member_id = v_member_id
          AND sp.status != 'proposed'
          AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;

        IF v_busy_count = 0 THEN
          v_best_member_id := v_member_id;
          v_best_member_name := v_member_name;
        END IF;
      END IF;
    END IF;

    -- Stufe 2: trade_id Match
    IF v_best_member_id IS NULL THEN
      v_min_busy := 999999;
      FOR v_member_id, v_member_name IN
        SELECT tm.id, tm.name FROM team_members tm
        WHERE tm.active = true
          AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
          AND tm.trade_id = v_trade.trade_id
        ORDER BY tm.name
      LOOP
        SELECT COUNT(*) INTO v_busy_count
        FROM schedule_phases sp
        WHERE sp.assigned_team_member_id = v_member_id
          AND sp.status != 'proposed'
          AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;

        IF v_busy_count < v_min_busy THEN
          v_min_busy := v_busy_count;
          v_best_member_id := v_member_id;
          v_best_member_name := v_member_name;
        END IF;
        EXIT WHEN v_busy_count = 0;
      END LOOP;
    END IF;

    -- Stufe 3: Fallback
    IF v_best_member_id IS NULL THEN
      v_min_busy := 999999;
      FOR v_member_id, v_member_name IN
        SELECT tm.id, tm.name FROM team_members tm
        WHERE tm.active = true
          AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
          AND tm.trade_id IS NOT NULL
        ORDER BY tm.name
      LOOP
        SELECT COUNT(*) INTO v_busy_count
        FROM schedule_phases sp
        WHERE sp.assigned_team_member_id = v_member_id
          AND sp.status != 'proposed'
          AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;

        IF v_busy_count < v_min_busy THEN
          v_min_busy := v_busy_count;
          v_best_member_id := v_member_id;
          v_best_member_name := v_member_name;
        END IF;
        EXIT WHEN v_busy_count = 0;
      END LOOP;
    END IF;

    INSERT INTO schedule_phases (
      project_id, phase_number, name, trade, trade_id,
      start_date, end_date, assigned_team_member_id,
      status, progress, estimated_qty
    ) VALUES (
      p_project_id, -v_phase_order, v_trade.trade_name, v_trade.trade_name, v_trade.trade_id,
      v_phase_start, v_phase_end, v_best_member_id,
      'proposed', 0, v_trade.pos_count
    )
    ON CONFLICT (project_id, phase_number) DO UPDATE SET
      name = EXCLUDED.name, trade = EXCLUDED.trade, trade_id = EXCLUDED.trade_id,
      start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
      assigned_team_member_id = EXCLUDED.assigned_team_member_id,
      status = 'proposed', estimated_qty = EXCLUDED.estimated_qty, updated_at = now();

    v_phases_created := v_phases_created + 1;

    IF v_best_member_id IS NOT NULL THEN
      v_assigned_count := v_assigned_count + 1;
      v_assignments := v_assignments || jsonb_build_object(
        'trade', v_trade.trade_name, 'trade_id', v_trade.trade_id,
        'member_id', v_best_member_id, 'member_name', v_best_member_name,
        'start_date', v_phase_start, 'end_date', v_phase_end
      );
    ELSE
      v_unassigned := array_append(v_unassigned, v_trade.trade_name);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 'phases_created', v_phases_created,
    'assigned_count', v_assigned_count,
    'unassigned_trades', to_jsonb(v_unassigned),
    'assignments', v_assignments
  );
END;
$$;


ALTER FUNCTION "public"."auto_plan_project"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_approve_invoices"("p_invoice_ids" "uuid"[], "p_approved_by" "text" DEFAULT 'Chef'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_id UUID;
  v_invoice RECORD;
  v_approved_count INT := 0;
  v_skipped_count INT := 0;
  v_skipped_ids UUID[] := '{}';
  v_total_amount DECIMAL(12,2) := 0;
BEGIN
  FOREACH v_id IN ARRAY p_invoice_ids
  LOOP
    SELECT id, invoice_number, status, total_gross, project_id
    INTO v_invoice
    FROM purchase_invoices WHERE id = v_id;

    IF NOT FOUND OR v_invoice.status != 'DRAFT' THEN
      v_skipped_count := v_skipped_count + 1;
      v_skipped_ids := array_append(v_skipped_ids, v_id);
      CONTINUE;
    END IF;

    -- Status → APPROVED
    UPDATE purchase_invoices
    SET status = 'APPROVED',
        approved_at = NOW(),
        approved_by = p_approved_by,
        updated_at = NOW()
    WHERE id = v_id;

    v_approved_count := v_approved_count + 1;
    v_total_amount := v_total_amount + COALESCE(v_invoice.total_gross, 0);

    -- Event loggen
    INSERT INTO events (project_id, event_type, source_system, payload)
    VALUES (
      v_invoice.project_id,
      'PURCHASE_INVOICE_APPROVED',
      'baugenius',
      json_build_object(
        'invoice_id', v_id,
        'invoice_number', v_invoice.invoice_number,
        'amount', v_invoice.total_gross,
        'approved_by', p_approved_by,
        'batch', true
      )::JSONB
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'approved_count', v_approved_count,
    'skipped_count', v_skipped_count,
    'skipped_ids', v_skipped_ids,
    'total_amount', v_total_amount,
    'message', v_approved_count || ' Rechnungen freigegeben (' || v_total_amount || '€)'
  );
END;
$$;


ALTER FUNCTION "public"."batch_approve_invoices"("p_invoice_ids" "uuid"[], "p_approved_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_approve_invoices"("p_invoice_ids" "uuid"[], "p_approved_by" "text") IS 'Batch-Freigabe: Mehrere Eingangsrechnungen DRAFT → APPROVED in einem Call.';



CREATE OR REPLACE FUNCTION "public"."batch_approve_time_entries"("p_entry_ids" "uuid"[], "p_approved_by" "text" DEFAULT 'Bauleiter'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_approved_count INT;
  v_total_hours DECIMAL(8,1);
BEGIN
  WITH updated AS (
    UPDATE time_entries
    SET approved = true,
        approved_by = p_approved_by,
        updated_at = NOW()
    WHERE id = ANY(p_entry_ids)
      AND approved = false
    RETURNING id, hours
  )
  SELECT COUNT(*), COALESCE(SUM(hours), 0)
  INTO v_approved_count, v_total_hours
  FROM updated;

  RETURN json_build_object(
    'success', true,
    'approved_count', v_approved_count,
    'total_hours', v_total_hours,
    'skipped_count', array_length(p_entry_ids, 1) - v_approved_count,
    'message', v_approved_count || ' Zeiteinträge freigegeben (' || v_total_hours || 'h)'
  );
END;
$$;


ALTER FUNCTION "public"."batch_approve_time_entries"("p_entry_ids" "uuid"[], "p_approved_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_approve_time_entries"("p_entry_ids" "uuid"[], "p_approved_by" "text") IS 'Batch-Freigabe: Zeiteinträge approved = true setzen.';



CREATE OR REPLACE FUNCTION "public"."batch_reject_invoices"("p_invoice_ids" "uuid"[], "p_rejected_by" "text" DEFAULT 'Chef'::"text", "p_reason" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_id UUID;
  v_invoice RECORD;
  v_rejected_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  FOREACH v_id IN ARRAY p_invoice_ids
  LOOP
    SELECT id, status, project_id, invoice_number
    INTO v_invoice
    FROM purchase_invoices WHERE id = v_id;

    IF NOT FOUND OR v_invoice.status != 'DRAFT' THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    UPDATE purchase_invoices
    SET status = 'CANCELLED',
        notes = COALESCE(notes, '') ||
          CASE WHEN notes IS NOT NULL THEN E'\n' ELSE '' END ||
          'Abgelehnt von ' || p_rejected_by ||
          CASE WHEN p_reason IS NOT NULL THEN ': ' || p_reason ELSE '' END,
        updated_at = NOW()
    WHERE id = v_id;

    v_rejected_count := v_rejected_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'rejected_count', v_rejected_count,
    'skipped_count', v_skipped_count,
    'message', v_rejected_count || ' Rechnungen abgelehnt'
  );
END;
$$;


ALTER FUNCTION "public"."batch_reject_invoices"("p_invoice_ids" "uuid"[], "p_rejected_by" "text", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_reject_invoices"("p_invoice_ids" "uuid"[], "p_rejected_by" "text", "p_reason" "text") IS 'Batch-Ablehnung: Mehrere Eingangsrechnungen DRAFT → CANCELLED.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."offer_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "catalog_code" "text",
    "position_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "unit" "text" NOT NULL,
    "unit_price" numeric(10,2),
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "total_price" numeric(12,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "is_optional" boolean DEFAULT false,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "trade" "public"."trade_type" DEFAULT 'Sonstiges'::"public"."trade_type",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "section_id" "uuid",
    "position_type" "public"."position_type" DEFAULT 'STANDARD'::"public"."position_type",
    "alternative_to" "uuid",
    "long_text" "text",
    "internal_note" "text",
    "image_path" "text",
    "labor_minutes" numeric(10,2),
    "material_cost" numeric(10,2),
    "has_calculation" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "wbs_gwg_position_id" "uuid",
    "catalog_position_v2_id" "uuid",
    "progress_percent" integer DEFAULT 0,
    "progress_updated_at" timestamp with time zone,
    "last_inspection_id" "uuid",
    "inspection_status" "text" DEFAULT 'pending'::"text",
    "replaces_position_id" "uuid",
    "material_note" "text",
    "deleted_at" timestamp with time zone,
    "phase" character varying(20) DEFAULT 'erstbegehung'::character varying,
    "completed_at" timestamp with time zone,
    "change_order_item_id" "uuid",
    "source" character varying(20) DEFAULT 'original'::character varying,
    "trade_id" "uuid",
    "tools_note" "text",
    "surcharge_overhead_percent" numeric(5,2) DEFAULT 0,
    "surcharge_profit_percent" numeric(5,2) DEFAULT 0,
    "actual_minutes" numeric(8,2),
    "assigned_team_member_id" "uuid",
    "assigned_subcontractor_id" "uuid",
    "assignment_type" "text",
    "staged_long_text" "text",
    "staged_at" timestamp with time zone,
    "staged_by" "uuid",
    CONSTRAINT "offer_positions_assignment_type_check" CHECK (("assignment_type" = ANY (ARRAY['eigen'::"text", 'fremd'::"text"]))),
    CONSTRAINT "offer_positions_phase_check" CHECK ((("phase")::"text" = ANY ((ARRAY['erstbegehung'::character varying, 'zwischenbegehung'::character varying, 'abnahme'::character varying])::"text"[]))),
    CONSTRAINT "offer_positions_progress_percent_check" CHECK ((("progress_percent" >= 0) AND ("progress_percent" <= 100))),
    CONSTRAINT "offer_positions_source_check" CHECK ((("source")::"text" = ANY ((ARRAY['original'::character varying, 'change_order'::character varying, 'manual'::character varying])::"text"[])))
);


ALTER TABLE "public"."offer_positions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."offer_positions"."progress_percent" IS 'Aktueller Fortschritt 0-100 aus letzter ZB';



COMMENT ON COLUMN "public"."offer_positions"."progress_updated_at" IS 'Timestamp der letzten Fortschritts-Aktualisierung';



COMMENT ON COLUMN "public"."offer_positions"."last_inspection_id" IS 'Referenz zur ZB die den Fortschritt zuletzt geändert hat';



COMMENT ON COLUMN "public"."offer_positions"."inspection_status" IS 'pending|confirmed|pending_correction|replaced|corrected';



COMMENT ON COLUMN "public"."offer_positions"."replaces_position_id" IS 'Zeigt auf die Original-Position die ersetzt wurde';



COMMENT ON COLUMN "public"."offer_positions"."material_note" IS 'Freitext für Material-Details bei Erstbegehung (Maße, etc.)';



COMMENT ON COLUMN "public"."offer_positions"."deleted_at" IS 'Soft delete timestamp - position removed from order but kept for audit';



COMMENT ON COLUMN "public"."offer_positions"."phase" IS 'Current workflow phase: erstbegehung, zwischenbegehung, abnahme';



COMMENT ON COLUMN "public"."offer_positions"."completed_at" IS 'Timestamp when position reached 100%';



COMMENT ON COLUMN "public"."offer_positions"."change_order_item_id" IS 'Verknüpfung bei Einbuchung aus Nachtrag';



COMMENT ON COLUMN "public"."offer_positions"."source" IS 'Herkunft: original (aus Angebot), change_order (aus Nachtrag), manual';



COMMENT ON COLUMN "public"."offer_positions"."tools_note" IS 'Freitext für benötigte Werkzeuge (nicht summierbar, 1x pro Projekt)';



COMMENT ON COLUMN "public"."offer_positions"."actual_minutes" IS 'Tatsächlich gebrauchte Minuten (vom Monteur oder Bauleiter erfasst)';



CREATE OR REPLACE FUNCTION "public"."book_change_order_to_positions"("p_change_order_id" "uuid") RETURNS SETOF "public"."offer_positions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_change_order change_orders%ROWTYPE;
  v_item change_order_items%ROWTYPE;
  v_max_position INTEGER;
  v_new_position offer_positions%ROWTYPE;
BEGIN
  SELECT * INTO v_change_order FROM change_orders WHERE id = p_change_order_id;
  IF v_change_order.id IS NULL THEN
    RAISE EXCEPTION 'Change order % not found', p_change_order_id;
  END IF;
  IF v_change_order.status != 'APPROVED_BY_CUSTOMER' THEN
    RAISE EXCEPTION 'Change order must be APPROVED_BY_CUSTOMER, is %', v_change_order.status;
  END IF;
  IF v_change_order.offer_id IS NULL THEN
    RAISE EXCEPTION 'Change order has no offer_id set';
  END IF;
  SELECT COALESCE(MAX(position_number), 0) INTO v_max_position
  FROM offer_positions WHERE offer_id = v_change_order.offer_id;
  FOR v_item IN
    SELECT * FROM change_order_items WHERE change_order_id = p_change_order_id ORDER BY sort_order
  LOOP
    v_max_position := v_max_position + 1;
    INSERT INTO offer_positions (
      offer_id, section_id, position_number,
      title, description, unit, unit_price, quantity,
      catalog_position_v2_id, change_order_item_id, source,
      phase, inspection_status, created_at
    ) VALUES (
      v_change_order.offer_id, v_change_order.section_id, v_max_position,
      v_item.description, 'Nachtrag: ' || v_change_order.title,
      v_item.unit, v_item.unit_price, v_item.quantity,
      v_item.catalog_position_id, v_item.id, 'change_order',
      'erstbegehung', 'confirmed', now()
    ) RETURNING * INTO v_new_position;
    RETURN NEXT v_new_position;
  END LOOP;
  UPDATE change_orders SET status = 'INVOICED', updated_at = now() WHERE id = p_change_order_id;
  RETURN;
END;
$$;


ALTER FUNCTION "public"."book_change_order_to_positions"("p_change_order_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."book_change_order_to_positions"("p_change_order_id" "uuid") IS 'Bucht alle Items eines freigegebenen Nachtrags als offer_positions ein';



CREATE OR REPLACE FUNCTION "public"."calc_change_order_item_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.total_price := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calc_change_order_item_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_match_confidence"("p_transaction_id" "uuid", "p_invoice_type" "text", "p_invoice_id" "uuid") RETURNS TABLE("confidence" integer, "reasons" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_trans bank_transactions%ROWTYPE;
  v_invoice_number TEXT;
  v_invoice_amount DECIMAL(12,2);
  v_invoice_due_date DATE;
  v_counterpart_name TEXT;
  v_conf INTEGER := 0;
  v_reasons JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_trans FROM bank_transactions WHERE id = p_transaction_id;
  
  IF p_invoice_type = 'sales' THEN
    SELECT si.invoice_number, si.total_gross, si.due_date, c.company_name
    INTO v_invoice_number, v_invoice_amount, v_invoice_due_date, v_counterpart_name
    FROM sales_invoices si
    LEFT JOIN clients c ON si.client_id = c.id
    WHERE si.id = p_invoice_id;
  ELSE
    SELECT pi.invoice_number, pi.total_gross, pi.due_date, s.name
    INTO v_invoice_number, v_invoice_amount, v_invoice_due_date, v_counterpart_name
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON pi.supplier_id = s.id
    WHERE pi.id = p_invoice_id;
  END IF;
  
  -- Betrag exakt
  IF ABS(v_trans.amount) = v_invoice_amount THEN
    v_conf := v_conf + 40;
    v_reasons := v_reasons || '"amount_exact"'::JSONB;
  ELSIF v_invoice_amount > 0 AND ABS(ABS(v_trans.amount) - v_invoice_amount) / v_invoice_amount < 0.01 THEN
    v_conf := v_conf + 20;
    v_reasons := v_reasons || '"amount_close"'::JSONB;
  END IF;
  
  -- Rechnungsnummer
  IF v_trans.reference_text ILIKE '%' || v_invoice_number || '%' THEN
    v_conf := v_conf + 50;
    v_reasons := v_reasons || '"invoice_number_found"'::JSONB;
  END IF;
  
  -- Name
  IF v_counterpart_name IS NOT NULL AND v_trans.counterpart_name ILIKE '%' || v_counterpart_name || '%' THEN
    v_conf := v_conf + 25;
    v_reasons := v_reasons || '"name_match"'::JSONB;
  END IF;
  
  -- Datum
  IF v_invoice_due_date IS NOT NULL 
     AND v_trans.booking_date BETWEEN v_invoice_due_date - 7 AND v_invoice_due_date + 14 THEN
    v_conf := v_conf + 15;
    v_reasons := v_reasons || '"date_plausible"'::JSONB;
  END IF;
  
  v_conf := LEAST(v_conf, 100);
  
  RETURN QUERY SELECT v_conf, v_reasons;
END;
$$;


ALTER FUNCTION "public"."calculate_match_confidence"("p_transaction_id" "uuid", "p_invoice_type" "text", "p_invoice_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_order_quantities"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_count INTEGER;
BEGIN
  -- Lösche vorherige auto-berechnete Bedarfe
  DELETE FROM project_material_needs
  WHERE project_id = p_project_id AND source = 'auto';

  WITH position_room AS (
    SELECT 
      op.id AS position_id,
      op.catalog_code,
      op.quantity AS pos_quantity,
      op.trade::TEXT AS pos_trade,
      os.title AS section_title,
      os.room_measurement_id,
      regexp_replace(COALESCE(os.title, ''), ' \d+$', '') AS room_base,
      o.project_id
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN offer_sections os ON op.section_id = os.id
    WHERE o.project_id = p_project_id
      AND op.deleted_at IS NULL
      AND op.inspection_status = 'confirmed'
      AND op.phase != 'erstbegehung'
  ),
  raw_materials AS (
    SELECT
      pr.position_id,
      mcr.name AS material_name,
      mcr.category AS material_category,
      mcr.consumption_unit,
      mcr.order_unit,
      mcr.order_unit_size,
      mcr.min_order_quantity,
      COALESCE(pr.pos_trade, 'Sonstiges') AS trade,
      CASE mcr.area_type
        WHEN 'ceiling'   THEN COALESCE(prm.ceiling_area_m2, 0) * mcr.consumption_per_unit * mcr.waste_factor
        WHEN 'wall'      THEN COALESCE(prm.wall_area_m2, 0) * mcr.consumption_per_unit * mcr.waste_factor
        WHEN 'floor'     THEN COALESCE(prm.floor_area_m2, 0) * mcr.consumption_per_unit * mcr.waste_factor
        WHEN 'perimeter' THEN COALESCE(prm.floor_perimeter_m, 0) * mcr.consumption_per_unit * mcr.waste_factor
        WHEN 'count'     THEN pr.pos_quantity * mcr.consumption_per_unit * mcr.waste_factor
        ELSE 0
      END AS total_with_waste,
      CASE mcr.area_type
        WHEN 'ceiling'   THEN COALESCE(prm.ceiling_area_m2, 0) * mcr.consumption_per_unit
        WHEN 'wall'      THEN COALESCE(prm.wall_area_m2, 0) * mcr.consumption_per_unit
        WHEN 'floor'     THEN COALESCE(prm.floor_area_m2, 0) * mcr.consumption_per_unit
        WHEN 'perimeter' THEN COALESCE(prm.floor_perimeter_m, 0) * mcr.consumption_per_unit
        WHEN 'count'     THEN pr.pos_quantity * mcr.consumption_per_unit
        ELSE 0
      END AS raw_quantity
    FROM position_room pr
    JOIN material_consumption_rates mcr 
      ON pr.catalog_code = mcr.catalog_position_prefix
      AND mcr.is_active = true
    LEFT JOIN project_room_measurements prm ON (
      prm.id = pr.room_measurement_id
      OR (pr.room_measurement_id IS NULL 
          AND prm.project_id = pr.project_id 
          AND prm.room_name ILIKE pr.room_base)
    )
    WHERE mcr.category NOT IN ('tool')
  ),
  aggregated AS (
    SELECT
      material_name,
      material_category,
      consumption_unit,
      order_unit,
      order_unit_size,
      min_order_quantity,
      MAX(trade) AS trade,
      SUM(raw_quantity) AS total_raw,
      SUM(total_with_waste) AS total_needed,
      CASE 
        WHEN order_unit_size > 0 THEN
          GREATEST(
            CEIL(SUM(total_with_waste) / order_unit_size) + 1,
            COALESCE(min_order_quantity, 1)
          )
        ELSE CEIL(SUM(total_with_waste))
      END AS order_quantity,
      CASE 
        WHEN order_unit_size > 0 THEN order_unit
        ELSE consumption_unit
      END AS final_unit
    FROM raw_materials
    WHERE total_with_waste > 0
    GROUP BY material_name, material_category, consumption_unit, order_unit, order_unit_size, min_order_quantity
  )
  INSERT INTO project_material_needs (
    project_id, trade, material_type, label,
    total_quantity, quantity_unit,
    status, source, notes, room
  )
  SELECT
    p_project_id,
    a.trade,
    a.material_name,
    a.material_name,
    a.order_quantity,
    a.final_unit,
    'planned',
    'auto',
    format('Rohbedarf: %s %s → %s× %s (à %s %s)', 
      round(a.total_raw, 1), a.consumption_unit,
      a.order_quantity::int, a.order_unit,
      a.order_unit_size, a.consumption_unit
    ),
    '__all__'
  FROM aggregated a;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Produkt-Matching: Verknüpfe mit besten Produkten aus products-Tabelle
  UPDATE project_material_needs pmn SET
    product_id = best.product_id,
    product_name = best.product_name,
    unit_price_net = best.last_price_net_eur
  FROM (
    SELECT DISTINCT ON (pmn2.id)
      pmn2.id AS need_id,
      p.id AS product_id,
      p.name AS product_name,
      p.last_price_net_eur
    FROM project_material_needs pmn2
    JOIN products p ON (
      p.material_type = pmn2.material_type
      OR p.name ILIKE '%' || pmn2.material_type || '%'
    )
    WHERE pmn2.project_id = p_project_id
      AND pmn2.source = 'auto'
      AND pmn2.product_id IS NULL
      AND p.is_active = true
    ORDER BY pmn2.id, p.is_favorite DESC NULLS LAST, p.use_count DESC NULLS LAST
  ) best
  WHERE pmn.id = best.need_id;

  RETURN json_build_object(
    'success', true,
    'project_id', p_project_id,
    'materials_calculated', v_count
  );
END;
$_$;


ALTER FUNCTION "public"."calculate_order_quantities"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_position_price"("p_position_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_material_sum NUMERIC(12,2) := 0;
  v_labor_sum NUMERIC(12,2) := 0;
  v_equipment_sum NUMERIC(12,2) := 0;
  v_sub_sum NUMERIC(12,2) := 0;
  
  v_base_cost NUMERIC(12,2) := 0;
  v_overhead_amount NUMERIC(12,2) := 0;
  v_profit_base NUMERIC(12,2) := 0;
  v_profit_amount NUMERIC(12,2) := 0;
  
  v_total_unit_price NUMERIC(12,2) := 0;
  
  v_quantity NUMERIC(10,3);
  v_overhead_pct NUMERIC(5,2);
  v_profit_pct NUMERIC(5,2);
BEGIN
  -- 1. Get current position details
  SELECT quantity, surcharge_overhead_percent, surcharge_profit_percent 
  INTO v_quantity, v_overhead_pct, v_profit_pct 
  FROM offer_positions WHERE id = p_position_id;
  
  IF v_quantity IS NULL THEN
    RETURN;
  END IF;

  -- Defaults
  v_overhead_pct := COALESCE(v_overhead_pct, 0);
  v_profit_pct := COALESCE(v_profit_pct, 0);

  -- 2. Calculate Sums from Sub-Tables
  SELECT COALESCE(SUM(total_price), 0) INTO v_material_sum 
  FROM position_calc_materials WHERE position_id = p_position_id;

  SELECT COALESCE(SUM(total_price), 0) INTO v_labor_sum
  FROM position_calc_labor WHERE position_id = p_position_id;

  SELECT COALESCE(SUM(total_price), 0) INTO v_equipment_sum
  FROM position_calc_equipment WHERE position_id = p_position_id;

  SELECT COALESCE(SUM(total_price), 0) INTO v_sub_sum
  FROM position_calc_subcontractor WHERE position_id = p_position_id;

  -- 3. Calculate Surcharges
  v_base_cost := v_material_sum + v_labor_sum + v_equipment_sum + v_sub_sum;
  
  -- Overhead (Gemeinkosten) logic: usually applied on base cost
  v_overhead_amount := v_base_cost * (v_overhead_pct / 100.0);
  
  -- Profit (Gewinn) logic: applied on (Base + Overhead)
  v_profit_base := v_base_cost + v_overhead_amount;
  v_profit_amount := v_profit_base * (v_profit_pct / 100.0);

  -- 4. Final Unit Price
  v_total_unit_price := v_base_cost + v_overhead_amount + v_profit_amount;

  -- 5. Update Position
  -- Always set has_calculation = TRUE if we are here (driven by triggers/frontend)
  UPDATE offer_positions
  SET 
    unit_price = v_total_unit_price,
    total_price = v_total_unit_price * quantity,
    has_calculation = TRUE,
    updated_at = NOW()
  WHERE id = p_position_id;

END;
$$;


ALTER FUNCTION "public"."calculate_position_price"("p_position_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_project_costs"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE v_labor_cost DECIMAL(12,2); v_material_cost DECIMAL(12,2); v_invoice_cost DECIMAL(12,2); v_change_order_cost DECIMAL(12,2); v_total_cost DECIMAL(12,2); v_offer_amount DECIMAL(12,2); v_profit DECIMAL(12,2); v_margin_percent DECIMAL(5,1); v_status TEXT; v_project RECORD; BEGIN SELECT id, name INTO v_project FROM projects WHERE id = p_project_id; IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden'); END IF; SELECT COALESCE(SUM(estimated_cost), 0) INTO v_labor_cost FROM schedule_phases WHERE project_id = p_project_id; SELECT COALESCE(SUM(line_total_net_eur), 0) INTO v_material_cost FROM project_materials WHERE project_id = p_project_id AND status IN ('planned', 'confirmed', 'ordered', 'delivered'); SELECT COALESCE(SUM(total_gross), 0) INTO v_invoice_cost FROM purchase_invoices WHERE project_id = p_project_id AND status IN ('APPROVED', 'PAID'); SELECT COALESCE(SUM(amount_gross), 0) INTO v_change_order_cost FROM change_orders WHERE project_id = p_project_id AND status IN ('APPROVED', 'INVOICED'); v_total_cost := v_labor_cost + v_material_cost + v_invoice_cost + v_change_order_cost; SELECT COALESCE(total_net, 0) INTO v_offer_amount FROM offers WHERE project_id = p_project_id AND status NOT IN ('REJECTED', 'EXPIRED') ORDER BY version DESC LIMIT 1; IF v_offer_amount > 0 THEN v_profit := v_offer_amount - v_total_cost; v_margin_percent := ROUND((v_profit / v_offer_amount * 100)::NUMERIC, 1); ELSE v_profit := 0 - v_total_cost; v_margin_percent := 0; END IF; IF v_margin_percent >= 20 THEN v_status := 'green'; ELSIF v_margin_percent >= 10 THEN v_status := 'yellow'; ELSE v_status := 'red'; END IF; RETURN json_build_object('success', true, 'project_name', v_project.name, 'breakdown', json_build_object('labor_cost', v_labor_cost, 'material_cost', v_material_cost, 'invoice_cost', v_invoice_cost, 'change_orders', v_change_order_cost), 'total_cost', v_total_cost, 'offer_amount', v_offer_amount, 'profit', v_profit, 'margin_percent', v_margin_percent, 'status', v_status); END;$$;


ALTER FUNCTION "public"."calculate_project_costs"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_project_costs"("p_project_id" "uuid") IS 'Aggregiert Projektkosten (Lohn + Material + Rechnungen + Nachträge) → Marge + Ampel.';



CREATE OR REPLACE FUNCTION "public"."calculate_project_materials"("p_project_id" "uuid") RETURNS TABLE("position_id" "uuid", "material_name" "text", "quantity" numeric, "unit" "text", "waste_factor" numeric, "total_quantity" numeric, "consumption_rate_id" "uuid")
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  RETURN QUERY
  WITH position_room_match AS (
    SELECT 
      op.id as position_id,
      op.catalog_code,
      op.quantity as pos_quantity,
      os.title as section_title,
      os.room_measurement_id,
      regexp_replace(os.title, ' \d+$', '') as room_base,
      o.project_id
    FROM offer_positions op
    JOIN offer_sections os ON op.section_id = os.id
    JOIN offers o ON op.offer_id = o.id
    WHERE o.project_id = p_project_id
      AND op.phase = 'zwischenbegehung'
      AND op.deleted_at IS NULL
  )
  SELECT 
    prm_match.position_id,
    mcr.name as material_name,
    CASE mcr.area_type
      WHEN 'ceiling' THEN COALESCE(prm.ceiling_area_m2, 0) * mcr.consumption_per_unit
      WHEN 'wall' THEN COALESCE(prm.wall_area_m2, 0) * mcr.consumption_per_unit
      WHEN 'floor' THEN COALESCE(prm.floor_area_m2, 0) * mcr.consumption_per_unit
      WHEN 'perimeter' THEN COALESCE(prm.floor_perimeter_m, prm.perimeter_m, 0) * mcr.consumption_per_unit  -- FIX
      WHEN 'count' THEN prm_match.pos_quantity * mcr.consumption_per_unit
      ELSE 0
    END as quantity,
    mcr.consumption_unit as unit,
    mcr.waste_factor,
    CASE mcr.area_type
      WHEN 'ceiling' THEN COALESCE(prm.ceiling_area_m2, 0) * mcr.consumption_per_unit * mcr.waste_factor
      WHEN 'wall' THEN COALESCE(prm.wall_area_m2, 0) * mcr.consumption_per_unit * mcr.waste_factor
      WHEN 'floor' THEN COALESCE(prm.floor_area_m2, 0) * mcr.consumption_per_unit * mcr.waste_factor
      WHEN 'perimeter' THEN COALESCE(prm.floor_perimeter_m, prm.perimeter_m, 0) * mcr.consumption_per_unit * mcr.waste_factor  -- FIX
      WHEN 'count' THEN prm_match.pos_quantity * mcr.consumption_per_unit * mcr.waste_factor
      ELSE 0
    END as total_quantity,
    mcr.id as consumption_rate_id
  FROM position_room_match prm_match
  LEFT JOIN project_room_measurements prm 
    ON (
      prm.id = prm_match.room_measurement_id
      OR (prm_match.room_measurement_id IS NULL 
          AND prm.project_id = prm_match.project_id 
          AND prm.room_name ILIKE prm_match.room_base)
    )
  JOIN material_consumption_rates mcr 
    ON prm_match.catalog_code = mcr.catalog_position_prefix
    AND mcr.is_active = true
  WHERE mcr.id IS NOT NULL;
END;
$_$;


ALTER FUNCTION "public"."calculate_project_materials"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_project_materials"("p_project_id" "uuid") IS 'Calculates material needs for all ZB-phase positions in a project.
Uses offer_sections.room_measurement_id (FK) for room matching.
Falls back to fuzzy name match if FK not set.';



CREATE OR REPLACE FUNCTION "public"."calculate_project_materials_v2"("p_project_id" "uuid") RETURNS TABLE("r_position_id" "uuid", "r_material_name" "text", "r_quantity" numeric, "r_unit" "text", "r_waste_factor" numeric, "r_total_quantity" numeric, "r_source" "text", "r_trade" "text", "r_adjusted_quantity" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_pos RECORD;
  v_req RECORD;
  v_calc_qty NUMERIC;
  v_manual_mat RECORD;
BEGIN
  -- We iterate over all confirmed positions in the project
  FOR v_pos IN
    SELECT 
      op.id, 
      op.title, 
      op.quantity as pos_quantity, 
      m.measured_quantity,
      op.catalog_position_v2_id,
      op.trade
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN measurements m ON m.offer_position_id = op.id AND m.status = 'confirmed'
    WHERE o.project_id = p_project_id
  LOOP
    
    -- 1. Check for MANUAL calculation (Deep Calculation)
    FOR v_manual_mat IN 
      SELECT pcm.material_name, pcm.quantity, pcm.unit 
      FROM position_calc_materials pcm 
      WHERE pcm.position_id = v_pos.id
    LOOP
      r_position_id := v_pos.id;
      r_material_name := v_manual_mat.material_name;
      r_quantity := v_manual_mat.quantity;
      r_unit := v_manual_mat.unit;
      r_waste_factor := 1.10;
      r_total_quantity := v_manual_mat.quantity;
      r_source := 'manual';
      r_trade := v_pos.trade;
      
      SELECT pm.quantity INTO r_adjusted_quantity
      FROM project_materials pm 
      WHERE pm.offer_position_id = v_pos.id AND pm.material_type = r_material_name;

      RETURN NEXT;
    END LOOP;
    
    IF FOUND THEN CONTINUE; END IF;

    -- 2. "In-Project Learning": Check if we have confirmed adjustments for similar positions
    -- We look for confirmed project_materials on sibling positions and SCALE them
    FOR v_manual_mat IN
      SELECT 
        pm.material_type, 
        pm.quantity as sibling_quantity, 
        pm.quantity_unit, 
        pm.trade,
        op_sib.quantity as sibling_pos_quantity
      FROM project_materials pm
      JOIN offer_positions op_sib ON op_sib.id = pm.offer_position_id
      JOIN offers o_sib ON o_sib.id = op_sib.offer_id
      WHERE o_sib.project_id = p_project_id 
        AND pm.status = 'confirmed'
        AND op_sib.id != v_pos.id
        AND op_sib.quantity > 0
        AND (
          (v_pos.catalog_position_v2_id IS NOT NULL AND op_sib.catalog_position_v2_id = v_pos.catalog_position_v2_id)
          OR 
          (v_pos.title = op_sib.title)
        )
      LIMIT 1
    LOOP
       r_position_id := v_pos.id;
       r_material_name := v_manual_mat.material_type;
       
       -- SCALE: (Sibling material qty / sibling pos qty) * current pos qty
       r_quantity := (v_manual_mat.sibling_quantity / v_manual_mat.sibling_pos_quantity) * v_pos.pos_quantity;
       
       r_unit := v_manual_mat.quantity_unit;
       r_waste_factor := 1.00; 
       r_total_quantity := r_quantity; 
       r_source := 'learned';
       r_trade := v_manual_mat.trade;

       SELECT pm.quantity INTO r_adjusted_quantity
       FROM project_materials pm 
       WHERE pm.offer_position_id = v_pos.id AND pm.material_type = r_material_name;

       RETURN NEXT;
    END LOOP;

    IF FOUND THEN CONTINUE; END IF;

    -- 3. Smart Propagation (Sibling Manual Calc) - ALSO SCALED
    FOR v_manual_mat IN
      SELECT 
        pcm.material_name, 
        pcm.quantity as sibling_calc_qty, 
        pcm.unit,
        op_sib.quantity as sibling_pos_quantity
      FROM position_calc_materials pcm
      JOIN offer_positions op_sib ON op_sib.id = pcm.position_id
      JOIN offers o_sib ON o_sib.id = op_sib.offer_id
      WHERE o_sib.project_id = p_project_id 
        AND op_sib.id != v_pos.id
        AND op_sib.quantity > 0
        AND (
          (v_pos.catalog_position_v2_id IS NOT NULL AND op_sib.catalog_position_v2_id = v_pos.catalog_position_v2_id)
          OR 
          (v_pos.title = op_sib.title)
        )
      LIMIT 1
    LOOP
       r_position_id := v_pos.id;
       r_material_name := v_manual_mat.material_name;
       
       -- SCALE: (Sibling calc qty / sibling pos qty) * current pos qty
       r_quantity := (v_manual_mat.sibling_calc_qty / v_manual_mat.sibling_pos_quantity) * v_pos.pos_quantity;
       
       r_unit := v_manual_mat.unit;
       r_waste_factor := 1.10;
       r_total_quantity := r_quantity; 
       r_source := 'propagated';
       r_trade := v_pos.trade;

       SELECT pm.quantity INTO r_adjusted_quantity
       FROM project_materials pm 
       WHERE pm.offer_position_id = v_pos.id AND pm.material_type = r_material_name;

       RETURN NEXT;
    END LOOP;

    IF FOUND THEN CONTINUE; END IF;

    -- 4. Catalog Default
    FOR v_req IN
      SELECT pmr.material_type, pmr.quantity_mode, pmr.default_quantity, pmr.quantity_unit, pmr.trade, pmr.default_product_id
      FROM position_material_requirements pmr
      WHERE pmr.catalog_position_v2_id = v_pos.catalog_position_v2_id
    LOOP
      v_calc_qty := CASE v_req.quantity_mode
        WHEN 'fixed' THEN v_req.default_quantity
        WHEN 'per_unit' THEN v_req.default_quantity * COALESCE(v_pos.measured_quantity, v_pos.pos_quantity)
        WHEN 'per_sqm' THEN v_req.default_quantity * COALESCE(v_pos.measured_quantity, v_pos.pos_quantity)
        WHEN 'per_m' THEN v_req.default_quantity * COALESCE(v_pos.measured_quantity, v_pos.pos_quantity)
        ELSE v_req.default_quantity
      END;

      r_position_id := v_pos.id;
      r_material_name := v_req.material_type;
      r_quantity := v_calc_qty;
      r_unit := v_req.quantity_unit;
      r_waste_factor := 1.15;
      r_total_quantity := v_calc_qty * 1.15;
      r_source := 'catalog';
      r_trade := v_req.trade;

      SELECT pm.quantity INTO r_adjusted_quantity
      FROM project_materials pm 
      WHERE pm.offer_position_id = v_pos.id 
        AND (pm.product_id = v_req.default_product_id OR pm.material_type = v_req.material_type);

      RETURN NEXT;
    END LOOP;

  END LOOP;
END;
$$;


ALTER FUNCTION "public"."calculate_project_materials_v2"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_project_materials_v3"("p_project_id" "uuid") RETURNS TABLE("r_material_name" "text", "r_sku" "text", "r_quantity" numeric, "r_unit" "text", "r_trade" "text", "r_source" "text", "r_total_quantity" numeric, "r_adjusted_quantity" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  WITH material_entries AS (
    SELECT
      p.id AS product_id,
      p.name::TEXT AS product_name,
      COALESCE(p.sku, 'Keine Art.-Nr.')::TEXT AS sku,
      COALESCE(NULLIF(TRIM(p.unit), ''), pm.quantity_unit, 'Stk')::TEXT AS unit,
      p.pack_size,
      CASE
        WHEN mcr.consumption_per_unit IS NOT NULL THEN
          COALESCE(m.measured_quantity, op.quantity, 1)
          * mcr.consumption_per_unit
          * COALESCE(mcr.waste_factor, 1.0)
        ELSE
          pm.quantity
      END AS calculated_qty,
      COALESCE(op.trade::TEXT, pm.trade) AS trade,
      CASE
        WHEN pm.is_auto_applied THEN 'auto_applied'
        WHEN mcr.consumption_per_unit IS NOT NULL THEN 'consumption_rate'
        ELSE 'manual'
      END AS source
    FROM project_materials pm
    JOIN products p ON p.id = pm.product_id
    LEFT JOIN offer_positions op ON op.id = pm.offer_position_id
    LEFT JOIN measurements m ON m.offer_position_id = op.id AND m.status = 'confirmed'
    LEFT JOIN material_consumption_rates mcr
      ON mcr.product_id = pm.product_id
      AND mcr.material_type = pm.material_type
    WHERE pm.project_id = p_project_id
      AND pm.product_id IS NOT NULL
      AND pm.status = 'confirmed'
  )
  SELECT
    me.product_name AS r_material_name,
    me.sku AS r_sku,
    SUM(me.calculated_qty)::NUMERIC AS r_quantity,
    me.unit AS r_unit,
    me.trade AS r_trade,
    MAX(me.source) AS r_source,
    SUM(me.calculated_qty)::NUMERIC AS r_total_quantity,
    SUM(me.calculated_qty)::NUMERIC AS r_adjusted_quantity
  FROM material_entries me
  GROUP BY me.product_id, me.product_name, me.sku, me.unit, me.trade
  ORDER BY me.trade, me.product_name;
END;
$$;


ALTER FUNCTION "public"."calculate_project_materials_v3"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_project_materials_v3"("p_project_id" "uuid") IS 'Smart-Aufmass v3: Konsolidiert project_materials pro Produkt. Nutzt consumption_rates wenn vorhanden, sonst gespeicherte Menge.';



CREATE OR REPLACE FUNCTION "public"."cancel_invoice"("p_invoice_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE purchase_invoices SET status = 'CANCELLED', updated_at = NOW() WHERE id = p_invoice_id;
  RETURN jsonb_build_object('success', true);
END; $$;


ALTER FUNCTION "public"."cancel_invoice"("p_invoice_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_email_duplicate"("p_message_id" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF p_message_id IS NULL OR p_message_id = '' THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM purchase_invoices 
    WHERE email_message_id = p_message_id
  );
END;
$$;


ALTER FUNCTION "public"."check_email_duplicate"("p_message_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_email_duplicate"("p_message_id" "text") IS 'Prüft ob E-Mail bereits verarbeitet wurde';



CREATE OR REPLACE FUNCTION "public"."check_expired_approvals"() RETURNS TABLE("approval_id" "uuid", "project_id" "uuid", "approval_type" "public"."approval_type", "hours_overdue" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.project_id,
    a.approval_type,
    ROUND(EXTRACT(EPOCH FROM (now() - a.expires_at))/3600, 2)
  FROM approvals a
  WHERE a.status = 'PENDING'
    AND a.expires_at < now();
END;
$$;


ALTER FUNCTION "public"."check_expired_approvals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_in_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_project RECORD;
  v_member RECORD;
  v_existing RECORD;
  v_attendance_id UUID;
BEGIN
  -- Projekt validieren
  SELECT id, name INTO v_project
  FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  -- Mitarbeiter validieren
  SELECT id, name, is_active INTO v_member
  FROM team_members WHERE id = p_team_member_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mitarbeiter nicht gefunden');
  END IF;

  IF NOT v_member.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Mitarbeiter ist nicht aktiv');
  END IF;

  -- Prüfe ob bereits eingecheckt
  SELECT id INTO v_existing
  FROM attendance_logs
  WHERE project_id = p_project_id
    AND team_member_id = p_team_member_id
    AND check_out IS NULL;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', v_member.name || ' ist bereits auf ' || v_project.name || ' eingecheckt'
    );
  END IF;

  -- Check-in eintragen
  INSERT INTO attendance_logs (project_id, team_member_id, person_name, check_in, source)
  VALUES (p_project_id, p_team_member_id, v_member.name, NOW(), 'qr_code')
  RETURNING id INTO v_attendance_id;

  -- Activity loggen
  INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_project_id,
    'attendance',
    v_member.name || ' eingecheckt',
    'Check-in via QR-Code',
    json_build_object('team_member_id', p_team_member_id, 'attendance_id', v_attendance_id)::JSONB,
    'system'
  );

  RETURN json_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'worker_name', v_member.name,
    'project_name', v_project.name,
    'check_in_time', NOW(),
    'message', v_member.name || ' auf ' || v_project.name || ' eingecheckt'
  );
END;
$$;


ALTER FUNCTION "public"."check_in_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_in_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") IS 'QR-Check-in: Erfasst Anwesenheit + Activity. Prüft Duplikate.';



CREATE OR REPLACE FUNCTION "public"."check_out_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_attendance RECORD;
  v_member RECORD;
  v_project RECORD;
  v_duration_hours DECIMAL(4,1);
  v_time_entry_id UUID;
BEGIN
  -- Mitarbeiter-Info
  SELECT id, name, hourly_rate INTO v_member
  FROM team_members WHERE id = p_team_member_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mitarbeiter nicht gefunden');
  END IF;

  -- Projekt-Info
  SELECT id, name INTO v_project
  FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  -- Offenen Check-in finden
  SELECT id, check_in INTO v_attendance
  FROM attendance_logs
  WHERE project_id = p_project_id
    AND team_member_id = p_team_member_id
    AND check_out IS NULL
  ORDER BY check_in DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kein offener Check-in für ' || v_member.name || ' auf ' || v_project.name
    );
  END IF;

  -- Check-out eintragen
  UPDATE attendance_logs
  SET check_out = NOW()
  WHERE id = v_attendance.id;

  -- Stunden berechnen (auf 0.5h gerundet)
  v_duration_hours := ROUND(
    (EXTRACT(EPOCH FROM (NOW() - v_attendance.check_in)) / 3600.0) * 2
  ) / 2.0;

  -- Minimum 0.5h
  IF v_duration_hours < 0.5 THEN
    v_duration_hours := 0.5;
  END IF;

  -- Maximum 16h (Plausibilität)
  IF v_duration_hours > 16.0 THEN
    v_duration_hours := 16.0;
  END IF;

  -- Zeit-Eintrag erstellen (ON CONFLICT: update hours)
  INSERT INTO time_entries (project_id, team_member_id, date, hours, activity_type, trade, notes)
  VALUES (
    p_project_id,
    p_team_member_id,
    v_attendance.check_in::DATE,
    v_duration_hours,
    'work',
    NULL,
    'Auto-erfasst via QR Check-in/Check-out'
  )
  ON CONFLICT (project_id, team_member_id, date, activity_type)
  DO UPDATE SET
    hours = time_entries.hours + v_duration_hours,
    notes = COALESCE(time_entries.notes, '') || ' + ' || v_duration_hours || 'h via QR',
    updated_at = NOW()
  RETURNING id INTO v_time_entry_id;

  -- Activity loggen
  INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_project_id,
    'attendance',
    v_member.name || ' ausgecheckt – ' || v_duration_hours || 'h erfasst',
    'Check-out via QR-Code. Arbeitszeit: ' || v_duration_hours || ' Stunden.',
    json_build_object(
      'team_member_id', p_team_member_id,
      'attendance_id', v_attendance.id,
      'time_entry_id', v_time_entry_id,
      'hours', v_duration_hours
    )::JSONB,
    'system'
  );

  RETURN json_build_object(
    'success', true,
    'attendance_id', v_attendance.id,
    'time_entry_id', v_time_entry_id,
    'worker_name', v_member.name,
    'project_name', v_project.name,
    'check_in_time', v_attendance.check_in,
    'check_out_time', NOW(),
    'hours_worked', v_duration_hours,
    'message', v_member.name || ' ausgecheckt – ' || v_duration_hours || 'h erfasst'
  );
END;
$$;


ALTER FUNCTION "public"."check_out_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_out_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") IS 'QR-Check-out: Berechnet Stunden (0.5h-gerundet), erstellt time_entry + Activity.';



CREATE OR REPLACE FUNCTION "public"."check_overdue_invoices"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_escalated INT := 0;
  v_reminded INT := 0;
  v_invoice RECORD;
  v_days_overdue INT;
  v_escalation_level TEXT;
BEGIN
  FOR v_invoice IN
    SELECT
      pi.id,
      pi.invoice_number,
      pi.total_gross,
      pi.due_date,
      pi.project_id,
      pi.status,
      s.name AS supplier_name,
      (CURRENT_DATE - pi.due_date) AS days_overdue
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON s.id = pi.supplier_id
    WHERE pi.status IN ('APPROVED', 'PENDING')
      AND pi.due_date < CURRENT_DATE
    ORDER BY pi.due_date ASC
  LOOP
    v_days_overdue := v_invoice.days_overdue;

    -- Eskalationsstufen
    IF v_days_overdue > 30 THEN
      v_escalation_level := 'critical';
    ELSIF v_days_overdue > 14 THEN
      v_escalation_level := 'warning';
    ELSIF v_days_overdue > 7 THEN
      v_escalation_level := 'reminder';
    ELSE
      v_escalation_level := 'info';
    END IF;

    -- Activity loggen (nur wenn Projekt zugeordnet)
    IF v_invoice.project_id IS NOT NULL AND v_days_overdue IN (7, 14, 30) THEN
      INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
      VALUES (
        v_invoice.project_id,
        'invoice',
        CASE v_escalation_level
          WHEN 'critical' THEN 'Rechnung ' || v_invoice.invoice_number || ' – 30+ Tage überfällig!'
          WHEN 'warning' THEN 'Rechnung ' || v_invoice.invoice_number || ' – 14+ Tage überfällig'
          ELSE 'Rechnung ' || v_invoice.invoice_number || ' – Zahlungserinnerung'
        END,
        v_invoice.supplier_name || ' – ' || v_invoice.total_gross || '€ seit ' || v_days_overdue || ' Tagen überfällig',
        json_build_object(
          'invoice_id', v_invoice.id,
          'days_overdue', v_days_overdue,
          'escalation_level', v_escalation_level
        )::JSONB,
        'system'
      )
      ON CONFLICT DO NOTHING;
      v_reminded := v_reminded + 1;
    END IF;

    v_escalated := v_escalated + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'overdue_count', v_escalated,
    'reminders_created', v_reminded,
    'summary', (
      SELECT json_build_object(
        'critical', COUNT(*) FILTER (WHERE (CURRENT_DATE - pi.due_date) > 30),
        'warning', COUNT(*) FILTER (WHERE (CURRENT_DATE - pi.due_date) BETWEEN 15 AND 30),
        'reminder', COUNT(*) FILTER (WHERE (CURRENT_DATE - pi.due_date) BETWEEN 8 AND 14),
        'info', COUNT(*) FILTER (WHERE (CURRENT_DATE - pi.due_date) BETWEEN 1 AND 7),
        'total_amount', COALESCE(SUM(pi.total_gross), 0)
      )
      FROM purchase_invoices pi
      WHERE pi.status IN ('APPROVED', 'PENDING')
        AND pi.due_date < CURRENT_DATE
    ),
    'message', v_escalated || ' überfällige Rechnungen geprüft, ' || v_reminded || ' Erinnerungen erstellt'
  );
END;
$$;


ALTER FUNCTION "public"."check_overdue_invoices"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_overdue_invoices"() IS 'Mahnwesen: Prüft überfällige Rechnungen, erstellt Erinnerungen bei 7/14/30 Tagen.';



CREATE OR REPLACE FUNCTION "public"."claim_next_receipt"() RETURNS TABLE("queue_id" "uuid", "drive_file_id" "text", "file_name" "text", "mime_type" "text", "attempt_number" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  claimed_id UUID;
BEGIN
  -- Atomic: SELECT + UPDATE in einer Transaktion
  -- FOR UPDATE = sperrt die Zeile
  -- SKIP LOCKED = wenn jemand anders gerade verarbeitet, überspringe
  UPDATE receipt_queue rq
  SET 
    status = 'PROCESSING',
    processing_started_at = now(),
    attempts = rq.attempts + 1
  WHERE rq.id = (
    SELECT rq2.id 
    FROM receipt_queue rq2
    WHERE rq2.status = 'PENDING'
      AND rq2.attempts < rq2.max_attempts
    ORDER BY rq2.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING rq.id INTO claimed_id;
  
  -- Return the claimed record (oder leere Zeile)
  IF claimed_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      rq.id AS queue_id,
      rq.drive_file_id,
      rq.file_name,
      rq.mime_type,
      rq.attempts AS attempt_number
    FROM receipt_queue rq
    WHERE rq.id = claimed_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."claim_next_receipt"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."claim_next_receipt"() IS 'Atomic claim: Holt genau EINEN pending Beleg und lockt ihn';



CREATE OR REPLACE FUNCTION "public"."claim_workflow_step"("p_step_key" "text", "p_project_id" "uuid", "p_step_type" "text", "p_timeout_minutes" integer DEFAULT 5) RETURNS TABLE("claimed" boolean, "current_status" "public"."workflow_step_status", "existing_payload" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- Check if step exists
  SELECT ws.status, ws.payload, ws.started_at
  INTO v_existing
  FROM workflow_steps ws
  WHERE ws.step_key = p_step_key
  FOR UPDATE;  -- Lock the row
  
  IF NOT FOUND THEN
    -- Step doesn't exist, create and claim it
    INSERT INTO workflow_steps (step_key, project_id, step_type, status, started_at, attempt_count)
    VALUES (p_step_key, p_project_id, p_step_type, 'IN_PROGRESS', now(), 1);
    
    RETURN QUERY SELECT true, 'IN_PROGRESS'::workflow_step_status, '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Step exists, check status
  IF v_existing.status = 'DONE' THEN
    -- Already done, return payload for downstream use
    RETURN QUERY SELECT false, 'DONE'::workflow_step_status, v_existing.payload;
    RETURN;
  END IF;
  
  IF v_existing.status = 'IN_PROGRESS' THEN
    -- Check if it's stale (older than timeout)
    IF v_existing.started_at < now() - (p_timeout_minutes || ' minutes')::INTERVAL THEN
      -- Stale claim, take over
      UPDATE workflow_steps 
      SET status = 'IN_PROGRESS', 
          started_at = now(), 
          attempt_count = attempt_count + 1
      WHERE step_key = p_step_key;
      
      RETURN QUERY SELECT true, 'IN_PROGRESS'::workflow_step_status, '{}'::JSONB;
      RETURN;
    ELSE
      -- Fresh claim by another process, back off
      RETURN QUERY SELECT false, 'IN_PROGRESS'::workflow_step_status, '{}'::JSONB;
      RETURN;
    END IF;
  END IF;
  
  IF v_existing.status = 'FAILED' THEN
    -- Retry
    UPDATE workflow_steps 
    SET status = 'IN_PROGRESS', 
        started_at = now(), 
        attempt_count = attempt_count + 1,
        error = NULL
    WHERE step_key = p_step_key;
    
    RETURN QUERY SELECT true, 'IN_PROGRESS'::workflow_step_status, '{}'::JSONB;
    RETURN;
  END IF;
  
  IF v_existing.status = 'DEAD_LETTER' THEN
    -- Don't auto-retry dead letters
    RETURN QUERY SELECT false, 'DEAD_LETTER'::workflow_step_status, v_existing.payload;
    RETURN;
  END IF;
  
  -- PENDING status - claim it
  UPDATE workflow_steps 
  SET status = 'IN_PROGRESS', 
      started_at = now(), 
      attempt_count = attempt_count + 1
  WHERE step_key = p_step_key;
  
  RETURN QUERY SELECT true, 'IN_PROGRESS'::workflow_step_status, '{}'::JSONB;
END;
$$;


ALTER FUNCTION "public"."claim_workflow_step"("p_step_key" "text", "p_project_id" "uuid", "p_step_type" "text", "p_timeout_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_abnahme"("p_project_id" "uuid", "p_signature_path" "text", "p_inspector_name" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_protocol_id UUID;
  v_protocol_number INT;
  v_pending_positions INT;
BEGIN
  -- Check if all positions are in abnahme phase
  SELECT COUNT(*) INTO v_pending_positions
  FROM offer_positions op
  JOIN offers o ON op.offer_id = o.id
  WHERE o.project_id = p_project_id
    AND op.deleted_at IS NULL
    AND op.phase != 'abnahme';

  IF v_pending_positions > 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Not all positions are at 100%',
      'pending_positions', v_pending_positions
    );
  END IF;

  -- Get next protocol number
  SELECT COALESCE(MAX(
    CASE 
      WHEN protocol_number ~ '^\d+$' THEN protocol_number::INT
      ELSE 0
    END
  ), 0) + 1
  INTO v_protocol_number
  FROM inspection_protocols
  WHERE project_id = p_project_id AND protocol_type = 'abnahme';

  -- Create Abnahme protocol
  INSERT INTO inspection_protocols (
    project_id,
    protocol_type,
    protocol_number,
    status,
    inspector_name,
    signature_path,
    completed_at
  ) VALUES (
    p_project_id,
    'abnahme',
    v_protocol_number::TEXT,
    'completed',
    p_inspector_name,
    p_signature_path,
    NOW()
  )
  RETURNING id INTO v_protocol_id;

  -- Update project status to COMPLETION (valid enum value)
  UPDATE projects
  SET status = 'COMPLETION', updated_at = NOW()
  WHERE id = p_project_id;

  RETURN json_build_object(
    'success', true,
    'protocol_id', v_protocol_id,
    'protocol_number', v_protocol_number
  );
END;
$_$;


ALTER FUNCTION "public"."complete_abnahme"("p_project_id" "uuid", "p_signature_path" "text", "p_inspector_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_erstbegehung"("p_project_id" "uuid", "p_inspector_name" "text" DEFAULT 'System'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_offer_id UUID;
  v_protocol_id UUID;
  v_positions_moved INT;
  v_protocol_number INT;
  v_event_id UUID;
  v_materials_result JSON;
  v_packing_result JSON;
  v_defaults_inserted INT;
  v_schedule_result JSON;
BEGIN
  SELECT id INTO v_offer_id FROM offers WHERE project_id = p_project_id LIMIT 1;
  IF v_offer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No offer found for project');
  END IF;

  SELECT COALESCE(MAX(
    CASE WHEN protocol_number ~ '^\d+$' THEN protocol_number::INT ELSE 0 END
  ), 0) + 1
  INTO v_protocol_number
  FROM inspection_protocols
  WHERE project_id = p_project_id AND protocol_type = 'erstbegehung';

  INSERT INTO inspection_protocols (
    project_id, protocol_type, protocol_number, status, inspector_name, completed_at
  ) VALUES (
    p_project_id, 'erstbegehung', v_protocol_number::TEXT, 'completed', p_inspector_name, NOW()
  ) RETURNING id INTO v_protocol_id;

  UPDATE offer_positions
  SET phase = 'zwischenbegehung', progress_percent = 0, updated_at = NOW()
  WHERE offer_id = v_offer_id
    AND inspection_status = 'confirmed'
    AND deleted_at IS NULL
    AND phase = 'erstbegehung';
  GET DIAGNOSTICS v_positions_moved = ROW_COUNT;

  -- Status: PLANNING (statt IN_PROGRESS)
  UPDATE projects SET status = 'PLANNING', updated_at = NOW() WHERE id = p_project_id;

  -- Default-Produkte aus position_material_requirements → project_materials
  -- (1:1 Mapping für konkrete Produkte wie REESAMIX Seidenglanz pro Tür)
  INSERT INTO project_materials (
    project_id, offer_position_id, material_type, trade,
    quantity, quantity_unit, product_id, category, status, is_auto_applied
  )
  SELECT
    p_project_id, op.id, pmr.material_type,
    COALESCE(pmr.trade, op.trade::TEXT),
    CASE pmr.quantity_mode
      WHEN 'fixed' THEN pmr.default_quantity
      ELSE pmr.default_quantity * COALESCE(m.measured_quantity, op.quantity, 1)
    END,
    pmr.quantity_unit, pmr.default_product_id,
    COALESCE(pmr.category, 'material'), 'confirmed', true
  FROM offer_positions op
  JOIN offers o ON o.id = op.offer_id
  JOIN position_material_requirements pmr ON pmr.catalog_position_v2_id = op.catalog_position_v2_id
  LEFT JOIN measurements m ON m.offer_position_id = op.id AND m.status = 'confirmed'
  WHERE o.project_id = p_project_id
    AND op.deleted_at IS NULL AND op.inspection_status = 'confirmed'
    AND pmr.default_product_id IS NOT NULL
  ON CONFLICT (project_id, offer_position_id, material_type) DO NOTHING;
  GET DIAGNOSTICS v_defaults_inserted = ROW_COUNT;

  -- NEU: Bestellmengen berechnen mit Gebinde-Umrechnung + Reserve
  -- Schreibt in project_material_needs (statt altes write_calculated_materials → position_calc_materials)
  SELECT calculate_order_quantities(p_project_id) INTO v_materials_result;

  -- Packliste generieren (Werkzeuge + Verbrauchsmaterial)
  SELECT generate_packing_list(p_project_id) INTO v_packing_result;

  -- Auto-Schedule generieren
  SELECT generate_project_schedule(p_project_id) INTO v_schedule_result;

  -- Events emittieren
  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, dedupe_key)
  VALUES (
    'MATERIALS_CALCULATED', p_project_id, 'function', 'complete_erstbegehung',
    json_build_object(
      'protocol_id', v_protocol_id, 'positions_moved', v_positions_moved,
      'materials', v_materials_result, 'defaults_auto_applied', v_defaults_inserted,
      'packing_list', v_packing_result
    )::jsonb,
    'eb_complete_' || p_project_id || '_' || v_protocol_number
  )
  ON CONFLICT (source_system, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO UPDATE SET payload = EXCLUDED.payload, created_at = NOW()
  RETURNING id INTO v_event_id;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, dedupe_key)
  VALUES (
    'PACKING_LIST_REVIEW_REQUESTED', p_project_id, 'function', 'complete_erstbegehung',
    json_build_object(
      'protocol_id', v_protocol_id, 'packing_list', v_packing_result,
      'review_scope', 'suggest_missing_consumables_and_tools'
    )::jsonb,
    'packing_review_' || p_project_id || '_' || v_protocol_number
  )
  ON CONFLICT (source_system, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, dedupe_key)
  VALUES (
    'SCHEDULE_GENERATED', p_project_id, 'function', 'complete_erstbegehung',
    json_build_object('protocol_id', v_protocol_id, 'schedule', v_schedule_result)::jsonb,
    'schedule_' || p_project_id || '_' || v_protocol_number
  )
  ON CONFLICT (source_system, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'protocol_id', v_protocol_id,
    'protocol_number', v_protocol_number,
    'positions_moved', v_positions_moved,
    'materials', v_materials_result,
    'defaults_auto_applied', v_defaults_inserted,
    'packing_list', v_packing_result,
    'schedule', v_schedule_result,
    'event_id', v_event_id
  );
END;
$_$;


ALTER FUNCTION "public"."complete_erstbegehung"("p_project_id" "uuid", "p_inspector_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_erstbegehung"("p_project_id" "uuid", "p_inspector_name" "text") IS 'Completes EB protocol: moves positions to ZB, calculates materials, 
generates packing list, and requests AI review for missing items.';



CREATE OR REPLACE FUNCTION "public"."complete_receipt_processing"("p_queue_id" "uuid", "p_invoice_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE receipt_queue
  SET 
    status = 'DONE',
    invoice_id = p_invoice_id,
    processed_at = now(),
    error_message = NULL
  WHERE id = p_queue_id;
END;
$$;


ALTER FUNCTION "public"."complete_receipt_processing"("p_queue_id" "uuid", "p_invoice_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_receipt_processing"("p_queue_id" "uuid", "p_invoice_id" "uuid") IS 'Markiert Verarbeitung als erfolgreich';



CREATE OR REPLACE FUNCTION "public"."complete_workflow_step"("p_step_key" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE workflow_steps
  SET status = 'DONE',
      payload = p_payload,
      completed_at = now(),
      error = NULL
  WHERE step_key = p_step_key;
END;
$$;


ALTER FUNCTION "public"."complete_workflow_step"("p_step_key" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_payment_match"("p_payment_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_payment invoice_payments%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM invoice_payments WHERE id = p_payment_id;
  IF v_payment IS NULL THEN RETURN FALSE; END IF;
  
  UPDATE invoice_payments SET
    status = 'CONFIRMED',
    confirmed_by = p_user_id,
    confirmed_at = now()
  WHERE id = p_payment_id;
  
  UPDATE bank_transactions SET
    is_matched = TRUE,
    matched_at = now()
  WHERE id = v_payment.bank_transaction_id;
  
  IF v_payment.sales_invoice_id IS NOT NULL THEN
    UPDATE sales_invoices SET
      paid_amount = COALESCE(paid_amount, 0) + v_payment.amount,
      status = CASE 
        WHEN COALESCE(paid_amount, 0) + v_payment.amount >= total_gross THEN 'PAID'
        ELSE status
      END,
      paid_at = CASE 
        WHEN COALESCE(paid_amount, 0) + v_payment.amount >= total_gross THEN now()
        ELSE paid_at
      END
    WHERE id = v_payment.sales_invoice_id;
  ELSE
    UPDATE purchase_invoices SET
      paid_amount = COALESCE(paid_amount, 0) + v_payment.amount,
      status = CASE 
        WHEN COALESCE(paid_amount, 0) + v_payment.amount >= total_gross THEN 'PAID'
        ELSE status
      END,
      paid_at = CASE 
        WHEN COALESCE(paid_amount, 0) + v_payment.amount >= total_gross THEN now()
        ELSE paid_at
      END
    WHERE id = v_payment.purchase_invoice_id;
  END IF;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."confirm_payment_match"("p_payment_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_proposed_phases"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INT;
BEGIN
  -- Negative phase_numbers zu positiven umwandeln + status → planned
  UPDATE schedule_phases
  SET
    status = 'planned',
    phase_number = ABS(phase_number),
    updated_at = now()
  WHERE project_id = p_project_id
    AND status = 'proposed';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Vorschläge zum Freigeben gefunden');
  END IF;

  RETURN jsonb_build_object('success', true, 'confirmed_count', v_count);
END;
$$;


ALTER FUNCTION "public"."confirm_proposed_phases"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_approval"("p_project_id" "uuid", "p_approval_type" "public"."approval_type", "p_request_summary" "text", "p_request_data" "jsonb" DEFAULT '{}'::"jsonb", "p_expires_in_hours" integer DEFAULT 24, "p_reference_id" "uuid" DEFAULT NULL::"uuid", "p_reference_table" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_approval_id UUID;
  v_existing_id UUID;
BEGIN
  -- Prüfen ob Projekt existiert
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project % not found', p_project_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Prüfen ob bereits PENDING existiert (idempotent!)
  SELECT id INTO v_existing_id
  FROM approvals
  WHERE project_id = p_project_id
    AND approval_type = p_approval_type
    AND COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::UUID) = 
        COALESCE(p_reference_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND status = 'PENDING';
  
  IF FOUND THEN
    -- Idempotent: Rückgabe der existierenden ID statt Fehler
    RAISE NOTICE 'Approval already pending: %. Returning existing.', v_existing_id;
    RETURN v_existing_id;
  END IF;
  
  INSERT INTO approvals (
    project_id, 
    approval_type, 
    request_summary, 
    request_data,
    expires_at,
    reference_id,
    reference_table,
    requested_by
  )
  VALUES (
    p_project_id,
    p_approval_type,
    p_request_summary,
    p_request_data,
    now() + (p_expires_in_hours || ' hours')::INTERVAL,
    p_reference_id,
    p_reference_table,
    'system'
  )
  RETURNING id INTO v_approval_id;
  
  -- Event loggen (mit dedupe_key!)
  PERFORM log_event(
    'APPROVAL_REQUESTED',
    p_project_id,
    'system',
    jsonb_build_object(
      'approval_id', v_approval_id, 
      'type', p_approval_type,
      'summary', p_request_summary
    ),
    NULL,  -- correlation_id
    NULL,  -- source_flow
    'approval_request_' || v_approval_id::TEXT  -- dedupe_key
  );
  
  RETURN v_approval_id;
END;
$$;


ALTER FUNCTION "public"."create_approval"("p_project_id" "uuid", "p_approval_type" "public"."approval_type", "p_request_summary" "text", "p_request_data" "jsonb", "p_expires_in_hours" integer, "p_reference_id" "uuid", "p_reference_table" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_client"("p_client_type" "text" DEFAULT 'COMMERCIAL'::"text", "p_company_name" "text" DEFAULT NULL::"text", "p_salutation" "text" DEFAULT NULL::"text", "p_first_name" "text" DEFAULT NULL::"text", "p_last_name" "text" DEFAULT NULL::"text", "p_email" "text" DEFAULT NULL::"text", "p_phone" "text" DEFAULT NULL::"text", "p_mobile" "text" DEFAULT NULL::"text", "p_street" "text" DEFAULT NULL::"text", "p_zip_code" "text" DEFAULT NULL::"text", "p_city" "text" DEFAULT NULL::"text", "p_email_domain" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_client_id UUID;
  v_display_name TEXT;
BEGIN
  -- Validierung: company_name ODER last_name required
  IF p_company_name IS NULL AND p_last_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Firmenname oder Nachname erforderlich'
    );
  END IF;

  -- Display Name für Event
  v_display_name := COALESCE(p_company_name, TRIM(COALESCE(p_first_name, '') || ' ' || COALESCE(p_last_name, '')));

  -- Insert client
  INSERT INTO clients (
    client_type,
    company_name,
    salutation,
    first_name,
    last_name,
    email,
    phone,
    mobile,
    street,
    zip_code,
    city,
    email_domain,
    notes
  ) VALUES (
    p_client_type,
    p_company_name,
    p_salutation,
    p_first_name,
    COALESCE(p_last_name, p_company_name), -- last_name ist NOT NULL
    p_email,
    p_phone,
    p_mobile,
    p_street,
    p_zip_code,
    p_city,
    p_email_domain,
    p_notes
  )
  RETURNING id INTO v_client_id;

  -- Fire EVENT
  INSERT INTO events (event_type, payload, source)
  VALUES (
    'CLIENT_CREATED',
    jsonb_build_object(
      'client_id', v_client_id,
      'display_name', v_display_name,
      'company_name', p_company_name,
      'client_type', p_client_type,
      'email', p_email
    ),
    'RPC:create_client'
  );

  RETURN json_build_object(
    'success', true,
    'client_id', v_client_id,
    'display_name', v_display_name
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;


ALTER FUNCTION "public"."create_client"("p_client_type" "text", "p_company_name" "text", "p_salutation" "text", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_mobile" "text", "p_street" "text", "p_zip_code" "text", "p_city" "text", "p_email_domain" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_project_folders"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO project_folders (project_id, name, sort_order) VALUES
    (NEW.id, '01_Auftrag', 1),
    (NEW.id, '02_Angebot', 2),
    (NEW.id, '03_Aufmass', 3),
    (NEW.id, '04_Rechnung', 4),
    (NEW.id, '05_Bauakte', 5),
    (NEW.id, '06_Protokolle', 6),
    (NEW.id, '07_Fotos', 7),
    (NEW.id, '08_Kommunikation', 8),
    (NEW.id, '09_Sonstiges', 9);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_project_folders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_defect"("p_project_id" "uuid", "p_title" "text", "p_description" "text" DEFAULT NULL::"text", "p_severity" "text" DEFAULT 'medium'::"text", "p_position_id" "uuid" DEFAULT NULL::"uuid", "p_section_id" "uuid" DEFAULT NULL::"uuid", "p_assigned_to" "uuid" DEFAULT NULL::"uuid", "p_deadline" "date" DEFAULT NULL::"date", "p_notes" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Projekt nicht gefunden: %', p_project_id;
  END IF;

  INSERT INTO defects (
    project_id, position_id, section_id, title, description,
    severity, assigned_to, deadline, notes
  ) VALUES (
    p_project_id, p_position_id, p_section_id, p_title, p_description,
    p_severity::defect_severity, p_assigned_to, p_deadline, p_notes
  )
  RETURNING json_build_object(
    'id', id, 'title', title, 'severity', severity, 'status', status,
    'assigned_to', assigned_to, 'deadline', deadline, 'created_at', created_at
  ) INTO v_result;

  INSERT INTO events (event_type, payload)
  VALUES ('DEFECT_CREATED', json_build_object('project_id', p_project_id, 'defect', v_result));

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_defect"("p_project_id" "uuid", "p_title" "text", "p_description" "text", "p_severity" "text", "p_position_id" "uuid", "p_section_id" "uuid", "p_assigned_to" "uuid", "p_deadline" "date", "p_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_defect"("p_project_id" "uuid", "p_title" "text", "p_description" "text", "p_severity" "text", "p_position_id" "uuid", "p_section_id" "uuid", "p_assigned_to" "uuid", "p_deadline" "date", "p_notes" "text") IS 'Erstellt einen neuen Mangel. Fires DEFECT_CREATED event.';



CREATE OR REPLACE FUNCTION "public"."create_duplicate_check_approval"("p_new_project_id" "uuid", "p_matched_project_id" "uuid", "p_new_address" "jsonb", "p_match_confidence" numeric, "p_catalog_type" "text", "p_pdf_storage_path" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_matched RECORD;
  v_approval_id UUID;
  v_idem_key TEXT;
BEGIN
  v_idem_key := 'dupcheck_' || p_new_project_id || '_' || p_matched_project_id;

  SELECT id INTO v_approval_id
  FROM approvals
  WHERE approval_type = 'DUPLICATE_CHECK'
    AND project_id = p_new_project_id
    AND status = 'PENDING'
    AND (request_data->>'matched_project_id')::uuid = p_matched_project_id;

  IF v_approval_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true, 'approval_id', v_approval_id,
      'message', 'DUPLICATE_CHECK Approval existiert bereits', 'idempotent_skip', true
    );
  END IF;

  SELECT project_number, object_street, object_city, object_floor
  INTO v_matched FROM projects WHERE id = p_matched_project_id;

  IF v_matched.project_number IS NULL THEN
    RETURN jsonb_build_object('success', false,
      'message', 'Matched Projekt nicht gefunden: ' || p_matched_project_id);
  END IF;

  INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
  VALUES (
    p_new_project_id, 'DUPLICATE_CHECK', 'PENDING', 'system_intake',
    'Moeglisches Duplikat erkannt: ' || v_matched.project_number
      || ' (' || v_matched.object_street || ', ' || v_matched.object_city || ')'
      || ' — Konfidenz: ' || round(p_match_confidence * 100) || '%',
    jsonb_build_object(
      'new_address', p_new_address,
      'matched_project_id', p_matched_project_id,
      'matched_project_number', v_matched.project_number,
      'matched_address', jsonb_build_object('street', v_matched.object_street, 'city', v_matched.object_city, 'floor', v_matched.object_floor),
      'match_confidence', p_match_confidence,
      'catalog_type', p_catalog_type,
      'pdf_storage_path', p_pdf_storage_path
    )
  )
  RETURNING id INTO v_approval_id;

  INSERT INTO events (project_id, event_type, payload, source_system, source_flow, dedupe_key)
  VALUES (
    p_new_project_id, 'DUPLICATE_CHECK_REQUESTED',
    jsonb_build_object('approval_id', v_approval_id, 'matched_project_id', p_matched_project_id,
      'matched_project_number', v_matched.project_number, 'confidence', p_match_confidence),
    'supabase_fn', 'fn_create_duplicate_check_approval', v_idem_key
  );

  RETURN jsonb_build_object(
    'success', true, 'approval_id', v_approval_id,
    'message', 'DUPLICATE_CHECK Approval erstellt fuer ' || v_matched.project_number
  );
END;
$$;


ALTER FUNCTION "public"."create_duplicate_check_approval"("p_new_project_id" "uuid", "p_matched_project_id" "uuid", "p_new_address" "jsonb", "p_match_confidence" numeric, "p_catalog_type" "text", "p_pdf_storage_path" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_duplicate_check_approval"("p_new_project_id" "uuid", "p_matched_project_id" "uuid", "p_new_address" "jsonb", "p_match_confidence" numeric, "p_catalog_type" "text", "p_pdf_storage_path" "text") IS 'Erstellt DUPLICATE_CHECK Approval im Freigabecenter bei unsicherem Adress-Match. Idempotent.';



CREATE OR REPLACE FUNCTION "public"."create_inspection_protocol"("p_project_id" "uuid", "p_protocol_type" "text", "p_inspector_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_protocol_id UUID;
    v_protocol_number TEXT;
    v_prefix TEXT;
    v_count INT;
BEGIN
    -- Generate protocol number
    v_prefix := CASE p_protocol_type
        WHEN 'erstbegehung' THEN 'EB'
        WHEN 'zwischenbegehung' THEN 'ZB'
        WHEN 'abnahme' THEN 'AB'
    END;
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM inspection_protocols
    WHERE project_id = p_project_id AND protocol_type = p_protocol_type;
    
    v_protocol_number := v_prefix || '-' || LPAD(v_count::TEXT, 3, '0');
    
    -- Create protocol
    INSERT INTO inspection_protocols (project_id, protocol_type, protocol_number, inspector_name)
    VALUES (p_project_id, p_protocol_type, v_protocol_number, p_inspector_name)
    RETURNING id INTO v_protocol_id;
    
    -- FIX: Create items via offers JOIN (offer_positions hat KEIN project_id)
    INSERT INTO inspection_protocol_items (protocol_id, offer_position_id, sort_order, status)
    SELECT 
        v_protocol_id,
        op.id,
        COALESCE(op.sort_order, op.position_number),
        'offen'
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    WHERE o.project_id = p_project_id
      AND op.deleted_at IS NULL  -- Gelöschte Positionen ignorieren
    ORDER BY COALESCE(op.sort_order, op.position_number);
    
    RETURN v_protocol_id;
END;
$$;


ALTER FUNCTION "public"."create_inspection_protocol"("p_project_id" "uuid", "p_protocol_type" "text", "p_inspector_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_inspection_protocol"("p_project_id" "uuid", "p_protocol_type" "text", "p_inspector_name" "text") IS 'Erstellt Protokoll mit Items für alle aktiven Angebotspositionen. Fix: JOIN über offers statt nicht-existenter offer_positions.project_id';



CREATE OR REPLACE FUNCTION "public"."create_invoice_from_transaction"("p_transaction_id" "uuid", "p_category" "text" DEFAULT 'Sonstiges'::"text", "p_description" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_tx RECORD; v_invoice_id UUID; v_supplier_id UUID; v_code TEXT;
BEGIN
  SELECT * INTO v_tx FROM bank_transactions WHERE id = p_transaction_id;
  IF NOT FOUND OR v_tx.is_matched THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid or already matched'); END IF;
  
  -- 1. Find or create supplier
  SELECT id INTO v_supplier_id FROM suppliers WHERE name = v_tx.counterpart_name LIMIT 1;
  IF v_supplier_id IS NULL THEN 
    -- Generate a simple code (4 letters + random)
    v_code := UPPER(LEFT(REGEXP_REPLACE(v_tx.counterpart_name, '[^a-zA-Z]', '', 'g'), 4)) || floor(random()*99)::text;
    INSERT INTO suppliers (name, supplier_code) VALUES (v_tx.counterpart_name, v_code) RETURNING id INTO v_supplier_id; 
  END IF;
  
  -- 2. Create invoice (Status PAID since it's already reconciled)
  INSERT INTO purchase_invoices (invoice_number, invoice_date, due_date, supplier_id, total_gross, status, paid_at, paid_amount)
  VALUES ('AUTO-' || to_char(NOW(), 'YYMMDDHHMI'), v_tx.booking_date, v_tx.booking_date, v_supplier_id, ABS(v_tx.amount), 'PAID', v_tx.booking_date, ABS(v_tx.amount))
  RETURNING id INTO v_invoice_id;
  
  -- 3. Link payment
  INSERT INTO invoice_payments (bank_transaction_id, purchase_invoice_id, amount, status, match_confidence)
  VALUES (p_transaction_id, v_invoice_id, ABS(v_tx.amount), 'CONFIRMED', 100);
  
  -- 4. Mark transaction as matched
  UPDATE bank_transactions SET is_matched = TRUE, matched_at = NOW() WHERE id = p_transaction_id;
  
  RETURN jsonb_build_object('success', true, 'invoice_id', v_invoice_id);
END; $$;


ALTER FUNCTION "public"."create_invoice_from_transaction"("p_transaction_id" "uuid", "p_category" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_position"("p_offer_id" "uuid", "p_section_id" "uuid" DEFAULT NULL::"uuid", "p_title" "text" DEFAULT 'Neue Position'::"text", "p_description" "text" DEFAULT NULL::"text", "p_unit" "text" DEFAULT 'Stk'::"text", "p_unit_price" numeric DEFAULT 0, "p_quantity" numeric DEFAULT 1, "p_trade" "text" DEFAULT NULL::"text", "p_is_optional" boolean DEFAULT false, "p_internal_note" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
  v_project_id UUID;
  v_total NUMERIC;
  v_next_pos_number INTEGER;
BEGIN
  SELECT o.project_id INTO v_project_id
  FROM offers o WHERE o.id = p_offer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Angebot nicht gefunden: %', p_offer_id;
  END IF;
  v_total := COALESCE(p_unit_price, 0) * COALESCE(p_quantity, 1);
  SELECT COALESCE(MAX(position_number), 0) + 1 INTO v_next_pos_number
  FROM offer_positions WHERE offer_id = p_offer_id AND deleted_at IS NULL;
  INSERT INTO offer_positions (
    offer_id, section_id, position_number, title, description,
    unit, unit_price, quantity, total_price, trade,
    is_optional, internal_note, phase, inspection_status
  ) VALUES (
    p_offer_id, p_section_id, v_next_pos_number, p_title, p_description,
    p_unit, p_unit_price, p_quantity, v_total, p_trade,
    p_is_optional, p_internal_note, 'erstbegehung', 'pending'
  )
  RETURNING json_build_object(
    'id', id, 'position_number', position_number, 'title', title,
    'unit', unit, 'unit_price', unit_price, 'quantity', quantity,
    'total_price', total_price, 'trade', trade, 'section_id', section_id,
    'created_at', created_at
  ) INTO v_result;
  INSERT INTO events (event_type, payload)
  VALUES ('POSITION_CREATED', json_build_object(
    'offer_id', p_offer_id, 'section_id', p_section_id,
    'project_id', v_project_id, 'position', v_result
  ));
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_position"("p_offer_id" "uuid", "p_section_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_internal_note" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_position"("p_offer_id" "uuid", "p_section_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_internal_note" "text") IS 'Creates a new offer position with auto total_price and position_number.';



CREATE OR REPLACE FUNCTION "public"."create_project"("p_name" "text", "p_client_id" "uuid" DEFAULT NULL::"uuid", "p_status" "text" DEFAULT 'DRAFT'::"text", "p_source" "text" DEFAULT 'MANUAL'::"text", "p_object_street" "text" DEFAULT NULL::"text", "p_object_zip" "text" DEFAULT NULL::"text", "p_object_city" "text" DEFAULT NULL::"text", "p_object_floor" "text" DEFAULT NULL::"text", "p_object_type" "text" DEFAULT NULL::"text", "p_object_size_sqm" numeric DEFAULT NULL::numeric, "p_planned_start" "date" DEFAULT NULL::"date", "p_planned_end" "date" DEFAULT NULL::"date", "p_assigned_team" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text", "p_project_type" "text" DEFAULT 'CONFIRMED_ORDER'::"text", "p_bid_deadline" "date" DEFAULT NULL::"date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_project_id UUID;
  v_project_number TEXT;
  v_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  v_seq INT;
BEGIN
  SELECT COALESCE(MAX(
    CASE
      WHEN project_number ~ ('^BL-' || v_year || '-[0-9]{3}$')
      THEN SUBSTRING(project_number FROM 9)::INT
      ELSE 0
    END
  ), 0) + 1
  INTO v_seq
  FROM projects
  WHERE project_number LIKE 'BL-' || v_year || '-%';

  v_project_number := 'BL-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');

  INSERT INTO projects (
    project_number, name, client_id, status,
    object_street, object_zip, object_city, object_floor,
    object_type, object_size_sqm, planned_start, planned_end,
    assigned_team, notes, project_type, bid_deadline
  ) VALUES (
    v_project_number, p_name, p_client_id, p_status::project_status,
    p_object_street, p_object_zip, p_object_city, p_object_floor,
    p_object_type, p_object_size_sqm, p_planned_start, p_planned_end,
    p_assigned_team, p_notes, p_project_type, p_bid_deadline
  )
  RETURNING id INTO v_project_id;

  INSERT INTO events (event_type, payload, source)
  VALUES (
    'PROJECT_CREATED',
    jsonb_build_object(
      'project_id', v_project_id,
      'project_number', v_project_number,
      'name', p_name,
      'client_id', p_client_id,
      'status', p_status,
      'source', p_source,
      'project_type', p_project_type,
      'bid_deadline', p_bid_deadline
    ),
    'RPC:create_project'
  );

  RETURN json_build_object(
    'success', true,
    'project_id', v_project_id,
    'project_number', v_project_number,
    'project_type', p_project_type
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$_$;


ALTER FUNCTION "public"."create_project"("p_name" "text", "p_client_id" "uuid", "p_status" "text", "p_source" "text", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_assigned_team" "text", "p_notes" "text", "p_project_type" "text", "p_bid_deadline" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_project"("p_name" "text", "p_client_id" "uuid", "p_status" "text", "p_source" "text", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_assigned_team" "text", "p_notes" "text", "p_project_type" "text", "p_bid_deadline" "date") IS 'Projekt erstellen mit Projektnummer-Generierung. Unterstuetzt BID_REQUEST und CONFIRMED_ORDER.';



CREATE OR REPLACE FUNCTION "public"."create_project_folder_entries"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO project_drive_folders (project_id, template_id, folder_name)
  SELECT 
    p_project_id,
    dft.id,
    dft.folder_name
  FROM drive_folder_templates dft
  WHERE dft.is_active = true
  ON CONFLICT (project_id, folder_name) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."create_project_folder_entries"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchase_order"("p_project_id" "uuid", "p_supplier_id" "uuid", "p_items" "jsonb", "p_notes" "text" DEFAULT NULL::"text", "p_created_by" "text" DEFAULT 'system'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_number TEXT;
  v_order_id UUID;
  v_item JSONB;
  v_total NUMERIC(12,2) := 0;
  v_item_count INTEGER := 0;
BEGIN
  -- Bestellnummer generieren
  v_order_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('purchase_order_number_seq')::TEXT, 4, '0');

  -- Bestellung erstellen
  INSERT INTO purchase_orders (id, order_number, project_id, supplier_id, notes, created_by)
  VALUES (gen_random_uuid(), v_order_number, p_project_id, p_supplier_id, p_notes, p_created_by)
  RETURNING id INTO v_order_id;

  -- Positionen einfügen
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO purchase_order_items (
      purchase_order_id, product_id, sort_order, description, unit, quantity, unit_price, offer_position_id
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item_count + 1,
      v_item->>'description',
      COALESCE(v_item->>'unit', 'Stk'),
      COALESCE((v_item->>'quantity')::NUMERIC, 1),
      COALESCE((v_item->>'unit_price')::NUMERIC, 0),
      (v_item->>'offer_position_id')::UUID
    );
    v_total := v_total + (COALESCE((v_item->>'quantity')::NUMERIC, 1) * COALESCE((v_item->>'unit_price')::NUMERIC, 0));
    v_item_count := v_item_count + 1;
  END LOOP;

  -- Summen aktualisieren
  UPDATE purchase_orders
  SET total_net = v_total,
      total_gross = ROUND(v_total * 1.19, 2)
  WHERE id = v_order_id;

  -- Event loggen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (p_project_id, 'PURCHASE_ORDER_CREATED', 'backend',
    json_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'supplier_id', p_supplier_id,
      'item_count', v_item_count,
      'total_net', v_total
    )::JSONB
  );

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'item_count', v_item_count,
    'total_net', v_total,
    'total_gross', ROUND(v_total * 1.19, 2)
  );
END;
$$;


ALTER FUNCTION "public"."create_purchase_order"("p_project_id" "uuid", "p_supplier_id" "uuid", "p_items" "jsonb", "p_notes" "text", "p_created_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_purchase_order"("p_project_id" "uuid", "p_supplier_id" "uuid", "p_items" "jsonb", "p_notes" "text", "p_created_by" "text") IS 'Bestellung aus Vorschlag erstellen mit Positionen und Event-Logging.';



CREATE OR REPLACE FUNCTION "public"."create_saga_order"("_external_ref" "text", "_tenant_name" "text", "_address" "text", "_pdf_url" "text", "_items" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_client_id          uuid;
    v_catalog_version_id uuid := '925ae844-bef4-4213-b0a4-d4598dee2dfd'; -- WABS 2024-09
    v_order_id           uuid;
    v_item               jsonb;
    v_code               text;
    v_qty                numeric;
    v_pos_id             uuid;
    v_price              numeric;
BEGIN
    -- SAGA-Client holen
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE code = 'SAGA'
    LIMIT 1;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client SAGA not found';
    END IF;

    -- Auftrag anlegen
    INSERT INTO public.saga_orders (
        client_id,
        catalog_version_id,
        external_ref,
        tenant_name,
        address,
        pdf_url
    )
    VALUES (
        v_client_id,
        v_catalog_version_id,
        _external_ref,
        _tenant_name,
        _address,
        _pdf_url
    )
    RETURNING id INTO v_order_id;

    -- JSON-Items durchgehen
    FOR v_item IN
        SELECT * FROM jsonb_array_elements(_items)
    LOOP
        v_code := (v_item ->> 'catalog_code');
        v_qty  := COALESCE((v_item ->> 'quantity')::numeric, 1);

        -- passende Position + Preis holen
        SELECT
            p.id,
            pr.gu_price_eur
        INTO
            v_pos_id,
            v_price
        FROM public.catalog_positions p
        LEFT JOIN public.catalog_position_prices pr
          ON pr.position_id = p.id
        WHERE p.catalog_version_id = v_catalog_version_id
          AND p.catalog_code = v_code
        LIMIT 1;

        IF v_pos_id IS NULL THEN
            RAISE NOTICE 'Katalogposition % nicht gefunden – wird übersprungen', v_code;
            CONTINUE;
        END IF;

        INSERT INTO public.saga_order_positions (
            order_id,
            catalog_version_id,
            catalog_code,
            position_id,
            quantity,
            gu_price_eur,
            total_gu_eur
        )
        VALUES (
            v_order_id,
            v_catalog_version_id,
            v_code,
            v_pos_id,
            v_qty,
            v_price,
            CASE WHEN v_price IS NULL THEN NULL ELSE v_price * v_qty END
        );
    END LOOP;

    RETURN v_order_id;
END;
$$;


ALTER FUNCTION "public"."create_saga_order"("_external_ref" "text", "_tenant_name" "text", "_address" "text", "_pdf_url" "text", "_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_section"("p_offer_id" "uuid", "p_title" "text" DEFAULT 'Neuer Bereich'::"text", "p_trade" "text" DEFAULT NULL::"text", "p_section_number" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
  v_section_number INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM offers WHERE id = p_offer_id) THEN
    RAISE EXCEPTION 'Angebot nicht gefunden: %', p_offer_id;
  END IF;

  IF p_section_number IS NULL THEN
    SELECT COALESCE(MAX(section_number), 0) + 1 INTO v_section_number
    FROM offer_sections WHERE offer_id = p_offer_id;
  ELSE
    v_section_number := p_section_number;
  END IF;

  INSERT INTO offer_sections (offer_id, title, trade, section_number)
  VALUES (p_offer_id, p_title, p_trade, v_section_number)
  RETURNING json_build_object(
    'id', id, 'offer_id', offer_id, 'title', title,
    'trade', trade, 'section_number', section_number
  ) INTO v_result;

  INSERT INTO events (event_type, payload)
  VALUES ('SECTION_CREATED', json_build_object('offer_id', p_offer_id, 'section', v_result));

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_section"("p_offer_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category" "text" DEFAULT NULL::"text", "p_feedback_reason" "text" DEFAULT NULL::"text", "p_feedback_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_project_id UUID;
  v_approval_type approval_type;
BEGIN
  -- Update Approval
  UPDATE approvals
  SET 
    status = p_status,
    decided_at = now(),
    decided_by = p_decided_by,
    decision_channel = p_channel,
    feedback_category = p_feedback_category,
    feedback_reason = p_feedback_reason,
    feedback_data = p_feedback_data
  WHERE id = p_approval_id
  RETURNING project_id, approval_type INTO v_project_id, v_approval_type;
  
  -- Event loggen
  PERFORM log_event(
    'APPROVAL_DECIDED',
    v_project_id,
    'user',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'type', v_approval_type,
      'status', p_status,
      'category', p_feedback_category,
      'channel', p_channel
    )
  );
END;
$$;


ALTER FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category" "text", "p_feedback_reason" "text", "p_feedback_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category_id" "uuid" DEFAULT NULL::"uuid", "p_feedback_reason" "text" DEFAULT NULL::"text", "p_feedback_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_project_id UUID;
  v_approval_type approval_type;
  v_current_status approval_status;
  v_rows_affected INT;
BEGIN
  -- Prüfen ob Approval existiert und noch PENDING ist
  SELECT project_id, approval_type, status
  INTO v_project_id, v_approval_type, v_current_status
  FROM approvals
  WHERE id = p_approval_id;
  
  -- Approval nicht gefunden
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval % not found', p_approval_id
      USING ERRCODE = 'P0002';  -- no_data_found
  END IF;
  
  -- Approval nicht mehr PENDING
  IF v_current_status != 'PENDING' THEN
    RAISE EXCEPTION 'Approval % is not PENDING (current status: %)', p_approval_id, v_current_status
      USING ERRCODE = 'P0003';  -- invalid_state
  END IF;
  
  -- Status muss APPROVED oder REJECTED sein
  IF p_status NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Invalid decision status: %. Must be APPROVED or REJECTED', p_status
      USING ERRCODE = 'P0004';  -- invalid_parameter
  END IF;
  
  -- Feedback-Kategorie Pflicht
  IF p_feedback_category_id IS NULL THEN
    RAISE EXCEPTION 'feedback_category_id is required for decision'
      USING ERRCODE = 'P0005';  -- missing_parameter
  END IF;
  
  -- Update Approval
  UPDATE approvals
  SET 
    status = p_status,
    decided_at = now(),
    decided_by = p_decided_by,
    decision_channel = p_channel,
    feedback_category_id = p_feedback_category_id,
    feedback_reason = p_feedback_reason,
    feedback_data = p_feedback_data
  WHERE id = p_approval_id
    AND status = 'PENDING';  -- Extra-Sicherheit gegen Race Condition
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Failed to update approval % (race condition or already decided)', p_approval_id
      USING ERRCODE = 'P0006';  -- update_failed
  END IF;
  
  -- Event loggen (mit dedupe_key!)
  PERFORM log_event(
    'APPROVAL_DECIDED',
    v_project_id,
    'user',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'type', v_approval_type,
      'status', p_status,
      'category_id', p_feedback_category_id,
      'channel', p_channel
    ),
    NULL,  -- correlation_id
    NULL,  -- source_flow
    'approval_decision_' || p_approval_id::TEXT  -- dedupe_key
  );
  
  RETURN p_approval_id;
END;
$$;


ALTER FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category_id" "uuid", "p_feedback_reason" "text", "p_feedback_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_position"("p_position_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON; v_offer_id UUID; v_project_id UUID; v_section_id UUID;
BEGIN
  SELECT op.offer_id, op.section_id, o.project_id
  INTO v_offer_id, v_section_id, v_project_id
  FROM offer_positions op JOIN offers o ON o.id = op.offer_id
  WHERE op.id = p_position_id AND op.deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position nicht gefunden oder bereits geloescht: %', p_position_id;
  END IF;
  UPDATE offer_positions SET deleted_at = now(), updated_at = now()
  WHERE id = p_position_id
  RETURNING json_build_object(
    'id', id, 'position_number', position_number,
    'title', title, 'deleted_at', deleted_at
  ) INTO v_result;
  INSERT INTO events (event_type, payload)
  VALUES ('POSITION_DELETED', json_build_object(
    'position_id', p_position_id, 'section_id', v_section_id,
    'offer_id', v_offer_id, 'project_id', v_project_id,
    'position', v_result
  ));
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."delete_position"("p_position_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_position"("p_position_id" "uuid") IS 'Soft-deletes an offer position. Fires POSITION_DELETED event.';



CREATE OR REPLACE FUNCTION "public"."delete_project_cascade"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_offer_ids uuid[];
  v_section_ids uuid[];
  v_position_ids uuid[];
  v_co_ids uuid[];
  v_si_ids uuid[];
BEGIN
  -- === 1. CHANGE ORDERS zuerst entkoppeln (haben FK auf offers UND offer_sections) ===
  SELECT COALESCE(array_agg(id), '{}') INTO v_co_ids
    FROM public.change_orders WHERE project_id = p_project_id;

  IF array_length(v_co_ids, 1) > 0 THEN
    UPDATE public.offer_positions SET change_order_item_id = NULL
      WHERE change_order_item_id IN (SELECT id FROM public.change_order_items WHERE change_order_id = ANY(v_co_ids));
    DELETE FROM public.change_order_items WHERE change_order_id = ANY(v_co_ids);
    DELETE FROM public.change_order_evidence WHERE change_order_id = ANY(v_co_ids);
    DELETE FROM public.change_orders WHERE id = ANY(v_co_ids);
  END IF;

  -- === 2. OFFERS CHAIN (deepest first) ===
  SELECT COALESCE(array_agg(id), '{}') INTO v_offer_ids
    FROM public.offers WHERE project_id = p_project_id;

  IF array_length(v_offer_ids, 1) > 0 THEN
    SELECT COALESCE(array_agg(id), '{}') INTO v_section_ids
      FROM public.offer_sections WHERE offer_id = ANY(v_offer_ids);

    IF array_length(v_section_ids, 1) > 0 THEN
      SELECT COALESCE(array_agg(id), '{}') INTO v_position_ids
        FROM public.offer_positions WHERE section_id = ANY(v_section_ids);

      IF array_length(v_position_ids, 1) > 0 THEN
        DELETE FROM public.position_calc_labor WHERE position_id = ANY(v_position_ids);
        DELETE FROM public.position_calc_materials WHERE position_id = ANY(v_position_ids);
        DELETE FROM public.position_calc_subcontractor WHERE position_id = ANY(v_position_ids);
        DELETE FROM public.project_materials WHERE offer_position_id = ANY(v_position_ids);
        DELETE FROM public.project_packing_list WHERE source_position_id = ANY(v_position_ids);
        UPDATE public.purchase_order_items SET offer_position_id = NULL WHERE offer_position_id = ANY(v_position_ids);
        UPDATE public.sales_invoice_items SET offer_position_id = NULL WHERE offer_position_id = ANY(v_position_ids);
        DELETE FROM public.offer_positions WHERE id = ANY(v_position_ids);
      END IF;

      DELETE FROM public.offer_sections WHERE id = ANY(v_section_ids);
    END IF;

    DELETE FROM public.offers WHERE id = ANY(v_offer_ids);
  END IF;

  -- === 3. SALES INVOICES CHAIN ===
  SELECT COALESCE(array_agg(id), '{}') INTO v_si_ids
    FROM public.sales_invoices WHERE project_id = p_project_id;

  IF array_length(v_si_ids, 1) > 0 THEN
    DELETE FROM public.sales_invoice_items WHERE sales_invoice_id = ANY(v_si_ids);
    DELETE FROM public.sales_invoices WHERE id = ANY(v_si_ids);
  END IF;

  -- === 4. OUTBOUND EMAILS ===
  DELETE FROM public.outbound_emails WHERE project_id = p_project_id;

  -- === 5. ENTKOPPELN (SET NULL) ===
  UPDATE public.purchase_invoices SET project_id = NULL WHERE project_id = p_project_id;
  UPDATE public.purchase_invoice_items SET project_id = NULL WHERE project_id = p_project_id;
  UPDATE public.purchase_orders SET project_id = NULL WHERE project_id = p_project_id;
  UPDATE public.events SET project_id = NULL WHERE project_id = p_project_id;
  UPDATE public.leads SET project_id = NULL WHERE project_id = p_project_id;

  -- === 6. PROJEKT LOESCHEN ===
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$;


ALTER FUNCTION "public"."delete_project_cascade"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_section"("p_section_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_section RECORD;
  v_positions_count INT;
BEGIN
  SELECT id, offer_id, title, section_number INTO v_section
  FROM offer_sections WHERE id = p_section_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bereich nicht gefunden: %', p_section_id;
  END IF;

  SELECT COUNT(*) INTO v_positions_count
  FROM offer_positions WHERE section_id = p_section_id AND deleted_at IS NULL;

  IF v_positions_count > 0 THEN
    UPDATE offer_positions SET section_id = NULL
    WHERE section_id = p_section_id AND deleted_at IS NULL;
  END IF;

  DELETE FROM offer_sections WHERE id = p_section_id;

  INSERT INTO events (event_type, payload)
  VALUES ('SECTION_DELETED', json_build_object(
    'offer_id', v_section.offer_id, 'section_id', p_section_id,
    'title', v_section.title, 'positions_unassigned', v_positions_count
  ));

  RETURN json_build_object(
    'success', true, 'section_id', p_section_id,
    'positions_unassigned', v_positions_count
  );
END;
$$;


ALTER FUNCTION "public"."delete_section"("p_section_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."discard_material_plan"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM project_material_needs
  WHERE project_id = p_project_id
    AND source = 'auto_plan'
    AND status = 'planned'
  RETURNING 1 INTO v_deleted;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'deleted', v_deleted
  );
END;
$$;


ALTER FUNCTION "public"."discard_material_plan"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."discard_proposed_phases"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM schedule_phases
  WHERE project_id = p_project_id
    AND status = 'proposed';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'discarded_count', v_count);
END;
$$;


ALTER FUNCTION "public"."discard_proposed_phases"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."escalate_overdue_invoices"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invoice RECORD;
  v_days_overdue INTEGER;
  v_new_level INTEGER;
  v_escalated INTEGER := 0;
  v_notifications JSONB := '[]'::JSONB;
  v_notification JSONB;
BEGIN
  FOR v_invoice IN
    SELECT si.*, c.company_name, c.email AS client_email, c.phone AS client_phone,
           p.name AS project_name, p.project_number
    FROM sales_invoices si
    JOIN clients c ON c.id = si.client_id
    JOIN projects p ON p.id = si.project_id
    WHERE si.status IN ('SENT', 'OVERDUE')
      AND si.due_date < CURRENT_DATE
      AND si.paid_at IS NULL
    ORDER BY si.due_date ASC
  LOOP
    v_days_overdue := CURRENT_DATE - v_invoice.due_date;

    -- Mahnstufe bestimmen
    CASE
      WHEN v_days_overdue >= 30 THEN v_new_level := 3; -- 3. Mahnung / Inkasso-Warnung
      WHEN v_days_overdue >= 14 THEN v_new_level := 2; -- 2. Mahnung
      WHEN v_days_overdue >= 7  THEN v_new_level := 1; -- 1. Zahlungserinnerung
      ELSE v_new_level := 0;
    END CASE;

    -- Nur eskalieren wenn neue Stufe höher als aktuelle
    IF v_new_level > COALESCE(v_invoice.reminder_level, 0) THEN
      -- Status auf OVERDUE setzen
      UPDATE sales_invoices
      SET status = 'OVERDUE',
          reminder_level = v_new_level,
          last_reminder_at = now(),
          updated_at = now()
      WHERE id = v_invoice.id;

      -- Notification-Daten sammeln
      v_notification := jsonb_build_object(
        'invoice_id', v_invoice.id,
        'invoice_number', v_invoice.invoice_number,
        'client_name', v_invoice.company_name,
        'client_email', v_invoice.client_email,
        'client_phone', v_invoice.client_phone,
        'project_name', v_invoice.project_name,
        'total_gross', v_invoice.total_gross,
        'due_date', v_invoice.due_date,
        'days_overdue', v_days_overdue,
        'reminder_level', v_new_level,
        'reminder_text', CASE v_new_level
          WHEN 1 THEN 'Zahlungserinnerung: Rechnung ' || v_invoice.invoice_number || ' ist seit ' || v_days_overdue || ' Tagen überfällig (' || v_invoice.total_gross || '€)'
          WHEN 2 THEN '2. Mahnung: Rechnung ' || v_invoice.invoice_number || ' ist seit ' || v_days_overdue || ' Tagen überfällig (' || v_invoice.total_gross || '€). Bitte umgehend begleichen.'
          WHEN 3 THEN 'Letzte Mahnung: Rechnung ' || v_invoice.invoice_number || ' ist seit ' || v_days_overdue || ' Tagen überfällig (' || v_invoice.total_gross || '€). Inkasso wird eingeleitet.'
        END
      );
      v_notifications := v_notifications || v_notification;

      -- Event loggen
      INSERT INTO events (project_id, event_type, source_system, payload)
      VALUES (v_invoice.project_id, 'PAYMENT_REMINDER_SENT', 'backend',
        jsonb_build_object(
          'invoice_id', v_invoice.id,
          'invoice_number', v_invoice.invoice_number,
          'reminder_level', v_new_level,
          'days_overdue', v_days_overdue,
          'amount', v_invoice.total_gross
        )
      );

      v_escalated := v_escalated + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'escalated_count', v_escalated,
    'notifications', v_notifications,
    'checked_at', now()
  );
END;
$$;


ALTER FUNCTION "public"."escalate_overdue_invoices"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."escalate_overdue_invoices"() IS 'Mahnwesen: Prüft überfällige Rechnungen, eskaliert Mahnstufen (1/2/3), loggt Events für n8n-Notifications.';



CREATE OR REPLACE FUNCTION "public"."export_datev_csv"("p_from_date" "date" DEFAULT ((CURRENT_DATE - '1 mon'::interval))::"date", "p_to_date" "date" DEFAULT CURRENT_DATE, "p_type" "text" DEFAULT 'purchase'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_rows JSON;
  v_count INT;
BEGIN
  IF p_type = 'purchase' THEN
    WITH datev AS (
      SELECT
        pi.invoice_number AS "Belegnummer",
        pi.invoice_date AS "Belegdatum",
        s.name AS "Lieferant",
        pi.total_net AS "Nettobetrag",
        pi.vat_amount AS "USt-Betrag",
        pi.total_gross AS "Bruttobetrag",
        CASE pi.vat_percent
          WHEN 19.00 THEN '19%'
          WHEN 7.00 THEN '7%'
          WHEN 0.00 THEN '0%'
          ELSE pi.vat_percent || '%'
        END AS "USt-Satz",
        CASE pi.expense_category
          WHEN 'MATERIAL' THEN '4900'
          WHEN 'SUBCONTRACTOR' THEN '4100'
          WHEN 'VEHICLE_FUEL' THEN '4530'
          WHEN 'VEHICLE_REPAIR' THEN '4540'
          WHEN 'VEHICLE_RENTAL' THEN '4570'
          WHEN 'SOFTWARE' THEN '4964'
          WHEN 'OFFICE' THEN '4930'
          WHEN 'DISPOSAL' THEN '4900'
          ELSE '4900'
        END AS "DATEV-Konto",
        pi.expense_category AS "Kategorie",
        COALESCE(p.project_number, '') AS "Kostenstelle",
        COALESCE(p.name, '') AS "Projekt",
        pi.status::TEXT AS "Status",
        pi.paid_at AS "Bezahlt am"
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON s.id = pi.supplier_id
      LEFT JOIN projects p ON p.id = pi.project_id
      WHERE pi.invoice_date BETWEEN p_from_date AND p_to_date
        AND pi.status IN ('APPROVED', 'PAID')
      ORDER BY pi.invoice_date, pi.invoice_number
    )
    SELECT json_agg(row_to_json(datev)), COUNT(*)
    INTO v_rows, v_count
    FROM datev;

  ELSIF p_type = 'sales' THEN
    WITH datev AS (
      SELECT
        si.invoice_number AS "Belegnummer",
        si.invoice_date AS "Belegdatum",
        c.company_name AS "Kunde",
        COALESCE(c.last_name, '') AS "Kontakt",
        si.total_net AS "Nettobetrag",
        si.total_vat AS "USt-Betrag",
        si.total_gross AS "Bruttobetrag",
        si.vat_rate || '%' AS "USt-Satz",
        '8400' AS "DATEV-Konto",
        si.invoice_type::TEXT AS "Rechnungstyp",
        COALESCE(p.project_number, '') AS "Kostenstelle",
        COALESCE(p.name, '') AS "Projekt",
        si.status::TEXT AS "Status",
        si.paid_at AS "Bezahlt am"
      FROM sales_invoices si
      LEFT JOIN clients c ON c.id = si.client_id
      LEFT JOIN projects p ON p.id = si.project_id
      WHERE si.invoice_date BETWEEN p_from_date AND p_to_date
        AND si.status NOT IN ('DRAFT', 'CANCELLED')
      ORDER BY si.invoice_date, si.invoice_number
    )
    SELECT json_agg(row_to_json(datev)), COUNT(*)
    INTO v_rows, v_count
    FROM datev;

  ELSE
    RETURN json_build_object('success', false, 'error', 'Typ muss purchase oder sales sein');
  END IF;

  RETURN json_build_object(
    'success', true,
    'type', p_type,
    'from_date', p_from_date,
    'to_date', p_to_date,
    'count', COALESCE(v_count, 0),
    'rows', COALESCE(v_rows, '[]'::JSON)
  );
END;
$$;


ALTER FUNCTION "public"."export_datev_csv"("p_from_date" "date", "p_to_date" "date", "p_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."export_datev_csv"("p_from_date" "date", "p_to_date" "date", "p_type" "text") IS 'DATEV-Export: Eingangs- oder Ausgangsrechnungen mit DATEV-Kontonummern als JSON (Frontend konvertiert zu CSV).';



CREATE OR REPLACE FUNCTION "public"."fail_receipt_processing"("p_queue_id" "uuid", "p_error_message" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_attempts INT;
  max_att INT;
BEGIN
  SELECT attempts, max_attempts 
  INTO current_attempts, max_att
  FROM receipt_queue 
  WHERE id = p_queue_id;
  
  UPDATE receipt_queue
  SET 
    status = CASE 
      WHEN current_attempts >= max_att THEN 'ERROR'::receipt_queue_status
      ELSE 'PENDING'::receipt_queue_status  -- Retry möglich
    END,
    error_message = p_error_message,
    processing_started_at = NULL  -- Reset für Retry
  WHERE id = p_queue_id;
END;
$$;


ALTER FUNCTION "public"."fail_receipt_processing"("p_queue_id" "uuid", "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fail_receipt_processing"("p_queue_id" "uuid", "p_error_message" "text") IS 'Markiert als fehlgeschlagen, ermöglicht Retry bis max_attempts';



CREATE OR REPLACE FUNCTION "public"."fail_workflow_step"("p_step_key" "text", "p_error" "jsonb", "p_retry_delay_minutes" integer DEFAULT 2) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_attempt_count INT;
  v_max_attempts INT;
BEGIN
  SELECT attempt_count, max_attempts 
  INTO v_attempt_count, v_max_attempts
  FROM workflow_steps 
  WHERE step_key = p_step_key;
  
  IF v_attempt_count >= v_max_attempts THEN
    -- Max retries reached, move to dead letter
    UPDATE workflow_steps
    SET status = 'DEAD_LETTER',
        error = p_error,
        completed_at = now(),
        next_retry_at = NULL
    WHERE step_key = p_step_key;
  ELSE
    -- Schedule retry
    UPDATE workflow_steps
    SET status = 'FAILED',
        error = p_error,
        next_retry_at = now() + (p_retry_delay_minutes || ' minutes')::INTERVAL
    WHERE step_key = p_step_key;
  END IF;
END;
$$;


ALTER FUNCTION "public"."fail_workflow_step"("p_step_key" "text", "p_error" "jsonb", "p_retry_delay_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_matching_project"("p_street" "text", "p_city" "text", "p_client_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_exact RECORD;
  v_fuzzy RECORD;
  v_street_normalized TEXT;
  v_city_normalized TEXT;
BEGIN
  v_street_normalized := lower(trim(p_street));
  v_city_normalized := lower(trim(p_city));

  SELECT id, project_number, object_street, object_city, object_floor
  INTO v_exact
  FROM projects
  WHERE lower(trim(object_street)) = v_street_normalized
    AND lower(trim(object_city)) = v_city_normalized
    AND client_id = p_client_id
    AND status NOT IN ('CANCELLED', 'COMPLETED', 'ARCHIVED')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_exact.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'match_type', 'EXACT',
      'project_id', v_exact.id,
      'project_number', v_exact.project_number,
      'matched_street', v_exact.object_street,
      'matched_city', v_exact.object_city,
      'matched_floor', v_exact.object_floor,
      'confidence', 1.0
    );
  END IF;

  SELECT id, project_number, object_street, object_city, object_floor,
         similarity(lower(trim(object_street)), v_street_normalized) AS sim_score
  INTO v_fuzzy
  FROM projects
  WHERE lower(trim(object_city)) = v_city_normalized
    AND client_id = p_client_id
    AND status NOT IN ('CANCELLED', 'COMPLETED', 'ARCHIVED')
    AND similarity(lower(trim(object_street)), v_street_normalized) > 0.4
  ORDER BY similarity(lower(trim(object_street)), v_street_normalized) DESC
  LIMIT 1;

  IF v_fuzzy.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'match_type', 'FUZZY',
      'project_id', v_fuzzy.id,
      'project_number', v_fuzzy.project_number,
      'matched_street', v_fuzzy.object_street,
      'matched_city', v_fuzzy.object_city,
      'matched_floor', v_fuzzy.object_floor,
      'confidence', round(v_fuzzy.sim_score::numeric, 2)
    );
  END IF;

  RETURN jsonb_build_object(
    'match_type', 'NONE',
    'project_id', NULL,
    'confidence', 0
  );
END;
$$;


ALTER FUNCTION "public"."find_matching_project"("p_street" "text", "p_city" "text", "p_client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_matching_project"("p_street" "text", "p_city" "text", "p_client_id" "uuid") IS 'Sucht bestehendes Projekt anhand Strasse + Stadt + Client. Returns match_type EXACT/FUZZY/NONE mit Confidence.';



CREATE OR REPLACE FUNCTION "public"."find_or_create_client"("p_company_name" "text", "p_email_domain" "text" DEFAULT NULL::"text") RETURNS TABLE("client_id" "uuid", "client_name" "text", "match_type" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_match_type TEXT;
BEGIN
  -- Step 1: Company name match
  SELECT c.id, c.company_name, 'name_match'
  INTO v_client_id, v_client_name, v_match_type
  FROM clients c
  WHERE c.company_name IS NOT NULL 
    AND (
      LOWER(c.company_name) ILIKE '%' || LOWER(p_company_name) || '%'
      OR LOWER(p_company_name) ILIKE '%' || LOWER(c.company_name) || '%'
    )
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    RETURN QUERY SELECT v_client_id, v_client_name, v_match_type;
    RETURN;
  END IF;

  -- Step 2: Email domain match
  IF p_email_domain IS NOT NULL AND p_email_domain != '' THEN
    SELECT c.id, c.company_name, 'domain_match'
    INTO v_client_id, v_client_name, v_match_type
    FROM clients c
    WHERE c.email_domain = p_email_domain
    LIMIT 1;

    IF v_client_id IS NOT NULL THEN
      RETURN QUERY SELECT v_client_id, v_client_name, v_match_type;
      RETURN;
    END IF;
  END IF;

  -- Step 3: Create new (nur Pflichtfelder)
  INSERT INTO clients (company_name, last_name, email_domain, auto_created)
  VALUES (p_company_name, p_company_name, COALESCE(NULLIF(p_email_domain, ''), 'unknown'), true)
  RETURNING id, company_name, 'created'
  INTO v_client_id, v_client_name, v_match_type;

  RETURN QUERY SELECT v_client_id, v_client_name, v_match_type;
END;
$$;


ALTER FUNCTION "public"."find_or_create_client"("p_company_name" "text", "p_email_domain" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_or_create_supplier_article"("p_supplier_id" "uuid", "p_article_number" "text", "p_article_name" "text", "p_unit" "public"."purchase_unit" DEFAULT 'STUECK'::"public"."purchase_unit", "p_category" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_article_id UUID;
BEGIN
  -- Erst suchen
  SELECT id INTO v_article_id
  FROM supplier_articles
  WHERE supplier_id = p_supplier_id
    AND supplier_article_number = p_article_number;
  
  -- Wenn nicht gefunden, anlegen
  IF v_article_id IS NULL THEN
    INSERT INTO supplier_articles (
      supplier_id,
      supplier_article_number,
      supplier_article_name,
      purchase_unit,
      category
    ) VALUES (
      p_supplier_id,
      p_article_number,
      p_article_name,
      p_unit,
      p_category
    )
    RETURNING id INTO v_article_id;
  END IF;
  
  RETURN v_article_id;
END;
$$;


ALTER FUNCTION "public"."find_or_create_supplier_article"("p_supplier_id" "uuid", "p_article_number" "text", "p_article_name" "text", "p_unit" "public"."purchase_unit", "p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_or_create_supplier_article"("p_supplier_id" "uuid", "p_article_number" "text", "p_article_name" "text", "p_unit" "public"."purchase_unit", "p_category" "text") IS 'Sucht Artikel oder legt ihn an (für n8n PDF-Import)';



CREATE OR REPLACE FUNCTION "public"."find_payment_matches"("p_transaction_id" "uuid", "p_min_confidence" integer DEFAULT 30) RETURNS TABLE("invoice_type" "text", "invoice_id" "uuid", "invoice_number" "text", "invoice_amount" numeric, "counterpart_name" "text", "confidence" integer, "reasons" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_trans bank_transactions%ROWTYPE;
BEGIN
  SELECT * INTO v_trans FROM bank_transactions WHERE id = p_transaction_id;
  
  IF v_trans.transaction_type = 'CREDIT' THEN
    RETURN QUERY
    SELECT 
      'sales'::TEXT,
      si.id,
      si.invoice_number,
      si.total_gross,
      c.company_name,
      (calculate_match_confidence(p_transaction_id, 'sales', si.id)).confidence,
      (calculate_match_confidence(p_transaction_id, 'sales', si.id)).reasons
    FROM sales_invoices si
    LEFT JOIN clients c ON si.client_id = c.id
    WHERE si.status IN ('SENT', 'OVERDUE')
      AND (calculate_match_confidence(p_transaction_id, 'sales', si.id)).confidence >= p_min_confidence
    ORDER BY 6 DESC
    LIMIT 5;
  ELSE
    RETURN QUERY
    SELECT 
      'purchase'::TEXT,
      pi.id,
      pi.invoice_number,
      pi.total_gross,
      s.name,
      (calculate_match_confidence(p_transaction_id, 'purchase', pi.id)).confidence,
      (calculate_match_confidence(p_transaction_id, 'purchase', pi.id)).reasons
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON pi.supplier_id = s.id
    WHERE pi.status IN ('PENDING', 'APPROVED')
      AND (calculate_match_confidence(p_transaction_id, 'purchase', pi.id)).confidence >= p_min_confidence
    ORDER BY 6 DESC
    LIMIT 5;
  END IF;
END;
$$;


ALTER FUNCTION "public"."find_payment_matches"("p_transaction_id" "uuid", "p_min_confidence" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_agent_einsatzplaner"("p_run_id" "uuid", "p_input" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_step_id UUID; v_project_id UUID; v_project RECORD; v_trade_seq JSONB; v_trade JSONB;
    v_warnings TEXT[] := '{}'; v_errors TEXT[] := '{}'; v_output JSONB;
    v_assignments JSONB := '[]'::JSONB; v_unassigned TEXT[] := '{}';
    v_phases_created INT := 0; v_assigned_count INT := 0;
    v_phase_order INT; v_duration INT; v_total_minutes NUMERIC;
    v_trade_id UUID; v_trade_name TEXT;
    v_start DATE; v_end DATE; v_phase_start DATE; v_phase_end DATE;
    v_day_offset INT := 0; v_total_days INT; v_existing INT;
    v_best_member_id UUID; v_best_member_name TEXT;
    v_member_id UUID; v_member_name TEXT; v_busy_count INT; v_min_busy INT;
    v_defaults RECORD; i INT;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;
    v_step_id := fn_pipeline_step_start(p_run_id, 'einsatzplaner', 5, p_input);

    SELECT id, planned_start, planned_end, status INTO v_project FROM projects WHERE id = v_project_id;
    IF NOT FOUND THEN
        v_errors := array_append(v_errors, 'Projekt nicht gefunden');
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id, 'phases_created', 0,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'failed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    IF v_project.planned_start IS NULL OR v_project.planned_end IS NULL THEN
        v_errors := array_append(v_errors, 'Projekt hat kein Start-/Enddatum');
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id, 'phases_created', 0,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'stopped', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    SELECT COUNT(*) INTO v_existing FROM schedule_phases WHERE project_id = v_project_id AND status = 'proposed';
    IF v_existing > 0 THEN
        DELETE FROM schedule_phases WHERE project_id = v_project_id AND status = 'proposed';
        v_warnings := array_append(v_warnings, 'Bestehende Vorschläge (' || v_existing || ' Phasen) wurden ersetzt');
    END IF;

    v_start := v_project.planned_start; v_end := v_project.planned_end;
    v_total_days := GREATEST((v_end - v_start) + 1, 1);

    v_trade_seq := p_input->'trade_sequence';
    IF v_trade_seq IS NULL OR jsonb_array_length(v_trade_seq) = 0 THEN
        v_errors := array_append(v_errors, 'Keine trade_sequence im Input');
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id, 'phases_created', 0,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'failed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    FOR i IN 0..jsonb_array_length(v_trade_seq) - 1 LOOP
        v_trade := v_trade_seq->i;
        v_trade_id := (v_trade->>'trade_id')::UUID;
        v_trade_name := v_trade->>'trade';
        v_phase_order := COALESCE((v_trade->>'phase_order')::INT, 99);
        v_total_minutes := COALESCE((v_trade->>'total_minutes')::NUMERIC, 0);

        IF v_total_minutes > 0 THEN
            v_duration := GREATEST(CEIL(v_total_minutes / 480.0), 1);
        ELSE
            SELECT * INTO v_defaults FROM schedule_defaults WHERE trade_id = v_trade_id;
            IF v_defaults IS NOT NULL AND v_defaults.avg_duration_days IS NOT NULL AND v_defaults.observation_count > 0 THEN
                v_duration := CEIL(v_defaults.avg_duration_days);
            ELSE
                v_duration := GREATEST(CEIL(v_total_days::NUMERIC / GREATEST(jsonb_array_length(v_trade_seq), 3)), 3);
            END IF;
            v_warnings := array_append(v_warnings, v_trade_name || ': Keine labor_minutes — Fallback (' || v_duration || ' Tage)');
        END IF;

        v_phase_start := LEAST(v_start + v_day_offset, v_end);
        v_phase_end := LEAST(v_phase_start + v_duration - 1, v_end);
        v_day_offset := v_day_offset + v_duration;

        v_best_member_id := NULL; v_best_member_name := NULL;

        SELECT * INTO v_defaults FROM schedule_defaults WHERE trade_id = v_trade_id;
        IF v_defaults IS NOT NULL AND v_defaults.default_team_member_id IS NOT NULL THEN
            SELECT id, tm.name INTO v_member_id, v_member_name FROM team_members tm
            WHERE tm.id = v_defaults.default_team_member_id AND tm.active = true;
            IF FOUND THEN
                SELECT COUNT(*) INTO v_busy_count FROM schedule_phases sp
                WHERE sp.assigned_team_member_id = v_member_id AND sp.status != 'proposed'
                  AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;
                IF v_busy_count = 0 THEN v_best_member_id := v_member_id; v_best_member_name := v_member_name; END IF;
            END IF;
        END IF;

        IF v_best_member_id IS NULL AND v_trade_id IS NOT NULL THEN
            v_min_busy := 999999;
            FOR v_member_id, v_member_name IN
                SELECT tm.id, tm.name FROM team_members tm
                WHERE tm.active = true AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
                  AND tm.trade_id = v_trade_id ORDER BY tm.name
            LOOP
                SELECT COUNT(*) INTO v_busy_count FROM schedule_phases sp
                WHERE sp.assigned_team_member_id = v_member_id AND sp.status != 'proposed'
                  AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;
                IF v_busy_count < v_min_busy THEN v_min_busy := v_busy_count; v_best_member_id := v_member_id; v_best_member_name := v_member_name; END IF;
                EXIT WHEN v_busy_count = 0;
            END LOOP;
        END IF;

        IF v_best_member_id IS NULL THEN
            v_min_busy := 999999;
            FOR v_member_id, v_member_name IN
                SELECT tm.id, tm.name FROM team_members tm
                WHERE tm.active = true AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
                  AND tm.trade_id IS NOT NULL ORDER BY tm.name
            LOOP
                SELECT COUNT(*) INTO v_busy_count FROM schedule_phases sp
                WHERE sp.assigned_team_member_id = v_member_id AND sp.status != 'proposed'
                  AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;
                IF v_busy_count < v_min_busy THEN v_min_busy := v_busy_count; v_best_member_id := v_member_id; v_best_member_name := v_member_name; END IF;
                EXIT WHEN v_busy_count = 0;
            END LOOP;
        END IF;

        INSERT INTO schedule_phases (project_id, phase_number, name, trade, trade_id,
            start_date, end_date, assigned_team_member_id, status, progress, estimated_qty)
        VALUES (v_project_id, -v_phase_order, v_trade_name, v_trade_name, v_trade_id,
            v_phase_start, v_phase_end, v_best_member_id, 'proposed', 0, (v_trade->>'position_count')::INT)
        ON CONFLICT (project_id, phase_number) DO UPDATE SET
            name = EXCLUDED.name, trade = EXCLUDED.trade, trade_id = EXCLUDED.trade_id,
            start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
            assigned_team_member_id = EXCLUDED.assigned_team_member_id,
            status = 'proposed', estimated_qty = EXCLUDED.estimated_qty, updated_at = now();

        v_phases_created := v_phases_created + 1;
        IF v_best_member_id IS NOT NULL THEN
            v_assigned_count := v_assigned_count + 1;
            v_assignments := v_assignments || jsonb_build_object('trade', v_trade_name, 'trade_id', v_trade_id,
                'member_id', v_best_member_id, 'member_name', v_best_member_name,
                'start_date', v_phase_start, 'end_date', v_phase_end, 'duration_days', v_duration, 'total_minutes', v_total_minutes);
        ELSE v_unassigned := array_append(v_unassigned, v_trade_name); END IF;
    END LOOP;

    v_output := jsonb_build_object('success', true, 'project_id', v_project_id,
        'phases_created', v_phases_created, 'assigned_count', v_assigned_count,
        'unassigned_trades', to_jsonb(v_unassigned), 'assignments', v_assignments,
        'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;


ALTER FUNCTION "public"."fn_agent_einsatzplaner"("p_run_id" "uuid", "p_input" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_agent_einsatzplaner"("p_run_id" "uuid", "p_input" "jsonb") IS 'Staffellauf Agent #5: Phasen + Monteure zuweisen. Nutzt trade_sequence vom Plausibilitäts-Agent + labor_minutes für Dauer.';



CREATE OR REPLACE FUNCTION "public"."fn_agent_material"("p_run_id" "uuid", "p_input" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_step_id UUID; v_project_id UUID; v_warnings TEXT[] := '{}'; v_errors TEXT[] := '{}';
    v_output JSONB; v_material_result JSONB; v_existing INT; v_needs JSONB := '[]'::JSONB; v_need RECORD;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;
    v_step_id := fn_pipeline_step_start(p_run_id, 'material', 4, p_input);

    SELECT COUNT(*) INTO v_existing FROM project_material_needs
    WHERE project_id = v_project_id AND status = 'planned' AND source = 'auto_plan';
    IF v_existing > 0 THEN
        DELETE FROM project_material_needs WHERE project_id = v_project_id AND source = 'auto_plan' AND status = 'planned';
        v_warnings := array_append(v_warnings, 'Bestehende Material-Planung (' || v_existing || ' Positionen) wurde ersetzt');
    END IF;

    v_material_result := auto_plan_materials(v_project_id);

    IF NOT (v_material_result->>'success')::BOOLEAN THEN
        v_errors := array_append(v_errors, COALESCE(v_material_result->>'error', 'Material-Planung fehlgeschlagen'));
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id, 'needs_created', 0,
            'problems', '[]'::JSONB, 'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'failed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    SELECT jsonb_agg(jsonb_build_object('trade', pmn.trade, 'material_type', pmn.material_type,
        'quantity', pmn.total_quantity, 'unit', pmn.quantity_unit, 'room', pmn.room, 'problem', pmn.problem, 'needed_by', pmn.needed_by))
    INTO v_needs FROM project_material_needs pmn
    WHERE pmn.project_id = v_project_id AND pmn.source = 'auto_plan' AND pmn.status = 'planned';

    FOR v_need IN SELECT problem, COUNT(*) AS cnt FROM project_material_needs
        WHERE project_id = v_project_id AND source = 'auto_plan' AND problem IS NOT NULL GROUP BY problem
    LOOP v_warnings := array_append(v_warnings, v_need.cnt || 'x ' || v_need.problem); END LOOP;

    v_output := jsonb_build_object('success', true, 'project_id', v_project_id,
        'needs_created', COALESCE((v_material_result->>'needs_created')::INT, 0),
        'needs_without_mapping', COALESCE((v_material_result->>'needs_without_mapping')::INT, 0),
        'trades', COALESCE(v_material_result->'trades', '[]'::JSONB),
        'needs', COALESCE(v_needs, '[]'::JSONB),
        'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;


ALTER FUNCTION "public"."fn_agent_material"("p_run_id" "uuid", "p_input" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_agent_material"("p_run_id" "uuid", "p_input" "jsonb") IS 'Staffellauf Agent #4: Materialbedarf aus Positionen + Aufmaß + Katalog-Mappings berechnen';



CREATE OR REPLACE FUNCTION "public"."fn_agent_plausibility"("p_run_id" "uuid", "p_input" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_step_id UUID;
    v_project_id UUID;
    v_positions JSONB;
    v_trade_summary JSONB := '[]'::JSONB;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_output JSONB;
    v_trade RECORD;
    v_rule RECORD;
    v_dep_in_project BOOLEAN;
    v_total_positions INT;
    v_positions_without_trade INT;
    v_positions_without_labor INT;
    v_total_project_minutes NUMERIC := 0;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;

    -- Step starten
    v_step_id := fn_pipeline_step_start(p_run_id, 'plausibility', 3, p_input);

    -- 1. Positionen laden (aus Input oder DB)
    IF p_input ? 'positions' AND jsonb_array_length(p_input->'positions') > 0 THEN
        v_positions := p_input->'positions';
        v_total_positions := jsonb_array_length(v_positions);
    ELSE
        -- Direkt aus offer_positions laden
        -- WICHTIG: trade_id aus trades-Tabelle resolven wenn NULL
        SELECT jsonb_agg(jsonb_build_object(
            'id', op.id,
            'catalog_code', op.catalog_code,
            'title', op.title,
            'quantity', op.quantity,
            'unit', op.unit,
            'trade', op.trade::TEXT,
            'trade_id', COALESCE(op.trade_id, t_resolved.id),
            'labor_minutes', op.labor_minutes,
            'material_cost', op.material_cost,
            'unit_price', op.unit_price
        ))
        INTO v_positions
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        LEFT JOIN trades t_resolved ON t_resolved.name = op.trade::TEXT
        WHERE o.project_id = v_project_id
          AND op.deleted_at IS NULL
          AND (op.is_optional IS NULL OR op.is_optional = false);

        v_total_positions := COALESCE(jsonb_array_length(v_positions), 0);
    END IF;

    -- STOP: Null Positionen
    IF v_total_positions = 0 THEN
        v_output := jsonb_build_object(
            'valid', false, 'stop', true,
            'stop_reason', 'Keine Positionen gefunden für Projekt',
            'project_id', v_project_id, 'total_positions', 0,
            'trade_sequence', '[]'::JSONB,
            'warnings', to_jsonb(v_warnings),
            'errors', to_jsonb(array_append(v_errors, 'Keine Positionen gefunden für Projekt'))
        );
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'stopped', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- 2. Positionen ohne Gewerk
    SELECT COUNT(*) INTO v_positions_without_trade
    FROM jsonb_array_elements(v_positions) pos
    WHERE pos->>'trade_id' IS NULL AND pos->>'trade' IS NULL;

    IF v_positions_without_trade = v_total_positions THEN
        v_errors := array_append(v_errors, 'Kein Gewerk zugeordnet bei allen ' || v_total_positions || ' Positionen');
        v_output := jsonb_build_object(
            'valid', false, 'stop', true,
            'stop_reason', v_errors[1],
            'project_id', v_project_id, 'total_positions', v_total_positions,
            'positions_without_trade', v_positions_without_trade,
            'trade_sequence', '[]'::JSONB,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors)
        );
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'stopped', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    IF v_positions_without_trade > 0 THEN
        v_warnings := array_append(v_warnings,
            v_positions_without_trade || ' von ' || v_total_positions || ' Positionen ohne Gewerk-Zuordnung');
    END IF;

    -- 3. Positionen ohne labor_minutes
    SELECT COUNT(*) INTO v_positions_without_labor
    FROM jsonb_array_elements(v_positions) pos
    WHERE (pos->>'labor_minutes') IS NULL OR (pos->>'labor_minutes')::NUMERIC = 0;

    IF v_positions_without_labor > 0 THEN
        v_warnings := array_append(v_warnings,
            v_positions_without_labor || ' Positionen ohne Zeitangabe (labor_minutes) — Einsatzplaner nutzt Fallback');
    END IF;

    -- 4. Trade-Summary mit Reihenfolge
    -- Resolve: trade_id direkt ODER über trade-Name aus trades-Tabelle
    FOR v_trade IN
        SELECT
            COALESCE(
                (pos->>'trade_id')::UUID,
                t_by_name.id
            )::TEXT AS trade_id,
            COALESCE(
                t_by_id.name,
                t_by_name.name,
                pos->>'trade',
                'Unbekannt'
            ) AS trade_name,
            COUNT(*) AS position_count,
            SUM(COALESCE((pos->>'labor_minutes')::NUMERIC, 0)) AS total_minutes,
            SUM(COALESCE((pos->>'material_cost')::NUMERIC, 0)) AS total_material_cost,
            COALESCE(tsr_id.default_phase_order, tsr_name.default_phase_order, 99) AS phase_order,
            COALESCE(tsr_id.must_come_after, tsr_name.must_come_after) AS must_come_after
        FROM jsonb_array_elements(v_positions) pos
        LEFT JOIN trades t_by_id ON t_by_id.id = (pos->>'trade_id')::UUID
        LEFT JOIN trades t_by_name ON t_by_name.name = pos->>'trade' AND (pos->>'trade_id') IS NULL
        LEFT JOIN trade_sequence_rules tsr_id ON tsr_id.trade_id = (pos->>'trade_id')::UUID
        LEFT JOIN trade_sequence_rules tsr_name ON tsr_name.trade_name = pos->>'trade' AND (pos->>'trade_id') IS NULL
        WHERE pos->>'trade_id' IS NOT NULL OR pos->>'trade' IS NOT NULL
        GROUP BY
            COALESCE((pos->>'trade_id')::UUID, t_by_name.id),
            COALESCE(t_by_id.name, t_by_name.name, pos->>'trade', 'Unbekannt'),
            COALESCE(tsr_id.default_phase_order, tsr_name.default_phase_order, 99),
            COALESCE(tsr_id.must_come_after, tsr_name.must_come_after)
        ORDER BY COALESCE(tsr_id.default_phase_order, tsr_name.default_phase_order, 99)
    LOOP
        -- >40h pro Gewerk = suspekt
        IF v_trade.total_minutes > 2400 THEN
            v_warnings := array_append(v_warnings,
                v_trade.trade_name || ': ' || ROUND(v_trade.total_minutes / 60, 1) || 'h geplant — ungewöhnlich hoch, bitte prüfen');
        END IF;

        v_total_project_minutes := v_total_project_minutes + v_trade.total_minutes;

        v_trade_summary := v_trade_summary || jsonb_build_object(
            'trade_id', v_trade.trade_id,
            'trade', v_trade.trade_name,
            'phase_order', v_trade.phase_order,
            'position_count', v_trade.position_count,
            'total_minutes', v_trade.total_minutes,
            'total_hours', ROUND(v_trade.total_minutes / 60, 1),
            'total_material_cost', v_trade.total_material_cost,
            'must_come_after', COALESCE(to_jsonb(v_trade.must_come_after), '[]'::JSONB)
        );
    END LOOP;

    -- 5. Gesamt-Plausibilität: >200h = Warnung
    IF v_total_project_minutes > 12000 THEN
        v_warnings := array_append(v_warnings,
            'Gesamtprojekt: ' || ROUND(v_total_project_minutes / 60, 1) || 'h — sehr großes Projekt, Zeitplan genau prüfen');
    END IF;

    -- 6. Output
    v_output := jsonb_build_object(
        'valid', true, 'stop', false,
        'project_id', v_project_id,
        'total_positions', v_total_positions,
        'positions_without_trade', v_positions_without_trade,
        'positions_without_labor', v_positions_without_labor,
        'total_project_minutes', v_total_project_minutes,
        'total_project_hours', ROUND(v_total_project_minutes / 60, 1),
        'trade_count', jsonb_array_length(v_trade_summary),
        'trade_sequence', v_trade_summary,
        'positions', v_positions,
        'warnings', to_jsonb(v_warnings),
        'errors', to_jsonb(v_errors)
    );

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;


ALTER FUNCTION "public"."fn_agent_plausibility"("p_run_id" "uuid", "p_input" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_agent_plausibility"("p_run_id" "uuid", "p_input" "jsonb") IS 'Staffellauf Agent #3: Prüft Gewerke-Reihenfolge, Gesamtstunden, fehlende Daten. STOP bei Null Positionen oder kein Gewerk.';



CREATE OR REPLACE FUNCTION "public"."fn_agent_zeitpruefer"("p_run_id" "uuid", "p_input" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_step_id UUID;
    v_project_id UUID;
    v_positions JSONB;
    v_enriched JSONB := '[]'::JSONB;
    v_pos JSONB;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_output JSONB;
    v_rzw RECORD;
    v_labor_min NUMERIC;
    v_mat_cost NUMERIC;
    v_confidence NUMERIC;
    v_source TEXT;
    v_matched INT := 0;
    v_formula_fallback INT := 0;
    v_no_data INT := 0;
    v_total INT;
    v_updated_in_db INT := 0;
    i INT;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;
    v_step_id := fn_pipeline_step_start(p_run_id, 'zeitpruefer', 2, p_input);

    -- Positionen aus Input (vom Plausibilitäts-Agent oder direkt aus DB)
    IF p_input ? 'positions' AND jsonb_array_length(p_input->'positions') > 0 THEN
        v_positions := p_input->'positions';
    ELSE
        SELECT jsonb_agg(jsonb_build_object(
            'id', op.id, 'catalog_code', op.catalog_code, 'title', op.title,
            'quantity', op.quantity, 'unit', op.unit,
            'trade', op.trade::TEXT, 'trade_id', COALESCE(op.trade_id, t.id),
            'labor_minutes', op.labor_minutes, 'material_cost', op.material_cost,
            'unit_price', op.unit_price
        ))
        INTO v_positions
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        LEFT JOIN trades t ON t.name = op.trade::TEXT
        WHERE o.project_id = v_project_id AND op.deleted_at IS NULL
          AND (op.is_optional IS NULL OR op.is_optional = false);
    END IF;

    v_total := COALESCE(jsonb_array_length(v_positions), 0);
    IF v_total = 0 THEN
        v_output := jsonb_build_object('success', true, 'project_id', v_project_id,
            'positions', '[]'::JSONB, 'matched', 0, 'formula_fallback', 0, 'no_data', 0,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- Jede Position enrichen
    FOR i IN 0..v_total - 1 LOOP
        v_pos := v_positions->i;
        v_labor_min := NULL;
        v_mat_cost := NULL;
        v_confidence := 0;
        v_source := NULL;

        -- 1. Richtzeitwert-Lookup (höchste Priorität)
        IF v_pos->>'catalog_code' IS NOT NULL THEN
            SELECT rzw.labor_minutes_per_unit, rzw.material_cost_per_unit, rzw.confidence
            INTO v_rzw
            FROM richtzeitwerte rzw
            WHERE rzw.catalog_position_nr = v_pos->>'catalog_code'
              AND rzw.confidence >= 0.5
            ORDER BY rzw.confidence DESC
            LIMIT 1;

            IF FOUND THEN
                v_labor_min := v_rzw.labor_minutes_per_unit * COALESCE((v_pos->>'quantity')::NUMERIC, 1);
                v_mat_cost := v_rzw.material_cost_per_unit * COALESCE((v_pos->>'quantity')::NUMERIC, 1);
                v_confidence := v_rzw.confidence;
                v_source := 'richtzeitwert';
                v_matched := v_matched + 1;
            END IF;
        END IF;

        -- 2. Formel-Fallback: (unit_price - geschätzte Material) / 70€/h × 60 = max Minuten
        IF v_labor_min IS NULL AND (v_pos->>'unit_price') IS NOT NULL AND (v_pos->>'unit_price')::NUMERIC > 0 THEN
            DECLARE
                v_price NUMERIC := (v_pos->>'unit_price')::NUMERIC;
                v_qty NUMERIC := COALESCE((v_pos->>'quantity')::NUMERIC, 1);
                v_estimated_material NUMERIC := v_price * 0.3;  -- 30% Material-Anteil Schätzung
                v_lohn NUMERIC := v_price - v_estimated_material;
            BEGIN
                -- Minuten = Lohnanteil / Stundensatz × 60
                v_labor_min := GREATEST(ROUND(v_lohn / 70.0 * 60 * v_qty, 1), 1);
                v_mat_cost := ROUND(v_estimated_material * v_qty, 2);
                v_confidence := 0.3;
                v_source := 'formel_fallback';
                v_formula_fallback := v_formula_fallback + 1;
            END;
        END IF;

        IF v_labor_min IS NULL THEN
            v_no_data := v_no_data + 1;
        END IF;

        -- Position enrichen
        v_enriched := v_enriched || (v_pos || jsonb_build_object(
            'labor_minutes', v_labor_min,
            'material_cost', v_mat_cost,
            'time_confidence', v_confidence,
            'time_source', v_source
        ));

        -- DB updaten: labor_minutes + material_cost in offer_positions schreiben
        IF v_labor_min IS NOT NULL AND (v_pos->>'id') IS NOT NULL THEN
            UPDATE offer_positions
            SET labor_minutes = v_labor_min,
                material_cost = COALESCE(v_mat_cost, material_cost),
                updated_at = now()
            WHERE id = (v_pos->>'id')::UUID
              AND (labor_minutes IS NULL OR labor_minutes = 0);
            IF FOUND THEN v_updated_in_db := v_updated_in_db + 1; END IF;
        END IF;
    END LOOP;

    -- Warnungen
    IF v_formula_fallback > 0 THEN
        v_warnings := array_append(v_warnings,
            v_formula_fallback || ' Positionen mit Formel-Fallback (30% Material, 70€/h) — geringe Confidence');
    END IF;
    IF v_no_data > 0 THEN
        v_warnings := array_append(v_warnings,
            v_no_data || ' Positionen ohne Zeitdaten (kein Katalogcode, kein Preis)');
    END IF;

    v_output := jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'total_positions', v_total,
        'matched_richtzeitwerte', v_matched,
        'formula_fallback', v_formula_fallback,
        'no_data', v_no_data,
        'updated_in_db', v_updated_in_db,
        'positions', v_enriched,
        'warnings', to_jsonb(v_warnings),
        'errors', to_jsonb(v_errors)
    );

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;


ALTER FUNCTION "public"."fn_agent_zeitpruefer"("p_run_id" "uuid", "p_input" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_agent_zeitpruefer"("p_run_id" "uuid", "p_input" "jsonb") IS 'Staffellauf Agent #2: Enriches Positionen mit labor_minutes aus Richtzeitwerten oder Formel-Fallback';



CREATE OR REPLACE FUNCTION "public"."fn_approve_intake"("p_approval_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_approval    RECORD;
  v_project_id  UUID;
  v_event_id    UUID;
  v_storage_path TEXT;
  v_file_name   TEXT;
  v_offer_id    UUID;
  v_catalog     TEXT;
  v_catalog_label TEXT;
BEGIN
  SELECT * INTO v_approval
  FROM approvals
  WHERE id = p_approval_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden');
  END IF;

  IF v_approval.status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe ist nicht mehr PENDING (aktuell: ' || v_approval.status::text || ')');
  END IF;

  IF v_approval.approval_type != 'PROJECT_START' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diese Funktion ist nur fuer PROJECT_START Approvals');
  END IF;

  v_project_id := v_approval.project_id;

  UPDATE approvals SET
    status = 'APPROVED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'approved_intake',
    updated_at = now()
  WHERE id = p_approval_id;

  UPDATE projects SET
    status = 'INSPECTION',
    updated_at = now()
  WHERE id = v_project_id
    AND status = 'INTAKE';

  -- Ersten Auftrag + Katalog ermitteln
  SELECT o.id INTO v_offer_id
  FROM offers o
  WHERE o.project_id = v_project_id
    AND o.deleted_at IS NULL
  ORDER BY o.created_at
  LIMIT 1;

  SELECT p.price_catalog INTO v_catalog
  FROM projects p
  WHERE p.id = v_project_id;

  v_catalog_label := CASE
    WHEN v_catalog ILIKE '%WABS%' THEN 'WABS'
    WHEN v_catalog ILIKE '%AV%'   THEN 'AV'
    ELSE NULL
  END;

  -- SITE_INSPECTION mit Kontext anlegen (idempotent)
  INSERT INTO approvals (project_id, approval_type, status, requested_at, request_summary, request_data)
  SELECT
    v_project_id,
    'SITE_INSPECTION',
    'PENDING',
    now(),
    'Erstbegehung erforderlich: Vor-Ort-Begehung um Monteure, Material und Umfang zu klaeren',
    jsonb_strip_nulls(jsonb_build_object(
      'offer_id',      v_offer_id,
      'catalog_label', v_catalog_label
    ))
  WHERE NOT EXISTS (
    SELECT 1 FROM approvals
    WHERE project_id = v_project_id
      AND approval_type = 'SITE_INSPECTION'
      AND status = 'PENDING'
  );

  -- Auftrags-PDF in 01_Auftrag ablegen (wenn vorhanden)
  v_storage_path := v_approval.request_data->>'storage_path';
  v_file_name := COALESCE(v_approval.request_data->>'file_name', 'Auftrag.pdf');
  IF v_storage_path IS NOT NULL THEN
    PERFORM fn_file_intake_to_folder(
      v_project_id,
      v_storage_path,
      v_file_name,
      COALESCE(v_approval.request_data->>'mime_type', 'application/pdf'),
      COALESCE((v_approval.request_data->>'file_size')::INT, 0)
    );
  END IF;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
  VALUES (
    'PROJECT_CREATED',
    v_project_id,
    'app',
    'freigabecenter_approve',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approved_by', 'app_gf',
      'channel', 'freigabecenter'
    )
  )
  RETURNING id INTO v_event_id;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES (
    'APPROVAL_APPROVED',
    v_project_id,
    'app',
    'freigabecenter_approve',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approval_type', 'PROJECT_START',
      'approved_by', 'app_gf'
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_project_id,
    'site_inspection_offer_id', v_offer_id,
    'site_inspection_catalog', v_catalog_label
  );
END;
$$;


ALTER FUNCTION "public"."fn_approve_intake"("p_approval_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_approve_material_order"("p_approval_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_approval RECORD;
  v_updated INT;
BEGIN
  SELECT * INTO v_approval
  FROM approvals WHERE id = p_approval_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden');
  END IF;

  IF v_approval.status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Status ist nicht PENDING');
  END IF;

  IF v_approval.approval_type != 'MATERIAL_ORDER' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Falscher Approval-Typ');
  END IF;

  -- Approval → APPROVED
  UPDATE approvals SET
    status = 'APPROVED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'approved_material',
    updated_at = now()
  WHERE id = p_approval_id;

  -- Material-Needs → ordered
  UPDATE project_material_needs SET
    status = 'ordered',
    updated_at = now()
  WHERE project_id = v_approval.project_id
    AND source = 'auto_plan'
    AND status = 'planned'
    AND problem IS NULL;  -- Nur problemfreie bestellen

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Event feuern → n8n kann Bestellmails senden
  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES (
    'MATERIAL_ORDER_APPROVED',
    v_approval.project_id,
    'app',
    'freigabecenter_approve',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'needs_ordered', v_updated
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'needs_ordered', v_updated,
    'approval_id', p_approval_id
  );
END;
$$;


ALTER FUNCTION "public"."fn_approve_material_order"("p_approval_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_approve_schedule"("p_approval_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_approval RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_approval
  FROM approvals WHERE id = p_approval_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden');
  END IF;

  IF v_approval.status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Status ist nicht PENDING');
  END IF;

  IF v_approval.approval_type != 'SCHEDULE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Falscher Approval-Typ');
  END IF;

  -- Bestehende confirm_proposed_phases nutzen
  SELECT confirm_proposed_phases(v_approval.project_id) INTO v_result;

  -- Approval → APPROVED
  UPDATE approvals SET
    status = 'APPROVED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'approved_schedule',
    updated_at = now()
  WHERE id = p_approval_id;

  -- Event
  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES (
    'SCHEDULE_APPROVED',
    v_approval.project_id,
    'app',
    'freigabecenter_approve',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'confirm_result', v_result
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'approval_id', p_approval_id,
    'confirm_result', v_result
  );
END;
$$;


ALTER FUNCTION "public"."fn_approve_schedule"("p_approval_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_assignment_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES (
      'POSITION_ASSIGNED',
      NEW.project_id,
      'trigger',
      'fn_assignment_event',
      jsonb_build_object(
        'assignment_id', NEW.id,
        'position_id', NEW.position_id,
        'subcontractor_id', NEW.subcontractor_id,
        'status', NEW.status::TEXT
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'IN_PROGRESS' AND NEW.started_at IS NULL THEN
      NEW.started_at := now();
    ELSIF NEW.status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    ELSIF NEW.status = 'VERIFIED' AND NEW.verified_at IS NULL THEN
      NEW.verified_at := now();
    END IF;
    
    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES (
      CASE 
        WHEN NEW.status = 'VERIFIED' THEN 'ASSIGNMENT_VERIFIED'::event_type
        ELSE 'ASSIGNMENT_STATUS_CHANGED'::event_type
      END,
      NEW.project_id,
      'trigger',
      'fn_assignment_event',
      jsonb_build_object(
        'assignment_id', NEW.id,
        'position_id', NEW.position_id,
        'subcontractor_id', NEW.subcontractor_id,
        'old_status', OLD.status::TEXT,
        'new_status', NEW.status::TEXT
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_assignment_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_commit_staged_longtext"("p_position_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      v_pos RECORD;
  BEGIN
      SELECT id, offer_id, title, long_text, staged_long_text
      INTO v_pos
      FROM offer_positions
      WHERE id = p_position_id AND deleted_at IS NULL;

      IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'error', 'Position not found');
      END IF;

      IF v_pos.staged_long_text IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'No staged text to commit');
      END IF;

      UPDATE offer_positions
      SET long_text = staged_long_text,
          staged_long_text = NULL,
          staged_at = NULL,
          staged_by = NULL,
          updated_at = now()
      WHERE id = p_position_id;

      BEGIN
          INSERT INTO offer_history (offer_id, changed_by, change_type, changes)
          VALUES (
              v_pos.offer_id,
              p_user_id,
              'longtext_committed',
              jsonb_build_object(
                  'position_id', p_position_id,
                  'position_title', v_pos.title,
                  'old_long_text', v_pos.long_text,
                  'new_long_text', v_pos.staged_long_text
              )
          );
      EXCEPTION WHEN undefined_table THEN
          NULL;
      END;

      RETURN jsonb_build_object(
          'success', true,
          'position_id', p_position_id,
          'committed_text', v_pos.staged_long_text
      );
  END;
  $$;


ALTER FUNCTION "public"."fn_commit_staged_longtext"("p_position_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_end_project_session"("p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
      UPDATE project_sessions
      SET ended_at = now()
      WHERE id = p_session_id
        AND ended_at IS NULL;
  END;
  $$;


ALTER FUNCTION "public"."fn_end_project_session"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_export_training_data"("p_min_quality" numeric DEFAULT 0.8) RETURNS TABLE("system_prompt" "text", "user_prompt" "text", "assistant_response" "text", "quality_score" numeric, "catalog_code" "text", "trade" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
      SELECT
          'Du bist der BauGenius Langtext-Assistent. Schreibe verkaufende Langtexte fuer Angebotspositionen im Handwerk.' AS system_prompt,
          'Schreibe den Langtext fuer: ' || COALESCE(op.title, 'Position') || ' (' || COALESCE(op.quantity::text, '?') || ' ' || COALESCE(op.unit, '?') || ')' AS user_prompt,
          ao.final_text AS assistant_response,
          ao.quality_score,
          ao.catalog_code,
          ao.trade,
          ao.created_at
      FROM agent_observations ao
      LEFT JOIN offer_positions op ON op.id = ao.position_id
      WHERE ao.observation_type IN ('text_approved', 'text_edited')
        AND ao.quality_score >= p_min_quality
        AND ao.final_text IS NOT NULL
        AND LENGTH(ao.final_text) > 20
      ORDER BY ao.quality_score DESC, ao.created_at DESC;
  $$;


ALTER FUNCTION "public"."fn_export_training_data"("p_min_quality" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_fetch_unrouted_file_events"("p_limit" integer DEFAULT 10) RETURNS TABLE("event_id" "uuid", "doc_type" "text", "subject" "text", "from_address" "text", "file_ids" "jsonb", "superchat_message_id" "text", "project_id" "uuid", "project_name" "text", "match_score" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.payload->>'doc_type' as doc_type,
    e.payload->>'subject' as subject,
    e.payload->>'from_address' as from_address,
    e.payload->'file_ids' as file_ids,
    e.payload->>'superchat_message_id' as superchat_message_id,
    m.project_id,
    m.project_name,
    COALESCE(m.match_score, 0) as match_score
  FROM events e
  LEFT JOIN LATERAL fn_match_project_by_text(
    COALESCE(e.payload->>'subject', '') || ' ' || COALESCE(e.payload->>'from_address', '')
  ) m ON true
  WHERE e.event_type::text LIKE 'DOC_CLASSIFIED%'
    AND (e.payload->>'has_attachments')::boolean = true
    AND jsonb_array_length(COALESCE(e.payload->'file_ids', '[]'::jsonb)) > 0
    AND NOT EXISTS (
      SELECT 1 FROM events e2 
      WHERE e2.event_type::text IN ('FILE_ROUTED', 'FILE_ROUTE_FAILED')
      AND e2.payload->>'source_event_id' = e.id::text
    )
  ORDER BY e.created_at DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."fn_fetch_unrouted_file_events"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_file_intake_to_folder"("p_project_id" "uuid", "p_storage_path" "text", "p_file_name" "text", "p_mime_type" "text" DEFAULT 'application/pdf'::"text", "p_file_size" integer DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_folder_id UUID;
BEGIN
  -- Ordner 01_Auftrag finden
  SELECT id INTO v_folder_id
  FROM project_folders
  WHERE project_id = p_project_id AND name = '01_Auftrag'
  LIMIT 1;

  -- Falls kein Ordner → anlegen
  IF v_folder_id IS NULL THEN
    INSERT INTO project_folders (project_id, name, sort_order)
    VALUES (p_project_id, '01_Auftrag', 1)
    RETURNING id INTO v_folder_id;
  END IF;

  -- Datei eintragen (nur wenn nicht schon vorhanden)
  INSERT INTO project_files (project_id, folder_id, file_type, file_name, mime_type, file_size_bytes, storage_path)
  VALUES (p_project_id, v_folder_id, 'pdf', p_file_name, p_mime_type, p_file_size, p_storage_path)
  ON CONFLICT DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."fn_file_intake_to_folder"("p_project_id" "uuid", "p_storage_path" "text", "p_file_name" "text", "p_mime_type" "text", "p_file_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_offer_assistant_context"("p_offer_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
  DECLARE
      v_result JSONB;
  BEGIN
      SELECT jsonb_build_object(
          'offer', jsonb_build_object(
              'id', o.id,
              'offer_number', o.offer_number,
              'status', o.status,
              'total_net', o.total_net,
              'total_gross', o.total_gross
          ),
          'project', jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'project_number', p.project_number,
              'object_street', p.object_street,
              'object_zip', p.object_zip,
              'object_city', p.object_city
          ),
          'client', jsonb_build_object(
              'company_name', c.company_name,
              'salutation', c.salutation,
              'first_name', c.first_name,
              'last_name', c.last_name
          ),
          'sections', COALESCE((
              SELECT jsonb_agg(
                  jsonb_build_object(
                      'id', s.id,
                      'section_number', s.section_number,
                      'title', s.title,
                      'trade', s.trade,
                      'positions', COALESCE((
                          SELECT jsonb_agg(
                              jsonb_build_object(
                                  'id', pos.id,
                                  'position_number', pos.position_number,
                                  'title', pos.title,
                                  'description', pos.description,
                                  'long_text', pos.long_text,
                                  'staged_long_text', pos.staged_long_text,
                                  'unit', pos.unit,
                                  'unit_price', pos.unit_price,
                                  'quantity', pos.quantity,
                                  'catalog_code', pos.catalog_code,
                                  'sort_order', pos.sort_order
                              ) ORDER BY pos.sort_order
                          )
                          FROM offer_positions pos
                          WHERE pos.section_id = s.id
                            AND pos.deleted_at IS NULL
                      ), '[]'::jsonb)
                  ) ORDER BY s.section_number
              )
              FROM offer_sections s
              WHERE s.offer_id = o.id
          ), '[]'::jsonb)
      ) INTO v_result
      FROM offers o
      LEFT JOIN projects p ON p.id = o.project_id
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE o.id = p_offer_id
        AND o.deleted_at IS NULL;

      RETURN COALESCE(v_result, '{}'::jsonb);
  END;
  $$;


ALTER FUNCTION "public"."fn_get_offer_assistant_context"("p_offer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_godmode_learner"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_project RECORD;
    v_pos RECORD;
    v_rzw RECORD;
    v_ema_alpha NUMERIC := 0.3;
    v_confidence_step NUMERIC := 0.05;
    v_max_confidence NUMERIC := 0.95;
    v_updated INT := 0;
    v_created INT := 0;
    v_skipped INT := 0;
    v_observations JSONB := '[]'::JSONB;
    v_new_value NUMERIC;
    v_new_mat NUMERIC;
    v_new_confidence NUMERIC;
BEGIN
    SELECT id, name, status INTO v_project
    FROM projects WHERE id = p_project_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
    END IF;

    FOR v_pos IN
        SELECT
            op.id,
            op.catalog_code,
            op.title,
            op.quantity,
            op.unit,
            op.labor_minutes AS planned_minutes,
            op.actual_minutes,
            op.material_cost AS planned_material_cost
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        WHERE o.project_id = p_project_id
          AND op.actual_minutes IS NOT NULL
          AND op.quantity > 0
          AND op.catalog_code IS NOT NULL
          AND op.deleted_at IS NULL
    LOOP
        DECLARE
            v_actual_per_unit NUMERIC;
            v_planned_per_unit NUMERIC;
            v_deviation_pct NUMERIC;
        BEGIN
            v_actual_per_unit := v_pos.actual_minutes / v_pos.quantity;
            v_planned_per_unit := COALESCE(v_pos.planned_minutes, 0) / NULLIF(v_pos.quantity, 0);

            IF v_planned_per_unit > 0 THEN
                v_deviation_pct := ((v_actual_per_unit - v_planned_per_unit) / v_planned_per_unit) * 100;
            ELSE
                v_deviation_pct := 0;
            END IF;

            SELECT * INTO v_rzw
            FROM richtzeitwerte
            WHERE catalog_position_nr = v_pos.catalog_code
            LIMIT 1;

            IF FOUND THEN
                v_new_value := v_ema_alpha * v_actual_per_unit + (1 - v_ema_alpha) * v_rzw.labor_minutes_per_unit;
                v_new_confidence := LEAST(v_rzw.confidence + v_confidence_step, v_max_confidence);

                UPDATE richtzeitwerte
                SET labor_minutes_per_unit = ROUND(v_new_value, 2),
                    confidence = v_new_confidence,
                    observation_count = observation_count + 1,
                    source = CASE WHEN source = 'manual' THEN 'godmode' ELSE source END,
                    updated_at = now(),
                    notes = COALESCE(notes, '') || ' | Godmode ' || to_char(now(), 'YYYY-MM-DD') ||
                            ': ' || ROUND(v_rzw.labor_minutes_per_unit, 1) || '→' || ROUND(v_new_value, 1) || ' min'
                WHERE id = v_rzw.id;

                v_updated := v_updated + 1;
            ELSE
                INSERT INTO richtzeitwerte (
                    catalog_position_nr, labor_minutes_per_unit, unit,
                    source, confidence, observation_count, notes
                ) VALUES (
                    v_pos.catalog_code,
                    ROUND(v_actual_per_unit, 2),
                    v_pos.unit,
                    'godmode',
                    0.5 + v_confidence_step,
                    1,
                    'Godmode initial: ' || ROUND(v_actual_per_unit, 1) || ' min aus Projekt ' || v_project.name
                );
                v_created := v_created + 1;
            END IF;

            v_observations := v_observations || jsonb_build_object(
                'catalog_code', v_pos.catalog_code,
                'title', v_pos.title,
                'planned_per_unit', ROUND(COALESCE(v_planned_per_unit, 0), 2),
                'actual_per_unit', ROUND(v_actual_per_unit, 2),
                'new_richtzeitwert', ROUND(COALESCE(v_new_value, v_actual_per_unit), 2),
                'deviation_pct', ROUND(v_deviation_pct, 1),
                'action', CASE WHEN v_rzw.id IS NOT NULL THEN 'updated' ELSE 'created' END
            );
        END;
    END LOOP;

    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES ('GODMODE_LEARNING_COMPLETED', p_project_id, 'db', 'fn_godmode_learner',
        jsonb_build_object(
            'updated', v_updated,
            'created', v_created,
            'skipped', v_skipped,
            'total_observations', jsonb_array_length(v_observations),
            'observations', v_observations
        ));

    RETURN jsonb_build_object(
        'success', true,
        'project_id', p_project_id,
        'project_name', v_project.name,
        'richtzeitwerte_updated', v_updated,
        'richtzeitwerte_created', v_created,
        'skipped', v_skipped,
        'total_observations', jsonb_array_length(v_observations),
        'observations', v_observations
    );
END;
$$;


ALTER FUNCTION "public"."fn_godmode_learner"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_godmode_learner"("p_project_id" "uuid") IS 'Godmode Learner: SOLL vs IST vergleichen, Richtzeitwerte per EMA anpassen.';



CREATE OR REPLACE FUNCTION "public"."fn_godmode_report"("p_days" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_since           TIMESTAMPTZ;
    v_phases          JSONB;
    v_top_deviations  JSONB;
    v_updated_count   INT;
    v_total_phases    INT;
BEGIN
    v_since := now() - (p_days || ' days')::INTERVAL;

    -- Alle abgeschlossenen Phasen mit Godmode-Events
    SELECT
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'phase_name', e.payload->>'phase_name',
                'trade', e.payload->>'trade',
                'project_id', e.project_id,
                'project_name', p.name,
                'soll_minutes', (e.payload->>'soll_minutes')::NUMERIC,
                'ist_minutes', (e.payload->>'ist_minutes')::NUMERIC,
                'ratio', (e.payload->>'ratio')::NUMERIC,
                'deviation_pct', ROUND(((e.payload->>'ratio')::NUMERIC - 1) * 100, 1),
                'richtzeitwerte_updated', (e.payload->>'updated')::INT,
                'richtzeitwerte_created', (e.payload->>'created')::INT,
                'learned_at', e.created_at
            ) ORDER BY e.created_at DESC
        ), '[]'::JSONB),
        COUNT(*)
    INTO v_phases, v_total_phases
    FROM events e
    LEFT JOIN projects p ON p.id = e.project_id
    WHERE e.event_type = 'GODMODE_PHASE_LEARNING'
      AND e.created_at >= v_since;

    -- Top 5 groesste Abweichungen (aus den Observations der Events)
    SELECT COALESCE(jsonb_agg(deviation ORDER BY abs_dev DESC), '[]'::JSONB)
    INTO v_top_deviations
    FROM (
        SELECT
            jsonb_build_object(
                'catalog_code', obs->>'catalog_code',
                'title', obs->>'title',
                'planned_per_unit', (obs->>'planned_per_unit')::NUMERIC,
                'actual_per_unit', (obs->>'actual_per_unit')::NUMERIC,
                'deviation_pct', (obs->>'deviation_pct')::NUMERIC,
                'phase_name', e.payload->>'phase_name',
                'trade', e.payload->>'trade'
            ) AS deviation,
            ABS((obs->>'deviation_pct')::NUMERIC) AS abs_dev
        FROM events e,
             jsonb_array_elements(e.payload->'observations') AS obs
        WHERE e.event_type = 'GODMODE_PHASE_LEARNING'
          AND e.created_at >= v_since
        ORDER BY abs_dev DESC
        LIMIT 5
    ) sub;

    -- Anzahl aktualisierter Richtzeitwerte im Zeitraum
    SELECT COUNT(*)
    INTO v_updated_count
    FROM richtzeitwerte
    WHERE source = 'godmode'
      AND updated_at >= v_since;

    RETURN jsonb_build_object(
        'success', true,
        'report_period_days', p_days,
        'since', v_since,
        'total_phases_learned', v_total_phases,
        'richtzeitwerte_updated_total', v_updated_count,
        'phases', v_phases,
        'top_5_deviations', v_top_deviations
    );
END;
$$;


ALTER FUNCTION "public"."fn_godmode_report"("p_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_godmode_report"("p_days" integer) IS 'Godmode Report: Zeigt alle Lern-Ergebnisse der letzten N Tage. Inkl. SOLL vs IST pro Phase, Top 5 Abweichungen, Anzahl Updates.';



CREATE OR REPLACE FUNCTION "public"."fn_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE auth_id = auth.uid()
      AND is_admin = true
  );
$$;


ALTER FUNCTION "public"."fn_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_learn_from_completed_phase"("p_phase_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_phase           RECORD;
    v_soll_total      NUMERIC;
    v_ist_total       NUMERIC;
    v_ratio           NUMERIC;
    v_pos             RECORD;
    v_rzw             RECORD;
    v_ema_alpha       NUMERIC := 0.3;
    v_confidence_step NUMERIC := 0.05;
    v_max_confidence  NUMERIC := 0.95;
    v_updated         INT := 0;
    v_created         INT := 0;
    v_skipped         INT := 0;
    v_observations    JSONB := '[]'::JSONB;
    v_new_value       NUMERIC;
    v_new_confidence  NUMERIC;
    v_actual_per_unit NUMERIC;
    v_planned_per_unit NUMERIC;
    v_deviation_pct   NUMERIC;
BEGIN
    -- Phase laden + validieren
    SELECT sp.id, sp.project_id, sp.trade, sp.trade_id, sp.name,
           sp.estimated_hours, sp.start_date, sp.end_date, sp.status
    INTO v_phase
    FROM schedule_phases sp
    WHERE sp.id = p_phase_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phase nicht gefunden');
    END IF;

    IF v_phase.status != 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phase nicht abgeschlossen');
    END IF;

    -- SOLL: Summe labor_minutes aus offer_positions fuer dieses Projekt + Gewerk
    SELECT COALESCE(SUM(op.labor_minutes), 0)
    INTO v_soll_total
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    WHERE o.project_id = v_phase.project_id
      AND op.deleted_at IS NULL
      AND op.labor_minutes > 0
      AND (
          (v_phase.trade_id IS NOT NULL AND op.trade_id = v_phase.trade_id)
          OR (v_phase.trade_id IS NULL AND op.trade::TEXT = v_phase.trade)
      );

    -- IST: Summe time_entries.hours * 60 (Stunden -> Minuten)
    SELECT COALESCE(SUM(te.hours), 0) * 60
    INTO v_ist_total
    FROM time_entries te
    WHERE te.project_id = v_phase.project_id
      AND te.trade = v_phase.trade;

    -- Nichts zu lernen wenn SOLL oder IST = 0
    IF v_soll_total = 0 OR v_ist_total = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'phase_id', p_phase_id,
            'phase_name', v_phase.name,
            'skipped', true,
            'reason', CASE
                WHEN v_soll_total = 0 THEN 'Keine geplanten Minuten (SOLL=0)'
                ELSE 'Keine Zeiterfassung (IST=0)'
            END,
            'soll_minutes', v_soll_total,
            'ist_minutes', v_ist_total
        );
    END IF;

    -- Ratio IST/SOLL: > 1 = dauerte laenger, < 1 = ging schneller
    v_ratio := v_ist_total / v_soll_total;

    -- Pro offer_position mit catalog_code: richtzeitwert anpassen
    FOR v_pos IN
        SELECT
            op.id,
            op.catalog_code,
            op.title,
            op.quantity,
            op.unit,
            op.labor_minutes,
            op.catalog_position_v2_id
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        WHERE o.project_id = v_phase.project_id
          AND op.deleted_at IS NULL
          AND op.labor_minutes > 0
          AND op.quantity > 0
          AND op.catalog_code IS NOT NULL
          AND (
              (v_phase.trade_id IS NOT NULL AND op.trade_id = v_phase.trade_id)
              OR (v_phase.trade_id IS NULL AND op.trade::TEXT = v_phase.trade)
          )
    LOOP
        -- Geplant pro Einheit
        v_planned_per_unit := v_pos.labor_minutes / v_pos.quantity;

        -- IST pro Einheit (proportional ueber Ratio verteilt)
        v_actual_per_unit := v_planned_per_unit * v_ratio;

        -- Abweichung in %
        v_deviation_pct := (v_ratio - 1) * 100;

        -- Richtzeitwert suchen
        SELECT * INTO v_rzw
        FROM richtzeitwerte
        WHERE catalog_position_nr = v_pos.catalog_code
        LIMIT 1;

        IF FOUND THEN
            -- EMA: new = 0.3 * IST + 0.7 * ALT
            v_new_value := v_ema_alpha * v_actual_per_unit
                         + (1 - v_ema_alpha) * v_rzw.labor_minutes_per_unit;
            v_new_confidence := LEAST(v_rzw.confidence + v_confidence_step, v_max_confidence);

            UPDATE richtzeitwerte
            SET labor_minutes_per_unit = ROUND(v_new_value, 2),
                confidence = v_new_confidence,
                observation_count = observation_count + 1,
                source = CASE WHEN source IN ('manual', 'ai_estimate') THEN 'godmode' ELSE source END,
                updated_at = now(),
                notes = COALESCE(notes, '') ||
                    ' | Phase ' || to_char(now(), 'YYYY-MM-DD') ||
                    ': ' || ROUND(v_rzw.labor_minutes_per_unit, 1) ||
                    E'\u2192' || ROUND(v_new_value, 1) || ' min'
            WHERE id = v_rzw.id;

            v_updated := v_updated + 1;
        ELSE
            -- Neuen Richtzeitwert anlegen
            INSERT INTO richtzeitwerte (
                catalog_position_nr, labor_minutes_per_unit, unit,
                source, confidence, observation_count, notes
            ) VALUES (
                v_pos.catalog_code,
                ROUND(v_actual_per_unit, 2),
                v_pos.unit,
                'godmode',
                0.5 + v_confidence_step,
                1,
                'Godmode Phase-Learner initial: ' || ROUND(v_actual_per_unit, 1) ||
                ' min (Phase: ' || v_phase.name || ')'
            );
            v_created := v_created + 1;
        END IF;

        v_observations := v_observations || jsonb_build_object(
            'catalog_code', v_pos.catalog_code,
            'title', v_pos.title,
            'planned_per_unit', ROUND(v_planned_per_unit, 2),
            'actual_per_unit', ROUND(v_actual_per_unit, 2),
            'new_richtzeitwert', ROUND(COALESCE(v_new_value, v_actual_per_unit), 2),
            'deviation_pct', ROUND(v_deviation_pct, 1),
            'action', CASE WHEN v_rzw.id IS NOT NULL THEN 'updated' ELSE 'created' END
        );
    END LOOP;

    -- Event loggen
    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES (
        'GODMODE_PHASE_LEARNING',
        v_phase.project_id,
        'db',
        'fn_learn_from_completed_phase',
        jsonb_build_object(
            'phase_id', p_phase_id,
            'phase_name', v_phase.name,
            'trade', v_phase.trade,
            'soll_minutes', v_soll_total,
            'ist_minutes', v_ist_total,
            'ratio', ROUND(v_ratio, 3),
            'updated', v_updated,
            'created', v_created,
            'observations', v_observations
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'phase_id', p_phase_id,
        'phase_name', v_phase.name,
        'trade', v_phase.trade,
        'soll_minutes', v_soll_total,
        'ist_minutes', v_ist_total,
        'ratio', ROUND(v_ratio, 3),
        'deviation_pct', ROUND((v_ratio - 1) * 100, 1),
        'richtzeitwerte_updated', v_updated,
        'richtzeitwerte_created', v_created,
        'total_observations', jsonb_array_length(v_observations),
        'observations', v_observations
    );
END;
$$;


ALTER FUNCTION "public"."fn_learn_from_completed_phase"("p_phase_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_learn_from_completed_phase"("p_phase_id" "uuid") IS 'Godmode Phase-Learner: Vergleicht SOLL (offer_positions.labor_minutes) mit IST (time_entries.hours) fuer eine abgeschlossene Phase. Aktualisiert richtzeitwerte per EMA (alpha=0.3).';



CREATE OR REPLACE FUNCTION "public"."fn_learn_from_offer_sessions"("p_days" integer DEFAULT 7) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      v_thread        RECORD;
      v_obs           RECORD;
      v_approved      INT := 0;
      v_edited        INT := 0;
      v_rejected      INT := 0;
      v_memories_created INT := 0;
      v_memories_updated INT := 0;
      v_ema_alpha     NUMERIC := 0.3;
      v_confidence_step NUMERIC := 0.05;
      v_max_confidence NUMERIC := 0.95;
      v_threads_processed INT := 0;
  BEGIN
      FOR v_thread IN
          SELECT id, offer_id, user_id, context_snapshot
          FROM agent_threads
          WHERE thread_type = 'offer_longtext'
            AND status = 'completed'
            AND updated_at >= now() - (p_days || ' days')::interval
            AND NOT EXISTS (
                SELECT 1 FROM events e
                WHERE e.payload->>'thread_id' = agent_threads.id::text
                  AND e.event_type = 'OFFER_LONGTEXT_LEARNING_COMPLETED'
            )
          ORDER BY updated_at
      LOOP
          v_threads_processed := v_threads_processed + 1;

          FOR v_obs IN
              SELECT observation_type, catalog_code, trade, proposed_text, final_text, quality_score, edit_distance
              FROM agent_observations
              WHERE thread_id = v_thread.id
          LOOP
              CASE v_obs.observation_type
                  WHEN 'text_approved' THEN
                      v_approved := v_approved + 1;
                  WHEN 'text_edited' THEN
                      v_edited := v_edited + 1;
                      IF v_obs.edit_distance IS NOT NULL AND v_obs.edit_distance > 10
                         AND v_obs.proposed_text IS NOT NULL AND v_obs.final_text IS NOT NULL THEN
                          IF EXISTS (
                              SELECT 1 FROM memory_entries
                              WHERE scope = 'tenant'
                                AND memory_type = 'correction_pattern'
                                AND key = COALESCE(v_obs.catalog_code, v_obs.trade, 'general')
                          ) THEN
                              UPDATE memory_entries
                              SET confidence = LEAST(v_max_confidence,
                                      v_ema_alpha * COALESCE(v_obs.quality_score, 0.8)
                                      + (1 - v_ema_alpha) * confidence),
                                  observation_count = observation_count + 1,
                                  updated_at = now()
                              WHERE scope = 'tenant'
                                AND memory_type = 'correction_pattern'
                                AND key = COALESCE(v_obs.catalog_code, v_obs.trade, 'general');
                              v_memories_updated := v_memories_updated + 1;
                          ELSE
                              INSERT INTO memory_entries (
                                  scope, scope_id, memory_type, key, value, trade,
                                  confidence, observation_count, source
                              ) VALUES (
                                  'tenant', NULL, 'correction_pattern',
                                  COALESCE(v_obs.catalog_code, v_obs.trade, 'general'),
                                  'User hat Text editiert. Proposed: ' || LEFT(v_obs.proposed_text, 100)
                                      || '... Final: ' || LEFT(v_obs.final_text, 100),
                                  v_obs.trade,
                                  COALESCE(v_obs.quality_score, 0.5),
                                  1,
                                  'auto_extracted'
                              );
                              v_memories_created := v_memories_created + 1;
                          END IF;
                      END IF;
                  WHEN 'text_rejected' THEN
                      v_rejected := v_rejected + 1;
              END CASE;
          END LOOP;

          INSERT INTO memory_entries (
              scope, scope_id, memory_type, key, value, trade,
              confidence, observation_count, source
          )
          SELECT
              'tenant', NULL, 'few_shot_example',
              COALESCE(ao.catalog_code, ao.trade, 'general'),
              ao.final_text,
              ao.trade,
              ao.quality_score,
              1,
              'auto_extracted'
          FROM agent_observations ao
          WHERE ao.thread_id = v_thread.id
            AND ao.observation_type IN ('text_approved', 'text_edited')
            AND ao.quality_score >= 0.8
            AND ao.final_text IS NOT NULL
            AND LENGTH(ao.final_text) > 20
            AND (
                SELECT COUNT(*) FROM memory_entries me
                WHERE me.scope = 'tenant'
                  AND me.memory_type = 'few_shot_example'
                  AND me.key = COALESCE(ao.catalog_code, ao.trade, 'general')
            ) < 3
          ON CONFLICT DO NOTHING;

          INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
          VALUES (
              'OFFER_LONGTEXT_LEARNING_COMPLETED',
              (SELECT project_id FROM agent_threads WHERE id = v_thread.id),
              'db',
              'fn_learn_from_offer_sessions',
              jsonb_build_object(
                  'thread_id', v_thread.id,
                  'offer_id', v_thread.offer_id,
                  'approved', v_approved,
                  'edited', v_edited,
                  'rejected', v_rejected,
                  'memories_created', v_memories_created,
                  'memories_updated', v_memories_updated
              )
          );
      END LOOP;

      RETURN jsonb_build_object(
          'success', true,
          'threads_processed', v_threads_processed,
          'total_approved', v_approved,
          'total_edited', v_edited,
          'total_rejected', v_rejected,
          'memories_created', v_memories_created,
          'memories_updated', v_memories_updated
      );
  END;
  $$;


ALTER FUNCTION "public"."fn_learn_from_offer_sessions"("p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_learn_schedule"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_actual_days INT;
  v_trade_text TEXT;
  v_trade_uuid UUID;
  v_member_count INT;
BEGIN
  IF NEW.status NOT IN ('planned', 'in_progress', 'completed') THEN
    RETURN NEW;
  END IF;

  v_trade_text := NEW.trade;
  v_trade_uuid := NEW.trade_id;
  v_actual_days := (NEW.end_date - NEW.start_date) + 1;

  INSERT INTO schedule_learning (
    trade, trade_id, team_member_id, actual_duration_days, phase_number, project_id
  ) VALUES (
    v_trade_text, v_trade_uuid, NEW.assigned_team_member_id,
    v_actual_days, ABS(NEW.phase_number), NEW.project_id
  )
  ON CONFLICT (project_id, trade) DO UPDATE SET
    trade_id = EXCLUDED.trade_id, team_member_id = EXCLUDED.team_member_id,
    actual_duration_days = EXCLUDED.actual_duration_days,
    phase_number = EXCLUDED.phase_number, updated_at = now();

  UPDATE schedule_defaults SET
    avg_duration_days = sub.avg_dur, observation_count = sub.cnt,
    default_phase_order = sub.avg_order, updated_at = now()
  FROM (
    SELECT sl.trade, ROUND(AVG(sl.actual_duration_days), 1) AS avg_dur,
      COUNT(*) AS cnt, ROUND(AVG(sl.phase_number)) AS avg_order
    FROM schedule_learning sl WHERE sl.trade = v_trade_text GROUP BY sl.trade
  ) sub
  WHERE schedule_defaults.trade = sub.trade;

  IF NEW.assigned_team_member_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_member_count
    FROM schedule_learning
    WHERE trade = v_trade_text AND team_member_id = NEW.assigned_team_member_id;

    IF v_member_count >= 3 THEN
      UPDATE schedule_defaults
      SET default_team_member_id = NEW.assigned_team_member_id, updated_at = now()
      WHERE trade = v_trade_text;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_learn_schedule"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_map_trade_from_catalog"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_catalog_trade text;
  v_catalog_trade_id uuid;
  v_mapped_trade text;
BEGIN
  -- Only act if catalog link exists and trade is Sonstiges/NULL
  IF NEW.catalog_position_v2_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF NEW.trade IS NOT NULL AND NEW.trade::text != 'Sonstiges' THEN
    RETURN NEW;
  END IF;

  -- Get trade from catalog
  SELECT trade, trade_id INTO v_catalog_trade, v_catalog_trade_id
  FROM catalog_positions_v2
  WHERE id = NEW.catalog_position_v2_id;

  IF v_catalog_trade IS NULL OR v_catalog_trade = '' THEN
    RETURN NEW;
  END IF;

  -- Map catalog trade name to enum value
  v_mapped_trade := CASE v_catalog_trade
    WHEN 'Maler' THEN 'Maler'
    WHEN 'Sanitär' THEN 'Sanitär'
    WHEN 'Elektro' THEN 'Elektro'
    WHEN 'Fliesen' THEN 'Fliesen'
    WHEN 'Fliesenleger' THEN 'Fliesen'
    WHEN 'Maurer/Fliesenleger' THEN 'Fliesen'
    WHEN 'Tischler' THEN 'Tischler'
    WHEN 'Heizung' THEN 'Heizung'
    WHEN 'Boden' THEN 'Boden'
    WHEN 'Bodenleger' THEN 'Boden'
    WHEN 'Oberboden' THEN 'Boden'
    WHEN 'Maurer' THEN 'Maurer'
    WHEN 'Trockenbau' THEN 'Trockenbau'
    WHEN 'Reinigung' THEN 'Reinigung'
    WHEN 'Gebäudereinigung' THEN 'Reinigung'
    ELSE NULL
  END;

  IF v_mapped_trade IS NOT NULL THEN
    NEW.trade := v_mapped_trade::trade_type;
    NEW.trade_id := v_catalog_trade_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_map_trade_from_catalog"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_match_project_by_reference"("p_project_reference" "text" DEFAULT NULL::"text", "p_delivery_address" "text" DEFAULT NULL::"text") RETURNS TABLE("project_id" "uuid", "project_number" "text", "match_type" "text", "confidence" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_street TEXT;
BEGIN
  -- 1. Exakter Match auf Projektnummer
  IF p_project_reference IS NOT NULL AND p_project_reference != '' THEN
    RETURN QUERY
    SELECT p.id, p.project_number, 'project_number'::TEXT, 1.0::NUMERIC
    FROM projects p
    WHERE p.project_number = p_project_reference
      AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
    SELECT p.id, p.project_number, 'project_number_fuzzy'::TEXT, 0.8::NUMERIC
    FROM projects p
    WHERE p.project_number ILIKE '%' || p_project_reference || '%'
      AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
    ORDER BY p.created_at DESC
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 2. Adress-Match
  IF p_delivery_address IS NOT NULL AND p_delivery_address != '' THEN
    v_street := split_part(split_part(p_delivery_address, ',', 1), E'\n', 1);
    v_street := trim(v_street);

    IF length(v_street) >= 5 THEN
      RETURN QUERY
      SELECT p.id, p.project_number, 'address'::TEXT, 0.7::NUMERIC
      FROM projects p
      WHERE p.object_street ILIKE '%' || v_street || '%'
        AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
      ORDER BY p.created_at DESC
      LIMIT 1;
      IF FOUND THEN RETURN; END IF;
    END IF;

    RETURN QUERY
    SELECT p.id, p.project_number, 'zip_code'::TEXT, 0.5::NUMERIC
    FROM projects p
    WHERE p.object_zip IS NOT NULL
      AND p_delivery_address ILIKE '%' || p.object_zip || '%'
      AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  RETURN;
END;
$$;


ALTER FUNCTION "public"."fn_match_project_by_reference"("p_project_reference" "text", "p_delivery_address" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_match_project_by_reference"("p_project_reference" "text", "p_delivery_address" "text") IS 'Matcht Belege auf Projekte via Projektnummer (BL-YYYY-NNN) oder Lieferadresse';



CREATE OR REPLACE FUNCTION "public"."fn_match_project_by_text"("p_text" "text") RETURNS TABLE("project_id" "uuid", "project_name" "text", "match_score" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, 
    CASE
      -- Exact street match
      WHEN p_text ILIKE '%' || p.object_street || '%' THEN 100
      -- Partial street (first word)
      WHEN p.object_street IS NOT NULL 
        AND p_text ILIKE '%' || split_part(p.object_street, ' ', 1) || '%' THEN 70
      -- Project number match
      WHEN p.project_number IS NOT NULL 
        AND p_text ILIKE '%' || p.project_number || '%' THEN 90
      ELSE 0
    END as match_score
  FROM projects p
  WHERE p.status NOT IN ('COMPLETED', 'CANCELLED', 'ARCHIVED')
    AND (
      p_text ILIKE '%' || p.object_street || '%'
      OR (p.object_street IS NOT NULL AND p_text ILIKE '%' || split_part(p.object_street, ' ', 1) || '%')
      OR (p.project_number IS NOT NULL AND p_text ILIKE '%' || p.project_number || '%')
    )
  ORDER BY match_score DESC
  LIMIT 3;
END;
$$;


ALTER FUNCTION "public"."fn_match_project_by_text"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_pipeline_complete"("p_run_id" "uuid", "p_result_summary" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE pipeline_runs SET status = 'completed', current_agent = NULL, result_summary = p_result_summary, completed_at = now() WHERE id = p_run_id AND status = 'running';
END;
$$;


ALTER FUNCTION "public"."fn_pipeline_complete"("p_run_id" "uuid", "p_result_summary" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_pipeline_start"("p_project_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_run_id UUID; v_existing UUID;
BEGIN
    SELECT id INTO v_existing FROM pipeline_runs WHERE project_id = p_project_id AND status = 'running' LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RAISE EXCEPTION 'Pipeline läuft bereits für Projekt % (run_id: %)', p_project_id, v_existing;
    END IF;
    INSERT INTO pipeline_runs (project_id, status, current_agent) VALUES (p_project_id, 'running', 'plausibility') RETURNING id INTO v_run_id;
    RETURN v_run_id;
END;
$$;


ALTER FUNCTION "public"."fn_pipeline_start"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_pipeline_step_complete"("p_step_id" "uuid", "p_output" "jsonb", "p_status" "public"."pipeline_step_status" DEFAULT 'completed'::"public"."pipeline_step_status", "p_warnings" "text"[] DEFAULT '{}'::"text"[], "p_errors" "text"[] DEFAULT '{}'::"text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_run_id UUID; v_agent TEXT; v_start TIMESTAMPTZ;
BEGIN
    SELECT run_id, agent_name, started_at INTO v_run_id, v_agent, v_start FROM pipeline_steps WHERE id = p_step_id;
    UPDATE pipeline_steps SET status = p_status, output_data = p_output, warnings = p_warnings, errors = p_errors, duration_ms = EXTRACT(EPOCH FROM (now() - v_start)) * 1000, completed_at = now() WHERE id = p_step_id;
    IF p_status = 'completed' THEN
        UPDATE pipeline_runs SET agents_completed = array_append(agents_completed, v_agent) WHERE id = v_run_id;
    ELSIF p_status = 'stopped' THEN
        UPDATE pipeline_runs SET status = 'stopped', stopped_by_agent = v_agent, stop_reason = p_output->>'stop_reason', completed_at = now() WHERE id = v_run_id;
    ELSIF p_status = 'failed' THEN
        UPDATE pipeline_runs SET status = 'failed', stopped_by_agent = v_agent, stop_reason = COALESCE(p_errors[1], 'Unknown error'), completed_at = now() WHERE id = v_run_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."fn_pipeline_step_complete"("p_step_id" "uuid", "p_output" "jsonb", "p_status" "public"."pipeline_step_status", "p_warnings" "text"[], "p_errors" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_pipeline_step_start"("p_run_id" "uuid", "p_agent_name" "text", "p_step_order" integer, "p_input" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_step_id UUID;
BEGIN
    INSERT INTO pipeline_steps (run_id, agent_name, step_order, status, input_data) VALUES (p_run_id, p_agent_name, p_step_order, 'running', p_input) RETURNING id INTO v_step_id;
    UPDATE pipeline_runs SET current_agent = p_agent_name, updated_at = now() WHERE id = p_run_id;
    RETURN v_step_id;
END;
$$;


ALTER FUNCTION "public"."fn_pipeline_step_start"("p_run_id" "uuid", "p_agent_name" "text", "p_step_order" integer, "p_input" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_reject_intake"("p_approval_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_approval RECORD;
BEGIN
  SELECT * INTO v_approval
  FROM approvals
  WHERE id = p_approval_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden');
  END IF;

  IF v_approval.status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe ist nicht mehr PENDING (aktuell: ' || v_approval.status::text || ')');
  END IF;

  IF v_approval.approval_type != 'PROJECT_START' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diese Funktion ist nur fuer PROJECT_START Approvals');
  END IF;

  UPDATE approvals SET
    status = 'REJECTED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'rejected_intake',
    feedback_reason = COALESCE(p_reason, 'Abgelehnt via Freigabecenter'),
    updated_at = now()
  WHERE id = p_approval_id;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES (
    'APPROVAL_DECIDED',
    v_approval.project_id,
    'app',
    'freigabecenter_reject',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approval_type', 'PROJECT_START',
      'decision', 'REJECTED',
      'reason', COALESCE(p_reason, 'Abgelehnt via Freigabecenter')
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_approval.project_id,
    'status', 'REJECTED'
  );
END;
$$;


ALTER FUNCTION "public"."fn_reject_intake"("p_approval_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_request_agent_task"("p_agent_function" "text", "p_agent_input" "jsonb", "p_project_id" "uuid" DEFAULT NULL::"uuid", "p_idempotency_key" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
    v_valid_functions TEXT[] := ARRAY[
        'lookup-catalog', 'create-offer', 'run-autoplan',
        'parse-lv', 'calculate-offer', 'generate-pdf', 'run-godmode'
    ];
BEGIN
    IF p_agent_function IS NULL OR p_agent_function = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'agent_function ist erforderlich');
    END IF;

    IF NOT (p_agent_function = ANY(v_valid_functions)) THEN
        RETURN jsonb_build_object('success', false, 'error',
            'Unbekannte Funktion: ' || p_agent_function || '. Erlaubt: ' || array_to_string(v_valid_functions, ', '));
    END IF;

    INSERT INTO events (
        event_type, project_id, source_system, source_flow, payload, idempotency_key
    ) VALUES (
        'AGENT_TASK_REQUESTED', p_project_id, 'db', 'fn_request_agent_task',
        jsonb_build_object(
            'agent_function', p_agent_function,
            'agent_input', p_agent_input,
            'requested_at', now()
        ),
        p_idempotency_key
    )
    RETURNING id INTO v_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'agent_function', p_agent_function,
        'message', 'Agent-Task wurde angefordert.'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task mit diesem Idempotency-Key existiert bereits');
END;
$$;


ALTER FUNCTION "public"."fn_request_agent_task"("p_agent_function" "text", "p_agent_input" "jsonb", "p_project_id" "uuid", "p_idempotency_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_request_agent_task"("p_agent_function" "text", "p_agent_input" "jsonb", "p_project_id" "uuid", "p_idempotency_key" "text") IS 'Erstellt AGENT_TASK_REQUESTED Event für MX_01 Agent Dispatcher.';



CREATE OR REPLACE FUNCTION "public"."fn_resolve_duplicate_check"("p_approval_id" "uuid", "p_decision" "text", "p_decided_by" "text" DEFAULT 'app_gf'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_approval RECORD;
  v_attach_result JSONB;
  v_feedback_cat TEXT;
BEGIN
  SELECT a.*,
         a.request_data->>'matched_project_id' AS matched_pid,
         a.request_data->>'catalog_type' AS catalog_type,
         a.request_data->>'pdf_storage_path' AS pdf_path
  INTO v_approval
  FROM approvals a
  WHERE a.id = p_approval_id
    AND a.approval_type = 'DUPLICATE_CHECK'
    AND a.status = 'PENDING'
  FOR UPDATE;

  IF v_approval.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Approval nicht gefunden oder bereits entschieden'
    );
  END IF;

  IF p_decision = 'ATTACH' THEN
    SELECT attach_offer_to_project(
      (v_approval.matched_pid)::uuid,
      jsonb_build_object(
        'catalog_type', v_approval.catalog_type,
        'source_pdf_path', v_approval.pdf_path,
        'idempotency_key', 'dupcheck_resolve_' || p_approval_id
      )
    ) INTO v_attach_result;

    v_feedback_cat := 'approved_intake';

    UPDATE approvals
    SET status = 'APPROVED',
        decided_at = now(),
        decided_by = p_decided_by,
        decision_channel = 'freigabecenter',
        feedback_category = v_feedback_cat,
        feedback_reason = 'Angebot an bestehendes Projekt angehaengt',
        feedback_data = v_attach_result,
        updated_at = now()
    WHERE id = p_approval_id;

    RETURN jsonb_build_object(
      'success', true,
      'decision', 'ATTACH',
      'attach_result', v_attach_result,
      'message', 'Angebot an bestehendes Projekt angehaengt'
    );

  ELSIF p_decision = 'KEEP_NEW' THEN
    v_feedback_cat := 'rejected_intake';

    UPDATE approvals
    SET status = 'REJECTED',
        decided_at = now(),
        decided_by = p_decided_by,
        decision_channel = 'freigabecenter',
        feedback_category = v_feedback_cat,
        feedback_reason = 'Neues Projekt behalten — kein Duplikat',
        updated_at = now()
    WHERE id = p_approval_id;

    RETURN jsonb_build_object(
      'success', true,
      'decision', 'KEEP_NEW',
      'message', 'Neues Projekt beibehalten, kein Merge'
    );

  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ungueltiger Decision-Typ: ' || p_decision || '. Erlaubt: ATTACH, KEEP_NEW'
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."fn_resolve_duplicate_check"("p_approval_id" "uuid", "p_decision" "text", "p_decided_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_resolve_duplicate_check"("p_approval_id" "uuid", "p_decision" "text", "p_decided_by" "text") IS 'Loest DUPLICATE_CHECK Approval auf: ATTACH = Angebot anhaengen, KEEP_NEW = Neues Projekt behalten.';



CREATE OR REPLACE FUNCTION "public"."fn_route_file_to_folder"("p_project_id" "uuid", "p_doc_type" "text", "p_file_name" "text", "p_storage_path" "text", "p_mime_type" "text" DEFAULT 'application/pdf'::"text", "p_file_size_bytes" integer DEFAULT NULL::integer, "p_source_ref" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_folder_name TEXT;
  v_folder_id UUID;
  v_file_type TEXT;
  v_file_id UUID;
  v_action TEXT;
BEGIN
  -- 1. Map doc_type to folder
  v_folder_name := CASE p_doc_type
    WHEN 'MAGICPLAN' THEN '03_Aufmass'
    WHEN 'PROJECT_ORDER' THEN '01_Auftrag'
    WHEN 'INVOICE_IN' THEN '04_Rechnung'
    WHEN 'CREDIT_NOTE' THEN '04_Rechnung'
    WHEN 'BID_REQUEST' THEN '02_Angebot'
    WHEN 'REMINDER' THEN '08_Kommunikation'
    ELSE '09_Sonstiges'
  END;

  -- 2. Find folder
  SELECT id INTO v_folder_id
  FROM project_folders
  WHERE project_id = p_project_id AND name = v_folder_name;

  IF v_folder_id IS NULL THEN
    INSERT INTO project_folders (project_id, name)
    VALUES (p_project_id, v_folder_name)
    RETURNING id INTO v_folder_id;
  END IF;

  -- 3. Determine file_type
  v_file_type := CASE
    WHEN p_mime_type ILIKE '%pdf%' THEN 'pdf'
    WHEN p_mime_type ILIKE '%image%' THEN 'photo'
    WHEN p_mime_type ILIKE '%csv%' OR p_mime_type ILIKE '%excel%' THEN 'document'
    ELSE 'document'
  END;

  -- 4. Insert with ON CONFLICT (idempotent)
  INSERT INTO project_files (project_id, folder_id, file_name, file_type, mime_type, file_size_bytes, storage_path)
  VALUES (p_project_id, v_folder_id, p_file_name, v_file_type, p_mime_type, p_file_size_bytes, p_storage_path)
  ON CONFLICT (project_id, file_type, file_name) 
  DO UPDATE SET 
    storage_path = EXCLUDED.storage_path,
    folder_id = EXCLUDED.folder_id,
    updated_at = now()
  RETURNING id, CASE WHEN xmax = 0 THEN 'created' ELSE 'updated' END
  INTO v_file_id, v_action;

  RETURN jsonb_build_object(
    'success', true,
    'file_id', v_file_id,
    'folder_name', v_folder_name,
    'folder_id', v_folder_id,
    'action', v_action
  );
END;
$$;


ALTER FUNCTION "public"."fn_route_file_to_folder"("p_project_id" "uuid", "p_doc_type" "text", "p_file_name" "text", "p_storage_path" "text", "p_mime_type" "text", "p_file_size_bytes" integer, "p_source_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_site_captures_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_site_captures_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_start_project_session"("p_project_id" "uuid", "p_user_id" "uuid", "p_device_info" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      v_session_id UUID;
      v_team_member_id UUID;
  BEGIN
      UPDATE project_sessions
      SET ended_at = now()
      WHERE project_id = p_project_id
        AND user_id = p_user_id
        AND ended_at IS NULL;

      SELECT id INTO v_team_member_id
      FROM team_members
      WHERE auth_id = p_user_id
      LIMIT 1;

      INSERT INTO project_sessions (project_id, user_id, team_member_id, device_info)
      VALUES (p_project_id, p_user_id, v_team_member_id, p_device_info)
      RETURNING id INTO v_session_id;

      RETURN v_session_id;
  END;
  $$;


ALTER FUNCTION "public"."fn_start_project_session"("p_project_id" "uuid", "p_user_id" "uuid", "p_device_info" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_trades_auto_alias"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO trade_aliases (alias, trade_id, source)
  VALUES (NEW.name, NEW.id, 'system')
  ON CONFLICT (alias) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_trades_auto_alias"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_catalog_prices_from_offer"("p_offer_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      v_pos RECORD;
      v_updated INT := 0;
      v_skipped INT := 0;
  BEGIN
      FOR v_pos IN
          SELECT op.catalog_position_v2_id, op.unit_price, op.catalog_code
          FROM offer_positions op
          WHERE op.offer_id = p_offer_id
            AND op.deleted_at IS NULL
            AND op.catalog_position_v2_id IS NOT NULL
            AND op.unit_price > 0
      LOOP
          UPDATE catalog_positions_v2
          SET base_price_eur = v_pos.unit_price,
              price_updated_at = now(),
              updated_at = now()
          WHERE id = v_pos.catalog_position_v2_id
            AND (base_price_eur IS NULL
                 OR base_price_eur != v_pos.unit_price
                 OR price_updated_at IS NULL);

          IF FOUND THEN
              v_updated := v_updated + 1;
          ELSE
              v_skipped := v_skipped + 1;
          END IF;
      END LOOP;

      RETURN jsonb_build_object(
          'success', true,
          'offer_id', p_offer_id,
          'prices_updated', v_updated,
          'prices_unchanged', v_skipped
      );
  END;
  $$;


ALTER FUNCTION "public"."fn_update_catalog_prices_from_offer"("p_offer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_user_has_project_access"("p_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT public.fn_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_assignments
      WHERE project_id = p_project_id
        AND team_member_id = public.fn_user_team_member_id()
    );
$$;


ALTER FUNCTION "public"."fn_user_has_project_access"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_user_team_member_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT id FROM public.team_members
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;


ALTER FUNCTION "public"."fn_user_team_member_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_wabs_create_site_inspection"("p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_offer_id      UUID;
  v_catalog       TEXT;
  v_catalog_label TEXT;
  v_row_count     INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  SELECT id INTO v_offer_id
  FROM offers
  WHERE project_id = p_project_id
    AND deleted_at IS NULL
  ORDER BY created_at
  LIMIT 1;

  SELECT price_catalog INTO v_catalog
  FROM projects
  WHERE id = p_project_id;

  v_catalog_label := CASE
    WHEN v_catalog ILIKE '%WABS%' THEN 'WABS'
    WHEN v_catalog ILIKE '%AV%'   THEN 'AV'
    ELSE NULL
  END;

  INSERT INTO approvals (project_id, approval_type, status, requested_at, request_summary, request_data)
  SELECT
    p_project_id,
    'SITE_INSPECTION',
    'PENDING',
    now(),
    'Erstbegehung erforderlich: Vor-Ort-Begehung um Monteure, Material und Umfang zu klaeren',
    jsonb_strip_nulls(jsonb_build_object(
      'offer_id',      v_offer_id,
      'catalog_label', v_catalog_label
    ))
  WHERE NOT EXISTS (
    SELECT 1 FROM approvals
    WHERE project_id = p_project_id
      AND approval_type = 'SITE_INSPECTION'
      AND status = 'PENDING'
  );

  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
  VALUES (
    'SITE_INSPECTION_CREATED',
    p_project_id,
    'db_function',
    'fn_wabs_create_site_inspection',
    jsonb_build_object(
      'offer_id',       v_offer_id,
      'catalog_label',  v_catalog_label,
      'already_existed', v_row_count = 0
    )
  );

  RETURN jsonb_build_object(
    'success',         true,
    'offer_id',        v_offer_id,
    'catalog_label',   v_catalog_label,
    'already_existed', v_row_count = 0
  );
END;
$$;


ALTER FUNCTION "public"."fn_wabs_create_site_inspection"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_wabs_create_site_inspection"("p_project_id" "uuid") IS 'Legt SITE_INSPECTION Approval fuer WABS/AV-Direktauftraege an. Idempotent — legt keinen zweiten an wenn bereits PENDING. Nach Projekt + Angebots-Anlage aufrufen (z.B. von n8n M1_02 oder parse-lv Edge Function).';



CREATE OR REPLACE FUNCTION "public"."generate_all_project_materials"("p_project_id" "uuid") RETURNS TABLE("positions_processed" integer, "materials_created" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_position RECORD;
  v_pos_count INTEGER := 0;
  v_mat_count INTEGER := 0;
  v_result INTEGER;
BEGIN
  FOR v_position IN
    SELECT op.id
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    WHERE o.project_id = p_project_id
      AND op.catalog_position_v2_id IS NOT NULL
  LOOP
    v_result := generate_project_materials(p_project_id, v_position.id);
    v_pos_count := v_pos_count + 1;
    v_mat_count := v_mat_count + v_result;
  END LOOP;
  
  positions_processed := v_pos_count;
  materials_created := v_mat_count;
  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."generate_all_project_materials"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_change_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_year TEXT;
    v_next_num INTEGER;
    v_number TEXT;
BEGIN
    v_year := to_char(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(change_order_number FROM 'N-' || v_year || '-(\d+)')
                AS INTEGER
            )
        ), 0
    ) + 1
    INTO v_next_num
    FROM change_orders
    WHERE change_order_number LIKE 'N-' || v_year || '-%';
    
    v_number := 'N-' || v_year || '-' || LPAD(v_next_num::TEXT, 3, '0');
    
    RETURN v_number;
END;
$$;


ALTER FUNCTION "public"."generate_change_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_customer_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  seq INT;
BEGIN
  IF NEW.customer_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(
    CASE 
      WHEN customer_number ~ ('^K-' || yr || '-\d+$')
      THEN CAST(split_part(customer_number, '-', 3) AS INT)
      ELSE 0
    END
  ), 0) + 1 INTO seq
  FROM clients;

  NEW.customer_number := 'K-' || yr || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."generate_customer_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_display_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Nur generieren wenn nicht manuell gesetzt
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    NEW.display_name := NEW.object_street || 
      CASE 
        WHEN NEW.object_floor IS NOT NULL AND NEW.object_floor != '' 
        THEN ', ' || NEW.object_floor 
        ELSE '' 
      END;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_display_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_year TEXT;
    v_next_num INTEGER;
    v_invoice_number TEXT;
BEGIN
    v_year := to_char(CURRENT_DATE, 'YYYY');
    
    -- Höchste Nummer dieses Jahres finden
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(invoice_number FROM 'R-' || v_year || '-(\d+)')
                AS INTEGER
            )
        ), 0
    ) + 1
    INTO v_next_num
    FROM sales_invoices
    WHERE invoice_number LIKE 'R-' || v_year || '-%';
    
    v_invoice_number := 'R-' || v_year || '-' || LPAD(v_next_num::TEXT, 3, '0');
    
    RETURN v_invoice_number;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_offer_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  seq INT;
BEGIN
  IF NEW.offer_number IS NOT NULL AND NEW.offer_number LIKE 'A-%' THEN
    RETURN NEW;
  END IF;

  seq := nextval('offer_number_seq');
  NEW.offer_number := 'A-' || yr || '-' || seq::TEXT;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_offer_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_offer_pdf"("p_offer_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_offer RECORD;
  v_project_id UUID;
  v_event_id UUID;
BEGIN
  -- Validate offer
  SELECT o.id, o.offer_number, o.project_id
  INTO v_offer
  FROM offers o
  WHERE o.id = p_offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Angebot nicht gefunden: %', p_offer_id;
  END IF;

  -- Fire Event
  INSERT INTO events (
    event_type,
    project_id,
    source_system,
    source_flow,
    payload
  ) VALUES (
    'OFFER_GENERATION_REQUESTED',
    v_offer.project_id,
    'webapp',
    'OfferEditor',
    jsonb_build_object(
      'offer_id', p_offer_id,
      'offer_number', v_offer.offer_number
    )
  )
  RETURNING id INTO v_event_id;

  RETURN json_build_object(
    'success', true,
    'event_id', v_event_id,
    'message', 'PDF-Generierung gestartet'
  );
END;
$$;


ALTER FUNCTION "public"."generate_offer_pdf"("p_offer_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_offer_pdf"("p_offer_id" "uuid") IS 'Startet die PDF-Generierung für ein Angebot. Fires OFFER_GENERATION_REQUESTED event.';



CREATE OR REPLACE FUNCTION "public"."generate_packing_list"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_materials_count INT := 0;
  v_tools_count INT := 0;
  v_tool_item TEXT;
  v_tool_items TEXT[];
  v_position RECORD;
BEGIN
  -- 1. Insert aggregated MATERIALS
  INSERT INTO project_packing_list (
    project_id, item_type, item_name, quantity, unit, source, confirmed
  )
  SELECT 
    p_project_id,
    'material'::packing_item_type,
    material_name,
    total_with_waste,
    unit,
    'calculated',
    true  -- Auto-confirmed since calculated
  FROM get_project_materials_summary(p_project_id)
  ON CONFLICT (project_id, item_type, item_name) 
  DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    updated_at = now();
  
  GET DIAGNOSTICS v_materials_count = ROW_COUNT;

  -- 2. Extract and insert TOOLS from tools_note
  FOR v_position IN 
    SELECT 
      op.id as position_id,
      op.tools_note
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    WHERE o.project_id = p_project_id
      AND op.tools_note IS NOT NULL 
      AND op.tools_note != ''
      AND op.deleted_at IS NULL
  LOOP
    -- Split by comma and trim
    v_tool_items := string_to_array(v_position.tools_note, ',');
    
    FOREACH v_tool_item IN ARRAY v_tool_items
    LOOP
      v_tool_item := trim(v_tool_item);
      IF v_tool_item != '' THEN
        INSERT INTO project_packing_list (
          project_id, item_type, item_name, quantity, unit, 
          source, source_position_id, confirmed
        )
        VALUES (
          p_project_id,
          'tool'::packing_item_type,
          v_tool_item,
          1,
          'Stück',
          'tools_note',
          v_position.position_id,
          true  -- User entered = confirmed
        )
        ON CONFLICT (project_id, item_type, item_name) DO NOTHING;
        
        v_tools_count := v_tools_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'materials_count', v_materials_count,
    'tools_count', v_tools_count
  );
END;
$$;


ALTER FUNCTION "public"."generate_packing_list"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_packing_list"("p_project_id" "uuid") IS 'Generates initial packing list from calculated materials and tools_note fields.
Call after complete_erstbegehung or when MagicPlan data arrives.';



CREATE OR REPLACE FUNCTION "public"."generate_project_materials"("p_project_id" "uuid", "p_offer_position_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_position RECORD;
  v_requirement RECORD;
  v_quantity NUMERIC;
  v_count INTEGER := 0;
BEGIN
  -- Hole Position-Details
  SELECT op.*, cp.trade as catalog_trade, m.measured_quantity
  INTO v_position
  FROM offer_positions op
  LEFT JOIN catalog_positions_v2 cp ON cp.id = op.catalog_position_v2_id
  LEFT JOIN measurements m ON m.offer_position_id = op.id AND m.status = 'confirmed'
  WHERE op.id = p_offer_position_id;
  
  IF v_position IS NULL THEN
    RAISE EXCEPTION 'Position % nicht gefunden', p_offer_position_id;
  END IF;
  
  -- Für jede Material-Anforderung der Katalogposition
  FOR v_requirement IN
    SELECT * FROM position_material_requirements
    WHERE catalog_position_v2_id = v_position.catalog_position_v2_id
  LOOP
    -- Berechne Menge basierend auf Mode
    v_quantity := CASE v_requirement.quantity_mode
      WHEN 'fixed' THEN v_requirement.default_quantity
      WHEN 'per_unit' THEN v_requirement.default_quantity * COALESCE(v_position.measured_quantity, v_position.quantity, 1)
      WHEN 'per_sqm' THEN v_requirement.default_quantity * COALESCE(v_position.measured_quantity, v_position.quantity, 1)
      WHEN 'per_m' THEN v_requirement.default_quantity * COALESCE(v_position.measured_quantity, v_position.quantity, 1)
      ELSE v_requirement.default_quantity
    END;
    
    -- Insert Material (idempotent mit explizitem Target)
    INSERT INTO project_materials (
      project_id,
      offer_position_id,
      material_type,
      trade,
      quantity,
      quantity_unit,
      product_id,
      status
    ) VALUES (
      p_project_id,
      p_offer_position_id,
      v_requirement.material_type,
      COALESCE(v_requirement.trade, v_position.catalog_trade, v_position.trade),
      v_quantity,
      COALESCE(v_requirement.quantity_unit, 'Stk'),
      v_requirement.default_product_id,
      CASE WHEN v_requirement.default_product_id IS NOT NULL THEN 'confirmed' ELSE 'planned' END
    )
    ON CONFLICT (offer_position_id, material_type) DO UPDATE SET
      quantity = EXCLUDED.quantity,
      updated_at = now();
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."generate_project_materials"("p_project_id" "uuid", "p_offer_position_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_project_materials"("p_project_id" "uuid", "p_offer_position_id" "uuid") IS 'Generiert Material-Einträge aus Katalog-Requirements für eine Position';



CREATE OR REPLACE FUNCTION "public"."generate_project_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  year_part TEXT;
  seq_num INT;
BEGIN
  IF NEW.project_number IS NULL THEN
    year_part := to_char(now(), 'YYYY');
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(project_number FROM 'BL-' || year_part || '-(\d+)') AS INT)
    ), 0) + 1
    INTO seq_num
    FROM projects
    WHERE project_number LIKE 'BL-' || year_part || '-%';
    
    NEW.project_number := 'BL-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_project_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_project_schedule"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_start_date DATE;
  v_current_date DATE;
  v_phase_number INT := 0;
  v_trade RECORD;
  v_duration INT;
  v_team_member_id UUID;
  v_team_member_name TEXT;
  v_prev_phase_id UUID;
  v_phases_created INT := 0;
  v_schedule_start DATE;
  v_schedule_end DATE;
BEGIN
  -- 1. Startdatum: planned_start oder 3 Werktage ab heute
  SELECT COALESCE(p.planned_start, CURRENT_DATE + 3)
  INTO v_start_date
  FROM projects p WHERE p.id = p_project_id;

  IF v_start_date IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Project not found');
  END IF;

  v_current_date := v_start_date;

  -- 2. Bestehende Phasen löschen (Neugenerierung)
  DELETE FROM schedule_phases WHERE project_id = p_project_id;

  -- 3. Gewerke aus bestätigten Positionen, sortiert nach Reihenfolge
  FOR v_trade IN
    SELECT
      op.trade::TEXT AS trade_name,
      SUM(COALESCE(m.measured_quantity, op.quantity, 1)) AS total_qty,
      COUNT(*) AS pos_count
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN measurements m ON m.offer_position_id = op.id AND m.status = 'confirmed'
    WHERE o.project_id = p_project_id
      AND op.deleted_at IS NULL
      AND op.inspection_status = 'confirmed'
    GROUP BY op.trade
    ORDER BY CASE op.trade::TEXT
      WHEN 'Trockenbau' THEN 1
      WHEN 'Sanitär'    THEN 2
      WHEN 'Elektro'    THEN 3
      WHEN 'Fliesen'    THEN 4
      WHEN 'Maler'      THEN 5
      WHEN 'Sonstiges'  THEN 6
      ELSE 7
    END
  LOOP
    v_phase_number := v_phase_number + 1;

    -- 4. Dauer berechnen: qm / Tagesleistung, min 1 Tag
    v_duration := GREATEST(1, CEIL(v_trade.total_qty /
      CASE v_trade.trade_name
        WHEN 'Maler'      THEN 25.0
        WHEN 'Fliesen'    THEN 8.0
        WHEN 'Sanitär'    THEN 10.0
        WHEN 'Elektro'    THEN 12.0
        WHEN 'Trockenbau' THEN 10.0
        ELSE 10.0
      END
    ));

    -- 5. Wochenenden überspringen für Startdatum
    WHILE EXTRACT(DOW FROM v_current_date) IN (0, 6) LOOP
      v_current_date := v_current_date + 1;
    END LOOP;

    -- 6. Team-Vorschlag: Member mit passendem Skill, ohne Abwesenheit
    v_team_member_id := NULL;
    v_team_member_name := NULL;

    SELECT tm.id, tm.name
    INTO v_team_member_id, v_team_member_name
    FROM team_members tm
    WHERE tm.is_active = true
      AND CASE v_trade.trade_name
        WHEN 'Sanitär'    THEN 'Sanitär' = ANY(tm.skills)
        WHEN 'Elektro'    THEN 'Elektroinstallation' = ANY(tm.skills)
        WHEN 'Trockenbau' THEN 'Trockenbau' = ANY(tm.skills)
        WHEN 'Fliesen'    THEN 'Fliesen' = ANY(tm.skills)
        WHEN 'Maler'      THEN 'Maler' = ANY(tm.skills)
                               OR 'Qualitätskontrolle' = ANY(tm.skills)
                               OR 'Bauleitung' = ANY(tm.skills)
        ELSE true
      END
      AND NOT EXISTS (
        SELECT 1 FROM absences a
        WHERE a.team_member_id = tm.id
          AND a.start_date <= v_current_date + v_duration - 1
          AND a.end_date >= v_current_date
      )
    ORDER BY
      -- Primär: Exakter Skill-Match bevorzugt (Maler mit 'Maler'-Skill vor BL-Fallback)
      CASE WHEN v_trade.trade_name = ANY(tm.skills)
           OR (v_trade.trade_name = 'Elektro' AND 'Elektroinstallation' = ANY(tm.skills))
        THEN 0 ELSE 1
      END,
      -- Sekundär: Erfahrungslevel
      CASE tm.skill_level
        WHEN 'master' THEN 1
        WHEN 'senior' THEN 2
        WHEN 'junior' THEN 3
        ELSE 4
      END
    LIMIT 1;

    -- 7. Phase schreiben
    INSERT INTO schedule_phases (
      project_id, phase_number, name, trade,
      start_date, end_date,
      assigned_team_member_id, is_external,
      depends_on, estimated_hours, estimated_qty
    ) VALUES (
      p_project_id,
      v_phase_number,
      v_trade.trade_name,
      v_trade.trade_name,
      v_current_date,
      v_current_date + (v_duration - 1),
      v_team_member_id,
      false,
      CASE WHEN v_prev_phase_id IS NOT NULL
        THEN ARRAY[v_prev_phase_id]
        ELSE '{}'::UUID[]
      END,
      v_duration * 8.0,
      v_trade.total_qty
    )
    RETURNING id INTO v_prev_phase_id;

    v_phases_created := v_phases_created + 1;

    -- 8. Startdatum für nächste Phase = Ende dieser + 1
    v_current_date := v_current_date + v_duration;
  END LOOP;

  -- 9. Projekt planned_end aktualisieren
  SELECT MIN(start_date), MAX(end_date)
  INTO v_schedule_start, v_schedule_end
  FROM schedule_phases WHERE project_id = p_project_id;

  IF v_schedule_end IS NOT NULL THEN
    UPDATE projects
    SET planned_start = COALESCE(planned_start, v_schedule_start),
        planned_end = v_schedule_end,
        updated_at = now()
    WHERE id = p_project_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'phases_created', v_phases_created,
    'schedule_start', v_schedule_start,
    'schedule_end', v_schedule_end
  );
END;
$$;


ALTER FUNCTION "public"."generate_project_schedule"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_protocol_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.protocol_number IS NULL THEN
    SELECT COALESCE(MAX(protocol_number), 0) + 1
    INTO NEW.protocol_number
    FROM protocols
    WHERE project_id = NEW.project_id
      AND protocol_type = NEW.protocol_type;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_protocol_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_sales_invoice_pdf"("p_invoice_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invoice RECORD;
  v_event_id UUID;
BEGIN
  -- Validate invoice
  SELECT si.id, si.invoice_number, si.project_id
  INTO v_invoice
  FROM sales_invoices si
  WHERE si.id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rechnung nicht gefunden: %', p_invoice_id;
  END IF;

  -- Fire Event
  INSERT INTO events (
    event_type,
    project_id,
    source_system,
    source_flow,
    payload
  ) VALUES (
    'SALES_INVOICE_GENERATION_REQUESTED',
    v_invoice.project_id,
    'webapp',
    'InvoicePreviewDialog',
    jsonb_build_object(
      'invoice_id', p_invoice_id,
      'invoice_number', v_invoice.invoice_number
    )
  )
  RETURNING id INTO v_event_id;

  RETURN json_build_object(
    'success', true,
    'event_id', v_event_id,
    'message', 'Rechnungs-PDF Generierung gestartet'
  );
END;
$$;


ALTER FUNCTION "public"."generate_sales_invoice_pdf"("p_invoice_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_sales_invoice_pdf"("p_invoice_id" "uuid") IS 'Startet die PDF-Generierung für eine Ausgangsrechnung via Event-System';



CREATE OR REPLACE FUNCTION "public"."get_5_second_project_check"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_project RECORD;
  v_schedule_status TEXT;
  v_schedule_detail TEXT;
  v_budget_status TEXT;
  v_budget_detail TEXT;
  v_docs_status TEXT;
  v_docs_detail TEXT;
  v_team_status TEXT;
  v_team_detail TEXT;
  v_overall TEXT;

  -- Schedule vars
  v_total_phases INT;
  v_completed_phases INT;
  v_planned_end DATE;
  v_days_remaining INT;

  -- Budget vars
  v_costs JSON;
  v_margin DECIMAL;

  -- Docs vars
  v_eb_count INT;
  v_eb_completed INT;
  v_zb_count INT;
  v_zb_completed INT;

  -- Team vars
  v_unfilled_positions INT;
BEGIN
  -- Projekt laden
  SELECT id, name, project_number, status, planned_start, planned_end
  INTO v_project
  FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  -- ========== ZEITPLAN ==========
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_phases, v_completed_phases
  FROM schedule_phases
  WHERE project_id = p_project_id;

  -- Geplantes Ende aus letzter Phase
  SELECT MAX(end_date) INTO v_planned_end
  FROM schedule_phases
  WHERE project_id = p_project_id;

  IF v_total_phases = 0 THEN
    v_schedule_status := 'yellow';
    v_schedule_detail := 'Kein Zeitplan erstellt';
  ELSE
    v_days_remaining := (v_planned_end - CURRENT_DATE);
    IF v_completed_phases = v_total_phases THEN
      v_schedule_status := 'green';
      v_schedule_detail := 'Alle ' || v_total_phases || ' Phasen abgeschlossen';
    ELSIF v_days_remaining >= 0 THEN
      v_schedule_status := 'green';
      v_schedule_detail := v_completed_phases || '/' || v_total_phases || ' Phasen – noch ' || v_days_remaining || ' Tage';
    ELSIF v_days_remaining >= -3 THEN
      v_schedule_status := 'yellow';
      v_schedule_detail := v_completed_phases || '/' || v_total_phases || ' Phasen – ' || ABS(v_days_remaining) || ' Tage Verzug';
    ELSE
      v_schedule_status := 'red';
      v_schedule_detail := v_completed_phases || '/' || v_total_phases || ' Phasen – ' || ABS(v_days_remaining) || ' Tage Verzug!';
    END IF;
  END IF;

  -- ========== BUDGET ==========
  v_costs := calculate_project_costs(p_project_id);

  IF (v_costs->>'offer_amount')::DECIMAL = 0 THEN
    v_budget_status := 'yellow';
    v_budget_detail := 'Kein Angebot vorhanden';
  ELSE
    v_margin := (v_costs->>'margin_percent')::DECIMAL;
    v_budget_status := v_costs->>'status';
    IF v_margin >= 20 THEN
      v_budget_detail := 'Marge ' || v_margin || '% – Budget OK';
    ELSIF v_margin >= 10 THEN
      v_budget_detail := 'Marge ' || v_margin || '% – Budget knapp';
    ELSE
      v_budget_detail := 'Marge ' || v_margin || '% – Budget kritisch!';
    END IF;
  END IF;

  -- ========== DOKUMENTE ==========
  SELECT
    COUNT(*) FILTER (WHERE protocol_type = 'erstbegehung'),
    COUNT(*) FILTER (WHERE protocol_type = 'erstbegehung' AND status IN ('completed', 'signed')),
    COUNT(*) FILTER (WHERE protocol_type = 'zwischenbegehung'),
    COUNT(*) FILTER (WHERE protocol_type = 'zwischenbegehung' AND status IN ('completed', 'signed'))
  INTO v_eb_count, v_eb_completed, v_zb_count, v_zb_completed
  FROM inspection_protocols
  WHERE project_id = p_project_id;

  IF v_eb_completed > 0 AND v_zb_completed > 0 THEN
    v_docs_status := 'green';
    v_docs_detail := 'EB + ZB abgeschlossen';
  ELSIF v_eb_completed > 0 THEN
    v_docs_status := 'yellow';
    v_docs_detail := 'EB fertig, ZB ' || CASE WHEN v_zb_count > 0 THEN 'offen' ELSE 'noch nicht angelegt' END;
  ELSIF v_eb_count > 0 THEN
    v_docs_status := 'yellow';
    v_docs_detail := 'EB in Bearbeitung';
  ELSE
    v_docs_status := 'red';
    v_docs_detail := 'Keine Erstbegehung';
  END IF;

  -- ========== TEAM ==========
  SELECT COUNT(*) INTO v_unfilled_positions
  FROM schedule_phases
  WHERE project_id = p_project_id
    AND assigned_team_member_id IS NULL
    AND is_external = false
    AND status != 'completed';

  IF v_unfilled_positions = 0 THEN
    v_team_status := 'green';
    v_team_detail := 'Alle Positionen besetzt';
  ELSIF v_unfilled_positions <= 2 THEN
    v_team_status := 'yellow';
    v_team_detail := v_unfilled_positions || ' Position(en) offen';
  ELSE
    v_team_status := 'red';
    v_team_detail := v_unfilled_positions || ' Positionen offen!';
  END IF;

  -- ========== OVERALL ==========
  IF v_schedule_status = 'red' OR v_budget_status = 'red' OR v_docs_status = 'red' OR v_team_status = 'red' THEN
    v_overall := 'red';
  ELSIF v_schedule_status = 'yellow' OR v_budget_status = 'yellow' OR v_docs_status = 'yellow' OR v_team_status = 'yellow' THEN
    v_overall := 'yellow';
  ELSE
    v_overall := 'green';
  END IF;

  RETURN json_build_object(
    'success', true,
    'project_name', v_project.name,
    'project_number', v_project.project_number,
    'project_status', v_project.status,
    'checks', json_build_object(
      'schedule', json_build_object('status', v_schedule_status, 'label', 'Zeitplan', 'detail', v_schedule_detail),
      'budget', json_build_object('status', v_budget_status, 'label', 'Budget', 'detail', v_budget_detail),
      'documents', json_build_object('status', v_docs_status, 'label', 'Dokumente', 'detail', v_docs_detail),
      'team', json_build_object('status', v_team_status, 'label', 'Team', 'detail', v_team_detail)
    ),
    'overall_status', v_overall
  );
END;
$$;


ALTER FUNCTION "public"."get_5_second_project_check"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_5_second_project_check"("p_project_id" "uuid") IS '5-Sekunden-Ampelcheck: Zeitplan, Budget, Dokumente, Team → grün/gelb/rot.';



CREATE OR REPLACE FUNCTION "public"."get_cheapest_supplier"("p_internal_sku" "text" DEFAULT NULL::"text", "p_internal_name" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text") RETURNS TABLE("supplier_id" "uuid", "supplier_code" "text", "supplier_name" "text", "article_id" "uuid", "article_number" "text", "unit_price" numeric, "purchase_unit" "public"."purchase_unit")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vcs.supplier_id,
    vcs.supplier_code,
    vcs.supplier_name,
    vcs.supplier_article_id,
    vcs.supplier_article_number,
    vcs.unit_price_net,
    vcs.purchase_unit
  FROM v_cheapest_supplier vcs
  WHERE 
    (p_internal_sku IS NULL OR vcs.internal_sku = p_internal_sku)
    AND (p_internal_name IS NULL OR vcs.internal_name ILIKE '%' || p_internal_name || '%')
    AND (p_category IS NULL OR vcs.category = p_category)
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_cheapest_supplier"("p_internal_sku" "text", "p_internal_name" "text", "p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_cheapest_supplier"("p_internal_sku" "text", "p_internal_name" "text", "p_category" "text") IS 'Findet günstigsten Lieferanten für einen Artikel';



CREATE OR REPLACE FUNCTION "public"."get_company_setting"("p_key" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT value FROM company_settings WHERE key = p_key;
$$;


ALTER FUNCTION "public"."get_company_setting"("p_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH draft_purchase AS (
    SELECT
      pi.id,
      pi.invoice_number,
      pi.total_gross,
      pi.created_at,
      pi.expense_category,
      s.name AS supplier_name
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON s.id = pi.supplier_id
    WHERE pi.status = 'DRAFT'
    ORDER BY pi.created_at DESC
  ),
  draft_sales AS (
    SELECT
      si.id,
      si.invoice_number,
      si.total_gross,
      si.invoice_date,
      si.created_at,
      si.status,
      c.company_name AS client_name,
      p.name AS project_name
    FROM sales_invoices si
    LEFT JOIN clients c ON c.id = si.client_id
    LEFT JOIN projects p ON p.id = si.project_id
    WHERE si.status IN ('DRAFT', 'REJECTED')
    ORDER BY si.created_at DESC
  ),
  overdue AS (
    SELECT
      pi.id,
      pi.invoice_number,
      pi.total_gross,
      pi.due_date,
      pi.status,
      s.name AS supplier_name,
      (CURRENT_DATE - pi.due_date) AS days_overdue
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON s.id = pi.supplier_id
    WHERE pi.status NOT IN ('PAID', 'CANCELLED')
      AND pi.due_date < CURRENT_DATE
    ORDER BY pi.due_date ASC
  ),
  stale_proj AS (
    SELECT
      p.id,
      p.project_number,
      p.name,
      p.status,
      p.updated_at,
      (CURRENT_DATE - p.updated_at::DATE) AS days_stale
    FROM projects p
    WHERE p.status = 'ACTIVE'
      AND p.updated_at < (CURRENT_DATE - INTERVAL '14 days')
    ORDER BY p.updated_at ASC
  ),
  stale_off AS (
    SELECT
      o.id,
      o.offer_number,
      o.total_net,
      o.status,
      o.created_at,
      p.name AS project_name,
      (CURRENT_DATE - o.created_at::DATE) AS days_old
    FROM offers o
    LEFT JOIN projects p ON p.id = o.project_id
    WHERE o.status IN ('DRAFT', 'SENT')
      AND o.created_at < (CURRENT_DATE - INTERVAL '7 days')
    ORDER BY o.created_at ASC
  )
  SELECT json_build_object(
    'pending_purchase_invoices', COALESCE((SELECT json_agg(row_to_json(dp)) FROM draft_purchase dp), '[]'::JSON),
    'pending_sales_invoices', COALESCE((SELECT json_agg(row_to_json(ds)) FROM draft_sales ds), '[]'::JSON),
    'overdue_invoices', COALESCE((SELECT json_agg(row_to_json(ov)) FROM overdue ov), '[]'::JSON),
    'stale_projects', COALESCE((SELECT json_agg(row_to_json(sp)) FROM stale_proj sp), '[]'::JSON),
    'stale_offers', COALESCE((SELECT json_agg(row_to_json(so)) FROM stale_off so), '[]'::JSON),
    'counts', json_build_object(
      'pending_purchase', (SELECT COUNT(*) FROM draft_purchase),
      'pending_sales', (SELECT COUNT(*) FROM draft_sales),
      'overdue', (SELECT COUNT(*) FROM overdue),
      'stale_projects', (SELECT COUNT(*) FROM stale_proj),
      'stale_offers', (SELECT COUNT(*) FROM stale_off)
    ),
    'totals', json_build_object(
      'pending_amount', COALESCE((SELECT SUM(total_gross) FROM draft_purchase), 0) +
                        COALESCE((SELECT SUM(total_gross) FROM draft_sales), 0),
      'overdue_amount', COALESCE((SELECT SUM(total_gross) FROM overdue), 0)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_summary"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_summary"() IS 'Konsolidiert alle ChefInbox-Daten in einem Call. Ersetzt 5 separate Frontend-Queries.';



CREATE OR REPLACE FUNCTION "public"."get_folder_from_registry"("p_folder_key" "text") RETURNS TABLE("folder_id" "text", "full_path" "text", "parent_id" "text", "found" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dfr.drive_folder_id,
    dfr.full_path,
    dfr.parent_folder_id,
    TRUE
  FROM drive_folder_registry dfr
  WHERE dfr.folder_key = p_folder_key;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_folder_from_registry"("p_folder_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inspection_protocol_details"("p_protocol_id" "uuid") RETURNS TABLE("protocol_id" "uuid", "protocol_type" "text", "protocol_number" "text", "inspection_date" "date", "status" "text", "inspector_name" "text", "general_notes" "text", "project_id" "uuid", "project_number" "text", "project_address" "text", "client_id" "uuid", "client_name" "text", "item_id" "uuid", "offer_position_id" "uuid", "position_code" "text", "position_title" "text", "trade" "text", "item_status" "text", "progress_percent" integer, "notes" "text", "default_product_id" "uuid", "default_product_name" "text", "default_product_format" "text", "override_product_id" "uuid", "override_product_name" "text", "wet_area_type" "text", "has_defect" boolean, "requires_supplement" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ip.id AS protocol_id,
        ip.protocol_type,
        ip.protocol_number,
        ip.inspection_date,
        ip.status,
        ip.inspector_name,
        ip.general_notes,
        p.id AS project_id,
        p.project_number,
        CONCAT_WS(', ', p.object_street, CONCAT(p.object_zip, ' ', p.object_city)) AS project_address,
        p.client_id,
        c.company_name AS client_name,
        ipi.id AS item_id,
        ipi.offer_position_id,
        COALESCE(op.catalog_code, op.position_number::text) AS position_code,
        op.title AS position_title,
        op.trade,
        ipi.status AS item_status,
        ipi.progress_percent,
        ipi.notes,
        cpd.product_id AS default_product_id,
        prod_def.name AS default_product_name,
        cpd.product_format AS default_product_format,
        ipi.product_override_id AS override_product_id,
        prod_ovr.name AS override_product_name,
        ipi.wet_area_type,
        ipi.has_defect,
        ipi.requires_supplement
    FROM inspection_protocols ip
    JOIN projects p ON p.id = ip.project_id
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN inspection_protocol_items ipi ON ipi.protocol_id = ip.id
    LEFT JOIN offer_positions op ON op.id = ipi.offer_position_id
    LEFT JOIN client_product_defaults cpd ON cpd.client_id = p.client_id 
        AND cpd.catalog_position_id = op.catalog_position_v2_id
    LEFT JOIN products prod_def ON prod_def.id = cpd.product_id
    LEFT JOIN products prod_ovr ON prod_ovr.id = ipi.product_override_id
    WHERE ip.id = p_protocol_id
    ORDER BY ipi.sort_order;
END;
$$;


ALTER FUNCTION "public"."get_inspection_protocol_details"("p_protocol_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lexware_sync_queue"("p_entity_type" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Clients ohne Lexware-ID
  WITH unsynced_clients AS (
    SELECT id, company_name, first_name, last_name, email, phone, street, zip_code, city
    FROM clients
    WHERE lexware_contact_id IS NULL
      AND (p_entity_type IS NULL OR p_entity_type = 'client')
    LIMIT p_limit
  ),
  -- Suppliers ohne Lexware-ID
  unsynced_suppliers AS (
    SELECT id, name, email, phone, street, zip_code, city, our_customer_number
    FROM suppliers
    WHERE lexware_contact_id IS NULL
      AND is_active = true
      AND (p_entity_type IS NULL OR p_entity_type = 'supplier')
    LIMIT p_limit
  ),
  -- Rechnungen ohne Lexware-ID
  unsynced_sales AS (
    SELECT si.id, si.invoice_number, si.total_net, si.total_gross, si.invoice_date, si.due_date,
           si.status, c.company_name AS client_name, c.lexware_contact_id AS client_lexware_id
    FROM sales_invoices si
    JOIN clients c ON c.id = si.client_id
    WHERE si.lexware_invoice_id IS NULL
      AND si.status NOT IN ('DRAFT', 'CANCELLED')
      AND (p_entity_type IS NULL OR p_entity_type = 'sales_invoice')
    LIMIT p_limit
  ),
  -- Eingangsrechnungen ohne Lexware-ID
  unsynced_purchases AS (
    SELECT pi.id, pi.invoice_number, pi.subtotal_net, pi.total_gross, pi.invoice_date, pi.due_date,
           pi.status, s.name AS supplier_name, s.lexware_contact_id AS supplier_lexware_id
    FROM purchase_invoices pi
    JOIN suppliers s ON s.id = pi.supplier_id
    WHERE pi.lexware_voucher_id IS NULL
      AND pi.status NOT IN ('DRAFT', 'CANCELLED')
      AND (p_entity_type IS NULL OR p_entity_type = 'purchase_invoice')
    LIMIT p_limit
  )
  SELECT json_build_object(
    'success', true,
    'clients', COALESCE((SELECT json_agg(row_to_json(c)) FROM unsynced_clients c), '[]'::JSON),
    'suppliers', COALESCE((SELECT json_agg(row_to_json(s)) FROM unsynced_suppliers s), '[]'::JSON),
    'sales_invoices', COALESCE((SELECT json_agg(row_to_json(si)) FROM unsynced_sales si), '[]'::JSON),
    'purchase_invoices', COALESCE((SELECT json_agg(row_to_json(pi)) FROM unsynced_purchases pi), '[]'::JSON),
    'total_pending', (
      (SELECT COUNT(*) FROM clients WHERE lexware_contact_id IS NULL) +
      (SELECT COUNT(*) FROM suppliers WHERE lexware_contact_id IS NULL AND is_active = true) +
      (SELECT COUNT(*) FROM sales_invoices WHERE lexware_invoice_id IS NULL AND status NOT IN ('DRAFT', 'CANCELLED')) +
      (SELECT COUNT(*) FROM purchase_invoices WHERE lexware_voucher_id IS NULL AND status NOT IN ('DRAFT', 'CANCELLED'))
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_lexware_sync_queue"("p_entity_type" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_lexware_sync_queue"("p_entity_type" "text", "p_limit" integer) IS 'Lexware-Sync: Alle Entitäten ohne Lexware-ID für den n8n-Sync-Flow.';



CREATE OR REPLACE FUNCTION "public"."get_marge_dashboard"("p_include_completed" boolean DEFAULT false) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_projects JSON;
  v_summary JSON;
  v_result JSON;
BEGIN
  -- Projekte mit Kosten sammeln
  WITH project_data AS (
    SELECT
      p.id,
      p.name,
      p.project_number,
      p.status::TEXT,
      p.planned_start,
      p.planned_end,
      c.company_name AS client_name,
      COALESCE(c.last_name, '') AS client_contact,
      o.total_net AS offer_amount,
      -- Schedule-Progress
      (SELECT COUNT(*) FROM schedule_phases sp WHERE sp.project_id = p.id) AS total_phases,
      (SELECT COUNT(*) FROM schedule_phases sp WHERE sp.project_id = p.id AND sp.status = 'completed') AS completed_phases,
      -- Kosten via calculate_project_costs
      calculate_project_costs(p.id) AS cost_data
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN LATERAL (
      SELECT total_net
      FROM offers
      WHERE project_id = p.id AND status NOT IN ('REJECTED', 'EXPIRED')
      ORDER BY version DESC
      LIMIT 1
    ) o ON true
    WHERE p.status NOT IN ('CANCELLED')
      AND (p_include_completed OR p.status != 'COMPLETED')
    ORDER BY
      CASE p.status
        WHEN 'IN_PROGRESS' THEN 1
        WHEN 'PLANNING' THEN 2
        WHEN 'INSPECTION' THEN 3
        WHEN 'ACTIVE' THEN 4
        WHEN 'DRAFT' THEN 5
        WHEN 'COMPLETED' THEN 6
        ELSE 7
      END,
      p.planned_end ASC NULLS LAST
  )
  SELECT
    json_agg(json_build_object(
      'id', pd.id,
      'name', pd.name,
      'project_number', pd.project_number,
      'status', pd.status,
      'client_name', pd.client_name,
      'offer_amount', COALESCE(pd.offer_amount, 0),
      'total_cost', COALESCE((pd.cost_data->>'total_cost')::DECIMAL, 0),
      'margin_percent', COALESCE((pd.cost_data->>'margin_percent')::DECIMAL, 0),
      'margin_status', COALESCE(pd.cost_data->>'status', 'yellow'),
      'schedule_progress', CASE WHEN pd.total_phases > 0
        THEN ROUND((pd.completed_phases::DECIMAL / pd.total_phases) * 100)
        ELSE 0 END,
      'planned_start', pd.planned_start,
      'planned_end', pd.planned_end,
      'days_remaining', CASE WHEN pd.planned_end IS NOT NULL
        THEN (pd.planned_end - CURRENT_DATE)
        ELSE NULL END,
      'breakdown', pd.cost_data->'breakdown'
    ))
  INTO v_projects
  FROM project_data pd;

  -- Summary berechnen
  WITH stats AS (
    SELECT
      COUNT(*) AS total_projects,
      COALESCE(SUM(COALESCE((pd.cost_data->>'offer_amount')::DECIMAL, 0)), 0) AS total_offer_volume,
      COALESCE(SUM(COALESCE((pd.cost_data->>'total_cost')::DECIMAL, 0)), 0) AS total_costs,
      COUNT(*) FILTER (WHERE pd.cost_data->>'status' = 'red') AS red_count,
      COUNT(*) FILTER (WHERE pd.cost_data->>'status' = 'yellow') AS yellow_count,
      COUNT(*) FILTER (WHERE pd.cost_data->>'status' = 'green') AS green_count
    FROM (
      SELECT calculate_project_costs(p.id) AS cost_data
      FROM projects p
      WHERE p.status NOT IN ('CANCELLED')
        AND (p_include_completed OR p.status != 'COMPLETED')
    ) pd
  )
  SELECT json_build_object(
    'total_projects', total_projects,
    'total_offer_volume', total_offer_volume,
    'total_costs', total_costs,
    'avg_margin', CASE WHEN total_offer_volume > 0
      THEN ROUND(((total_offer_volume - total_costs) / total_offer_volume * 100)::NUMERIC, 1)
      ELSE 0 END,
    'red_count', red_count,
    'yellow_count', yellow_count,
    'green_count', green_count
  ) INTO v_summary FROM stats;

  RETURN json_build_object(
    'success', true,
    'projects', COALESCE(v_projects, '[]'::JSON),
    'summary', v_summary
  );
END;
$$;


ALTER FUNCTION "public"."get_marge_dashboard"("p_include_completed" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_marge_dashboard"("p_include_completed" boolean) IS 'MARGE-Ansicht: Alle Projekte mit Kosten, Marge, Ampel. Optional mit abgeschlossenen Projekten.';



CREATE OR REPLACE FUNCTION "public"."get_matching_bank_transactions"("p_invoice_id" "uuid", "p_limit" integer DEFAULT 5) RETURNS TABLE("id" "uuid", "booking_date" "date", "amount" numeric, "counterpart_name" "text", "reference_text" "text", "match_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                                                                       
  DECLARE                                                                                                             
    v_total_gross NUMERIC;                                                                                            
    v_invoice_number TEXT;                                                                                            
    v_supplier_id UUID;                                                                                               
    v_supplier_name TEXT;                                                                                             
  BEGIN                                                                                                               
    SELECT pi.total_gross, pi.invoice_number, pi.supplier_id                                                          
    INTO v_total_gross, v_invoice_number, v_supplier_id                                                               
    FROM purchase_invoices pi                                                                                         
    WHERE pi.id = p_invoice_id;                                                                                       
                                                                                                                      
    SELECT s.name INTO v_supplier_name                                                                                
    FROM suppliers s WHERE s.id = v_supplier_id;                                                                      
                                                                                                                      
    RETURN QUERY                                                                                                      
    SELECT                                                                                                            
      bt.id,                                                                                                          
      bt.booking_date,                                                                                                
      bt.amount,                                                                                                      
      bt.counterpart_name,                                                                                            
      bt.reference_text,                                                                                              
      (                                                                                                               
        CASE                                                                                                          
          WHEN ABS(ABS(bt.amount) - v_total_gross) < 0.10 THEN 100                                                    
          WHEN ABS(ABS(bt.amount) - v_total_gross) < (v_total_gross * 0.04) THEN 50                                   
          ELSE 0                                                                                                      
        END +                                                                                                         
        CASE                                                                                                          
          WHEN v_invoice_number IS NOT NULL AND v_invoice_number != 'UNKNOWN' AND                                     
               LOWER(bt.reference_text) LIKE '%' || LOWER(v_invoice_number) || '%' THEN 80                            
          WHEN v_invoice_number IS NOT NULL AND v_invoice_number != 'UNKNOWN' AND                                     
               LOWER(bt.counterpart_name) LIKE '%' || LOWER(v_invoice_number) || '%' THEN 80                          
          ELSE 0                                                                                                      
        END +                                                                                                         
        CASE                                                                                                          
          WHEN v_supplier_name IS NOT NULL AND (                                                                      
            LOWER(bt.counterpart_name) LIKE '%' || LOWER(v_supplier_name) || '%'                                      
            OR LOWER(v_supplier_name) LIKE '%' || LOWER(bt.counterpart_name) || '%'                                   
          ) THEN 80                                                                                                   
          WHEN v_supplier_name IS NOT NULL AND                                                                        
            LOWER(bt.reference_text) LIKE '%' || LOWER(v_supplier_name) || '%'                                        
          THEN 70                                                                                                     
          ELSE 0                                                                                                      
        END                                                                                                           
      )::INTEGER AS match_score                                                                                       
    FROM bank_transactions bt                                                                                         
    WHERE bt.is_matched = FALSE                                                                                       
      AND (                                                                                                           
        ABS(ABS(bt.amount) - v_total_gross) < (v_total_gross * 0.04 + 0.10)                                           
        OR (v_supplier_name IS NOT NULL AND LOWER(bt.reference_text) LIKE '%' || LOWER(v_supplier_name) || '%')       
        OR (v_invoice_number IS NOT NULL AND v_invoice_number != 'UNKNOWN' AND LOWER(bt.reference_text) LIKE '%' ||   
  LOWER(v_invoice_number) || '%')                                                                                     
      )                                                                                                               
    ORDER BY 6 DESC                                                                                                   
    LIMIT p_limit;                                                                                                    
  END;                                                                                                                
  $$;


ALTER FUNCTION "public"."get_matching_bank_transactions"("p_invoice_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monteur_auftrag"("p_project_id" "uuid", "p_trade" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH project_info AS (
    SELECT
      p.id, p.name, p.project_number, p.status,
      p.object_street, p.object_zip, p.object_city,
      c.company_name AS client_name, c.phone AS client_phone, c.email AS client_email,
      c.street AS client_street, c.zip_code AS client_zip, c.city AS client_city
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.id = p_project_id
  ),
  -- Positionen mit Zuweisungen
  positions AS (
    SELECT
      op.id AS position_id,
      op.position_number,
      op.title,
      op.description,
      op.unit,
      op.quantity,
      op.unit_price,
      op.trade,
      os.title AS section_title,
      -- Zugewiesene Monteure/Subunternehmer
      (SELECT json_agg(json_build_object(
        'subcontractor_id', sc.id,
        'name', sc.name,
        'contact_person', sc.contact_person,
        'phone', sc.phone
      ))
      FROM position_assignments pa
      JOIN subcontractors sc ON sc.id = pa.subcontractor_id
      WHERE pa.position_id = op.id
        AND pa.status IN ('ASSIGNED', 'IN_PROGRESS')
      ) AS assigned_workers,
      -- Materialien
      (SELECT json_agg(json_build_object(
        'product_name', pr.name,
        'quantity', pm.quantity,
        'unit', COALESCE(pm.quantity_unit, pr.unit)
      ))
      FROM project_materials pm
      LEFT JOIN products pr ON pr.id = pm.product_id
      WHERE pm.offer_position_id = op.id
      ) AS materials
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN offer_sections os ON os.id = op.section_id
    WHERE o.project_id = p_project_id
      AND o.status NOT IN ('REJECTED', 'EXPIRED')
      AND (p_trade IS NULL OR op.trade::TEXT = p_trade)
    ORDER BY op.position_number
  ),
  -- Zeitplan
  schedule AS (
    SELECT json_agg(json_build_object(
      'phase_name', sp.name,
      'trade', sp.trade,
      'start_date', sp.start_date,
      'end_date', sp.end_date,
      'status', sp.status,
      'assigned_to', tm.name,
      'notes', sp.notes
    ) ORDER BY sp.start_date)
    FROM schedule_phases sp
    LEFT JOIN team_members tm ON tm.id = sp.assigned_team_member_id
    WHERE sp.project_id = p_project_id
      AND (p_trade IS NULL OR sp.trade::TEXT = p_trade)
      AND sp.status != 'completed'
  ),
  -- Checkliste aus EB-Protokoll (verknüpft über Angebotspositionen)
  checklist AS (
    SELECT json_agg(json_build_object(
      'position', op.title,
      'status', ipi.status,
      'has_defect', ipi.has_defect,
      'defect', ipi.defect_description,
      'notes', ipi.notes,
      'progress_percent', ipi.progress_percent,
      'measured_quantity', ipi.measured_quantity
    ) ORDER BY ipi.sort_order)
    FROM inspection_protocol_items ipi
    JOIN inspection_protocols ip ON ip.id = ipi.protocol_id
    LEFT JOIN offer_positions op ON op.id = ipi.offer_position_id
    WHERE ip.project_id = p_project_id
      AND ip.protocol_type = 'erstbegehung'
      AND (p_trade IS NULL OR op.trade::TEXT = p_trade)
  )
  SELECT json_build_object(
    'success', true,
    'project', (SELECT row_to_json(pi) FROM project_info pi),
    'trade_filter', p_trade,
    'positions', COALESCE((SELECT json_agg(row_to_json(pos)) FROM positions pos), '[]'::JSON),
    'schedule', COALESCE((SELECT * FROM schedule), '[]'::JSON),
    'checklist', COALESCE((SELECT * FROM checklist), '[]'::JSON),
    'summary', json_build_object(
      'total_positions', (SELECT COUNT(*) FROM positions),
      'total_value', (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM positions),
      'trades', (SELECT COALESCE(json_agg(DISTINCT trade), '[]'::JSON) FROM positions WHERE trade IS NOT NULL)
    ),
    'generated_at', now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_monteur_auftrag"("p_project_id" "uuid", "p_trade" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_monteur_auftrag"("p_project_id" "uuid", "p_trade" "text") IS 'Monteur-Auftrag: Komplette Daten für Arbeitsauftrag-PDF inkl. Positionen, Material, Zeitplan, EB-Checkliste.';



CREATE OR REPLACE FUNCTION "public"."get_monteur_auftrag_data"("p_project_id" "uuid", "p_language" "text" DEFAULT 'de'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
  v_is_saga BOOLEAN;
BEGIN
  -- SAGA-Check (für evtl. spätere Unterscheidungen)
  SELECT 
    LOWER(c.company_name) LIKE '%saga%'
  INTO v_is_saga
  FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE p.id = p_project_id;

  SELECT jsonb_build_object(
    'project', jsonb_build_object(
      'id', p.id,
      'name', COALESCE(p.display_name, p.name),
      'project_number', p.project_number,
      'street', p.object_street,
      'zip_code', p.object_zip,
      'city', p.object_city,
      'deadline', p.planned_end,
      'drive_folder_id', p.drive_folder_id
    ),
    'is_saga', COALESCE(v_is_saga, false),
    'language', p_language,
    'sections', (
      SELECT COALESCE(jsonb_agg(section_data ORDER BY section_num), '[]'::jsonb)
      FROM (
        SELECT 
          os.section_number as section_num,
          jsonb_build_object(
            'group_key', COALESCE(os.title, os.trade, 'Allgemein'),
            'group_label', COALESCE(os.title, os.trade, 'Allgemein'),
            'positions', (
              SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                  'id', op.id,
                  'position_number', op.position_number,
                  'catalog_code', op.catalog_code,
                  'title', CASE p_language
                    WHEN 'tr' THEN COALESCE(cp.repair_title_tr, cpv2.title_tr, wgp.title_tr, op.title)
                    WHEN 'pl' THEN COALESCE(cpv2.title_pl, op.title)
                    WHEN 'ro' THEN COALESCE(cpv2.title_ro, op.title)
                    WHEN 'ru' THEN COALESCE(cpv2.title_ru, op.title)
                    ELSE op.title 
                  END,
                  'title_de', op.title,
                  'quantity', op.quantity,
                  'unit', op.unit
                ) ORDER BY op.sort_order, op.position_number
              ), '[]'::jsonb)
              FROM offer_positions op
              LEFT JOIN catalog_positions cp ON cp.catalog_code = op.catalog_code
              LEFT JOIN catalog_positions_v2 cpv2 ON cpv2.id = op.catalog_position_v2_id
              LEFT JOIN wbs_gwg_positions wgp ON wgp.id = op.wbs_gwg_position_id
              WHERE op.section_id = os.id
                AND op.deleted_at IS NULL
                AND COALESCE(op.position_type::text, 'standard') != 'alternative'
            )
          ) as section_data
        FROM offer_sections os
        JOIN offers o ON o.id = os.offer_id
        WHERE o.project_id = p_project_id
        
        UNION ALL
        
        -- Positionen ohne Section
        SELECT 
          999 as section_num,
          jsonb_build_object(
            'group_key', COALESCE(op.trade, 'Allgemein'),
            'group_label', COALESCE(op.trade, 'Allgemein'),
            'positions', jsonb_agg(
              jsonb_build_object(
                'id', op.id,
                'position_number', op.position_number,
                'catalog_code', op.catalog_code,
                'title', CASE p_language
                  WHEN 'tr' THEN COALESCE(cp.repair_title_tr, cpv2.title_tr, wgp.title_tr, op.title)
                  WHEN 'pl' THEN COALESCE(cpv2.title_pl, op.title)
                  WHEN 'ro' THEN COALESCE(cpv2.title_ro, op.title)
                  WHEN 'ru' THEN COALESCE(cpv2.title_ru, op.title)
                  ELSE op.title 
                END,
                'title_de', op.title,
                'quantity', op.quantity,
                'unit', op.unit
              ) ORDER BY op.sort_order, op.position_number
            )
          ) as section_data
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        LEFT JOIN catalog_positions cp ON cp.catalog_code = op.catalog_code
        LEFT JOIN catalog_positions_v2 cpv2 ON cpv2.id = op.catalog_position_v2_id
        LEFT JOIN wbs_gwg_positions wgp ON wgp.id = op.wbs_gwg_position_id
        WHERE o.project_id = p_project_id
          AND op.section_id IS NULL
          AND op.deleted_at IS NULL
          AND COALESCE(op.position_type::text, 'standard') != 'alternative'
        GROUP BY COALESCE(op.trade, 'Allgemein')
      ) grouped
    )
  )
  INTO v_result
  FROM projects p
  WHERE p.id = p_project_id;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_monteur_auftrag_data"("p_project_id" "uuid", "p_language" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_monteur_auftrag_data"("p_project_id" "uuid", "p_language" "text") IS 'Liefert Projekt-Daten für Monteurauftrag PDF - gruppiert nach section.title (Räume), mit TR-Übersetzungen aus catalog_positions';



CREATE OR REPLACE FUNCTION "public"."get_open_bid_requests"("p_days_ahead" integer DEFAULT 14) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(json_build_object(
      'project_id', p.id,
      'project_number', p.project_number,
      'name', p.name,
      'client_name', c.company_name,
      'bid_deadline', p.bid_deadline,
      'days_remaining', p.bid_deadline - CURRENT_DATE,
      'status', p.status
    ) ORDER BY p.bid_deadline ASC), '[]'::JSON)
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.project_type = 'BID_REQUEST'
      AND p.bid_deadline IS NOT NULL
      AND p.bid_deadline >= CURRENT_DATE
      AND p.bid_deadline <= CURRENT_DATE + p_days_ahead
      AND p.status NOT IN ('COMPLETED', 'CANCELLED')
  );
END;
$$;


ALTER FUNCTION "public"."get_open_bid_requests"("p_days_ahead" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_open_bid_requests"("p_days_ahead" integer) IS 'Alle offenen Angebotsanfragen mit Frist in den naechsten X Tagen.';



CREATE OR REPLACE FUNCTION "public"."get_or_create_zb_protocol"("p_project_id" "uuid", "p_inspector_name" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_protocol_id UUID;
  v_protocol_number INT;
BEGIN
  -- Check for existing in_progress ZB protocol
  SELECT id, protocol_number::INT INTO v_protocol_id, v_protocol_number
  FROM inspection_protocols
  WHERE project_id = p_project_id 
    AND protocol_type = 'zwischenbegehung'
    AND status = 'in_progress'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_protocol_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'protocol_id', v_protocol_id,
      'protocol_number', v_protocol_number,
      'created', false
    );
  END IF;

  -- Create new ZB protocol
  SELECT COALESCE(MAX(
    CASE 
      WHEN protocol_number ~ '^\d+$' THEN protocol_number::INT
      ELSE 0
    END
  ), 0) + 1
  INTO v_protocol_number
  FROM inspection_protocols
  WHERE project_id = p_project_id AND protocol_type = 'zwischenbegehung';

  INSERT INTO inspection_protocols (
    project_id,
    protocol_type,
    protocol_number,
    status,
    inspector_name
  ) VALUES (
    p_project_id,
    'zwischenbegehung',
    v_protocol_number::TEXT,
    'in_progress',
    p_inspector_name
  )
  RETURNING id INTO v_protocol_id;

  RETURN json_build_object(
    'success', true,
    'protocol_id', v_protocol_id,
    'protocol_number', v_protocol_number,
    'created', true
  );
END;
$_$;


ALTER FUNCTION "public"."get_or_create_zb_protocol"("p_project_id" "uuid", "p_inspector_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parent_info"("p_folder_type" "text", "p_year" "text" DEFAULT NULL::"text") RETURNS TABLE("parent_type" "text", "parent_key" "text", "parent_folder_id" "text", "parent_path" "text", "parent_found" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_parent_type TEXT;
  v_parent_key TEXT;
  v_lookup RECORD;
BEGIN
  -- Determine parent based on folder type
  CASE p_folder_type
    WHEN 'project_year' THEN
      v_parent_type := 'project_root';
      v_parent_key := 'project:root';
    WHEN 'buchhaltung_year' THEN
      v_parent_type := 'buchhaltung_root';
      v_parent_key := 'buchhaltung:root';
    WHEN 'buchhaltung_month' THEN
      v_parent_type := 'buchhaltung_year';
      v_parent_key := 'buchhaltung:' || p_year;
    ELSE
      -- Root types have no parent
      RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
      RETURN;
  END CASE;
  
  -- Lookup parent in registry
  SELECT * INTO v_lookup FROM get_folder_from_registry(v_parent_key);
  
  IF v_lookup.found THEN
    RETURN QUERY SELECT 
      v_parent_type,
      v_parent_key,
      v_lookup.folder_id,
      v_lookup.full_path,
      TRUE;
  ELSE
    RETURN QUERY SELECT 
      v_parent_type,
      v_parent_key,
      NULL::TEXT,
      NULL::TEXT,
      FALSE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_parent_info"("p_folder_type" "text", "p_year" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_parent_info"("p_folder_type" "text", "p_year" "text") IS 'Returns parent info for cascade. If parent_found=false, parent must be created first.';



CREATE OR REPLACE FUNCTION "public"."get_position_context"("p_position_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'position_id', op.id,
    'position_number', op.position_number,
    'position_title', COALESCE(op.title, op.description),
    'quantity', op.quantity,
    'unit', op.unit,
    'trade', op.trade,
    'section_title', os.title,
    'current_material_note', op.material_note,
    'object_type', p.object_type,
    'client_name', c.company_name
  ) INTO result
  FROM offer_positions op
  JOIN offers o ON o.id = op.offer_id
  JOIN projects p ON p.id = o.project_id
  LEFT JOIN offer_sections os ON os.id = op.section_id
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE op.id = p_position_id;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_position_context"("p_position_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_positions_for_language"("p_position_ids" "uuid"[], "p_language" "text" DEFAULT 'de'::"text") RETURNS TABLE("id" "uuid", "catalog_code" "text", "title" "text", "description" "text", "unit" "text", "trade" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.catalog_code,
    CASE p_language
      WHEN 'tr' THEN COALESCE(cp.repair_title_tr, cp.repair_title)
      WHEN 'pl' THEN COALESCE(cp.repair_title_pl, cp.repair_title)
      ELSE cp.repair_title
    END as title,
    CASE p_language
      WHEN 'tr' THEN COALESCE(cp.repair_text_full_tr, cp.repair_text_full)
      WHEN 'pl' THEN COALESCE(cp.repair_text_full_pl, cp.repair_text_full)
      ELSE cp.repair_text_full
    END as description,
    cp.unit,
    cp.trade
  FROM catalog_positions cp
  WHERE cp.id = ANY(p_position_ids)
    AND cp.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_positions_for_language"("p_position_ids" "uuid"[], "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_activities"("p_project_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_activity_type" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'success', true,
    'project_id', p_project_id,
    'total_count', (
      SELECT COUNT(*) FROM project_activities
      WHERE project_id = p_project_id
        AND (p_activity_type IS NULL OR activity_type = p_activity_type)
    ),
    'activities', COALESCE((
      SELECT json_agg(json_build_object(
        'id', pa.id,
        'activity_type', pa.activity_type,
        'title', pa.title,
        'description', pa.description,
        'metadata', pa.metadata,
        'created_by', pa.created_by,
        'created_at', pa.created_at
      ) ORDER BY pa.created_at DESC)
      FROM (
        SELECT *
        FROM project_activities
        WHERE project_id = p_project_id
          AND (p_activity_type IS NULL OR activity_type = p_activity_type)
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
      ) pa
    ), '[]'::JSON)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_project_activities"("p_project_id" "uuid", "p_limit" integer, "p_offset" integer, "p_activity_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_project_activities"("p_project_id" "uuid", "p_limit" integer, "p_offset" integer, "p_activity_type" "text") IS 'Activity-Feed: Chronologische Aktivitäten pro Projekt mit Pagination + Typfilter.';



CREATE OR REPLACE FUNCTION "public"."get_project_change_orders"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH co_data AS (
    SELECT
      co.id,
      co.change_order_number,
      co.title,
      co.status::TEXT,
      co.reason::TEXT,
      co.amount_net,
      co.amount_gross,
      co.submitted_at,
      co.approved_at,
      co.approved_by,
      co.rejected_at,
      co.rejection_reason,
      co.created_at,
      (SELECT json_agg(json_build_object(
        'id', ci.id,
        'description', ci.description,
        'quantity', ci.quantity,
        'unit', ci.unit,
        'unit_price', ci.unit_price,
        'total_price', ci.total_price
      ) ORDER BY ci.sort_order)
      FROM change_order_items ci
      WHERE ci.change_order_id = co.id
      ) AS items
    FROM change_orders co
    WHERE co.project_id = p_project_id
    ORDER BY co.created_at DESC
  )
  SELECT json_build_object(
    'success', true,
    'project_id', p_project_id,
    'change_orders', COALESCE((SELECT json_agg(row_to_json(co_data)) FROM co_data), '[]'::JSON),
    'summary', json_build_object(
      'total_count', (SELECT COUNT(*) FROM co_data),
      'draft_count', (SELECT COUNT(*) FROM co_data WHERE status = 'DRAFT'),
      'submitted_count', (SELECT COUNT(*) FROM co_data WHERE status = 'SUBMITTED'),
      'approved_count', (SELECT COUNT(*) FROM co_data WHERE status IN ('APPROVED_BY_CUSTOMER', 'INVOICED')),
      'rejected_count', (SELECT COUNT(*) FROM co_data WHERE status IN ('REJECTED', 'REJECTED_BY_CUSTOMER')),
      'total_approved_amount', COALESCE((SELECT SUM(amount_gross) FROM co_data WHERE status IN ('APPROVED_BY_CUSTOMER', 'INVOICED')), 0),
      'total_pending_amount', COALESCE((SELECT SUM(amount_gross) FROM co_data WHERE status IN ('DRAFT', 'SUBMITTED', 'PENDING_CUSTOMER')), 0)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_project_change_orders"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_project_change_orders"("p_project_id" "uuid") IS 'Alle Nachträge eines Projekts mit Items + Zusammenfassung.';



CREATE OR REPLACE FUNCTION "public"."get_project_materials_summary"("p_project_id" "uuid") RETURNS TABLE("material_name" "text", "unit" "text", "raw_total" numeric, "waste_percent" numeric, "total_with_waste" numeric, "position_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcm.material_name,
    pcm.unit,
    ROUND(SUM(pcm.quantity), 2) as raw_total,
    ROUND(AVG(pcm.waste_percent), 0) as waste_percent,
    ROUND(SUM(pcm.total_quantity), 2) as total_with_waste,
    COUNT(*) as position_count
  FROM position_calc_materials pcm
  JOIN offer_positions op ON op.id = pcm.position_id
  JOIN offers o ON o.id = op.offer_id
  WHERE o.project_id = p_project_id
  GROUP BY pcm.material_name, pcm.unit
  ORDER BY pcm.material_name;
END;
$$;


ALTER FUNCTION "public"."get_project_materials_summary"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_project_materials_summary"("p_project_id" "uuid") IS 'Returns aggregated material list for a project. Used by frontend dashboard.';



CREATE OR REPLACE FUNCTION "public"."get_project_packing_list"("p_project_id" "uuid") RETURNS TABLE("id" "uuid", "item_type" "text", "item_name" "text", "quantity" numeric, "unit" "text", "source" "text", "ai_suggested" boolean, "ai_reason" "text", "confirmed" boolean, "packed" boolean, "notes" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ppl.id,
    ppl.item_type::TEXT,
    ppl.item_name,
    ppl.quantity,
    ppl.unit,
    ppl.source,
    ppl.ai_suggested,
    ppl.ai_reason,
    ppl.confirmed,
    ppl.packed,
    ppl.notes
  FROM project_packing_list ppl
  WHERE ppl.project_id = p_project_id
  ORDER BY 
    ppl.item_type,
    ppl.sort_order,
    ppl.item_name;
END;
$$;


ALTER FUNCTION "public"."get_project_packing_list"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_project_packing_list"("p_project_id" "uuid") IS 'Returns complete packing list (materials + tools + AI suggestions) for frontend.';



CREATE OR REPLACE FUNCTION "public"."get_saga_order_payload"("_order_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    AS $$
SELECT jsonb_build_object(
  'order',
    jsonb_build_object(
      'id',           o.id,
      'external_ref', o.external_ref,
      'tenant_name',  o.tenant_name,
      'address',      o.address,
      'pdf_url',      o.pdf_url,
      'created_at',   o.created_at
    ),
  'positions',
    COALESCE(
      (
        SELECT jsonb_agg(
                 jsonb_build_object(
                   'order_position_id', op.order_position_id,
                   'catalog_code',      op.catalog_code,
                   'quantity',          op.quantity,
                   'trade',             op.trade,
                   'main_group',        op.main_group,
                   'damage_title',      op.damage_title,
                   'repair_title',      op.repair_title,
                   'repair_text_full',  op.repair_text_full,
                   'unit',              op.unit,
                   'gu_price_eur',      op.gu_price_eur,
                   'total_gu_eur',      op.total_gu_eur
                 )
                 ORDER BY op.catalog_code
               )
        FROM public.v_saga_order_positions_full op
        WHERE op.order_id = o.id
      ),
      '[]'::jsonb
    )
)
FROM public.saga_orders o
WHERE o.id = _order_id;
$$;


ALTER FUNCTION "public"."get_saga_order_payload"("_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sub_auftrag_data"("p_project_id" "uuid", "p_position_ids" "uuid"[], "p_supplier_id" "uuid", "p_language" "text" DEFAULT 'de'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_result JSONB;
  v_project JSONB;
  v_supplier JSONB;
  v_positions JSONB;
BEGIN
  -- Project info
  SELECT jsonb_build_object(
    'id', p.id,
    'project_number', p.project_number,
    'name', COALESCE(p.display_name, p.name),
    'street', p.object_street,
    'zip_code', p.object_zip,
    'city', p.object_city,
    'client_name', COALESCE(c.company_name, c.first_name || ' ' || c.last_name)
  )
  INTO v_project
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
  WHERE p.id = p_project_id;

  IF v_project IS NULL THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;

  -- Supplier info
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'short_name', s.short_name,
    'email', s.email,
    'phone', s.phone,
    'street', s.street,
    'zip_code', s.zip_code,
    'city', s.city
  )
  INTO v_supplier
  FROM suppliers s
  WHERE s.id = p_supplier_id;

  IF v_supplier IS NULL THEN
    RETURN jsonb_build_object('error', 'Supplier not found');
  END IF;

  -- Positions grouped by trade
  SELECT jsonb_agg(trade_group ORDER BY trade_name)
  INTO v_positions
  FROM (
    SELECT jsonb_build_object(
      'section_title', COALESCE(op.trade, 'Sonstige'),
      'positions', jsonb_agg(
        jsonb_build_object(
          'id', op.id,
          'position_code', op.position_number,
          'title', CASE 
            WHEN p_language = 'tr' THEN COALESCE(
              cp.title_tr,
              wbs.title_tr,
              op.description,
              op.title
            )
            ELSE COALESCE(op.description, op.title, cp.title, wbs.title_de)
          END,
          'quantity', op.quantity,
          'unit', op.unit,
          'trade', op.trade
        ) ORDER BY op.sort_order, op.position_number
      )
    ) as trade_group,
    COALESCE(op.trade, 'Sonstige') as trade_name
    FROM offer_positions op
    JOIN offers o ON op.offer_id = o.id
    LEFT JOIN catalog_positions_v2 cp ON op.catalog_position_v2_id = cp.id
    LEFT JOIN wbs_gwg_positions wbs ON op.wbs_gwg_position_id = wbs.id
    WHERE o.project_id = p_project_id
      AND op.id = ANY(p_position_ids)
    GROUP BY COALESCE(op.trade, 'Sonstige')
  ) grouped;

  v_result := jsonb_build_object(
    'project', v_project,
    'supplier', v_supplier,
    'sections', COALESCE(v_positions, '[]'::jsonb),
    'position_count', array_length(p_position_ids, 1),
    'generated_at', now(),
    'language', p_language
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_sub_auftrag_data"("p_project_id" "uuid", "p_position_ids" "uuid"[], "p_supplier_id" "uuid", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_capacity"("p_start_date" "date" DEFAULT CURRENT_DATE, "p_end_date" "date" DEFAULT ((CURRENT_DATE + '28 days'::interval))::"date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH members AS (
    SELECT
      tm.id,
      tm.name,
      tm.role,
      tm.skills,
      tm.hourly_rate,
      tm.max_hours_per_week,
      -- Aktive Zuweisungen im Zeitraum
      (SELECT json_agg(json_build_object(
        'project_name', p.name,
        'project_id', sp.project_id,
        'phase_name', sp.name,
        'trade', sp.trade,
        'start_date', sp.start_date,
        'end_date', sp.end_date,
        'status', sp.status
      ) ORDER BY sp.start_date)
      FROM schedule_phases sp
      JOIN projects p ON p.id = sp.project_id
      WHERE sp.assigned_team_member_id = tm.id
        AND sp.end_date >= p_start_date
        AND sp.start_date <= p_end_date
        AND sp.status != 'completed'
      ) AS assignments,
      -- Abwesenheiten im Zeitraum
      (SELECT json_agg(json_build_object(
        'type', a.type,
        'start_date', a.start_date,
        'end_date', a.end_date,
        'notes', a.note
      ) ORDER BY a.start_date)
      FROM absences a
      WHERE a.team_member_id = tm.id
        AND a.end_date >= p_start_date
        AND a.start_date <= p_end_date
      ) AS absences,
      -- Verfügbare Tage (grob: Arbeitstage minus Abwesenheiten minus Zuweisungen)
      (
        SELECT COUNT(*)
        FROM generate_series(p_start_date, p_end_date, '1 day'::INTERVAL) d
        WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)  -- Keine Wochenenden
          AND NOT EXISTS (
            SELECT 1 FROM absences a
            WHERE a.team_member_id = tm.id
              AND d::DATE BETWEEN a.start_date AND a.end_date
          )
          AND NOT EXISTS (
            SELECT 1 FROM schedule_phases sp
            WHERE sp.assigned_team_member_id = tm.id
              AND d::DATE BETWEEN sp.start_date AND sp.end_date
              AND sp.status != 'completed'
          )
      ) AS free_days,
      -- Belegte Tage
      (
        SELECT COUNT(DISTINCT d::DATE)
        FROM schedule_phases sp,
        generate_series(
          GREATEST(sp.start_date, p_start_date),
          LEAST(sp.end_date, p_end_date),
          '1 day'::INTERVAL
        ) d
        WHERE sp.assigned_team_member_id = tm.id
          AND sp.status != 'completed'
          AND EXTRACT(DOW FROM d) NOT IN (0, 6)
      ) AS busy_days
    FROM team_members tm
    WHERE tm.is_active = true
    ORDER BY tm.name
  )
  SELECT json_build_object(
    'success', true,
    'period', json_build_object('start', p_start_date, 'end', p_end_date),
    'team', COALESCE((SELECT json_agg(json_build_object(
      'id', m.id,
      'name', m.name,
      'role', m.role,
      'skills', m.skills,
      'free_days', m.free_days,
      'busy_days', m.busy_days,
      'availability_percent', CASE WHEN (m.free_days + m.busy_days) > 0
        THEN ROUND((m.free_days::DECIMAL / (m.free_days + m.busy_days)) * 100)
        ELSE 100 END,
      'assignments', COALESCE(m.assignments, '[]'::JSON),
      'absences', COALESCE(m.absences, '[]'::JSON)
    )) FROM members m), '[]'::JSON),
    'summary', (
      SELECT json_build_object(
        'total_members', COUNT(*),
        'fully_available', COUNT(*) FILTER (WHERE m.busy_days = 0 AND m.absences IS NULL),
        'partially_available', COUNT(*) FILTER (WHERE m.free_days > 0 AND m.busy_days > 0),
        'fully_booked', COUNT(*) FILTER (WHERE m.free_days = 0)
      ) FROM members m
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_team_capacity"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_team_capacity"("p_start_date" "date", "p_end_date" "date") IS 'Team-Kapazität: Verfügbarkeit, Zuweisungen, Abwesenheiten pro Mitarbeiter im Zeitraum.';



CREATE OR REPLACE FUNCTION "public"."import_bank_transaction"("p_account_iban" "text", "p_booking_date" "date", "p_amount" numeric, "p_counterpart_name" "text", "p_counterpart_iban" "text" DEFAULT NULL::"text", "p_reference_text" "text" DEFAULT NULL::"text", "p_transaction_type" "text" DEFAULT 'DEBIT'::"text", "p_external_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE 
  v_existing UUID; 
  v_tx_id UUID;
BEGIN
  -- Duplicate check
  IF p_external_id IS NOT NULL THEN
    SELECT id INTO v_existing FROM bank_transactions WHERE external_id = p_external_id;
    IF FOUND THEN 
      RETURN jsonb_build_object('success', false, 'error', 'Duplicate', 'existing_id', v_existing); 
    END IF;
  END IF;
  
  -- Insert transaction
  INSERT INTO bank_transactions (
    account_iban, booking_date, amount, counterpart_name, 
    counterpart_iban, reference_text, transaction_type, external_id
  )
  VALUES (
    p_account_iban, p_booking_date, p_amount, p_counterpart_name, 
    p_counterpart_iban, p_reference_text, p_transaction_type::transaction_type, p_external_id
  )
  RETURNING id INTO v_tx_id;
  
  -- Fire event for downstream processing
  INSERT INTO events (
    event_type,
    source_system,
    source_flow,
    reference_id,
    reference_table,
    payload,
    dedupe_key
  ) VALUES (
    'BANK_TRANSACTION_CREATED',
    'frontend',
    'BankUpload',
    v_tx_id,
    'bank_transactions',
    jsonb_build_object(
      'transaction_id', v_tx_id,
      'amount', p_amount,
      'counterpart_name', p_counterpart_name,
      'booking_date', p_booking_date
    ),
    'bank_tx_' || v_tx_id::text
  );
  
  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id);
END;
$$;


ALTER FUNCTION "public"."import_bank_transaction"("p_account_iban" "text", "p_booking_date" "date", "p_amount" numeric, "p_counterpart_name" "text", "p_counterpart_iban" "text", "p_reference_text" "text", "p_transaction_type" "text", "p_external_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."import_bank_transaction"("p_account_iban" "text", "p_booking_date" "date", "p_amount" numeric, "p_counterpart_name" "text", "p_counterpart_iban" "text", "p_reference_text" "text", "p_transaction_type" "text", "p_external_id" "text") IS 'Imports single bank transaction with duplicate check. Fires BANK_TRANSACTION_CREATED event.';



CREATE OR REPLACE FUNCTION "public"."is_event_processed"("p_consumer_name" "text", "p_event_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM event_consumer_receipts
    WHERE consumer_name = p_consumer_name
      AND event_id = p_event_id
  );
END;
$$;


ALTER FUNCTION "public"."is_event_processed"("p_consumer_name" "text", "p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."learn_material_choice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.product_id IS NOT NULL AND (OLD.product_id IS NULL OR OLD.product_id != NEW.product_id) THEN
    UPDATE products 
    SET use_count = use_count + 1, last_used_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."learn_material_choice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."learn_product_selection"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_use_count INTEGER;
BEGIN
  -- Nur bei neuer oder geänderter Produkt-Zuordnung
  IF NEW.product_id IS NOT NULL AND 
     (OLD.product_id IS NULL OR OLD.product_id IS DISTINCT FROM NEW.product_id) THEN
    
    -- 1. Erhöhe use_count beim Produkt
    UPDATE products
    SET use_count = use_count + 1,
        last_used_at = now(),
        updated_at = now()
    WHERE id = NEW.product_id
    RETURNING use_count INTO v_use_count;
    
    -- 2. Bei 3+ Nutzungen: Als Default setzen (wenn Position verknüpft)
    IF v_use_count >= 3 AND NEW.offer_position_id IS NOT NULL THEN
      UPDATE position_material_requirements pmr
      SET default_product_id = NEW.product_id,
          updated_at = now()
      FROM offer_positions op
      WHERE op.id = NEW.offer_position_id
        AND op.catalog_position_v2_id IS NOT NULL
        AND pmr.catalog_position_v2_id = op.catalog_position_v2_id
        AND pmr.material_type = NEW.material_type
        AND (pmr.default_product_id IS NULL OR pmr.default_product_id != NEW.product_id);
    END IF;
    
    -- 3. Status auf 'confirmed' setzen
    NEW.status := 'confirmed';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."learn_product_selection"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."learn_product_selection"() IS 'Lernt von manuellen Produktzuordnungen und setzt Defaults nach 3x Nutzung';



CREATE OR REPLACE FUNCTION "public"."list_baugenius_rpcs"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(json_build_object(
      'function_name', p.proname,
      'args', pg_get_function_arguments(p.oid),
      'return_type', pg_get_function_result(p.oid),
      'description', d.description
    ) ORDER BY p.proname)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_description d ON d.objoid = p.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname LIKE ANY(ARRAY[
        'get_%', 'create_%', 'update_%', 'delete_%',
        'check_%', 'calculate_%', 'submit_%', 'approve_%',
        'reject_%', 'batch_%', 'export_%', 'suggest_%',
        'record_%', 'mark_%', 'book_%', 'list_%',
        'escalate_%', 'request_%', 'reschedule_%',
        'complete_%'
      ])
  );
END;
$$;


ALTER FUNCTION "public"."list_baugenius_rpcs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."list_baugenius_rpcs"() IS 'Alle BauGenius RPCs auflisten mit Argumenten und Beschreibungen.';



CREATE OR REPLACE FUNCTION "public"."log_bank_import"("p_filename" "text", "p_format" "text", "p_count" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO bank_import_logs (filename, format_detected, transaction_count, imported_by)
  VALUES (p_filename, p_format, p_count, auth.uid())
  RETURNING id INTO v_log_id;
  
  -- Fire batch completion event
  INSERT INTO events (
    event_type,
    source_system,
    source_flow,
    reference_id,
    reference_table,
    payload
  ) VALUES (
    'BANK_IMPORT_COMPLETED',
    'frontend',
    'BankUpload',
    v_log_id,
    'bank_import_logs',
    jsonb_build_object(
      'log_id', v_log_id,
      'filename', p_filename,
      'format', p_format,
      'transaction_count', p_count
    )
  );
  
  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;


ALTER FUNCTION "public"."log_bank_import"("p_filename" "text", "p_format" "text", "p_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_bank_import"("p_filename" "text", "p_format" "text", "p_count" integer) IS 'Logs completed bank import batch. Fires BANK_IMPORT_COMPLETED event.';



CREATE OR REPLACE FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_correlation_id" "uuid" DEFAULT NULL::"uuid", "p_source_flow" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (event_type, project_id, source_system, payload, correlation_id, source_flow)
  VALUES (p_event_type, p_project_id, p_source_system, p_payload, p_correlation_id, p_source_flow)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;


ALTER FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_correlation_id" "uuid" DEFAULT NULL::"uuid", "p_source_flow" "text" DEFAULT NULL::"text", "p_dedupe_key" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_event_id UUID;
  v_existing_id UUID;
BEGIN
  -- Dedupe-Check wenn Key angegeben (idempotent!)
  IF p_dedupe_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM events
    WHERE source_system = p_source_system
      AND dedupe_key = p_dedupe_key;
    
    IF FOUND THEN
      -- Idempotent: Rückgabe der existierenden ID statt Fehler
      RETURN v_existing_id;
    END IF;
  END IF;
  
  INSERT INTO events (
    event_type, 
    project_id, 
    source_system, 
    payload, 
    correlation_id, 
    source_flow,
    dedupe_key
  )
  VALUES (
    p_event_type, 
    p_project_id, 
    p_source_system, 
    p_payload, 
    p_correlation_id, 
    p_source_flow,
    p_dedupe_key
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;


ALTER FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text", "p_dedupe_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_event_as_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_title TEXT;
  v_activity_type TEXT;
BEGIN
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_activity_type := CASE
    WHEN NEW.event_type::TEXT LIKE '%STATUS%' THEN 'status_change'
    WHEN NEW.event_type::TEXT LIKE '%INVOICE%' THEN 'invoice'
    WHEN NEW.event_type::TEXT LIKE '%MATERIAL%' THEN 'material'
    WHEN NEW.event_type::TEXT LIKE '%SCHEDULE%' THEN 'schedule'
    WHEN NEW.event_type::TEXT LIKE '%ASSIGNMENT%' THEN 'assignment'
    WHEN NEW.event_type::TEXT LIKE '%PROTOCOL%' THEN 'document'
    WHEN NEW.event_type::TEXT LIKE '%DRIVE%' THEN 'document'
    ELSE 'event'
  END;

  v_title := CASE NEW.event_type::TEXT
    WHEN 'PROJECT_CREATED' THEN 'Projekt angelegt'
    WHEN 'PROJECT_STATUS_CHANGED' THEN 'Status geaendert'
    WHEN 'PURCHASE_INVOICE_CREATED' THEN 'Eingangsrechnung erfasst'
    WHEN 'SCHEDULE_GENERATED' THEN 'Zeitplan automatisch erstellt'
    WHEN 'MATERIALS_CALCULATED' THEN 'Materialberechnung durchgefuehrt'
    WHEN 'PROTOCOL_CREATED' THEN 'Protokoll erstellt'
    WHEN 'PROTOCOL_COMPLETED' THEN 'Protokoll abgeschlossen'
    WHEN 'DRIVE_SETUP_COMPLETE' THEN 'Drive-Ordner eingerichtet'
    WHEN 'FILE_UPLOADED' THEN 'Datei hochgeladen'
    ELSE REPLACE(NEW.event_type::TEXT, '_', ' ')
  END;

  INSERT INTO project_activities (
    project_id, activity_type, title, metadata, created_by
  ) VALUES (
    NEW.project_id,
    v_activity_type,
    v_title,
    NEW.payload,
    COALESCE(NEW.source_flow, NEW.source_system, 'system')
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_event_as_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_event_processed"("p_consumer_name" "text", "p_event_id" "uuid", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_already_processed BOOLEAN;
BEGIN
  -- Prüfen ob bereits verarbeitet
  SELECT true INTO v_already_processed
  FROM event_consumer_receipts
  WHERE consumer_name = p_consumer_name
    AND event_id = p_event_id;
  
  IF FOUND THEN
    RETURN false;  -- Bereits verarbeitet, nichts tun
  END IF;
  
  -- Als verarbeitet markieren
  INSERT INTO event_consumer_receipts (consumer_name, event_id, success, error_message)
  VALUES (p_consumer_name, p_event_id, p_success, p_error_message)
  ON CONFLICT (consumer_name, event_id) DO NOTHING;
  
  RETURN true;  -- Erfolgreich markiert
END;
$$;


ALTER FUNCTION "public"."mark_event_processed"("p_consumer_name" "text", "p_event_id" "uuid", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_invoice_paid"("p_invoice_id" "uuid", "p_paid_amount" numeric DEFAULT NULL::numeric, "p_paid_at" timestamp with time zone DEFAULT "now"(), "p_bank_transaction_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_invoice RECORD;
BEGIN
  SELECT * INTO v_invoice FROM purchase_invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Invoice not found'); END IF;
  UPDATE purchase_invoices SET paid_at = p_paid_at, paid_amount = COALESCE(p_paid_amount, total_gross), status = 'PAID', updated_at = NOW() WHERE id = p_invoice_id;
  IF p_bank_transaction_id IS NOT NULL THEN
     INSERT INTO invoice_payments (bank_transaction_id, purchase_invoice_id, amount, status, match_confidence, confirmed_at)
     VALUES (p_bank_transaction_id, p_invoice_id, COALESCE(p_paid_amount, v_invoice.total_gross), 'CONFIRMED', 100, NOW());
     UPDATE bank_transactions SET is_matched = TRUE, matched_at = NOW() WHERE id = p_bank_transaction_id;
  END IF;
  RETURN jsonb_build_object('success', true, 'invoice_id', p_invoice_id);
END; $$;


ALTER FUNCTION "public"."mark_invoice_paid"("p_invoice_id" "uuid", "p_paid_amount" numeric, "p_paid_at" timestamp with time zone, "p_bank_transaction_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_invoice_paid"("p_invoice_id" "uuid", "p_paid_amount" numeric, "p_paid_at" timestamp with time zone, "p_bank_transaction_id" "uuid") IS 'Markiert eine Rechnung als bezahlt und verknüpft optional mit Bank-Transaktion';



CREATE OR REPLACE FUNCTION "public"."mark_lexware_synced"("p_entity_type" "text", "p_entity_id" "uuid", "p_lexware_id" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  CASE p_entity_type
    WHEN 'client' THEN
      UPDATE clients SET lexware_contact_id = p_lexware_id, lexware_synced_at = now() WHERE id = p_entity_id;
    WHEN 'supplier' THEN
      UPDATE suppliers SET lexware_contact_id = p_lexware_id, lexware_synced_at = now() WHERE id = p_entity_id;
    WHEN 'sales_invoice' THEN
      UPDATE sales_invoices SET lexware_invoice_id = p_lexware_id, lexware_synced_at = now() WHERE id = p_entity_id;
    WHEN 'purchase_invoice' THEN
      UPDATE purchase_invoices SET lexware_voucher_id = p_lexware_id, lexware_synced_at = now() WHERE id = p_entity_id;
    ELSE
      RETURN json_build_object('success', false, 'error', 'Unknown entity_type: ' || p_entity_type);
  END CASE;

  -- Log
  INSERT INTO lexware_sync_log (entity_type, entity_id, lexware_id, sync_direction, sync_status)
  VALUES (p_entity_type, p_entity_id, p_lexware_id, 'to_lexware', 'success');

  RETURN json_build_object('success', true, 'entity_type', p_entity_type, 'lexware_id', p_lexware_id);
END;
$$;


ALTER FUNCTION "public"."mark_lexware_synced"("p_entity_type" "text", "p_entity_id" "uuid", "p_lexware_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_lexware_synced"("p_entity_type" "text", "p_entity_id" "uuid", "p_lexware_id" "text") IS 'Lexware-Sync: ID nach erfolgreichem Sync eintragen.';



CREATE OR REPLACE FUNCTION "public"."match_catalog_position"("p_contractor_code" "text", "p_position_code" "text") RETURNS TABLE("position_id" "uuid", "title" "text", "title_tr" "text", "unit" "text", "base_price_eur" numeric, "trade" "text", "catalog_name" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpv2.id,
    cpv2.title,
    cpv2.title_tr,
    cpv2.unit,
    cpv2.base_price_eur,
    cpv2.trade,
    cat.name
  FROM catalog_positions_v2 cpv2
  JOIN catalogs cat ON cat.id = cpv2.catalog_id
  JOIN contractors con ON con.id = cat.contractor_id
  WHERE con.code = p_contractor_code
    AND cpv2.position_code = p_position_code
    AND cpv2.is_active = true
    AND cat.is_active = true
  ORDER BY cat.valid_from DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."match_catalog_position"("p_contractor_code" "text", "p_position_code" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."match_catalog_position"("p_contractor_code" "text", "p_position_code" "text") IS 'Findet Katalog-Position für M1_03 Workflow';



CREATE OR REPLACE FUNCTION "public"."match_catalog_position"("p_title" "text", "p_trade" "text", "p_contractor_code" "text", "p_position_code" "text" DEFAULT NULL::"text", "p_similarity_threshold" numeric DEFAULT 0.4) RETURNS TABLE("catalog_position_v2_id" "uuid", "matched_title" "text", "match_type" "text", "similarity_score" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_normalized_title TEXT;
BEGIN
  v_normalized_title := LOWER(TRIM(
    REPLACE(REPLACE(REPLACE(p_title, 'ß', 'ss'), '-', ' '), '  ', ' ')
  ));

  -- 0. CODE MATCH
  IF p_position_code IS NOT NULL AND p_position_code != '' THEN
    RETURN QUERY
    SELECT cp.id, cp.title, 'CODE'::TEXT, 1.0::NUMERIC
    FROM catalog_positions_v2 cp
    JOIN catalogs cat ON cp.catalog_id = cat.id
    JOIN contractors con ON cat.contractor_id = con.id
    WHERE con.code = p_contractor_code
      AND cat.is_active = true AND cp.is_active = true
      AND (p_trade IS NULL OR cp.trade = p_trade)
      AND cp.position_code = p_position_code
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 1. EXACT TITLE
  RETURN QUERY
  SELECT cp.id, cp.title, 'EXACT'::TEXT, 1.0::NUMERIC
  FROM catalog_positions_v2 cp
  JOIN catalogs cat ON cp.catalog_id = cat.id
  JOIN contractors con ON cat.contractor_id = con.id
  WHERE con.code = p_contractor_code
    AND cat.is_active = true AND cp.is_active = true
    AND (p_trade IS NULL OR cp.trade = p_trade)
    AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(cp.title, 'ß', 'ss'), '-', ' '), '  ', ' '))) = v_normalized_title
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- 2. ALIAS
  RETURN QUERY
  SELECT ca.catalog_position_v2_id, cp.title, 'ALIAS'::TEXT, 1.0::NUMERIC
  FROM catalog_aliases ca
  JOIN catalog_positions_v2 cp ON ca.catalog_position_v2_id = cp.id
  JOIN catalogs cat ON cp.catalog_id = cat.id
  JOIN contractors con ON cat.contractor_id = con.id
  WHERE con.code = p_contractor_code
    AND cat.is_active = true AND cp.is_active = true
    AND (p_trade IS NULL OR cp.trade = p_trade)
    AND LOWER(TRIM(ca.alias_title)) = v_normalized_title
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- 3. FUZZY
  RETURN QUERY
  SELECT cp.id, cp.title, 'FUZZY'::TEXT, similarity(LOWER(cp.title), v_normalized_title)::NUMERIC
  FROM catalog_positions_v2 cp
  JOIN catalogs cat ON cp.catalog_id = cat.id
  JOIN contractors con ON cat.contractor_id = con.id
  WHERE con.code = p_contractor_code
    AND cat.is_active = true AND cp.is_active = true
    AND (p_trade IS NULL OR cp.trade = p_trade)
    AND similarity(LOWER(cp.title), v_normalized_title) >= p_similarity_threshold
  ORDER BY similarity(LOWER(cp.title), v_normalized_title) DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."match_catalog_position"("p_title" "text", "p_trade" "text", "p_contractor_code" "text", "p_position_code" "text", "p_similarity_threshold" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_knowledge"("query_embedding" "extensions"."vector", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 5, "filter_source_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "content" "text", "title" "text", "category" "text", "source_type" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.title,
    kb.category,
    kb.source_type,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.visibility = 'public'
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (filter_source_type IS NULL OR kb.source_type = filter_source_type)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_knowledge"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "filter_source_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_room_name"("raw_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE lower(trim(raw_name))
        WHEN 'küche' THEN 'küche'
        WHEN 'kuche' THEN 'küche'
        WHEN 'kueche' THEN 'küche'
        WHEN 'bad' THEN 'bad'
        WHEN 'badezimmer' THEN 'bad'
        WHEN 'wc' THEN 'bad'
        WHEN 'gäste-wc' THEN 'bad'
        WHEN 'gäste wc' THEN 'bad'
        WHEN 'flur' THEN 'flur'
        WHEN 'diele' THEN 'flur'
        WHEN 'eingang' THEN 'flur'
        WHEN 'wohnzimmer' THEN 'wohnzimmer'
        WHEN 'wohnen' THEN 'wohnzimmer'
        WHEN 'wohnraum' THEN 'wohnzimmer'
        WHEN 'schlafzimmer' THEN 'schlafzimmer'
        WHEN 'schlafen' THEN 'schlafzimmer'
        WHEN 'schlafraum' THEN 'schlafzimmer'
        WHEN 'kinderzimmer' THEN 'kinderzimmer'
        WHEN 'kinder' THEN 'kinderzimmer'
        WHEN 'kinderraum' THEN 'kinderzimmer'
        WHEN 'abstellraum' THEN 'abstellraum'
        WHEN 'abstellkammer' THEN 'abstellraum'
        WHEN 'kammer' THEN 'abstellraum'
        WHEN 'hauswirtschaftsraum' THEN 'abstellraum'
        WHEN 'hwr' THEN 'abstellraum'
        WHEN 'balkon' THEN 'balkon'
        WHEN 'terrasse' THEN 'balkon'
        WHEN 'keller' THEN 'keller'
        WHEN 'kellerraum' THEN 'keller'
        ELSE lower(trim(raw_name))
    END;
END;
$$;


ALTER FUNCTION "public"."normalize_room_name"("raw_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_project_material_needs"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count integer;
BEGIN
  -- Delete existing auto-generated needs for this project
  DELETE FROM project_material_needs
  WHERE project_id = p_project_id AND source = 'auto';

  -- Aggregate project_materials by material_type only (label = material_type is the unique key)
  -- If same material_type has multiple products, pick the most-used one
  -- line_total_net is GENERATED, trade defaults to 'Sonstiges', status must be valid enum
  WITH raw_agg AS (
    SELECT
      pm.project_id,
      COALESCE(pm.trade, 'Sonstiges') AS trade,
      pm.material_type,
      SUM(pm.quantity) AS total_quantity,
      MODE() WITHIN GROUP (ORDER BY pm.quantity_unit) AS quantity_unit,
      pm.product_id,
      pr.name AS product_name,
      pr.last_price_net_eur,
      COALESCE(pr.use_count, 0) AS product_use_count,
      COUNT(DISTINCT pm.offer_position_id) AS position_count,
      bool_and(pm.status = 'ordered') AS all_ordered
    FROM project_materials pm
    LEFT JOIN products pr ON pr.id = pm.product_id
    WHERE pm.project_id = p_project_id
    GROUP BY pm.project_id, COALESCE(pm.trade, 'Sonstiges'), pm.material_type,
             pm.product_id, pr.name, pr.last_price_net_eur, pr.use_count
  ),
  -- Now pick one row per material_type: prefer the one with a product, then highest use_count
  ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (
        PARTITION BY project_id, material_type
        ORDER BY 
          CASE WHEN product_id IS NOT NULL THEN 0 ELSE 1 END,
          product_use_count DESC,
          total_quantity DESC
      ) AS rn
    FROM raw_agg
  ),
  -- Also get totals per material_type
  totals AS (
    SELECT
      project_id,
      material_type,
      SUM(total_quantity) AS grand_total_quantity,
      SUM(position_count) AS grand_position_count,
      bool_or(product_id IS NOT NULL) AS has_any_product,
      bool_and(product_id IS NOT NULL) AS all_have_product,
      bool_and(all_ordered) FILTER (WHERE product_id IS NOT NULL) AS all_are_ordered
    FROM raw_agg
    GROUP BY project_id, material_type
  )
  INSERT INTO project_material_needs (
    project_id, trade, material_type, label, total_quantity, quantity_unit,
    product_id, product_name, unit_price_net,
    status, source, notes, room
  )
  SELECT
    r.project_id,
    r.trade,
    r.material_type,
    r.material_type AS label,
    t.grand_total_quantity,
    r.quantity_unit,
    r.product_id,
    r.product_name,
    r.last_price_net_eur,
    CASE
      WHEN t.all_are_ordered THEN 'ordered'
      WHEN t.all_have_product THEN 'confirmed'
      ELSE 'planned'
    END,
    'auto',
    t.grand_position_count::text || ' Positionen',
    '__all__'
  FROM ranked r
  JOIN totals t ON t.project_id = r.project_id AND t.material_type = r.material_type
  WHERE r.rn = 1;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'project_id', p_project_id,
    'needs_created', v_count
  );
END;
$$;


ALTER FUNCTION "public"."populate_project_material_needs"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_invoice_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_payment_reference" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invoice sales_invoices%ROWTYPE;
BEGIN
  SELECT * INTO v_invoice FROM sales_invoices WHERE id = p_invoice_id;
  IF v_invoice.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rechnung nicht gefunden');
  END IF;

  UPDATE sales_invoices
  SET status = 'PAID',
      paid_at = now(),
      paid_amount = p_amount,
      reminder_level = 0,
      updated_at = now()
  WHERE id = p_invoice_id;

  -- Event loggen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (v_invoice.project_id, 'PROJECT_STATUS_CHANGED', 'backend',
    jsonb_build_object(
      'type', 'invoice_paid',
      'invoice_id', p_invoice_id,
      'invoice_number', v_invoice.invoice_number,
      'amount', p_amount,
      'payment_reference', p_payment_reference
    )
  );

  RETURN json_build_object(
    'success', true,
    'invoice_number', v_invoice.invoice_number,
    'amount_paid', p_amount,
    'message', 'Zahlung verbucht für ' || v_invoice.invoice_number
  );
END;
$$;


ALTER FUNCTION "public"."record_invoice_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_payment_reference" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."record_invoice_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_payment_reference" "text") IS 'Zahlung verbuchen: Setzt Status auf PAID, reseted Mahnstufe.';



CREATE OR REPLACE FUNCTION "public"."record_price_from_invoice"("p_supplier_article_id" "uuid", "p_unit_price" numeric, "p_invoice_number" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_price_id UUID;
  v_existing_today UUID;
BEGIN
  -- CHECK: Existiert heute schon ein Preis für diesen Artikel?
  SELECT id INTO v_existing_today
  FROM supplier_article_prices
  WHERE supplier_article_id = p_supplier_article_id
    AND valid_from = CURRENT_DATE
    AND min_quantity = 1;
  
  -- Wenn JA: nur Preis updaten, fertig
  IF v_existing_today IS NOT NULL THEN
    UPDATE supplier_article_prices
    SET unit_price_net = p_unit_price,
        source_reference = p_invoice_number
    WHERE id = v_existing_today;
    RETURN v_existing_today;
  END IF;
  
  -- Alten Preis abschließen (NUR wenn NICHT von heute!)
  UPDATE supplier_article_prices
  SET valid_to = CURRENT_DATE - INTERVAL '1 day'
  WHERE supplier_article_id = p_supplier_article_id
    AND valid_to IS NULL
    AND min_quantity = 1
    AND valid_from < CURRENT_DATE;  -- ← WICHTIG!
  
  -- Neuen Preis eintragen
  INSERT INTO supplier_article_prices (
    supplier_article_id,
    unit_price_net,
    valid_from,
    min_quantity,
    source,
    source_reference
  ) VALUES (
    p_supplier_article_id,
    p_unit_price,
    CURRENT_DATE,
    1,
    'INVOICE',
    p_invoice_number
  )
  RETURNING id INTO v_price_id;
  
  RETURN v_price_id;
END;
$$;


ALTER FUNCTION "public"."record_price_from_invoice"("p_supplier_article_id" "uuid", "p_unit_price" numeric, "p_invoice_number" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."record_price_from_invoice"("p_supplier_article_id" "uuid", "p_unit_price" numeric, "p_invoice_number" "text") IS 'Erfasst neuen Preis aus Rechnung und schließt alten ab';



CREATE OR REPLACE FUNCTION "public"."refresh_protocol_stats"("p_protocol_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE inspection_protocols
  SET 
    total_items = (
      SELECT COUNT(*) FROM inspection_protocol_items 
      WHERE protocol_id = p_protocol_id
    ),
    completed_items = (
      SELECT COUNT(*) FROM inspection_protocol_items 
      WHERE protocol_id = p_protocol_id 
      AND status IN ('ja', 'nicht_anwendbar')
    ),
    items_with_issues = (
      SELECT COUNT(*) FROM inspection_protocol_items 
      WHERE protocol_id = p_protocol_id 
      AND (has_defect = true OR requires_supplement = true)
    ),
    updated_at = now()
  WHERE id = p_protocol_id;
END;
$$;


ALTER FUNCTION "public"."refresh_protocol_stats"("p_protocol_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_protocol_stats"("p_protocol_id" "uuid") IS 'Aktualisiert Zähler nach Item-Änderungen';



CREATE OR REPLACE FUNCTION "public"."register_folder"("p_folder_type" "text", "p_folder_key" "text", "p_drive_folder_id" "text", "p_parent_folder_id" "text" DEFAULT NULL::"text", "p_full_path" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "folder_key" "text", "drive_folder_id" "text", "created" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_existing_id UUID;
  v_new_id UUID;
BEGIN
  SELECT dfr.id INTO v_existing_id
  FROM drive_folder_registry dfr
  WHERE dfr.folder_key = p_folder_key;
  
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY
    SELECT dfr.id, dfr.folder_key, dfr.drive_folder_id, FALSE
    FROM drive_folder_registry dfr
    WHERE dfr.id = v_existing_id;
  ELSE
    INSERT INTO drive_folder_registry (folder_type, folder_key, drive_folder_id, parent_folder_id, full_path)
    VALUES (p_folder_type, p_folder_key, p_drive_folder_id, p_parent_folder_id, p_full_path)
    RETURNING drive_folder_registry.id INTO v_new_id;
    
    RETURN QUERY
    SELECT dfr.id, dfr.folder_key, dfr.drive_folder_id, TRUE
    FROM drive_folder_registry dfr
    WHERE dfr.id = v_new_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."register_folder"("p_folder_type" "text", "p_folder_key" "text", "p_drive_folder_id" "text", "p_parent_folder_id" "text", "p_full_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_change_order"("p_change_order_id" "uuid", "p_rejected_by" "text" DEFAULT 'Auftraggeber'::"text", "p_reason" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_co RECORD;
BEGIN
  SELECT id, change_order_number, project_id, status, amount_gross, title
  INTO v_co
  FROM change_orders WHERE id = p_change_order_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Nachtrag nicht gefunden');
  END IF;

  IF v_co.status NOT IN ('SUBMITTED', 'PENDING_CUSTOMER') THEN
    RETURN json_build_object('success', false, 'error',
      'Nachtrag kann nur aus Status SUBMITTED/PENDING_CUSTOMER abgelehnt werden (aktuell: ' || v_co.status || ')');
  END IF;

  UPDATE change_orders
  SET status = 'REJECTED_BY_CUSTOMER',
      rejected_at = NOW(),
      rejection_reason = p_reason,
      customer_response_at = NOW(),
      updated_at = NOW()
  WHERE id = p_change_order_id;

  -- Event loggen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (
    v_co.project_id,
    'CHANGE_ORDER_CUSTOMER_REJECTED',
    'baugenius',
    json_build_object(
      'change_order_id', p_change_order_id,
      'change_order_number', v_co.change_order_number,
      'rejected_by', p_rejected_by,
      'reason', COALESCE(p_reason, 'Kein Grund angegeben')
    )::JSONB
  );

  -- Activity loggen
  INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
  VALUES (
    v_co.project_id,
    'change_order',
    'Nachtrag ' || v_co.change_order_number || ' abgelehnt',
    'Abgelehnt von ' || p_rejected_by || CASE WHEN p_reason IS NOT NULL THEN ': ' || p_reason ELSE '' END,
    json_build_object('change_order_id', p_change_order_id, 'reason', p_reason)::JSONB,
    'system'
  );

  RETURN json_build_object(
    'success', true,
    'change_order_number', v_co.change_order_number,
    'rejected_by', p_rejected_by,
    'reason', p_reason,
    'message', 'Nachtrag ' || v_co.change_order_number || ' abgelehnt'
  );
END;
$$;


ALTER FUNCTION "public"."reject_change_order"("p_change_order_id" "uuid", "p_rejected_by" "text", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reject_change_order"("p_change_order_id" "uuid", "p_rejected_by" "text", "p_reason" "text") IS 'Nachtrag ablehnen: SUBMITTED → REJECTED_BY_CUSTOMER + Event + Activity.';



CREATE OR REPLACE FUNCTION "public"."request_monteur_auftrag_pdf"("p_project_id" "uuid", "p_trade" "text" DEFAULT NULL::"text", "p_requested_by" "text" DEFAULT 'system'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_project projects%ROWTYPE;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF v_project.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  -- Event für n8n-Flow erstellen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (p_project_id, 'MONTEUR_AUFTRAG_CREATED', 'backend',
    jsonb_build_object(
      'project_id', p_project_id,
      'project_name', v_project.name,
      'project_number', v_project.project_number,
      'trade', p_trade,
      'requested_by', p_requested_by
    )
  );

  -- Route hinzufügen falls nicht vorhanden
  INSERT INTO event_routing (event_type, target_workflow, description, is_active)
  VALUES ('MONTEUR_AUFTRAG_CREATED', 'MX_07_Monteur_Auftrag_PDF', 'Monteur-Auftrag PDF generieren', true)
  ON CONFLICT (event_type, target_workflow) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'project_name', v_project.name,
    'trade', p_trade,
    'message', 'Monteur-Auftrag PDF wird generiert für ' || v_project.name || COALESCE(' (' || p_trade || ')', '')
  );
END;
$$;


ALTER FUNCTION "public"."request_monteur_auftrag_pdf"("p_project_id" "uuid", "p_trade" "text", "p_requested_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."request_monteur_auftrag_pdf"("p_project_id" "uuid", "p_trade" "text", "p_requested_by" "text") IS 'Monteur-Auftrag PDF anfordern: Erstellt Event für n8n-Flow zur PDF-Generierung.';



CREATE OR REPLACE FUNCTION "public"."reschedule_project"("p_project_id" "uuid", "p_new_start_date" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_project RECORD;
  v_current_start DATE;
  v_shift_days INT;
  v_phases_count INT;
BEGIN
  -- Projekt laden
  SELECT id, name, project_number, planned_start, planned_end
  INTO v_project
  FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  -- Frühestes Start-Datum aus schedule_phases
  SELECT MIN(start_date) INTO v_current_start
  FROM schedule_phases
  WHERE project_id = p_project_id;

  IF v_current_start IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Kein Zeitplan vorhanden — zuerst Schedule generieren');
  END IF;

  -- Verschiebung berechnen
  v_shift_days := p_new_start_date - v_current_start;

  IF v_shift_days = 0 THEN
    RETURN json_build_object('success', true, 'message', 'Keine Verschiebung nötig — Start-Datum ist identisch', 'shift_days', 0);
  END IF;

  -- Nur nicht-abgeschlossene Phasen verschieben
  UPDATE schedule_phases
  SET start_date = start_date + v_shift_days,
      end_date = end_date + v_shift_days,
      updated_at = NOW()
  WHERE project_id = p_project_id
    AND status NOT IN ('completed');

  GET DIAGNOSTICS v_phases_count = ROW_COUNT;

  -- Projekt-Datum aktualisieren
  UPDATE projects
  SET planned_start = p_new_start_date,
      planned_end = CASE
        WHEN planned_end IS NOT NULL THEN planned_end + v_shift_days
        ELSE NULL
      END,
      updated_at = NOW()
  WHERE id = p_project_id;

  -- Activity loggen
  INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_project_id,
    'schedule',
    'Zeitplan verschoben',
    v_phases_count || ' Phasen um ' || ABS(v_shift_days) || ' Tage ' ||
      CASE WHEN v_shift_days > 0 THEN 'nach hinten' ELSE 'nach vorne' END ||
      ' verschoben. Neuer Start: ' || p_new_start_date,
    json_build_object(
      'old_start', v_current_start,
      'new_start', p_new_start_date,
      'shift_days', v_shift_days,
      'phases_affected', v_phases_count
    )::JSONB,
    'system'
  );

  -- Event loggen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (
    p_project_id,
    'PROJECT_UPDATED',
    'baugenius',
    json_build_object(
      'action', 'reschedule',
      'old_start', v_current_start,
      'new_start', p_new_start_date,
      'shift_days', v_shift_days,
      'phases_affected', v_phases_count
    )::JSONB
  );

  RETURN json_build_object(
    'success', true,
    'project_name', v_project.name,
    'old_start', v_current_start,
    'new_start', p_new_start_date,
    'shift_days', v_shift_days,
    'phases_affected', v_phases_count,
    'new_planned_end', (SELECT MAX(end_date) FROM schedule_phases WHERE project_id = p_project_id),
    'message', v_project.name || ': ' || v_phases_count || ' Phasen um ' || ABS(v_shift_days) || ' Tage verschoben'
  );
END;
$$;


ALTER FUNCTION "public"."reschedule_project"("p_project_id" "uuid", "p_new_start_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reschedule_project"("p_project_id" "uuid", "p_new_start_date" "date") IS 'Zeitplan verschieben: Alle nicht-abgeschlossenen Phasen um N Tage verschieben.';



CREATE OR REPLACE FUNCTION "public"."reset_invoice_status"("p_invoice_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- 1. Unlink bank transactions
  UPDATE bank_transactions bt SET is_matched = FALSE, matched_at = NULL FROM invoice_payments ip 
  WHERE ip.bank_transaction_id = bt.id AND ip.purchase_invoice_id = p_invoice_id;
  
  -- 2. Delete payment links
  DELETE FROM invoice_payments WHERE purchase_invoice_id = p_invoice_id;
  
  -- 3. Reset invoice (using APPROVED as the valid open status)
  UPDATE purchase_invoices SET status = 'APPROVED', paid_at = NULL, paid_amount = 0 WHERE id = p_invoice_id;
  
  RETURN jsonb_build_object('success', true);
END; $$;


ALTER FUNCTION "public"."reset_invoice_status"("p_invoice_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_stale_processing"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  reset_count INT;
BEGIN
  UPDATE receipt_queue
  SET 
    status = 'PENDING',
    processing_started_at = NULL
  WHERE status = 'PROCESSING'
    AND processing_started_at < now() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$;


ALTER FUNCTION "public"."reset_stale_processing"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reset_stale_processing"() IS 'Cleanup für crashed Worker (nach 5 Min Timeout)';



CREATE OR REPLACE FUNCTION "public"."resolve_trade_id"("p_trade_text" "text") RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COALESCE(
    (SELECT trade_id FROM trade_aliases WHERE alias = p_trade_text LIMIT 1),
    (SELECT id FROM trades WHERE name = 'Sonstiges' LIMIT 1)
  );
$$;


ALTER FUNCTION "public"."resolve_trade_id"("p_trade_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."resolve_trade_id"("p_trade_text" "text") IS 'Löst Trade-Text zu trades.id auf, mit Sonstiges als Fallback';



CREATE OR REPLACE FUNCTION "public"."revert_position_status"("p_position_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_phase VARCHAR;
BEGIN
    -- Check current phase
    SELECT phase INTO v_current_phase
    FROM offer_positions
    WHERE id = p_position_id;

    IF v_current_phase != 'abnahme' THEN
        RAISE EXCEPTION 'Position is not in abnahme phase';
    END IF;

    -- Update position
    UPDATE offer_positions
    SET 
        phase = 'zwischenbegehung',
        progress_percent = 90,
        completed_at = NULL
    WHERE id = p_position_id;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."revert_position_status"("p_position_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_positions"("search_term" "text", "limit_results" integer DEFAULT 10) RETURNS TABLE("source" "text", "id" "uuid", "code" "text", "title" "text", "description" "text", "unit" "text", "unit_price" numeric, "trade" "text", "rank" real)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  
  SELECT 
    'CATALOG'::TEXT as source,
    cp.id,
    cp.catalog_code as code,
    cp.repair_title as title,
    cp.repair_text_full as description,
    cp.unit,
    cpp.gu_price_eur as unit_price,
    cp.trade,
    ts_rank(
      to_tsvector('german', coalesce(cp.repair_title, '') || ' ' || coalesce(cp.damage_title, '') || ' ' || coalesce(cp.catalog_code, '')),
      plainto_tsquery('german', search_term)
    ) as rank
  FROM catalog_positions cp
  LEFT JOIN catalog_position_prices cpp ON cp.id = cpp.position_id
  WHERE cp.is_active = true
    AND (
      cp.catalog_code ILIKE '%' || search_term || '%'
      OR cp.repair_title ILIKE '%' || search_term || '%'
      OR cp.damage_title ILIKE '%' || search_term || '%'
      OR to_tsvector('german', coalesce(cp.repair_title, '') || ' ' || coalesce(cp.damage_title, '')) 
         @@ plainto_tsquery('german', search_term)
    )
  
  UNION ALL
  
  SELECT 
    'CUSTOM'::TEXT as source,
    cust.id,
    cust.code,
    cust.title,
    cust.description,
    cust.unit,
    CASE 
      WHEN cust.use_manual_price THEN cust.manual_unit_price
      ELSE cust.calculated_unit_price
    END as unit_price,
    cust.trade,
    ts_rank(
      to_tsvector('german', coalesce(cust.title, '') || ' ' || coalesce(cust.description, '')),
      plainto_tsquery('german', search_term)
    ) as rank
  FROM custom_positions cust
  WHERE cust.is_active = true
    AND (
      cust.code ILIKE '%' || search_term || '%'
      OR cust.title ILIKE '%' || search_term || '%'
      OR to_tsvector('german', coalesce(cust.title, '') || ' ' || coalesce(cust.description, '')) 
         @@ plainto_tsquery('german', search_term)
    )
  
  ORDER BY rank DESC, title ASC
  LIMIT limit_results;
END;
$$;


ALTER FUNCTION "public"."search_positions"("search_term" "text", "limit_results" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_products"("p_query" "text", "p_material_type" "text" DEFAULT NULL::"text", "p_trade" "text" DEFAULT NULL::"text", "p_supplier_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "name" "text", "material_type" "text", "supplier_id" "uuid", "supplier_name" "text", "sku" "text", "last_price_net_eur" numeric, "unit" "text", "use_count" integer, "is_favorite" boolean, "similarity_score" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.material_type,
    p.supplier_id,
    s.name as supplier_name,
    p.sku,
    p.last_price_net_eur,
    p.unit,
    p.use_count,
    p.is_favorite,
    CASE 
      WHEN p_query IS NULL THEN 1.0
      ELSE similarity(p.name, p_query)
    END as similarity_score
  FROM products p
  LEFT JOIN suppliers s ON s.id = p.supplier_id
  WHERE 
    p.is_active = true
    AND (
      p_query IS NULL 
      OR p.name ILIKE '%' || p_query || '%' 
      OR similarity(p.name, p_query) > 0.2
      OR p.sku ILIKE '%' || p_query || '%'
    )
    AND (p_material_type IS NULL OR p.material_type = p_material_type)
    AND (p_trade IS NULL OR p.trade = p_trade)
    AND (p_supplier_id IS NULL OR p.supplier_id = p_supplier_id)
  ORDER BY 
    -- Favoriten zuerst
    p.is_favorite DESC,
    -- Exakter Prefix-Match
    CASE WHEN p_query IS NOT NULL AND p.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    -- Dann nach Nutzungshäufigkeit
    p.use_count DESC,
    -- Dann nach Ähnlichkeit
    similarity(p.name, COALESCE(p_query, '')) DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_products"("p_query" "text", "p_material_type" "text", "p_trade" "text", "p_supplier_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_products"("p_query" "text", "p_material_type" "text", "p_trade" "text", "p_supplier_id" "uuid", "p_limit" integer) IS 'Autocomplete-Suche für Produkte mit Ranking nach Relevanz und Nutzung';



CREATE OR REPLACE FUNCTION "public"."set_change_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.change_order_number IS NULL OR NEW.change_order_number = '' THEN
        NEW.change_order_number := generate_change_order_number();
    END IF;
    NEW.amount_gross := NEW.amount_net * (1 + NEW.vat_rate / 100);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_change_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_timestamp_catalog_position_prices"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_timestamp_catalog_position_prices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_timestamp_catalog_position_texts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_timestamp_catalog_position_texts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_timestamp_catalog_positions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_timestamp_catalog_positions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."skip_receipt_processing"("p_queue_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE receipt_queue
  SET 
    status = 'SKIPPED',
    error_message = p_reason,
    processed_at = now()
  WHERE id = p_queue_id;
END;
$$;


ALTER FUNCTION "public"."skip_receipt_processing"("p_queue_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_change_order"("p_change_order_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_co RECORD;
BEGIN
  -- Nachtrag laden
  SELECT id, change_order_number, project_id, status, amount_gross, title
  INTO v_co
  FROM change_orders WHERE id = p_change_order_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Nachtrag nicht gefunden');
  END IF;

  IF v_co.status != 'DRAFT' THEN
    RETURN json_build_object('success', false, 'error',
      'Nachtrag kann nur aus Status DRAFT eingereicht werden (aktuell: ' || v_co.status || ')');
  END IF;

  -- Status ändern
  UPDATE change_orders
  SET status = 'SUBMITTED',
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_change_order_id;

  -- Event loggen
  INSERT INTO events (project_id, event_type, source_system, payload)
  VALUES (
    v_co.project_id,
    'CHANGE_ORDER_SUBMITTED',
    'baugenius',
    json_build_object(
      'change_order_id', p_change_order_id,
      'change_order_number', v_co.change_order_number,
      'amount_gross', v_co.amount_gross,
      'title', v_co.title
    )::JSONB
  );

  -- Activity loggen
  INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_by)
  VALUES (
    v_co.project_id,
    'change_order',
    'Nachtrag ' || v_co.change_order_number || ' eingereicht',
    v_co.title || ' (' || v_co.amount_gross || '€)',
    json_build_object('change_order_id', p_change_order_id)::JSONB,
    'system'
  );

  RETURN json_build_object(
    'success', true,
    'change_order_number', v_co.change_order_number,
    'amount', v_co.amount_gross,
    'message', 'Nachtrag ' || v_co.change_order_number || ' eingereicht (' || v_co.amount_gross || '€)'
  );
END;
$$;


ALTER FUNCTION "public"."submit_change_order"("p_change_order_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."submit_change_order"("p_change_order_id" "uuid") IS 'Nachtrag einreichen: DRAFT → SUBMITTED + Event + Activity.';



CREATE OR REPLACE FUNCTION "public"."suggest_purchase_orders"("p_project_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
  v_project projects%ROWTYPE;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF v_project.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  WITH needed AS (
    SELECT
      pm.id,
      pm.product_id,
      pr.name AS product_name,
      pm.material_type,
      COALESCE(pm.quantity_unit, pr.unit, 'Stk') AS unit,
      pm.quantity,
      COALESCE(pm.trade, 'Sonstiges')::TEXT AS trade,
      COALESCE(pm.override_price_net_eur, pr.last_price_net_eur, 0) AS unit_price,
      COALESCE(s.name, '⚠️ Kein Lieferant') AS supplier_name,
      COALESCE(s.short_name, s.name, '—') AS supplier_short,
      s.email AS supplier_email
    FROM project_materials pm
    LEFT JOIN products pr ON pr.id = pm.product_id
    LEFT JOIN suppliers s ON s.id = pr.supplier_id
    WHERE pm.project_id = p_project_id
      AND pm.purchase_order_id IS NULL
      AND pm.status != 'ordered'
  ),
  -- Aggregate same product per supplier
  product_agg AS (
    SELECT
      supplier_name,
      supplier_short,
      supplier_email,
      COALESCE(product_name, material_type) AS label,
      unit,
      trade,
      SUM(quantity) AS total_qty,
      MAX(unit_price) AS unit_price,
      SUM(quantity * unit_price) AS line_total
    FROM needed
    GROUP BY supplier_name, supplier_short, supplier_email,
             COALESCE(product_name, material_type), unit, trade
  ),
  -- Rank products within each supplier
  ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY supplier_name ORDER BY line_total DESC) AS rn
    FROM product_agg
  ),
  -- Group by supplier with top products
  by_supplier AS (
    SELECT
      supplier_name,
      MAX(supplier_short) AS supplier_short,
      MAX(supplier_email) AS supplier_email,
      COUNT(*) AS product_count,
      SUM(line_total)::numeric(10,2) AS total_value,
      string_agg(DISTINCT trade, ', ' ORDER BY trade) AS trades,
      (SELECT json_agg(json_build_object(
        'name', r.label,
        'qty', r.total_qty,
        'unit', r.unit,
        'price', r.unit_price,
        'total', r.line_total::numeric(10,2)
      ) ORDER BY r.line_total DESC)
       FROM ranked r
       WHERE r.supplier_name = pa.supplier_name AND r.rn <= 5
      ) AS top_products
    FROM product_agg pa
    GROUP BY supplier_name
  )
  SELECT json_build_object(
    'success', true,
    'project_id', p_project_id,
    'project_name', v_project.name,
    'project_number', v_project.project_number,
    'orders', COALESCE((
      SELECT json_agg(json_build_object(
        'supplier', bs.supplier_name,
        'supplier_short', bs.supplier_short,
        'email', bs.supplier_email,
        'product_count', bs.product_count,
        'total_value', bs.total_value,
        'trades', bs.trades,
        'top_products', bs.top_products
      ) ORDER BY bs.total_value DESC)
      FROM by_supplier bs
    ), '[]'::JSON),
    'summary', json_build_object(
      'total_orderable', (SELECT COUNT(*) FROM needed WHERE product_id IS NOT NULL),
      'total_unassigned', (SELECT COUNT(*) FROM needed WHERE product_id IS NULL),
      'total_suppliers', (SELECT COUNT(*) FROM by_supplier WHERE supplier_name != '⚠️ Kein Lieferant'),
      'total_est_value', (SELECT COALESCE(SUM(total_value), 0) FROM by_supplier),
      'missing_email', (SELECT COUNT(*) FROM by_supplier WHERE supplier_email IS NULL AND supplier_name != '⚠️ Kein Lieferant')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."suggest_purchase_orders"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."suggest_purchase_orders"("p_project_id" "uuid") IS 'M4_03 Order Suggester: Generiert Bestellvorschläge gruppiert nach Gewerk, basierend auf unbestelltem Material-Bedarf.';



CREATE OR REPLACE FUNCTION "public"."trg_auto_apply_material_to_siblings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_pos_key TEXT;
  v_project_id UUID;
  v_sibling RECORD;
BEGIN
  IF NEW.product_id IS NULL OR NEW.offer_position_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.is_auto_applied = true THEN
    RETURN NEW;
  END IF;

  v_project_id := NEW.project_id;

  SELECT COALESCE(
    op.catalog_position_v2_id::TEXT,
    NULLIF(TRIM(op.catalog_code), ''),
    op.title
  )
  INTO v_pos_key
  FROM offer_positions op
  WHERE op.id = NEW.offer_position_id;

  IF v_pos_key IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_sibling IN
    SELECT
      op.id AS position_id,
      COALESCE(m.measured_quantity, op.quantity, 1) AS effective_qty,
      op.trade::TEXT AS pos_trade
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN measurements m ON m.offer_position_id = op.id
                              AND m.status = 'confirmed'
    WHERE o.project_id = v_project_id
      AND op.id != NEW.offer_position_id
      AND op.deleted_at IS NULL
      AND COALESCE(
        op.catalog_position_v2_id::TEXT,
        NULLIF(TRIM(op.catalog_code), ''),
        op.title
      ) = v_pos_key
  LOOP
    INSERT INTO project_materials (
      project_id, offer_position_id, material_type, trade,
      quantity, quantity_unit, product_id, category, status,
      is_auto_applied, notes
    ) VALUES (
      v_project_id,
      v_sibling.position_id,
      NEW.material_type,
      COALESCE(NEW.trade, v_sibling.pos_trade),
      v_sibling.effective_qty,
      NEW.quantity_unit,
      NEW.product_id,
      COALESCE(NEW.category, 'material'),
      'confirmed',
      true,
      NULL
    )
    ON CONFLICT (project_id, offer_position_id, material_type)
    DO UPDATE SET
      product_id = EXCLUDED.product_id,
      quantity = EXCLUDED.quantity,
      quantity_unit = EXCLUDED.quantity_unit,
      status = 'confirmed',
      is_auto_applied = true,
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_auto_apply_material_to_siblings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_fn_godmode_phase_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Nur ausfuehren wenn Status auf 'completed' wechselt
    PERFORM fn_learn_from_completed_phase(NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_fn_godmode_phase_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_fn_sync_catalog_price"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
      IF NEW.catalog_position_v2_id IS NOT NULL AND NEW.unit_price > 0 AND NEW.deleted_at IS NULL THEN
          UPDATE catalog_positions_v2
          SET base_price_eur = NEW.unit_price,
              price_updated_at = now(),
              updated_at = now()
          WHERE id = NEW.catalog_position_v2_id
            AND (base_price_eur IS NULL OR base_price_eur != NEW.unit_price);
      END IF;
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."trg_fn_sync_catalog_price"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_recalc_on_surcharge_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF COALESCE(NEW.surcharge_overhead_percent, 0) <> COALESCE(OLD.surcharge_overhead_percent, 0) OR
     COALESCE(NEW.surcharge_profit_percent, 0) <> COALESCE(OLD.surcharge_profit_percent, 0) THEN
     
     PERFORM calculate_position_price(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_recalc_on_surcharge_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bank_accounts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bank_accounts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_classified_emails_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_classified_emails_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_defect_status"("p_defect_id" "uuid", "p_status" "text", "p_comment" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
  v_old_status defect_status;
  v_project_id UUID;
BEGIN
  SELECT status, project_id INTO v_old_status, v_project_id
  FROM defects WHERE id = p_defect_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mangel nicht gefunden: %', p_defect_id;
  END IF;

  UPDATE defects
  SET status = p_status::defect_status,
      resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN now() ELSE resolved_at END,
      updated_at = now()
  WHERE id = p_defect_id
  RETURNING json_build_object(
    'id', id, 'title', title, 'status', status,
    'resolved_at', resolved_at, 'updated_at', updated_at
  ) INTO v_result;

  IF p_comment IS NOT NULL THEN
    INSERT INTO defect_comments (defect_id, comment, status_from, status_to)
    VALUES (p_defect_id, p_comment, v_old_status, p_status::defect_status);
  END IF;

  INSERT INTO events (event_type, payload)
  VALUES ('DEFECT_STATUS_CHANGED', json_build_object(
    'defect_id', p_defect_id, 'project_id', v_project_id,
    'old_status', v_old_status, 'new_status', p_status, 'defect', v_result
  ));

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."update_defect_status"("p_defect_id" "uuid", "p_status" "text", "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inspection_defects_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inspection_defects_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inspection_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inspection_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_subtotal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE purchase_invoices
  SET subtotal_net = (
    SELECT COALESCE(SUM(total_price_net), 0)
    FROM purchase_invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  )
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invoice_subtotal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_offer_missing_prices"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE offers 
  SET has_missing_prices = EXISTS(
    SELECT 1 FROM offer_positions 
    WHERE offer_id = COALESCE(NEW.offer_id, OLD.offer_id)
    AND (unit_price IS NULL OR unit_price = 0)
  )
  WHERE id = COALESCE(NEW.offer_id, OLD.offer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_offer_missing_prices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_offer_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE offers
  SET 
    total_net = sub.total,
    total_gross = sub.total * 1.19,
    updated_at = now()
  FROM (
    SELECT COALESCE(SUM(total_price), 0) as total
    FROM offer_positions 
    WHERE offer_id = COALESCE(NEW.offer_id, OLD.offer_id)
  ) sub
  WHERE id = COALESCE(NEW.offer_id, OLD.offer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_offer_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_position"("p_position_id" "uuid", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_unit" "text" DEFAULT NULL::"text", "p_unit_price" numeric DEFAULT NULL::numeric, "p_quantity" numeric DEFAULT NULL::numeric, "p_trade" "text" DEFAULT NULL::"text", "p_is_optional" boolean DEFAULT NULL::boolean, "p_position_number" integer DEFAULT NULL::integer, "p_internal_note" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
  v_offer_id UUID;
  v_project_id UUID;
  v_section_id UUID;
  v_new_total NUMERIC;
  v_final_unit_price NUMERIC;
  v_final_quantity NUMERIC;
BEGIN
  -- Get offer, project, and section IDs for event
  SELECT op.offer_id, op.section_id, o.project_id INTO v_offer_id, v_section_id, v_project_id
  FROM offer_positions op
  JOIN offers o ON o.id = op.offer_id
  WHERE op.id = p_position_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position not found: %', p_position_id;
  END IF;

  -- Get current values for calculation if not provided
  SELECT 
    COALESCE(p_unit_price, unit_price),
    COALESCE(p_quantity, quantity)
  INTO v_final_unit_price, v_final_quantity
  FROM offer_positions WHERE id = p_position_id;

  -- Calculate new total
  v_new_total := COALESCE(v_final_unit_price, 0) * COALESCE(v_final_quantity, 0);

  -- Update the position
  UPDATE offer_positions
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    unit = COALESCE(p_unit, unit),
    unit_price = COALESCE(p_unit_price, unit_price),
    quantity = COALESCE(p_quantity, quantity),
    total_price = v_new_total,
    trade = COALESCE(p_trade, trade),
    is_optional = COALESCE(p_is_optional, is_optional),
    position_number = COALESCE(p_position_number, position_number),
    internal_note = COALESCE(p_internal_note, internal_note),
    updated_at = now()
  WHERE id = p_position_id
  RETURNING json_build_object(
    'id', id,
    'title', title,
    'unit', unit,
    'unit_price', unit_price,
    'quantity', quantity,
    'total_price', total_price,
    'trade', trade,
    'updated_at', updated_at
  ) INTO v_result;

  -- Fire event
  INSERT INTO events (event_type, payload)
  VALUES (
    'POSITION_UPDATED',
    json_build_object(
      'position_id', p_position_id,
      'section_id', v_section_id,
      'offer_id', v_offer_id,
      'project_id', v_project_id,
      'changes', v_result
    )
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."update_position"("p_position_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_position_number" integer, "p_internal_note" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_position"("p_position_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_position_number" integer, "p_internal_note" "text") IS 'Updates an offer position. Auto-calculates total_price. Fires POSITION_UPDATED event.';



CREATE OR REPLACE FUNCTION "public"."update_position_progress"("p_position_id" "uuid", "p_progress_percent" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_phase TEXT;
BEGIN
  -- Validate progress
  IF p_progress_percent < 0 OR p_progress_percent > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Progress must be 0-100');
  END IF;

  -- Determine new phase
  IF p_progress_percent = 100 THEN
    v_new_phase := 'abnahme';
  ELSE
    v_new_phase := 'zwischenbegehung';
  END IF;

  -- Update position
  UPDATE offer_positions
  SET 
    progress_percent = p_progress_percent,
    progress_updated_at = NOW(),
    phase = v_new_phase,
    completed_at = CASE WHEN p_progress_percent = 100 THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_position_id
    AND deleted_at IS NULL;

  RETURN json_build_object(
    'success', true,
    'position_id', p_position_id,
    'progress_percent', p_progress_percent,
    'phase', v_new_phase
  );
END;
$$;


ALTER FUNCTION "public"."update_position_progress"("p_position_id" "uuid", "p_progress_percent" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project"("p_project_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_status" "public"."project_status" DEFAULT NULL::"public"."project_status", "p_client_id" "uuid" DEFAULT NULL::"uuid", "p_object_street" "text" DEFAULT NULL::"text", "p_object_zip" "text" DEFAULT NULL::"text", "p_object_city" "text" DEFAULT NULL::"text", "p_object_floor" "text" DEFAULT NULL::"text", "p_object_type" "text" DEFAULT NULL::"text", "p_object_size_sqm" numeric DEFAULT NULL::numeric, "p_planned_start" "date" DEFAULT NULL::"date", "p_planned_end" "date" DEFAULT NULL::"date", "p_notes" "text" DEFAULT NULL::"text", "p_assigned_team" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE projects SET
    name = COALESCE(p_name, name),
    status = COALESCE(p_status, status),
    client_id = COALESCE(p_client_id, client_id),
    object_street = COALESCE(p_object_street, object_street),
    object_zip = COALESCE(p_object_zip, object_zip),
    object_city = COALESCE(p_object_city, object_city),
    object_floor = COALESCE(p_object_floor, object_floor),
    object_type = COALESCE(p_object_type, object_type),
    object_size_sqm = COALESCE(p_object_size_sqm, object_size_sqm),
    planned_start = COALESCE(p_planned_start, planned_start),
    planned_end = COALESCE(p_planned_end, planned_end),
    notes = COALESCE(p_notes, notes),
    assigned_team = COALESCE(p_assigned_team, assigned_team),
    updated_at = NOW()
  WHERE id = p_project_id
  RETURNING jsonb_build_object(
    'id', id,
    'name', name,
    'status', status,
    'updated_at', updated_at
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;

  -- Event feuern fuer n8n (Fix: source -> source_system)
  INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
  VALUES (
    'PROJECT_UPDATED',
    p_project_id,
    'frontend',
    'EditProjectDialog',
    jsonb_build_object(
      'project_id', p_project_id,
      'changes', jsonb_build_object(
        'name', p_name,
        'status', p_status
      )
    )
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."update_project"("p_project_id" "uuid", "p_name" "text", "p_status" "public"."project_status", "p_client_id" "uuid", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_notes" "text", "p_assigned_team" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_project"("p_project_id" "uuid", "p_name" "text", "p_status" "public"."project_status", "p_client_id" "uuid", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_notes" "text", "p_assigned_team" "text") IS 'Update project details. Only non-null params are updated.';



CREATE OR REPLACE FUNCTION "public"."update_protocol_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE inspection_protocols
    SET 
        total_items = (
            SELECT COUNT(*) FROM inspection_protocol_items WHERE protocol_id = COALESCE(NEW.protocol_id, OLD.protocol_id)
        ),
        completed_items = (
            SELECT COUNT(*) FROM inspection_protocol_items 
            WHERE protocol_id = COALESCE(NEW.protocol_id, OLD.protocol_id)
            AND status IN ('ja', 'nein', 'nicht_anwendbar')
        ),
        items_with_issues = (
            SELECT COUNT(*) FROM inspection_protocol_items 
            WHERE protocol_id = COALESCE(NEW.protocol_id, OLD.protocol_id)
            AND (has_defect = TRUE OR requires_supplement = TRUE)
        ),
        updated_at = now()
    WHERE id = COALESCE(NEW.protocol_id, OLD.protocol_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_protocol_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_invoice"("p_invoice_id" "uuid", "p_invoice_number" "text", "p_subtotal_net" numeric, "p_vat_percent" numeric, "p_invoice_date" "date", "p_due_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                                                                
  BEGIN                                                                                                                  
    UPDATE purchase_invoices                                                                                             
    SET                                                                                                                  
      invoice_number = p_invoice_number,                                                                                 
      subtotal_net = p_subtotal_net,                                                                                     
      vat_percent = p_vat_percent,                                                                                       
      invoice_date = p_invoice_date,                                                                                     
      due_date = p_due_date,                                                                                             
      updated_at = NOW()                                                                                                 
    WHERE id = p_invoice_id;                                                                                             
    RETURN jsonb_build_object('success', true);                                                                          
  END;                                                                                                                   
  $$;


ALTER FUNCTION "public"."update_purchase_invoice"("p_invoice_id" "uuid", "p_invoice_number" "text", "p_subtotal_net" numeric, "p_vat_percent" numeric, "p_invoice_date" "date", "p_due_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_room_measurements_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_room_measurements_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_schedule_phase_cost"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.assigned_team_member_id IS NOT NULL AND NEW.estimated_hours IS NOT NULL THEN
    SELECT NEW.estimated_hours * tm.hourly_rate
    INTO NEW.estimated_cost
    FROM team_members tm
    WHERE tm.id = NEW.assigned_team_member_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_schedule_phase_cost"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_section"("p_section_id" "uuid", "p_title" "text", "p_trade" "text" DEFAULT NULL::"text", "p_section_number" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
  v_offer_id UUID;
  v_project_id UUID;
BEGIN
  -- Get offer and project IDs for event
  SELECT os.offer_id, o.project_id INTO v_offer_id, v_project_id
  FROM offer_sections os
  JOIN offers o ON o.id = os.offer_id
  WHERE os.id = p_section_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Section not found: %', p_section_id;
  END IF;

  -- Update the section
  UPDATE offer_sections
  SET 
    title = COALESCE(p_title, title),
    trade = p_trade,
    section_number = COALESCE(p_section_number, section_number),
    updated_at = now()
  WHERE id = p_section_id
  RETURNING json_build_object(
    'id', id,
    'title', title,
    'trade', trade,
    'section_number', section_number,
    'updated_at', updated_at
  ) INTO v_result;

  -- Fire event
  INSERT INTO events (event_type, payload)
  VALUES (
    'SECTION_UPDATED',
    json_build_object(
      'section_id', p_section_id,
      'offer_id', v_offer_id,
      'project_id', v_project_id,
      'changes', v_result
    )
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."update_section"("p_section_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_section"("p_section_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) IS 'Updates an offer section. Fires SECTION_UPDATED event.';



CREATE OR REPLACE FUNCTION "public"."update_section_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE offer_sections
  SET section_total_net = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM offer_positions
    WHERE section_id = COALESCE(NEW.section_id, OLD.section_id)
    AND position_type = 'STANDARD'
  )
  WHERE id = COALESCE(NEW.section_id, OLD.section_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_section_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_room_measurement"("p_project_id" "uuid", "p_floor_name" "text", "p_room_name" "text", "p_floor_area_m2" numeric DEFAULT NULL::numeric, "p_wall_area_m2" numeric DEFAULT NULL::numeric, "p_wall_area_with_openings_m2" numeric DEFAULT NULL::numeric, "p_room_height_m" numeric DEFAULT NULL::numeric, "p_volume_m3" numeric DEFAULT NULL::numeric, "p_perimeter_m" numeric DEFAULT NULL::numeric, "p_ceiling_perimeter_m" numeric DEFAULT NULL::numeric, "p_door_area_m2" numeric DEFAULT NULL::numeric, "p_window_area_m2" numeric DEFAULT NULL::numeric, "p_source_file" "text" DEFAULT NULL::"text", "p_source_event_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_id UUID;
  v_room_normalized TEXT;
BEGIN
  -- Normalize room name (lowercase, trim)
  v_room_normalized := lower(trim(p_room_name));
  
  INSERT INTO project_room_measurements (
    project_id, floor_name, room_name, room_name_normalized,
    floor_area_m2, wall_area_m2, wall_area_with_openings_m2,
    room_height_m, volume_m3, perimeter_m, ceiling_perimeter_m,
    door_area_m2, window_area_m2,
    source_file, source_event_id
  ) VALUES (
    p_project_id, COALESCE(p_floor_name, 'Erdgeschoss'), p_room_name, v_room_normalized,
    p_floor_area_m2, p_wall_area_m2, p_wall_area_with_openings_m2,
    p_room_height_m, p_volume_m3, p_perimeter_m, p_ceiling_perimeter_m,
    p_door_area_m2, p_window_area_m2,
    p_source_file, p_source_event_id
  )
  ON CONFLICT (project_id, room_name_normalized, floor_name) DO UPDATE SET
    room_name = EXCLUDED.room_name,
    floor_area_m2 = COALESCE(EXCLUDED.floor_area_m2, project_room_measurements.floor_area_m2),
    wall_area_m2 = COALESCE(EXCLUDED.wall_area_m2, project_room_measurements.wall_area_m2),
    wall_area_with_openings_m2 = COALESCE(EXCLUDED.wall_area_with_openings_m2, project_room_measurements.wall_area_with_openings_m2),
    room_height_m = COALESCE(EXCLUDED.room_height_m, project_room_measurements.room_height_m),
    volume_m3 = COALESCE(EXCLUDED.volume_m3, project_room_measurements.volume_m3),
    perimeter_m = COALESCE(EXCLUDED.perimeter_m, project_room_measurements.perimeter_m),
    ceiling_perimeter_m = COALESCE(EXCLUDED.ceiling_perimeter_m, project_room_measurements.ceiling_perimeter_m),
    door_area_m2 = COALESCE(EXCLUDED.door_area_m2, project_room_measurements.door_area_m2),
    window_area_m2 = COALESCE(EXCLUDED.window_area_m2, project_room_measurements.window_area_m2),
    source_file = COALESCE(EXCLUDED.source_file, project_room_measurements.source_file),
    source_event_id = COALESCE(EXCLUDED.source_event_id, project_room_measurements.source_event_id),
    updated_at = now()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."upsert_room_measurement"("p_project_id" "uuid", "p_floor_name" "text", "p_room_name" "text", "p_floor_area_m2" numeric, "p_wall_area_m2" numeric, "p_wall_area_with_openings_m2" numeric, "p_room_height_m" numeric, "p_volume_m3" numeric, "p_perimeter_m" numeric, "p_ceiling_perimeter_m" numeric, "p_door_area_m2" numeric, "p_window_area_m2" numeric, "p_source_file" "text", "p_source_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_room_measurement"("p_project_id" "uuid", "p_floor_name" "text", "p_room_name" "text", "p_floor_area_m2" numeric, "p_wall_area_m2" numeric, "p_wall_area_with_openings_m2" numeric, "p_room_height_m" numeric, "p_volume_m3" numeric, "p_perimeter_m" numeric, "p_ceiling_perimeter_m" numeric, "p_door_area_m2" numeric, "p_window_area_m2" numeric, "p_source_file" "text", "p_source_event_id" "uuid") IS 'Idempotent Upsert für n8n Parser Flow';



CREATE OR REPLACE FUNCTION "public"."write_calculated_materials"("p_project_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_calc RECORD;
BEGIN
  -- Delete existing calculations for this project's positions
  DELETE FROM position_calc_materials
  WHERE position_id IN (
    SELECT op.id 
    FROM offer_positions op
    JOIN offers o ON op.offer_id = o.id
    WHERE o.project_id = p_project_id
  );
  
  -- Insert new calculations (only base columns, generated columns auto-calculate)
  FOR v_calc IN SELECT * FROM calculate_project_materials(p_project_id) LOOP
    INSERT INTO position_calc_materials (
      id,
      position_id,
      material_name,
      quantity,
      unit,
      waste_percent,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_calc.position_id,
      v_calc.material_name,
      v_calc.quantity,
      v_calc.unit,
      (v_calc.waste_factor - 1) * 100,
      now(),
      now()
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."write_calculated_materials"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."write_calculated_materials"("p_project_id" "uuid") IS 'M4-01: Writes calculated materials to position_calc_materials table';



CREATE TABLE IF NOT EXISTS "public"."absences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_member_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "note" "text",
    "approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "absences_type_check" CHECK (("type" = ANY (ARRAY['vacation'::"text", 'sick'::"text", 'training'::"text", 'other'::"text"]))),
    CONSTRAINT "valid_absence_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."absences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "permissions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "rate_limit_per_minute" integer DEFAULT 60,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_api_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."agent_api_keys" IS 'API Keys für externe Agenten — Hash-basiert, kein Klartext';



COMMENT ON COLUMN "public"."agent_api_keys"."key_hash" IS 'SHA-256 Hash des Klartext-Keys';



COMMENT ON COLUMN "public"."agent_api_keys"."permissions" IS 'Array erlaubter Edge Function Namen';



CREATE TABLE IF NOT EXISTS "public"."agent_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "position_id" "uuid",
    "action" "text",
    "proposed_text" "text",
    "final_text" "text",
    "quality_score" numeric(3,2),
    "model_used" "text",
    "tokens_in" integer,
    "tokens_out" integer,
    "latency_ms" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_messages_action_check" CHECK (("action" = ANY (ARRAY['propose'::"text", 'approve'::"text", 'edit'::"text", 'reject'::"text", 'commit'::"text", 'batch_propose'::"text"]))),
    CONSTRAINT "agent_messages_quality_score_check" CHECK ((("quality_score" IS NULL) OR (("quality_score" >= (0)::numeric) AND ("quality_score" <= (1)::numeric)))),
    CONSTRAINT "agent_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text", 'tool'::"text"])))
);


ALTER TABLE "public"."agent_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "position_id" "uuid",
    "catalog_code" "text",
    "trade" "text",
    "observation_type" "text" NOT NULL,
    "proposed_text" "text",
    "final_text" "text",
    "edit_distance" integer,
    "quality_score" numeric(3,2),
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_observations_observation_type_check" CHECK (("observation_type" = ANY (ARRAY['text_approved'::"text", 'text_edited'::"text", 'text_rejected'::"text", 'style_preference'::"text", 'term_correction'::"text"])))
);


ALTER TABLE "public"."agent_observations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_type" "text" NOT NULL,
    "project_id" "uuid",
    "offer_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "context_snapshot" "jsonb",
    "positions_total" integer DEFAULT 0,
    "positions_completed" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agent_threads_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'archived'::"text"]))),
    CONSTRAINT "agent_threads_thread_type_check" CHECK (("thread_type" = ANY (ARRAY['offer_longtext'::"text", 'email_draft'::"text", 'protocol'::"text", 'change_order'::"text"])))
);


ALTER TABLE "public"."agent_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agent_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_prompt" "text" NOT NULL,
    "parsed_params" "jsonb",
    "matched_jumbo_id" "uuid",
    "created_offer_id" "uuid",
    "processing_time_ms" integer,
    "position_count" integer,
    "total_value" numeric(12,2),
    "was_accepted" boolean,
    "user_edits_count" integer,
    "user_feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."ai_agent_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "approval_type" "public"."approval_type" NOT NULL,
    "reference_id" "uuid",
    "reference_table" "text",
    "status" "public"."approval_status" DEFAULT 'PENDING'::"public"."approval_status",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "requested_by" "text",
    "request_summary" "text",
    "request_data" "jsonb",
    "decided_at" timestamp with time zone,
    "decided_by" "text",
    "decision_channel" "text",
    "feedback_category" "text",
    "feedback_reason" "text",
    "feedback_data" "jsonb",
    "reminder_sent_at" timestamp with time zone,
    "reminder_count" integer DEFAULT 0,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "feedback_category_id" "uuid",
    "dispatched_at" timestamp with time zone,
    "dispatch_channel" "text",
    "dispatch_status" "text" DEFAULT 'pending'::"text",
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    CONSTRAINT "approvals_dispatch_channel_check" CHECK (("dispatch_channel" = ANY (ARRAY['telegram'::"text", 'whatsapp'::"text", 'email'::"text"]))),
    CONSTRAINT "approvals_dispatch_status_check" CHECK (("dispatch_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"]))),
    CONSTRAINT "chk_decision_requires_decider" CHECK (((("status" = ANY (ARRAY['APPROVED'::"public"."approval_status", 'REJECTED'::"public"."approval_status"])) AND ("decided_by" IS NOT NULL)) OR ("status" = ANY (ARRAY['PENDING'::"public"."approval_status", 'REVISED'::"public"."approval_status", 'EXPIRED'::"public"."approval_status"])))),
    CONSTRAINT "chk_decision_requires_feedback" CHECK (((("status" = ANY (ARRAY['APPROVED'::"public"."approval_status", 'REJECTED'::"public"."approval_status"])) AND (("feedback_category_id" IS NOT NULL) OR ("feedback_category" IS NOT NULL))) OR ("status" <> ALL (ARRAY['APPROVED'::"public"."approval_status", 'REJECTED'::"public"."approval_status"])))),
    CONSTRAINT "chk_decision_requires_timestamp" CHECK (((("status" = ANY (ARRAY['APPROVED'::"public"."approval_status", 'REJECTED'::"public"."approval_status", 'REVISED'::"public"."approval_status", 'EXPIRED'::"public"."approval_status"])) AND ("decided_at" IS NOT NULL)) OR (("status" = 'PENDING'::"public"."approval_status") AND ("decided_at" IS NULL))))
);


ALTER TABLE "public"."approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "team_member_id" "uuid",
    "subcontractor_id" "uuid",
    "person_name" "text" NOT NULL,
    "company_name" "text",
    "check_in" timestamp with time zone DEFAULT "now"() NOT NULL,
    "check_out" timestamp with time zone,
    "source" "text" DEFAULT 'qr_code'::"text",
    "notes" "text",
    CONSTRAINT "attendance_logs_source_check" CHECK (("source" = ANY (ARRAY['qr_code'::"text", 'manual'::"text", 'app'::"text", 'nfc'::"text"]))),
    CONSTRAINT "valid_checkout" CHECK ((("check_out" IS NULL) OR ("check_out" > "check_in")))
);


ALTER TABLE "public"."attendance_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requisition_id" "text",
    "account_id" "text",
    "institution_id" "text",
    "institution_name" "text" NOT NULL,
    "iban" "text" NOT NULL,
    "owner_name" "text",
    "is_primary" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text",
    "last_synced_at" timestamp with time zone,
    "consent_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."bank_accounts" IS 'GoCardless Bank Account Data Integration - VR Bank Holstein + Finom';



COMMENT ON COLUMN "public"."bank_accounts"."requisition_id" IS 'GoCardless Requisition ID für Consent-Flow';



COMMENT ON COLUMN "public"."bank_accounts"."consent_expires_at" IS 'PSD2 verlangt Re-Auth alle 90 Tage';



CREATE TABLE IF NOT EXISTS "public"."bank_import_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filename" "text" NOT NULL,
    "format_detected" "text",
    "transaction_count" integer,
    "imported_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_import_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_name" "text",
    "account_iban" "text" NOT NULL,
    "booking_date" "date" NOT NULL,
    "value_date" "date",
    "amount" numeric(15,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "counterpart_name" "text",
    "counterpart_iban" "text",
    "reference_text" "text",
    "external_id" "text",
    "transaction_type" "public"."transaction_type" DEFAULT 'TRANSFER'::"public"."transaction_type" NOT NULL,
    "is_matched" boolean DEFAULT false,
    "matched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_v2_id" "uuid" NOT NULL,
    "alias_title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_discount_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_version_id" "uuid" NOT NULL,
    "min_netto_sum" numeric(12,2) NOT NULL,
    "discount_pct" numeric(5,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_discount_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_material_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_nr" "text" NOT NULL,
    "catalog_source" "text" NOT NULL,
    "material_name" "text" NOT NULL,
    "default_qty" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "gewerk" "text" NOT NULL,
    "product_pool_id" "uuid",
    "multiplier_field" "text",
    "multiplier_factor" numeric DEFAULT 1,
    "note" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "catalog_material_mapping_catalog_source_check" CHECK (("catalog_source" = ANY (ARRAY['epa_078'::"text", 'handwerkerauftrag'::"text", 'custom'::"text"]))),
    CONSTRAINT "catalog_material_mapping_multiplier_field_check" CHECK ((("multiplier_field" IS NULL) OR ("multiplier_field" = ANY (ARRAY['position_qty'::"text", 'floor_area_m2'::"text", 'wall_area_m2'::"text", 'room_perimeter_m'::"text", 'ceiling_area_m2'::"text"]))))
);


ALTER TABLE "public"."catalog_material_mapping" OWNER TO "postgres";


COMMENT ON TABLE "public"."catalog_material_mapping" IS 'Maps EPA 078 and Handwerkerauftrag position numbers to required materials with quantity calculation rules';



COMMENT ON COLUMN "public"."catalog_material_mapping"."multiplier_field" IS 'NULL=fixed qty, position_qty=from offer position, floor_area_m2/wall_area_m2/room_perimeter_m/ceiling_area_m2=from room measurements';



CREATE TABLE IF NOT EXISTS "public"."catalog_position_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "catalog_version_id" "uuid" NOT NULL,
    "gu_price_eur" numeric(12,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "valid_from" "date",
    "valid_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_position_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_position_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity_per_unit" numeric DEFAULT 1,
    "is_default" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_position_products" OWNER TO "postgres";


COMMENT ON TABLE "public"."catalog_position_products" IS 'Direkte Produkt-Zuordnung für Stück-basierte Positionen (Sanitär, Elektro). Ergänzt material_consumption_rates für Flächen-basierte Gewerke.';



CREATE TABLE IF NOT EXISTS "public"."catalog_position_texts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "language" "text" DEFAULT 'de'::"text" NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_position_texts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_version_id" "uuid" NOT NULL,
    "catalog_code" "text" NOT NULL,
    "main_group" "text" NOT NULL,
    "damage_title" "text" NOT NULL,
    "repair_title" "text" NOT NULL,
    "repair_text_full" "text",
    "unit" "text",
    "trade" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "repair_title_tr" "text",
    "repair_text_full_tr" "text",
    "repair_title_pl" "text",
    "repair_text_full_pl" "text"
);


ALTER TABLE "public"."catalog_positions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."catalog_positions"."repair_title_tr" IS 'Türkische Übersetzung des Reparaturtitels';



COMMENT ON COLUMN "public"."catalog_positions"."repair_text_full_tr" IS 'Türkische Übersetzung des vollständigen Leistungstexts';



CREATE TABLE IF NOT EXISTS "public"."catalog_positions_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_id" "uuid" NOT NULL,
    "position_code" "text" NOT NULL,
    "parent_code" "text",
    "title" "text" NOT NULL,
    "title_secondary" "text",
    "title_tr" "text",
    "description" "text",
    "trade" "text",
    "category" "text",
    "unit" "text",
    "base_price_eur" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "legacy_table" "text",
    "legacy_id" "uuid",
    "title_pl" "text",
    "title_ro" "text",
    "title_ru" "text",
    "trade_id" "uuid",
    "price_updated_at" timestamp with time zone
);


ALTER TABLE "public"."catalog_positions_v2" OWNER TO "postgres";


COMMENT ON TABLE "public"."catalog_positions_v2" IS 'Unified Leistungspositionen aller Contractors';



COMMENT ON COLUMN "public"."catalog_positions_v2"."legacy_table" IS 'Quell-Tabelle für Migration (catalog_positions, wbs_gwg_positions)';



COMMENT ON COLUMN "public"."catalog_positions_v2"."legacy_id" IS 'Original-ID für Debugging';



COMMENT ON COLUMN "public"."catalog_positions_v2"."title_pl" IS 'Polish translation of position title';



COMMENT ON COLUMN "public"."catalog_positions_v2"."title_ro" IS 'Romanian translation of position title';



COMMENT ON COLUMN "public"."catalog_positions_v2"."title_ru" IS 'Russian translation of position title';



CREATE TABLE IF NOT EXISTS "public"."catalog_supplier_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_id" "uuid",
    "supplier_article_id" "uuid" NOT NULL,
    "conversion_factor" numeric(10,4) DEFAULT 1,
    "conversion_note" "text",
    "priority" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_supplier_mapping" OWNER TO "postgres";


COMMENT ON TABLE "public"."catalog_supplier_mapping" IS 'Mapping: Welcher Lieferantenartikel passt zu welcher Katalogposition';



CREATE TABLE IF NOT EXISTS "public"."catalog_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "valid_from" "date",
    "valid_to" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "valid_from" "date" NOT NULL,
    "valid_to" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalogs" OWNER TO "postgres";


COMMENT ON TABLE "public"."catalogs" IS 'Preiskataloge pro Auftraggeber mit Gültigkeitszeitraum';



CREATE TABLE IF NOT EXISTS "public"."change_order_evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "change_order_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_size_bytes" integer,
    "description" "text",
    "captured_at" timestamp with time zone,
    "captured_by" "text",
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."change_order_evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."change_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "change_order_id" "uuid" NOT NULL,
    "position_number" "text" NOT NULL,
    "catalog_position_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit" "text" DEFAULT 'Stück'::"text" NOT NULL,
    "unit_price" numeric(12,2) NOT NULL,
    "total_price" numeric(12,2) NOT NULL,
    "is_catalog_price" boolean DEFAULT false,
    "markup_percent" numeric(5,2),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."change_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."change_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "change_order_number" "text" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "sales_invoice_id" "uuid",
    "title" "text" NOT NULL,
    "reason" "public"."change_order_reason" DEFAULT 'ADDITIONAL_WORK'::"public"."change_order_reason" NOT NULL,
    "reason_detail" "text",
    "description" "text",
    "status" "public"."change_order_status" DEFAULT 'DRAFT'::"public"."change_order_status" NOT NULL,
    "amount_net" numeric(12,2) DEFAULT 0 NOT NULL,
    "vat_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "amount_gross" numeric(12,2) DEFAULT 0 NOT NULL,
    "vob_reference" "text",
    "submitted_at" timestamp with time zone,
    "response_deadline" "date",
    "approved_at" timestamp with time zone,
    "approved_by" "text",
    "approval_reference" "text",
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text",
    "pdf_storage_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "offer_id" "uuid",
    "section_id" "uuid",
    "sent_at" timestamp with time zone,
    "customer_response_at" timestamp with time zone,
    "idempotency_key" "text",
    "quantity" numeric(10,2),
    "unit" character varying(20),
    "unit_price" numeric(10,2),
    "source" character varying(20),
    "catalog_position_id" "uuid",
    "photo_paths" "text"[],
    CONSTRAINT "change_orders_source_check" CHECK ((("source")::"text" = ANY ((ARRAY['catalog'::character varying, 'manual'::character varying])::"text"[])))
);


ALTER TABLE "public"."change_orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."change_orders"."amount_net" IS 'Total = quantity * unit_price (netto)';



COMMENT ON COLUMN "public"."change_orders"."offer_id" IS 'Verknüpfung zum Angebot für Einbuchung';



COMMENT ON COLUMN "public"."change_orders"."section_id" IS 'Raum/Sektion für Zuordnung';



COMMENT ON COLUMN "public"."change_orders"."sent_at" IS 'Zeitpunkt Mailversand an Kunde';



COMMENT ON COLUMN "public"."change_orders"."customer_response_at" IS 'Zeitpunkt Kundenantwort';



COMMENT ON COLUMN "public"."change_orders"."idempotency_key" IS 'Verhindert doppelte Nachträge bei Event-Replay';



COMMENT ON COLUMN "public"."change_orders"."quantity" IS 'Menge (z.B. 3)';



COMMENT ON COLUMN "public"."change_orders"."unit" IS 'Einheit (psch, lfm, m², Stk)';



COMMENT ON COLUMN "public"."change_orders"."unit_price" IS 'Einzelpreis netto';



COMMENT ON COLUMN "public"."change_orders"."source" IS 'catalog = aus Katalog, manual = freie Eingabe';



COMMENT ON COLUMN "public"."change_orders"."catalog_position_id" IS 'FK zur Katalog-Position wenn source=catalog';



COMMENT ON COLUMN "public"."change_orders"."photo_paths" IS 'Array von Storage-Pfaden für Beweisfotos';



CREATE TABLE IF NOT EXISTS "public"."chat_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_history_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."chat_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid",
    "role" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "tool_calls" "jsonb",
    "tool_results" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."chat_messages" IS 'Chat-Verlauf zwischen User und BauGenius Agent, projektbezogen';



COMMENT ON COLUMN "public"."chat_messages"."project_id" IS 'Projekt-UUID, NULL fuer allgemeine Chats ohne Projektbezug';



CREATE TABLE IF NOT EXISTS "public"."classified_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gmail_message_id" "text",
    "gmail_thread_id" "text",
    "from_address" "text",
    "to_address" "text",
    "subject" "text",
    "body_snippet" "text",
    "attachment_names" "text"[],
    "received_at" timestamp with time zone,
    "gmail_label" "text",
    "doc_type" "text" NOT NULL,
    "confidence" numeric(3,2),
    "reason" "text",
    "routed_to" "text",
    "event_id" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "superchat_message_id" "text",
    "superchat_conversation_id" "text",
    "channel" "text" DEFAULT 'email'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "classified_emails_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))
);


ALTER TABLE "public"."classified_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "alias_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_product_defaults" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "catalog_position_id" "uuid",
    "product_id" "uuid",
    "product_format" "text",
    "default_height_cm" integer,
    "wet_area_height_cm" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_product_defaults" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_product_defaults" IS 'Standardprodukte pro Gesellschaft (WBS, SAGA, etc.)';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text",
    "salutation" "text",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "street" "text",
    "zip_code" "text",
    "city" "text",
    "notes" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_type" "public"."client_type" DEFAULT 'PRIVATE'::"public"."client_type",
    "email_domain" "text",
    "default_catalog_id" "uuid",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "auto_created" boolean DEFAULT false,
    "vat_id" "text",
    "contact_person" "text",
    "customer_number" "text",
    "lexware_contact_id" "text",
    "lexware_synced_at" timestamp with time zone,
    CONSTRAINT "clients_salutation_check" CHECK (("salutation" = ANY (ARRAY['Herr'::"text", 'Frau'::"text", 'Firma'::"text", 'Divers'::"text"])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clients"."email" IS 'E-Mail-Adresse des Kunden / Ansprechpartners';



COMMENT ON COLUMN "public"."clients"."phone" IS 'Telefonnummer';



COMMENT ON COLUMN "public"."clients"."street" IS 'Straße und Hausnummer';



COMMENT ON COLUMN "public"."clients"."zip_code" IS 'PLZ';



COMMENT ON COLUMN "public"."clients"."city" IS 'Ort';



COMMENT ON COLUMN "public"."clients"."email_domain" IS 'Email-Domain für automatisches Client-Matching (z.B. saga.de)';



COMMENT ON COLUMN "public"."clients"."vat_id" IS 'USt-IdNr. des Kunden';



COMMENT ON COLUMN "public"."clients"."contact_person" IS 'Hauptansprechpartner';



COMMENT ON COLUMN "public"."clients"."customer_number" IS 'Deine interne Kundennummer';



CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text",
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "setting_type" "text" DEFAULT 'text'::"text",
    "updated_by" "text"
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_settings" IS 'Firmenstammdaten und Einstellungen für Dokumentgenerierung';



CREATE TABLE IF NOT EXISTS "public"."contractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email_domains" "text"[] DEFAULT '{}'::"text"[],
    "logo_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contractors" OWNER TO "postgres";


COMMENT ON TABLE "public"."contractors" IS 'Auftraggeber: SAGA, WBS, BDS, B&O etc.';



CREATE TABLE IF NOT EXISTS "public"."custom_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "long_text" "text",
    "unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "trade" "text",
    "category" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "material_cost_per_unit" numeric(10,2) DEFAULT 0,
    "material_markup_percent" numeric(5,2) DEFAULT 20,
    "labor_minutes_per_unit" numeric(10,2) DEFAULT 0,
    "hourly_rate" numeric(10,2) DEFAULT 45,
    "labor_markup_percent" numeric(5,2) DEFAULT 165,
    "equipment_cost_per_unit" numeric(10,2) DEFAULT 0,
    "equipment_markup_percent" numeric(5,2) DEFAULT 5,
    "profit_margin_percent" numeric(5,2) DEFAULT 15,
    "calculated_unit_price" numeric(10,2) GENERATED ALWAYS AS (((("material_cost_per_unit" * ((1)::numeric + ("material_markup_percent" / (100)::numeric))) + ((("labor_minutes_per_unit" / (60)::numeric) * "hourly_rate") * ((1)::numeric + ("labor_markup_percent" / (100)::numeric)))) + (("equipment_cost_per_unit" * ((1)::numeric + ("equipment_markup_percent" / (100)::numeric))) * ((1)::numeric + ("profit_margin_percent" / (100)::numeric))))) STORED,
    "manual_unit_price" numeric(10,2),
    "use_manual_price" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "is_template" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."defect_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "defect_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "photo_paths" "text"[] DEFAULT '{}'::"text"[],
    "status_from" "public"."defect_status",
    "status_to" "public"."defect_status",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."defect_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."defect_comments" IS 'Kommentare und Statusänderungen zu Mängeln';



CREATE TABLE IF NOT EXISTS "public"."defects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "position_id" "uuid",
    "section_id" "uuid",
    "inspection_protocol_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "severity" "public"."defect_severity" DEFAULT 'medium'::"public"."defect_severity" NOT NULL,
    "status" "public"."defect_status" DEFAULT 'open'::"public"."defect_status" NOT NULL,
    "assigned_to" "uuid",
    "deadline" "date",
    "resolved_at" timestamp with time zone,
    "photo_paths" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."defects" OWNER TO "postgres";


COMMENT ON TABLE "public"."defects" IS 'Mängelverwaltung: Erfassung und Tracking von Baumängeln bei Abnahme';



CREATE TABLE IF NOT EXISTS "public"."dispatch_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "event_type" "text" NOT NULL,
    "target_workflow" "text" NOT NULL,
    "webhook_url" "text",
    "error_message" "text",
    "error_code" "text",
    "http_status" integer,
    "attempt_count" integer DEFAULT 1,
    "max_attempts" integer DEFAULT 3,
    "last_attempt_at" timestamp with time zone DEFAULT "now"(),
    "next_retry_at" timestamp with time zone DEFAULT ("now"() + '00:05:00'::interval),
    "resolved_at" timestamp with time zone,
    "resolved_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dispatch_errors" OWNER TO "postgres";


COMMENT ON TABLE "public"."dispatch_errors" IS 'Tracking für fehlgeschlagene Event-Dispatches. MX_03_Dispatch_Doctor überwacht und retried.';



CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "html_content" "text" NOT NULL,
    "version" integer DEFAULT 1,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."document_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_templates" IS 'HTML Templates für PDF-Generierung via Gotenberg';



CREATE TABLE IF NOT EXISTS "public"."drive_folder_registry" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "folder_type" "text" NOT NULL,
    "folder_key" "text" NOT NULL,
    "drive_folder_id" "text" NOT NULL,
    "parent_folder_id" "text",
    "full_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_folder_type" CHECK (("folder_type" = ANY (ARRAY['root'::"text", 'project_root'::"text", 'project_year'::"text", 'buchhaltung_root'::"text", 'buchhaltung_year'::"text", 'buchhaltung_month'::"text"])))
);


ALTER TABLE "public"."drive_folder_registry" OWNER TO "postgres";


COMMENT ON TABLE "public"."drive_folder_registry" IS 'Central registry for all Google Drive folders used by BG flows';



CREATE TABLE IF NOT EXISTS "public"."drive_folder_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "folder_name" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "is_required" boolean DEFAULT true,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."drive_folder_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_processing_attempts" (
    "email_message_id" "text" NOT NULL,
    "attempts" integer DEFAULT 1,
    "last_error" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "last_attempt_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_processing_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_processing_attempts" IS 'Tracks retry attempts for email invoice processing';



CREATE TABLE IF NOT EXISTS "public"."event_consumer_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consumer_name" "text" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean DEFAULT true,
    "error_message" "text"
);


ALTER TABLE "public"."event_consumer_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_routing" (
    "event_type" "text" NOT NULL,
    "target_workflow" "text" NOT NULL,
    "webhook_url" "text",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_routing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"(),
    "event_type" "public"."event_type" NOT NULL,
    "project_id" "uuid",
    "source_system" "text" NOT NULL,
    "source_flow" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "reference_id" "uuid",
    "reference_table" "text",
    "error_message" "text",
    "error_stack" "text",
    "correlation_id" "uuid",
    "parent_event_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dedupe_key" "text",
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."dedupe_key" IS 'Idempotenz-Key: z.B. "email_123" oder "tally_response_abc". Verhindert doppelte Events bei Retry.';



CREATE TABLE IF NOT EXISTS "public"."feedback_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "approval_type" "public"."approval_type" NOT NULL,
    "category_code" "text" NOT NULL,
    "category_label_de" "text" NOT NULL,
    "category_label_tr" "text",
    "is_rejection" boolean DEFAULT false,
    "requires_reason" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flow_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flow_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "reason" "text",
    "message_id" "text",
    "from_address" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flow_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "attachment_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "filename" "text",
    "file_size_bytes" bigint,
    "mime_type" "text",
    "metadata" "jsonb",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "site_capture_id" "uuid",
    CONSTRAINT "inspection_attachments_attachment_type_check" CHECK (("attachment_type" = ANY (ARRAY['magicplan_pdf'::"text", 'magicplan_csv'::"text", 'magicplan_sketch'::"text", 'video'::"text", 'photo'::"text", 'document'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."inspection_attachments" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_attachments" IS 'MagicPlan, Videos, Fotos zu Protokollen';



CREATE TABLE IF NOT EXISTS "public"."inspection_attendees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text",
    "company" "text",
    "signature_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inspection_attendees" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_attendees" IS 'Anwesende Personen bei Begehung';



COMMENT ON COLUMN "public"."inspection_attendees"."role" IS 'Rolle: Bauleiter, Architekt, Mieter, Elektriker, etc.';



COMMENT ON COLUMN "public"."inspection_attendees"."signature_data" IS 'Optional: {type: "base64"|"path", data: "..."}';



CREATE TABLE IF NOT EXISTS "public"."inspection_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "checked" boolean DEFAULT false,
    "note" "text",
    "photo_storage_path" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "checked_at" timestamp with time zone,
    "checked_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inspection_checklist_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_checklist_items" IS 'Checklisten-Punkte für Begehungen (Wohnung begehbar, Schlüssel erhalten, etc.)';



CREATE TABLE IF NOT EXISTS "public"."inspection_defects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "protocol_item_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "description" "text" NOT NULL,
    "room" "text",
    "severity" "text" DEFAULT 'mittel'::"text",
    "status" "text" DEFAULT 'offen'::"text",
    "photo_storage_path" "text",
    "responsible_party" "text",
    "due_date" "date",
    "resolved_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inspection_defects_severity_check" CHECK (("severity" = ANY (ARRAY['gering'::"text", 'mittel'::"text", 'schwer'::"text", 'kritisch'::"text"]))),
    CONSTRAINT "inspection_defects_status_check" CHECK (("status" = ANY (ARRAY['offen'::"text", 'in_bearbeitung'::"text", 'behoben'::"text", 'akzeptiert'::"text"])))
);


ALTER TABLE "public"."inspection_defects" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_defects" IS 'Mängel dokumentiert bei Begehungen';



COMMENT ON COLUMN "public"."inspection_defects"."protocol_item_id" IS 'Optional: Verknüpfung zu spezifischer Angebotsposition';



COMMENT ON COLUMN "public"."inspection_defects"."photo_storage_path" IS 'Pfad zu Foto in Google Drive oder Supabase Storage';



CREATE TABLE IF NOT EXISTS "public"."inspection_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "section_id" "uuid",
    "position_id" "uuid",
    "inspection_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "room_name" "text",
    "position_title" "text",
    "note" "text",
    "file_size_bytes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "inspection_photos_inspection_type_check" CHECK (("inspection_type" = ANY (ARRAY['erstbegehung'::"text", 'zwischenbegehung'::"text", 'abnahme'::"text"])))
);


ALTER TABLE "public"."inspection_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inspection_protocol_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "offer_position_id" "uuid",
    "sort_order" integer,
    "status" "text",
    "progress_percent" integer DEFAULT 0,
    "notes" "text",
    "product_override_id" "uuid",
    "product_notes" "text",
    "wet_area_type" "text",
    "tile_height_override_cm" integer,
    "measured_quantity" numeric(10,2),
    "measured_unit" "text",
    "measurement_source" "text",
    "has_defect" boolean DEFAULT false,
    "defect_description" "text",
    "requires_supplement" boolean DEFAULT false,
    "supplement_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deviation_type" "text",
    "is_additional" boolean DEFAULT false,
    "catalog_position_nr" "text",
    "photo_required" boolean DEFAULT true,
    CONSTRAINT "inspection_protocol_items_deviation_type_check" CHECK (("deviation_type" = ANY (ARRAY['schlimmer'::"text", 'anders'::"text", 'nicht_vorgefunden'::"text"]))),
    CONSTRAINT "inspection_protocol_items_measurement_source_check" CHECK (("measurement_source" = ANY (ARRAY['magicplan'::"text", 'manual'::"text", 'calculated'::"text"]))),
    CONSTRAINT "inspection_protocol_items_progress_percent_check" CHECK ((("progress_percent" >= 0) AND ("progress_percent" <= 100))),
    CONSTRAINT "inspection_protocol_items_status_check" CHECK (("status" = ANY (ARRAY['ja'::"text", 'nein'::"text", 'teilweise'::"text", 'nicht_anwendbar'::"text", 'offen'::"text"]))),
    CONSTRAINT "inspection_protocol_items_wet_area_type_check" CHECK (("wet_area_type" = ANY (ARRAY['dusche'::"text", 'badewanne'::"text", 'keine'::"text", NULL::"text"])))
);


ALTER TABLE "public"."inspection_protocol_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_protocol_items" IS 'Status pro Position im Protokoll';



COMMENT ON COLUMN "public"."inspection_protocol_items"."deviation_type" IS 'schlimmer=schlimmer als beschrieben, anders=anders als beschrieben, nicht_vorgefunden=Position nicht vorgefunden';



COMMENT ON COLUMN "public"."inspection_protocol_items"."is_additional" IS 'true=Zusatzleistung die nicht im Auftrag stand';



CREATE TABLE IF NOT EXISTS "public"."inspection_protocols" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "protocol_type" "text" NOT NULL,
    "protocol_number" "text",
    "inspection_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "inspector_name" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "general_notes" "text",
    "total_items" integer DEFAULT 0,
    "completed_items" integer DEFAULT 0,
    "items_with_issues" integer DEFAULT 0,
    "signature_contractor" "jsonb",
    "signature_client" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "next_appointment" "date",
    "pdf_storage_path" "text",
    "signature_path" "text",
    "completed_at" timestamp with time zone,
    "finalized_at" timestamp with time zone,
    "finalized_by" "uuid",
    "offer_id" "uuid",
    "catalog_label" "text",
    CONSTRAINT "inspection_protocols_protocol_type_check" CHECK (("protocol_type" = ANY (ARRAY['erstbegehung'::"text", 'zwischenbegehung'::"text", 'abnahme'::"text"]))),
    CONSTRAINT "inspection_protocols_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_progress'::"text", 'completed'::"text", 'signed'::"text"])))
);


ALTER TABLE "public"."inspection_protocols" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_protocols" IS 'Erstbegehung, Zwischenbegehung, Abnahme Protokolle';



COMMENT ON COLUMN "public"."inspection_protocols"."next_appointment" IS 'Geplanter nächster Begehungstermin';



COMMENT ON COLUMN "public"."inspection_protocols"."pdf_storage_path" IS 'Storage path für generiertes PDF';



COMMENT ON COLUMN "public"."inspection_protocols"."signature_path" IS 'Storage path to PNG signature file (e.g. signatures/{project_id}/{protocol_id}.png)';



COMMENT ON COLUMN "public"."inspection_protocols"."completed_at" IS 'Timestamp when protocol was finalized';



COMMENT ON COLUMN "public"."inspection_protocols"."offer_id" IS 'Links inspection to specific offer/LV (AV or WABS)';



COMMENT ON COLUMN "public"."inspection_protocols"."catalog_label" IS 'Display label: AV, WABS, etc. for quick identification';



CREATE TABLE IF NOT EXISTS "public"."invoice_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_transaction_id" "uuid" NOT NULL,
    "sales_invoice_id" "uuid",
    "purchase_invoice_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "match_confidence" integer,
    "match_reasons" "jsonb",
    "status" "public"."payment_match_status" DEFAULT 'SUGGESTED'::"public"."payment_match_status",
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoice_payments_match_confidence_check" CHECK ((("match_confidence" >= 0) AND ("match_confidence" <= 100))),
    CONSTRAINT "one_invoice_type" CHECK (((("sales_invoice_id" IS NOT NULL) AND ("purchase_invoice_id" IS NULL)) OR (("sales_invoice_id" IS NULL) AND ("purchase_invoice_id" IS NOT NULL))))
);


ALTER TABLE "public"."invoice_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jumbo_template_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jumbo_id" "uuid" NOT NULL,
    "section_id" "uuid" NOT NULL,
    "catalog_position_id" "uuid",
    "custom_position_id" "uuid",
    "fallback_title" "text",
    "fallback_unit" "text",
    "fallback_unit_price" numeric(10,2),
    "quantity_formula" "text" DEFAULT '1'::"text",
    "default_quantity" numeric(10,3) DEFAULT 1,
    "position_number" integer NOT NULL,
    "is_optional" boolean DEFAULT false,
    "condition" "text",
    "sort_order" integer DEFAULT 0,
    CONSTRAINT "valid_position_source" CHECK ((("catalog_position_id" IS NOT NULL) OR ("custom_position_id" IS NOT NULL) OR ("fallback_title" IS NOT NULL)))
);


ALTER TABLE "public"."jumbo_template_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jumbo_template_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jumbo_id" "uuid" NOT NULL,
    "section_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "trade" "text",
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."jumbo_template_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jumbo_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "required_params" "jsonb" DEFAULT '[]'::"jsonb",
    "estimated_value_min" numeric(12,2),
    "estimated_value_max" numeric(12,2),
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."jumbo_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(768),
    "source_type" "text" NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "category" "text",
    "title" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "knowledge_base_source_type_check" CHECK (("source_type" = ANY (ARRAY['manual'::"text", 'faq'::"text", 'website_crawl'::"text", 'catalog'::"text", 'service'::"text"]))),
    CONSTRAINT "knowledge_base_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'internal'::"text"])))
);


ALTER TABLE "public"."knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labor_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "labor_group" "public"."labor_group" NOT NULL,
    "name" "text" NOT NULL,
    "hourly_rate" numeric(10,2) NOT NULL,
    "overhead_percent" numeric(5,2) DEFAULT 165,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."labor_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" DEFAULT 'MANUAL'::"text" NOT NULL,
    "source_detail" "text",
    "raw_name" "text",
    "raw_email" "text",
    "raw_phone" "text",
    "raw_address" "text",
    "raw_message" "text",
    "object_street" "text",
    "object_zip" "text",
    "object_city" "text",
    "object_type" "text",
    "status" "public"."lead_status" DEFAULT 'NEW'::"public"."lead_status",
    "qualified_at" timestamp with time zone,
    "disqualified_reason" "text",
    "client_id" "uuid",
    "project_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_file" "text",
    "source_offer_number" "text",
    "import_date" timestamp with time zone DEFAULT "now"(),
    "position_number" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "long_text" "text",
    "unit" "text",
    "quantity" numeric(10,3),
    "unit_price" numeric(10,2),
    "total_price" numeric(12,2),
    "project_type" "text",
    "project_size_sqm" numeric(10,2),
    "trade" "text",
    "matched_catalog_code" "text",
    "matched_custom_id" "uuid",
    "match_confidence" numeric(3,2),
    "used_for_training" boolean DEFAULT false,
    "is_processed" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false
);


ALTER TABLE "public"."legacy_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lexware_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "lexware_id" "text",
    "sync_direction" "text" NOT NULL,
    "sync_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "action" "text",
    "request_payload" "jsonb",
    "response_payload" "jsonb",
    CONSTRAINT "lexware_sync_log_sync_direction_check" CHECK (("sync_direction" = ANY (ARRAY['to_lexware'::"text", 'from_lexware'::"text", 'push'::"text", 'pull'::"text"]))),
    CONSTRAINT "lexware_sync_log_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'error'::"text", 'received'::"text"])))
);


ALTER TABLE "public"."lexware_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."llm_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "model_id" "text" NOT NULL,
    "endpoint_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 10 NOT NULL,
    "capabilities" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "max_tokens" integer DEFAULT 4096 NOT NULL,
    "cost_per_1k_input" numeric(8,6) DEFAULT 0,
    "cost_per_1k_output" numeric(8,6) DEFAULT 0,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "llm_providers_provider_check" CHECK (("provider" = ANY (ARRAY['anthropic'::"text", 'google'::"text", 'openai'::"text", 'local'::"text"])))
);


ALTER TABLE "public"."llm_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_consumption_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "catalog_position_prefix" "text",
    "product_id" "uuid",
    "consumption_per_unit" numeric(10,4) NOT NULL,
    "consumption_unit" "text" NOT NULL,
    "area_type" "text" NOT NULL,
    "waste_factor" numeric(5,2) DEFAULT 1.10,
    "min_order_quantity" numeric(10,2),
    "order_unit" "text",
    "order_unit_size" numeric(10,2),
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."material_consumption_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "offer_position_id" "uuid",
    "original_quantity" numeric(10,3),
    "measured_quantity" numeric(10,3),
    "unit" "text",
    "quantity_delta" numeric(10,3) GENERATED ALWAYS AS ((COALESCE("measured_quantity", (0)::numeric) - COALESCE("original_quantity", (0)::numeric))) STORED,
    "measured_by" "text",
    "measured_at" timestamp with time zone,
    "location_note" "text",
    "photo_paths" "text"[],
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."measurements" OWNER TO "postgres";


COMMENT ON TABLE "public"."measurements" IS 'Aufmaß-Erfassung vor Ort durch Monteure';



COMMENT ON COLUMN "public"."measurements"."quantity_delta" IS 'Positiv = mehr als erwartet, Negativ = weniger';



CREATE TABLE IF NOT EXISTS "public"."memory_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scope" "text" NOT NULL,
    "scope_id" "text",
    "memory_type" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "trade" "text",
    "confidence" numeric(3,2) DEFAULT 0.50 NOT NULL,
    "observation_count" integer DEFAULT 0 NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "memory_entries_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "memory_entries_memory_type_check" CHECK (("memory_type" = ANY (ARRAY['style_rule'::"text", 'term_preference'::"text", 'template_fragment'::"text", 'few_shot_example'::"text", 'correction_pattern'::"text", 'condensed_summary'::"text"]))),
    CONSTRAINT "memory_entries_scope_check" CHECK (("scope" = ANY (ARRAY['global'::"text", 'tenant'::"text", 'user'::"text", 'project'::"text", 'session'::"text"]))),
    CONSTRAINT "memory_entries_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'auto_extracted'::"text", 'godmode'::"text", 'condensed'::"text"])))
);


ALTER TABLE "public"."memory_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text",
    "file_size" integer,
    "storage_path" "text" NOT NULL,
    "folder" "text" DEFAULT 'Allgemein'::"text",
    "sort_order" integer DEFAULT 0,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid"
);


ALTER TABLE "public"."offer_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "field_name" "text",
    "old_value" "text",
    "new_value" "text",
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "changed_by" "uuid",
    "changed_by_name" "text"
);


ALTER TABLE "public"."offer_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."offer_number_seq"
    START WITH 113
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."offer_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "section_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "trade" "text",
    "is_collapsed" boolean DEFAULT false,
    "section_total_net" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "room_measurement_id" "uuid"
);


ALTER TABLE "public"."offer_sections" OWNER TO "postgres";


COMMENT ON COLUMN "public"."offer_sections"."room_measurement_id" IS 'FK to project_room_measurements for M4 material calculation. Links section (room in offer) to MagicPlan measurements.';



CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_number" "text" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "version" integer DEFAULT 1,
    "status" "public"."offer_status" DEFAULT 'DRAFT'::"public"."offer_status",
    "valid_until" "date",
    "sent_at" timestamp with time zone,
    "responded_at" timestamp with time zone,
    "total_net" numeric(12,2) DEFAULT 0,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "total_with_discount" numeric(12,2) DEFAULT 0,
    "intro_text" "text",
    "outro_text" "text",
    "internal_notes" "text",
    "pdf_storage_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "has_discount" boolean DEFAULT false,
    "discount_type" "text",
    "discount_value" numeric(10,2) DEFAULT 0,
    "discount_reason" "text",
    "has_skonto" boolean DEFAULT false,
    "skonto_percent" numeric(5,2) DEFAULT 2,
    "skonto_days" integer DEFAULT 10,
    "has_installments" boolean DEFAULT false,
    "installment_count" integer DEFAULT 0,
    "is_reverse_charge" boolean DEFAULT false,
    "has_withdrawal_notice" boolean DEFAULT false,
    "customer_note" "text",
    "footer_text" "text",
    "vat_rate" numeric(5,2) DEFAULT 19,
    "total_vat" numeric(12,2) DEFAULT 0,
    "total_gross" numeric(12,2) DEFAULT 0,
    "has_missing_prices" boolean DEFAULT false,
    "pdf_public_url" "text",
    "is_lump_sum" boolean DEFAULT false NOT NULL,
    "lump_sum_amount" numeric(12,2) DEFAULT NULL::numeric,
    "hide_position_prices" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "offers_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['PERCENT'::"text", 'FIXED'::"text"])))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."offers"."has_missing_prices" IS 'True wenn mindestens eine Position unit_price = NULL oder 0 hat';



CREATE TABLE IF NOT EXISTS "public"."outbound_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "recipient" "text" NOT NULL,
    "cc" "text"[],
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "rejected_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "idempotency_key" "text",
    "project_id" "uuid",
    CONSTRAINT "outbound_emails_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'pending_approval'::character varying, 'approved'::character varying, 'rejected'::character varying, 'sent'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."outbound_emails" OWNER TO "postgres";


COMMENT ON TABLE "public"."outbound_emails" IS 'Ausgehende E-Mails mit Chef-Freigabe-Workflow';



COMMENT ON COLUMN "public"."outbound_emails"."entity_type" IS 'z.B. change_order, invoice, etc.';



COMMENT ON COLUMN "public"."outbound_emails"."entity_id" IS 'ID der referenzierten Entität';



COMMENT ON COLUMN "public"."outbound_emails"."idempotency_key" IS 'Verhindert doppelte Mails bei Event-Replay';



COMMENT ON COLUMN "public"."outbound_emails"."project_id" IS 'Denormalisiert für Chef-Inbox Queries';



CREATE TABLE IF NOT EXISTS "public"."pipeline_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "status" "public"."pipeline_run_status" DEFAULT 'running'::"public"."pipeline_run_status" NOT NULL,
    "current_agent" "text",
    "agents_completed" "text"[] DEFAULT '{}'::"text"[],
    "stopped_by_agent" "text",
    "stop_reason" "text",
    "approval_schedule_id" "uuid",
    "approval_material_id" "uuid",
    "result_summary" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."pipeline_runs" IS 'Staffellauf: Ein Lauf der gesamten Autoplanungs-Pipeline';



CREATE TABLE IF NOT EXISTS "public"."pipeline_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "agent_name" "text" NOT NULL,
    "step_order" integer NOT NULL,
    "status" "public"."pipeline_step_status" DEFAULT 'running'::"public"."pipeline_step_status" NOT NULL,
    "input_data" "jsonb",
    "output_data" "jsonb",
    "warnings" "text"[] DEFAULT '{}'::"text"[],
    "errors" "text"[] DEFAULT '{}'::"text"[],
    "duration_ms" integer,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "subcontractor_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "status" "public"."assignment_status" DEFAULT 'ASSIGNED'::"public"."assignment_status" NOT NULL,
    "tab" "text" DEFAULT 'SUBUNTERNEHMER'::"text" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "notes" "text",
    "idempotency_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_calc_equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "equipment_name" "text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "purchase_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "markup_percent" numeric(5,2) DEFAULT 5,
    "unit_price" numeric(10,2) GENERATED ALWAYS AS (("purchase_price" * ((1)::numeric + ("markup_percent" / (100)::numeric)))) STORED,
    "total_price" numeric(12,2) GENERATED ALWAYS AS ((("quantity" * "purchase_price") * ((1)::numeric + ("markup_percent" / (100)::numeric)))) STORED,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_calc_equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_calc_labor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "labor_group" "public"."labor_group" DEFAULT 'GESELLE'::"public"."labor_group",
    "minutes" numeric(10,2) DEFAULT 0 NOT NULL,
    "hourly_rate" numeric(10,2) DEFAULT 45 NOT NULL,
    "markup_percent" numeric(5,2) DEFAULT 165,
    "total_minutes" numeric(10,2) GENERATED ALWAYS AS (((("minutes" * ((1)::numeric + ("markup_percent" / (100)::numeric))) / (100)::numeric) * (100)::numeric)) STORED,
    "total_price" numeric(12,2) GENERATED ALWAYS AS (((("minutes" / (60)::numeric) * "hourly_rate") * ((1)::numeric + ("markup_percent" / (100)::numeric)))) STORED,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_calc_labor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_calc_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "material_name" "text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "purchase_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "waste_percent" numeric(5,2) DEFAULT 0,
    "markup_percent" numeric(5,2) DEFAULT 20,
    "total_quantity" numeric(10,3) GENERATED ALWAYS AS (("quantity" * ((1)::numeric + ("waste_percent" / (100)::numeric)))) STORED,
    "unit_price" numeric(10,2) GENERATED ALWAYS AS (("purchase_price" * ((1)::numeric + ("markup_percent" / (100)::numeric)))) STORED,
    "total_price" numeric(12,2) GENERATED ALWAYS AS (((("quantity" * ((1)::numeric + ("waste_percent" / (100)::numeric))) * "purchase_price") * ((1)::numeric + ("markup_percent" / (100)::numeric)))) STORED,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_calc_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_calc_subcontractor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "supplier" "text",
    "cost" numeric(10,2) DEFAULT 0 NOT NULL,
    "markup_percent" numeric(5,2) DEFAULT 10,
    "total_price" numeric(12,2) GENERATED ALWAYS AS (("cost" * ((1)::numeric + ("markup_percent" / (100)::numeric)))) STORED,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_calc_subcontractor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_material_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_v2_id" "uuid" NOT NULL,
    "material_type" "text" NOT NULL,
    "category" "text",
    "trade" "text",
    "default_quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "quantity_unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "quantity_mode" "text" DEFAULT 'fixed'::"text" NOT NULL,
    "notes" "text",
    "default_product_id" "uuid",
    "is_optional" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_material_requirements" OWNER TO "postgres";


COMMENT ON TABLE "public"."position_material_requirements" IS 'KI-generierter oder manueller Material-Bedarf pro Katalogposition';



COMMENT ON COLUMN "public"."position_material_requirements"."quantity_mode" IS 'fixed=immer gleich, per_unit=mal Menge, per_sqm=mal m², per_m=mal Laufmeter';



CREATE TABLE IF NOT EXISTS "public"."position_usage_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_id" "uuid",
    "custom_position_id" "uuid",
    "project_type" "text",
    "client_type" "text",
    "usage_count" integer DEFAULT 1,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "avg_quantity" numeric(10,3),
    "avg_unit_price" numeric(10,2),
    CONSTRAINT "position_usage_stats_check" CHECK (((("catalog_position_id" IS NOT NULL) AND ("custom_position_id" IS NULL)) OR (("catalog_position_id" IS NULL) AND ("custom_position_id" IS NOT NULL))))
);


ALTER TABLE "public"."position_usage_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_normalized" "text" GENERATED ALWAYS AS ("lower"("regexp_replace"("name", '[^a-zA-Z0-9äöüßÄÖÜ]'::"text", ''::"text", 'g'::"text"))) STORED,
    "trade" "text",
    "category" "text",
    "material_type" "text",
    "supplier_id" "uuid",
    "sku" "text",
    "ean" "text",
    "product_url" "text",
    "last_price_net_eur" numeric(10,2),
    "last_price_date" "date",
    "unit" "text" DEFAULT 'Stk'::"text",
    "pack_size" numeric(10,2),
    "use_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "source_reference" "text",
    "is_active" boolean DEFAULT true,
    "is_favorite" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_consumable" boolean DEFAULT true
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Zentraler Produktkatalog - wächst durch Rechnungsimport und manuelle Pflege';



COMMENT ON COLUMN "public"."products"."material_type" IS 'Generischer Typ für KI-Matching, z.B. "Waschtischarmatur" statt "Grohe Focus"';



COMMENT ON COLUMN "public"."products"."use_count" IS 'Anzahl Verwendungen - für Sortierung im Autocomplete';



COMMENT ON COLUMN "public"."products"."is_consumable" IS 'TRUE = Verbrauchsmaterial (summieren), FALSE = Werkzeug/Equipment (1x pro Projekt)';



CREATE TABLE IF NOT EXISTS "public"."products_backup_20260119" (
    "id" "uuid",
    "name" "text",
    "name_normalized" "text",
    "trade" "text",
    "category" "text",
    "material_type" "text",
    "supplier_id" "uuid",
    "sku" "text",
    "ean" "text",
    "product_url" "text",
    "last_price_net_eur" numeric(10,2),
    "last_price_date" "date",
    "unit" "text",
    "pack_size" numeric(10,2),
    "use_count" integer,
    "last_used_at" timestamp with time zone,
    "source" "text",
    "source_reference" "text",
    "is_active" boolean,
    "is_favorite" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."products_backup_20260119" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "activity_type" "text" DEFAULT 'event'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "team_member_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "hours_planned" numeric(6,2),
    "hours_logged" numeric(6,2) DEFAULT 0,
    "role_in_project" "text",
    "status" "text" DEFAULT 'planned'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_assignments_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_assignment_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."project_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_drive_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "folder_name" "text" NOT NULL,
    "drive_folder_id" "text",
    "is_created" boolean DEFAULT false,
    "created_in_drive_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "folder_type" "text"
);


ALTER TABLE "public"."project_drive_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "file_size_bytes" bigint,
    "storage_bucket" "text" DEFAULT 'project-files'::"text",
    "storage_path" "text" NOT NULL,
    "drive_file_id" "text",
    "drive_file_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "room" "text",
    "photo_tag" "text",
    "urgency" "text" DEFAULT 'normal'::"text",
    "folder_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_files_photo_tag_check" CHECK (("photo_tag" = ANY (ARRAY['fortschritt'::"text", 'mangel'::"text", 'nachtrag'::"text", 'frage'::"text", 'lieferung'::"text", 'abnahme'::"text"]))),
    CONSTRAINT "project_files_urgency_check" CHECK (("urgency" = ANY (ARRAY['normal'::"text", 'wichtig'::"text", 'dringend'::"text"])))
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_files"."room" IS 'Raum-Zuordnung z.B. Bad, Küche, Wohnzimmer';



COMMENT ON COLUMN "public"."project_files"."photo_tag" IS 'Foto-Kategorie für Filterung';



COMMENT ON COLUMN "public"."project_files"."urgency" IS 'Dringlichkeitsstufe für Mangel-Fotos';



CREATE TABLE IF NOT EXISTS "public"."project_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_material_needs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "trade" "text" NOT NULL,
    "material_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "total_quantity" numeric(10,3) DEFAULT 0 NOT NULL,
    "quantity_unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "product_id" "uuid",
    "product_name" "text",
    "unit_price_net" numeric(10,2),
    "line_total_net" numeric(10,2) GENERATED ALWAYS AS ("round"(("total_quantity" * COALESCE("unit_price_net", (0)::numeric)), 2)) STORED,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "source" "text" DEFAULT 'auto'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "room" "text",
    "source_position_nr" "text",
    "supplier_name" "text",
    "supplier_id" "uuid",
    "schedule_phase_id" "uuid",
    "needed_by" "date",
    "problem" "text",
    "suggested_product_id" "uuid",
    "suggested_product_name" "text",
    "catalog_position_nr" "text",
    "multiplier_used" numeric DEFAULT 1,
    CONSTRAINT "project_material_needs_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'confirmed'::"text", 'ordered'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."project_material_needs" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_material_needs" IS 'Konkreter Materialbedarf pro Projekt — ein Produkt pro material_type';



CREATE TABLE IF NOT EXISTS "public"."project_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "offer_position_id" "uuid",
    "material_type" "text" NOT NULL,
    "trade" "text",
    "quantity" numeric(10,3) NOT NULL,
    "quantity_unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "product_id" "uuid",
    "override_price_net_eur" numeric(10,2),
    "line_total_net_eur" numeric(10,2) GENERATED ALWAYS AS (("quantity" * COALESCE("override_price_net_eur", (0)::numeric))) STORED,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "purchase_order_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'material'::"text",
    "is_auto_applied" boolean DEFAULT false,
    CONSTRAINT "chk_project_materials_category" CHECK (("category" = ANY (ARRAY['material'::"text", 'werkzeug'::"text", 'hilfsmittel'::"text"])))
);


ALTER TABLE "public"."project_materials" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_materials" IS 'Konkrete Materialliste pro Projekt mit Produkt-Zuordnung';



COMMENT ON COLUMN "public"."project_materials"."category" IS 'material = summierbar, werkzeug/hilfsmittel = 1x pro Projekt';



CREATE TABLE IF NOT EXISTS "public"."project_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "message_type" "text" DEFAULT 'chat'::"text" NOT NULL,
    "text" "text",
    "room" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "photo_storage_path" "text",
    "reply_to_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['chat'::"text", 'system'::"text", 'alert'::"text", 'photo'::"text", 'protocol'::"text", 'voice'::"text"])))
);


ALTER TABLE "public"."project_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_messages" IS 'Baustellen-Chat pro Projekt. System-Events bleiben in project_activities.';



CREATE TABLE IF NOT EXISTS "public"."project_packing_list" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "item_type" "public"."packing_item_type" NOT NULL,
    "item_name" "text" NOT NULL,
    "quantity" numeric,
    "unit" "text",
    "source" "text",
    "source_position_id" "uuid",
    "ai_suggested" boolean DEFAULT false,
    "ai_reason" "text",
    "confirmed" boolean DEFAULT false,
    "packed" boolean DEFAULT false,
    "packed_at" timestamp with time zone,
    "packed_by" "text",
    "notes" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_packing_list" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_packing_list" IS 'Unified packing list: materials (from calculation) + tools (from EB) + AI suggestions';



CREATE TABLE IF NOT EXISTS "public"."project_room_measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "room_name" "text" NOT NULL,
    "room_name_normalized" "text" NOT NULL,
    "floor_name" "text",
    "floor_area_m2" numeric(10,2),
    "wall_area_m2" numeric(10,2),
    "wall_area_with_openings_m2" numeric(10,2),
    "ceiling_area_m2" numeric(10,2),
    "room_height_m" numeric(5,2),
    "floor_perimeter_m" numeric(10,2),
    "door_area_m2" numeric(10,2) DEFAULT 0,
    "window_area_m2" numeric(10,2) DEFAULT 0,
    "door_count" integer DEFAULT 0,
    "window_count" integer DEFAULT 0,
    "source" "text" DEFAULT 'magicplan'::"text",
    "source_filename" "text",
    "raw_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "volume_m3" numeric(10,2),
    "perimeter_m" numeric(10,2),
    "ceiling_perimeter_m" numeric(10,2),
    "source_file" "text",
    "source_event_id" "uuid"
);


ALTER TABLE "public"."project_room_measurements" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_room_measurements" IS 'Raummessungen aus MagicPlan CSV Import';



CREATE TABLE IF NOT EXISTS "public"."project_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "team_member_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "device_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "uuid",
    "lead_id" "uuid",
    "object_street" "text" NOT NULL,
    "object_zip" "text" NOT NULL,
    "object_city" "text" NOT NULL,
    "object_floor" "text",
    "object_type" "text",
    "object_size_sqm" numeric(10,2),
    "status" "public"."project_status" DEFAULT 'DRAFT'::"public"."project_status",
    "planned_start" "date",
    "planned_end" "date",
    "actual_start" "date",
    "actual_end" "date",
    "drive_folder_id" "text",
    "budget_net" numeric(12,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "display_name" "text",
    "source" "text" DEFAULT 'MANUAL'::"text",
    "source_reference" "text",
    "progress_percent" integer DEFAULT 0,
    "inspection_date" "date",
    "inspection_completed" boolean DEFAULT false,
    "handover_date" "date",
    "assigned_team" "text",
    "price_catalog" "text",
    "project_type" "text" DEFAULT 'CONFIRMED_ORDER'::"text",
    "bid_deadline" "date",
    CONSTRAINT "chk_progress_range" CHECK ((("progress_percent" >= 0) AND ("progress_percent" <= 100))),
    CONSTRAINT "projects_project_type_check" CHECK (("project_type" = ANY (ARRAY['BID_REQUEST'::"text", 'CONFIRMED_ORDER'::"text"]))),
    CONSTRAINT "valid_dates" CHECK ((("planned_end" IS NULL) OR ("planned_start" IS NULL) OR ("planned_end" >= "planned_start")))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."price_catalog" IS 'Preiskatalog: SAGA, WBS, CUSTOM';



CREATE TABLE IF NOT EXISTS "public"."protocol_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "protocol_type" "text" NOT NULL,
    "signer_name" "text" NOT NULL,
    "signer_role" "text",
    "signature_data" "text",
    "signed_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text",
    CONSTRAINT "protocol_signatures_protocol_type_check" CHECK (("protocol_type" = ANY (ARRAY['erstbegehung'::"text", 'zwischenbegehung'::"text", 'abnahme'::"text"]))),
    CONSTRAINT "protocol_signatures_signer_role_check" CHECK (("signer_role" = ANY (ARRAY['bauleiter'::"text", 'auftraggeber'::"text", 'nachunternehmer'::"text", 'zeuge'::"text", 'mieter'::"text"])))
);


ALTER TABLE "public"."protocol_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protocols" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "protocol_type" "public"."protocol_type" NOT NULL,
    "protocol_number" integer NOT NULL,
    "protocol_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "progress_percent" integer,
    "notes" "text",
    "tally_response_id" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "protocols_progress_percent_check" CHECK ((("progress_percent" >= 0) AND ("progress_percent" <= 100)))
);


ALTER TABLE "public"."protocols" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "position_number" integer NOT NULL,
    "supplier_article_id" "uuid",
    "raw_article_number" "text",
    "raw_description" "text" NOT NULL,
    "quantity" numeric(12,3) NOT NULL,
    "unit" "text",
    "unit_price_net" numeric(12,4) NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "total_price_net" numeric(12,2) GENERATED ALWAYS AS ((("quantity" * "unit_price_net") * ((1)::numeric - (COALESCE("discount_percent", (0)::numeric) / (100)::numeric)))) STORED,
    "project_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_invoice_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_invoice_items" IS 'Einzelpositionen einer Eingangsrechnung';



COMMENT ON COLUMN "public"."purchase_invoice_items"."raw_article_number" IS 'Artikelnummer wie auf Rechnung (vor Matching)';



CREATE TABLE IF NOT EXISTS "public"."purchase_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "our_reference" "text",
    "supplier_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "invoice_date" "date" NOT NULL,
    "delivery_date" "date",
    "due_date" "date",
    "subtotal_net" numeric(12,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(12,2) DEFAULT 0,
    "shipping_cost" numeric(12,2) DEFAULT 0,
    "total_net" numeric(12,2) GENERATED ALWAYS AS ((("subtotal_net" - "discount_amount") + "shipping_cost")) STORED,
    "vat_percent" numeric(5,2) DEFAULT 19.00,
    "vat_amount" numeric(12,2) GENERATED ALWAYS AS ((((("subtotal_net" - "discount_amount") + "shipping_cost") * "vat_percent") / (100)::numeric)) STORED,
    "total_gross" numeric(12,2) GENERATED ALWAYS AS (((("subtotal_net" - "discount_amount") + "shipping_cost") * ((1)::numeric + ("vat_percent" / (100)::numeric)))) STORED,
    "currency" "text" DEFAULT 'EUR'::"text",
    "status" "public"."purchase_invoice_status" DEFAULT 'DRAFT'::"public"."purchase_invoice_status",
    "approved_at" timestamp with time zone,
    "approved_by" "text",
    "paid_at" timestamp with time zone,
    "payment_reference" "text",
    "pdf_storage_path" "text",
    "ocr_raw_text" "text",
    "ocr_confidence" numeric(5,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "expense_category" "public"."expense_category" DEFAULT 'MATERIAL'::"public"."expense_category",
    "payment_iban" "text",
    "payment_bic" "text",
    "payment_terms_days" integer DEFAULT 14,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_days" integer DEFAULT 0,
    "source_type" "public"."invoice_source_type" DEFAULT 'SCAN'::"public"."invoice_source_type",
    "email_from" "text",
    "email_subject" "text",
    "email_received_at" timestamp with time zone,
    "email_message_id" "text",
    "paid_amount" numeric(12,2) DEFAULT 0,
    "lexware_voucher_id" "text",
    "lexware_synced_at" timestamp with time zone,
    "lexware_sync_status" "text" DEFAULT 'pending'::"text",
    "lexware_sync_error" "text",
    "invoice_type" "text" DEFAULT 'invoice'::"text" NOT NULL,
    "project_reference" "text",
    "delivery_address" "text",
    "lexware_forwarded_at" timestamp with time zone,
    CONSTRAINT "purchase_invoices_lexware_sync_status_check" CHECK (("lexware_sync_status" = ANY (ARRAY['pending'::"text", 'synced'::"text", 'error'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."purchase_invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_invoices" IS 'Eingangsrechnungen von Lieferanten';



COMMENT ON COLUMN "public"."purchase_invoices"."ocr_raw_text" IS 'Extrahierter Text aus PDF für Volltextsuche';



COMMENT ON COLUMN "public"."purchase_invoices"."invoice_type" IS 'invoice | credit_note — Gutschriften von z.B. besser zuhause';



COMMENT ON COLUMN "public"."purchase_invoices"."project_reference" IS 'Projektnummer (BL-YYYY-NNN) vom Beleg extrahiert';



COMMENT ON COLUMN "public"."purchase_invoices"."delivery_address" IS 'Lieferadresse vom Beleg extrahiert';



COMMENT ON COLUMN "public"."purchase_invoices"."lexware_forwarded_at" IS 'Zeitpunkt der Email-Weiterleitung an Lexware Inbox';



CREATE TABLE IF NOT EXISTS "public"."purchase_invoices_backup_20260112" (
    "id" "uuid",
    "invoice_number" "text",
    "our_reference" "text",
    "supplier_id" "uuid",
    "project_id" "uuid",
    "invoice_date" "date",
    "delivery_date" "date",
    "due_date" "date",
    "subtotal_net" numeric(12,2),
    "discount_amount" numeric(12,2),
    "shipping_cost" numeric(12,2),
    "total_net" numeric(12,2),
    "vat_percent" numeric(5,2),
    "vat_amount" numeric(12,2),
    "total_gross" numeric(12,2),
    "currency" "text",
    "status" "public"."purchase_invoice_status",
    "approved_at" timestamp with time zone,
    "approved_by" "text",
    "paid_at" timestamp with time zone,
    "payment_reference" "text",
    "pdf_storage_path" "text",
    "ocr_raw_text" "text",
    "ocr_confidence" numeric(5,2),
    "notes" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "created_by" "text",
    "expense_category" "public"."expense_category",
    "payment_iban" "text",
    "payment_bic" "text",
    "payment_terms_days" integer,
    "discount_percent" numeric(5,2),
    "discount_days" integer,
    "source_type" "public"."invoice_source_type",
    "email_from" "text",
    "email_subject" "text",
    "email_received_at" timestamp with time zone,
    "email_message_id" "text"
);


ALTER TABLE "public"."purchase_invoices_backup_20260112" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "supplier_article_id" "uuid",
    "sort_order" integer DEFAULT 1 NOT NULL,
    "description" "text" NOT NULL,
    "unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_price" numeric(12,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "offer_position_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."purchase_order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchase_order_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "project_id" "uuid",
    "supplier_id" "uuid" NOT NULL,
    "status" "public"."purchase_order_status" DEFAULT 'DRAFT'::"public"."purchase_order_status" NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expected_delivery" "date",
    "delivered_at" timestamp with time zone,
    "total_net" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_gross" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "internal_notes" "text",
    "pdf_storage_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipt_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "drive_file_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "file_size_bytes" bigint,
    "status" "public"."receipt_queue_status" DEFAULT 'PENDING'::"public"."receipt_queue_status" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "invoice_id" "uuid",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processing_started_at" timestamp with time zone,
    "processed_at" timestamp with time zone,
    CONSTRAINT "valid_attempts" CHECK ((("attempts" >= 0) AND ("attempts" <= "max_attempts")))
);


ALTER TABLE "public"."receipt_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."receipt_queue" IS 'Queue für sequentielle Beleg-Verarbeitung - verhindert Claude API Overload';



CREATE TABLE IF NOT EXISTS "public"."richtzeitwerte" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_position_nr" "text" NOT NULL,
    "catalog_id" "uuid",
    "trade_id" "uuid",
    "labor_minutes_per_unit" numeric(8,2) NOT NULL,
    "unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "material_cost_per_unit" numeric(10,2) DEFAULT 0,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "confidence" numeric(3,2) DEFAULT 0.5 NOT NULL,
    "observation_count" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "richtzeitwerte_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "richtzeitwerte_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'godmode'::"text", 'ai_estimate'::"text"])))
);


ALTER TABLE "public"."richtzeitwerte" OWNER TO "postgres";


COMMENT ON TABLE "public"."richtzeitwerte" IS 'Wissensbasis: Wie lange dauert eine Katalogposition wirklich auf der Baustelle?';



COMMENT ON COLUMN "public"."richtzeitwerte"."labor_minutes_per_unit" IS 'DER ANKER — Minuten pro Einheit (z.B. 3.0 für Thermostatkopf)';



COMMENT ON COLUMN "public"."richtzeitwerte"."source" IS 'manual = vom User, godmode = vom Lernagenten, ai_estimate = Claude-Schätzung';



COMMENT ON COLUMN "public"."richtzeitwerte"."confidence" IS '0.0 = Schätzung, 1.0 = basiert auf vielen Beobachtungen';



CREATE TABLE IF NOT EXISTS "public"."saga_order_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "catalog_version_id" "uuid" NOT NULL,
    "catalog_code" "text" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "quantity" numeric(12,2) DEFAULT 1 NOT NULL,
    "unit_override" "text",
    "gu_price_eur" numeric(12,2),
    "total_gu_eur" numeric(12,2),
    "notes" "text"
);


ALTER TABLE "public"."saga_order_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saga_order_texts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "content_monteur" "text",
    "content_subunternehmer" "text",
    "content_internal" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saga_order_texts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saga_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "catalog_version_id" "uuid" NOT NULL,
    "external_ref" "text",
    "tenant_name" "text",
    "address" "text",
    "pdf_url" "text",
    "status" "text" DEFAULT 'neu'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "drive_root_folder_id" "text",
    "drive_root_folder_url" "text",
    "folder_auftrag_id" "text",
    "folder_aufmass_id" "text",
    "folder_bilder_id" "text",
    "folder_video_id" "text",
    "folder_docs_id" "text",
    "pdf_file_id" "text",
    "pdf_file_url" "text",
    "ai_status" "text" DEFAULT 'pending'::"text",
    "ai_last_error" "text",
    "project_id" "uuid"
);


ALTER TABLE "public"."saga_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "position_number" "text" NOT NULL,
    "is_title" boolean DEFAULT false NOT NULL,
    "offer_position_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit" "text" DEFAULT 'Stück'::"text" NOT NULL,
    "unit_price" numeric(12,2),
    "total_price" numeric(12,2),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_invoice_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_invoice_items" IS 'Rechnungspositionen';



CREATE TABLE IF NOT EXISTS "public"."sales_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "project_id" "uuid",
    "client_id" "uuid",
    "offer_id" "uuid",
    "invoice_type" "public"."sales_invoice_type" DEFAULT 'SCHLUSS'::"public"."sales_invoice_type" NOT NULL,
    "status" "public"."sales_invoice_status" DEFAULT 'DRAFT'::"public"."sales_invoice_status" NOT NULL,
    "total_net" numeric(12,2) NOT NULL,
    "vat_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "total_vat" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_gross" numeric(12,2) NOT NULL,
    "abschlag_percent" numeric(5,2),
    "abschlag_number" integer,
    "invoice_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "service_date_from" "date",
    "service_date_to" "date",
    "due_date" "date",
    "payment_days" integer DEFAULT 14 NOT NULL,
    "is_reverse_charge" boolean DEFAULT true NOT NULL,
    "client_vat_id" "text",
    "description" "text",
    "pdf_storage_path" "text",
    "paid_at" timestamp with time zone,
    "paid_amount" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "gu_deduction_percent" numeric(5,2) DEFAULT 0,
    "pdf_public_url" "text",
    "approved_at" timestamp with time zone,
    "lexware_invoice_id" "text",
    "lexware_synced_at" timestamp with time zone,
    "reminder_level" integer DEFAULT 0,
    "last_reminder_at" timestamp with time zone,
    "reminder_notes" "text",
    "lexware_raw_data" "jsonb",
    "customer_name" "text",
    "customer_address" "text",
    "currency" "text" DEFAULT 'EUR'::"text",
    "lexware_sync_status" "text" DEFAULT 'pending'::"text",
    "lexware_sync_error" "text",
    "lexware_contact_id" "text",
    "lexware_last_synced_at" timestamp with time zone,
    "source" "text" DEFAULT 'bg'::"text",
    CONSTRAINT "sales_invoices_lexware_sync_status_check" CHECK (("lexware_sync_status" = ANY (ARRAY['pending'::"text", 'synced'::"text", 'error'::"text", 'skipped'::"text"]))),
    CONSTRAINT "sales_invoices_source_check" CHECK (("source" = ANY (ARRAY['bg'::"text", 'lexware'::"text"])))
);


ALTER TABLE "public"."sales_invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_invoices" IS 'Ausgangsrechnungen an Kunden';



COMMENT ON COLUMN "public"."sales_invoices"."is_reverse_charge" IS '§13b UStG - Steuerschuldnerschaft Leistungsempfänger';



COMMENT ON COLUMN "public"."sales_invoices"."gu_deduction_percent" IS 'General Contractor (GU) deduction percentage (Baustellengemeinkosten)';



CREATE TABLE IF NOT EXISTS "public"."schedule_defaults" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade" "text" NOT NULL,
    "default_team_member_id" "uuid",
    "avg_duration_days" numeric(5,1) DEFAULT 5,
    "default_phase_order" integer DEFAULT 99 NOT NULL,
    "observation_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "trade_id" "uuid"
);


ALTER TABLE "public"."schedule_defaults" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_learning" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade" "text" NOT NULL,
    "team_member_id" "uuid",
    "proposed_duration_days" integer,
    "actual_duration_days" integer,
    "phase_number" integer,
    "project_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "trade_id" "uuid"
);


ALTER TABLE "public"."schedule_learning" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_phases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "phase_number" integer NOT NULL,
    "name" "text" NOT NULL,
    "trade" "text" DEFAULT 'Sonstiges'::"text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "assigned_team_member_id" "uuid",
    "is_external" boolean DEFAULT false,
    "external_name" "text",
    "depends_on" "uuid"[] DEFAULT '{}'::"uuid"[],
    "status" "text" DEFAULT 'planned'::"text",
    "progress" integer DEFAULT 0,
    "estimated_hours" numeric(6,2),
    "estimated_qty" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "estimated_cost" numeric(10,2),
    "trade_id" "uuid",
    CONSTRAINT "schedule_phases_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "schedule_phases_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'delayed'::"text", 'blocked'::"text", 'proposed'::"text"]))),
    CONSTRAINT "valid_phase_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."schedule_phases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_captures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'recording'::"text" NOT NULL,
    "capture_date" "date" DEFAULT CURRENT_DATE,
    "notes" "text",
    "checklist_data" "jsonb" DEFAULT '{}'::"jsonb",
    "transcript_raw" "text",
    "transcript_structured" "jsonb",
    "magicplan_matched" boolean DEFAULT false,
    "offer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "site_captures_status_check" CHECK (("status" = ANY (ARRAY['recording'::"text", 'processing'::"text", 'draft_ready'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."site_captures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcontractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "short_name" "text",
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "trade_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "is_internal" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "trades" "public"."trade_type"[] DEFAULT ARRAY['Sonstiges'::"public"."trade_type"]
);


ALTER TABLE "public"."subcontractors" OWNER TO "postgres";


COMMENT ON COLUMN "public"."subcontractors"."trades" IS 'Gewerke als Text-Array';



CREATE TABLE IF NOT EXISTS "public"."supplier_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "alias_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplier_aliases" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_aliases" IS 'Alternative Namen/Schreibweisen für OCR-Erkennung';



CREATE TABLE IF NOT EXISTS "public"."supplier_article_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_article_id" "uuid" NOT NULL,
    "unit_price_net" numeric(12,4) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "min_quantity" numeric(10,3) DEFAULT 1,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_to" "date",
    "source" "text",
    "source_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."supplier_article_prices" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_article_prices" IS 'Preishistorie pro Artikel - aktueller Preis hat valid_to = NULL';



COMMENT ON COLUMN "public"."supplier_article_prices"."min_quantity" IS 'Staffelpreis ab dieser Menge';



CREATE TABLE IF NOT EXISTS "public"."supplier_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "supplier_article_number" "text" NOT NULL,
    "supplier_article_name" "text" NOT NULL,
    "internal_name" "text",
    "internal_sku" "text",
    "category" "text",
    "subcategory" "text",
    "purchase_unit" "public"."purchase_unit" DEFAULT 'STUECK'::"public"."purchase_unit" NOT NULL,
    "units_per_package" numeric(10,3) DEFAULT 1,
    "ean" "text",
    "gtin" "text",
    "manufacturer" "text",
    "manufacturer_article_number" "text",
    "is_active" boolean DEFAULT true,
    "is_discontinued" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplier_articles" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_articles" IS 'Artikel pro Lieferant mit deren Artikelnummern';



COMMENT ON COLUMN "public"."supplier_articles"."supplier_article_number" IS 'Artikelnummer BEIM Lieferanten (nicht unsere!)';



COMMENT ON COLUMN "public"."supplier_articles"."units_per_package" IS 'Umrechnung: 1 Packung = X Stück';



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "short_name" "text",
    "supplier_type" "public"."supplier_type" DEFAULT 'SONSTIGE'::"public"."supplier_type" NOT NULL,
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "email" "text",
    "phone" "text",
    "website" "text",
    "street" "text",
    "zip_code" "text",
    "city" "text",
    "country" "text" DEFAULT 'DE'::"text",
    "payment_terms_days" integer DEFAULT 30,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "min_order_value" numeric(10,2),
    "delivery_days" integer,
    "our_customer_number" "text",
    "rating" integer,
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "is_preferred" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "default_expense_category" "public"."expense_category" DEFAULT 'MATERIAL'::"public"."expense_category",
    "lexware_contact_id" "text",
    "lexware_synced_at" timestamp with time zone,
    CONSTRAINT "suppliers_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


COMMENT ON TABLE "public"."suppliers" IS 'Lieferanten-Stammdaten für Einkauf';



COMMENT ON COLUMN "public"."suppliers"."supplier_code" IS 'Kurzcode für interne Referenz, z.B. HORN, REUT';



COMMENT ON COLUMN "public"."suppliers"."is_preferred" IS 'Bevorzugter Lieferant = bei gleichem Preis wählen';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "initials" "text",
    "role" "text",
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "skill_level" "text" DEFAULT 'senior'::"text",
    "email" "text",
    "phone" "text",
    "hourly_rate" numeric(8,2),
    "avatar_color" "text" DEFAULT 'bg-blue-500'::"text",
    "max_hours_per_week" integer DEFAULT 40,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "trade" "text",
    "role_label" "text",
    "gewerk" "text",
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "trade_id" "uuid",
    "auth_id" "uuid",
    "push_token" "text",
    "is_admin" boolean DEFAULT false NOT NULL,
    CONSTRAINT "team_members_skill_level_check" CHECK (("skill_level" = ANY (ARRAY['junior'::"text", 'senior'::"text", 'master'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_members" IS 'Mitarbeiter/Team für Einstellungen → Team (Stammdaten)';



COMMENT ON COLUMN "public"."team_members"."trade" IS 'Primäres Gewerk des Mitarbeiters z.B. Maler, Fliesen, Sanitär';



COMMENT ON COLUMN "public"."team_members"."auth_id" IS 'Verknüpfung mit auth.users für Push-Token-Zuordnung';



COMMENT ON COLUMN "public"."team_members"."push_token" IS 'Expo Push Token (ExpoPushToken[xxx]) für Push-Benachrichtigungen';



CREATE OR REPLACE VIEW "public"."team_members_public" AS
 SELECT "id",
    "name",
    NULL::"text" AS "initials",
    "role",
    "role_label",
    "gewerk",
    "active",
    "active" AS "is_active",
    "sort_order",
    NULL::"text" AS "email",
    NULL::"text" AS "phone",
    NULL::numeric AS "hourly_rate",
    NULL::"text" AS "skill_level",
    NULL::"text"[] AS "skills",
    NULL::integer AS "max_hours_per_week"
   FROM "public"."team_members" "tm"
  WHERE ("active" = true);


ALTER VIEW "public"."team_members_public" OWNER TO "postgres";


COMMENT ON VIEW "public"."team_members_public" IS 'Abgespeckte Team-Liste fuer App-Screens ohne sensible Kontaktdaten oder Stundensaetze.';



CREATE TABLE IF NOT EXISTS "public"."text_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "content" "text" NOT NULL,
    "variables" "text"[] DEFAULT '{}'::"text"[],
    "is_default" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."text_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "team_member_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "hours" numeric(4,1) NOT NULL,
    "activity_type" "text" DEFAULT 'work'::"text",
    "trade" "text",
    "notes" "text",
    "approved" boolean DEFAULT false,
    "approved_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "time_entries_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['work'::"text", 'travel'::"text", 'setup'::"text", 'cleanup'::"text", 'meeting'::"text", 'documentation'::"text"]))),
    CONSTRAINT "time_entries_hours_check" CHECK ((("hours" > (0)::numeric) AND ("hours" <= (24)::numeric)))
);


ALTER TABLE "public"."time_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trade_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alias" "text" NOT NULL,
    "trade_id" "uuid" NOT NULL,
    "source" "text" DEFAULT 'system'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trade_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trade_material_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade" "text" NOT NULL,
    "material_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "unit" "text" DEFAULT 'Stk'::"text" NOT NULL,
    "quantity_mode" "text" DEFAULT 'per_unit'::"text" NOT NULL,
    "default_quantity" numeric(10,3) DEFAULT 1,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trade_material_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."trade_material_types" IS 'Stammdaten: Welche Materialien braucht welches Gewerk';



CREATE TABLE IF NOT EXISTS "public"."trade_sequence_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade_id" "uuid" NOT NULL,
    "trade_name" "text" NOT NULL,
    "default_phase_order" integer NOT NULL,
    "must_come_after" "uuid"[] DEFAULT '{}'::"uuid"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trade_sequence_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."trade_sequence_rules" IS 'Baulogik: Gewerke-Reihenfolge für Plausibilitätsprüfung';



CREATE TABLE IF NOT EXISTS "public"."trades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'gray'::"text",
    "icon" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unanswered_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "customer_context" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "answer" "text",
    "answered_by" "text",
    "answered_at" timestamp with time zone,
    "knowledge_base_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "unanswered_questions_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'answered'::"text", 'ignored'::"text"])))
);


ALTER TABLE "public"."unanswered_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_name" "text",
    "user_role" "text",
    "category" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auth_user_id" "uuid" DEFAULT "auth"."uid"(),
    CONSTRAINT "user_feedback_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'verbesserung'::"text", 'sonstiges'::"text"]))),
    CONSTRAINT "user_feedback_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'done'::"text", 'wont_fix'::"text"])))
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_approval_audit" AS
 SELECT "a"."id",
    "a"."approval_type",
    "a"."status",
    "a"."requested_at",
    "a"."decided_at",
    "a"."decided_by",
    "a"."decision_channel",
    "fc"."category_code" AS "feedback_category",
    "fc"."category_label_de" AS "feedback_label",
    "fc"."is_rejection",
    "a"."feedback_reason",
    "a"."reference_id",
    "a"."reference_table",
    "p"."project_number",
    "p"."display_name",
    "round"((EXTRACT(epoch FROM ("a"."decided_at" - "a"."requested_at")) / (3600)::numeric), 2) AS "hours_to_decision"
   FROM (("public"."approvals" "a"
     JOIN "public"."projects" "p" ON (("p"."id" = "a"."project_id")))
     LEFT JOIN "public"."feedback_categories" "fc" ON (("fc"."id" = "a"."feedback_category_id")))
  WHERE ("a"."status" = ANY (ARRAY['APPROVED'::"public"."approval_status", 'REJECTED'::"public"."approval_status"]))
  ORDER BY "a"."decided_at" DESC;


ALTER VIEW "public"."v_approval_audit" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_assignments_by_subcontractor" AS
 SELECT "pa"."project_id",
    "pa"."subcontractor_id",
    "s"."name" AS "subcontractor_name",
    "s"."is_internal",
    "pa"."status",
    "count"(*) AS "position_count",
    "sum"("op"."total_price") AS "total_value",
    "array_agg"("pa"."position_id") AS "position_ids"
   FROM (("public"."position_assignments" "pa"
     JOIN "public"."subcontractors" "s" ON (("pa"."subcontractor_id" = "s"."id")))
     JOIN "public"."offer_positions" "op" ON (("pa"."position_id" = "op"."id")))
  WHERE ("pa"."tab" = 'SUBUNTERNEHMER'::"text")
  GROUP BY "pa"."project_id", "pa"."subcontractor_id", "s"."name", "s"."is_internal", "pa"."status";


ALTER VIEW "public"."v_assignments_by_subcontractor" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_bank_transactions_unmatched" AS
 SELECT "id",
    "booking_date",
    "value_date",
    "amount",
    "counterpart_name",
    "counterpart_iban",
    "reference_text",
    "is_matched",
    ( SELECT "ip"."purchase_invoice_id"
           FROM "public"."invoice_payments" "ip"
          WHERE ("ip"."bank_transaction_id" = "bt"."id")
         LIMIT 1) AS "matched_invoice_id",
    'Uncategorized'::"text" AS "category",
    "account_name",
    "account_iban"
   FROM "public"."bank_transactions" "bt"
  WHERE ("is_matched" = false);


ALTER VIEW "public"."v_bank_transactions_unmatched" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_catalog_positions_active" AS
 SELECT "cpv2"."id",
    "cpv2"."position_code",
    "cpv2"."title",
    "cpv2"."title_secondary",
    "cpv2"."title_tr",
    "cpv2"."trade",
    "cpv2"."category",
    "cpv2"."unit",
    "cpv2"."base_price_eur",
    "cpv2"."parent_code",
    "cat"."code" AS "catalog_code",
    "cat"."name" AS "catalog_name",
    "con"."code" AS "contractor_code",
    "con"."name" AS "contractor_name"
   FROM (("public"."catalog_positions_v2" "cpv2"
     JOIN "public"."catalogs" "cat" ON (("cat"."id" = "cpv2"."catalog_id")))
     JOIN "public"."contractors" "con" ON (("con"."id" = "cat"."contractor_id")))
  WHERE (("cpv2"."is_active" = true) AND ("cat"."is_active" = true) AND ("con"."is_active" = true));


ALTER VIEW "public"."v_catalog_positions_active" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_catalog_positions_active" IS 'Aktive Positionen mit Contractor-Info für LLM-Matching';



CREATE OR REPLACE VIEW "public"."v_catalog_with_translations" AS
 SELECT "cp"."id",
    "cp"."catalog_code",
    "cp"."main_group",
    "cp"."damage_title",
    "cp"."repair_title",
    "cp"."repair_text_full",
    "cp"."repair_title_tr",
    "cp"."repair_text_full_tr",
    "cp"."unit",
    "cp"."trade",
    "cpp"."gu_price_eur" AS "unit_price",
    "cv"."name" AS "catalog_version"
   FROM (("public"."catalog_positions" "cp"
     LEFT JOIN "public"."catalog_position_prices" "cpp" ON (("cpp"."position_id" = "cp"."id")))
     LEFT JOIN "public"."catalog_versions" "cv" ON (("cv"."id" = "cp"."catalog_version_id")))
  WHERE (("cp"."is_active" = true) AND (("cv"."is_active" = true) OR ("cv"."is_active" IS NULL)));


ALTER VIEW "public"."v_catalog_with_translations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_cheapest_supplier" AS
 WITH "ranked_prices" AS (
         SELECT "sa"."id" AS "supplier_article_id",
            "sa"."supplier_id",
            "s"."supplier_code",
            "s"."name" AS "supplier_name",
            "s"."is_preferred",
            "sa"."supplier_article_number",
            "sa"."internal_name",
            "sa"."internal_sku",
            "sa"."category",
            "sap"."unit_price_net",
            "sa"."purchase_unit",
            "row_number"() OVER (PARTITION BY COALESCE("sa"."internal_sku", "sa"."internal_name") ORDER BY "sap"."unit_price_net", "s"."is_preferred" DESC, "s"."rating" DESC NULLS LAST) AS "price_rank"
           FROM (("public"."supplier_articles" "sa"
             JOIN "public"."suppliers" "s" ON (("s"."id" = "sa"."supplier_id")))
             JOIN "public"."supplier_article_prices" "sap" ON ((("sap"."supplier_article_id" = "sa"."id") AND ("sap"."valid_to" IS NULL) AND ("sap"."min_quantity" = (1)::numeric))))
          WHERE (("sa"."is_active" = true) AND ("s"."is_active" = true) AND (("sa"."internal_sku" IS NOT NULL) OR ("sa"."internal_name" IS NOT NULL)))
        )
 SELECT "supplier_article_id",
    "supplier_id",
    "supplier_code",
    "supplier_name",
    "is_preferred",
    "supplier_article_number",
    "internal_name",
    "internal_sku",
    "category",
    "unit_price_net" AS "cheapest_price",
    "purchase_unit"
   FROM "ranked_prices"
  WHERE ("price_rank" = 1);


ALTER VIEW "public"."v_cheapest_supplier" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_cheapest_supplier" IS 'Günstigster Lieferant pro Artikel (bei Gleichstand: Bevorzugter)';



CREATE OR REPLACE VIEW "public"."v_current_supplier_prices" AS
 SELECT "sa"."id" AS "supplier_article_id",
    "s"."id" AS "supplier_id",
    "s"."supplier_code",
    "s"."name" AS "supplier_name",
    "s"."is_preferred",
    "sa"."supplier_article_number",
    "sa"."supplier_article_name",
    "sa"."internal_name",
    "sa"."internal_sku",
    "sa"."category",
    "sa"."purchase_unit",
    "sa"."units_per_package",
    "sap"."unit_price_net",
    "sap"."currency",
    "sap"."valid_from" AS "price_valid_from",
    "sap"."source" AS "price_source",
        CASE
            WHEN ("sa"."units_per_package" > (1)::numeric) THEN ("sap"."unit_price_net" / "sa"."units_per_package")
            ELSE "sap"."unit_price_net"
        END AS "unit_price_per_piece",
    "sa"."is_active",
    "sa"."is_discontinued"
   FROM (("public"."supplier_articles" "sa"
     JOIN "public"."suppliers" "s" ON (("s"."id" = "sa"."supplier_id")))
     LEFT JOIN "public"."supplier_article_prices" "sap" ON ((("sap"."supplier_article_id" = "sa"."id") AND ("sap"."valid_to" IS NULL) AND ("sap"."min_quantity" = (1)::numeric))))
  WHERE (("sa"."is_active" = true) AND ("s"."is_active" = true));


ALTER VIEW "public"."v_current_supplier_prices" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_current_supplier_prices" IS 'Aktuelle EK-Preise aller aktiven Artikel';



CREATE OR REPLACE VIEW "public"."v_direct_costs_monthly" AS
 SELECT "date_trunc"('month'::"text", ("invoice_date")::timestamp with time zone) AS "monat",
    "expense_category",
    "sum"("total_net") AS "summe"
   FROM "public"."purchase_invoices"
  WHERE (("expense_category" = ANY (ARRAY['MATERIAL'::"public"."expense_category", 'SUBCONTRACTOR'::"public"."expense_category"])) AND ("project_id" IS NOT NULL))
  GROUP BY ("date_trunc"('month'::"text", ("invoice_date")::timestamp with time zone)), "expense_category"
  ORDER BY ("date_trunc"('month'::"text", ("invoice_date")::timestamp with time zone)) DESC, "expense_category";


ALTER VIEW "public"."v_direct_costs_monthly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_feedback_stats" AS
 SELECT "a"."approval_type",
    "fc"."category_code",
    "fc"."category_label_de",
    "fc"."is_rejection",
    "count"(*) AS "total_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'APPROVED'::"public"."approval_status")) AS "approved_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'REJECTED'::"public"."approval_status")) AS "rejected_count",
    "round"("avg"((EXTRACT(epoch FROM ("a"."decided_at" - "a"."requested_at")) / (3600)::numeric)), 2) AS "avg_hours_to_decision",
    "round"(((("count"(*))::numeric / NULLIF("sum"("count"(*)) OVER (PARTITION BY "a"."approval_type"), (0)::numeric)) * (100)::numeric), 1) AS "percentage_of_type"
   FROM ("public"."approvals" "a"
     JOIN "public"."feedback_categories" "fc" ON (("fc"."id" = "a"."feedback_category_id")))
  WHERE ("a"."decided_at" IS NOT NULL)
  GROUP BY "a"."approval_type", "fc"."category_code", "fc"."category_label_de", "fc"."is_rejection"
  ORDER BY "a"."approval_type", ("count"(*)) DESC;


ALTER VIEW "public"."v_feedback_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_finance_summary" AS
 SELECT "count"(*) FILTER (WHERE (("paid_at" IS NULL) AND ("status" <> 'CANCELLED'::"public"."purchase_invoice_status"))) AS "total_open_invoices",
    COALESCE("sum"("total_gross") FILTER (WHERE (("paid_at" IS NULL) AND ("status" <> 'CANCELLED'::"public"."purchase_invoice_status"))), (0)::numeric) AS "total_open_amount",
    "count"(*) FILTER (WHERE (("paid_at" IS NULL) AND ("due_date" < CURRENT_DATE) AND ("status" <> 'CANCELLED'::"public"."purchase_invoice_status"))) AS "overdue_invoices",
    COALESCE("sum"("total_gross") FILTER (WHERE (("paid_at" IS NULL) AND ("due_date" < CURRENT_DATE) AND ("status" <> 'CANCELLED'::"public"."purchase_invoice_status"))), (0)::numeric) AS "overdue_amount",
    "count"(*) FILTER (WHERE (("paid_at" IS NULL) AND (("due_date" >= CURRENT_DATE) AND ("due_date" <= (CURRENT_DATE + '7 days'::interval))))) AS "due_this_week_invoices",
    COALESCE("sum"("total_gross") FILTER (WHERE (("paid_at" IS NULL) AND (("due_date" >= CURRENT_DATE) AND ("due_date" <= (CURRENT_DATE + '7 days'::interval))))), (0)::numeric) AS "due_this_week_amount",
    "count"(*) FILTER (WHERE (("paid_at" IS NOT NULL) AND ("date_trunc"('month'::"text", "paid_at") = "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))) AS "paid_this_month_invoices",
    COALESCE("sum"("paid_amount") FILTER (WHERE (("paid_at" IS NOT NULL) AND ("date_trunc"('month'::"text", "paid_at") = "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)))), (0)::numeric) AS "paid_this_month_amount"
   FROM "public"."purchase_invoices";


ALTER VIEW "public"."v_finance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_steps" (
    "step_key" "text" NOT NULL,
    "project_id" "uuid",
    "step_type" "text" NOT NULL,
    "status" "public"."workflow_step_status" DEFAULT 'PENDING'::"public"."workflow_step_status" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "error" "jsonb",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "next_retry_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "model_used" "text",
    "fallback_chain" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."workflow_steps" OWNER TO "postgres";


COMMENT ON COLUMN "public"."workflow_steps"."model_used" IS 'Which AI model successfully processed this step';



COMMENT ON COLUMN "public"."workflow_steps"."fallback_chain" IS 'Array of models attempted in order';



CREATE OR REPLACE VIEW "public"."v_global_workflow_steps" AS
 SELECT "step_key",
    "step_type",
    "status",
    "payload",
    "completed_at"
   FROM "public"."workflow_steps"
  WHERE ("project_id" IS NULL)
  ORDER BY "step_type", "step_key";


ALTER VIEW "public"."v_global_workflow_steps" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_inspection_protocols_summary" AS
 SELECT "ip"."id",
    "ip"."project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    (((("p"."object_street" || ', '::"text") || "p"."object_zip") || ' '::"text") || "p"."object_city") AS "project_address",
    "ip"."protocol_type",
    "ip"."protocol_number",
    "ip"."inspection_date",
    "ip"."status",
    "ip"."general_notes",
    "ip"."next_appointment",
    "ip"."total_items",
    "ip"."completed_items",
    "ip"."items_with_issues",
    "round"(
        CASE
            WHEN ("ip"."total_items" > 0) THEN ((("ip"."completed_items")::numeric / ("ip"."total_items")::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END, 0) AS "completion_percent",
    ( SELECT "count"(*) AS "count"
           FROM "public"."inspection_attendees" "ia"
          WHERE ("ia"."protocol_id" = "ip"."id")) AS "attendees_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."inspection_defects" "id"
          WHERE ("id"."protocol_id" = "ip"."id")) AS "defects_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."inspection_defects" "id"
          WHERE (("id"."protocol_id" = "ip"."id") AND ("id"."status" = 'offen'::"text"))) AS "open_defects_count",
    "ip"."created_at",
    "ip"."updated_at"
   FROM ("public"."inspection_protocols" "ip"
     JOIN "public"."projects" "p" ON (("p"."id" = "ip"."project_id")));


ALTER VIEW "public"."v_inspection_protocols_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_inspection_protocols_summary" IS 'Aggregierte Protokoll-Übersicht für Dashboard';



CREATE OR REPLACE VIEW "public"."v_margin_analysis" AS
 SELECT "csm"."catalog_position_id",
    "cp"."catalog_code",
    "cp"."repair_title" AS "position_name",
    "cpp"."gu_price_eur" AS "vk_price",
    "cp"."unit" AS "vk_unit",
    "vcs"."supplier_code",
    "vcs"."supplier_name",
    "vcs"."unit_price_net" AS "ek_price",
    "vcs"."purchase_unit" AS "ek_unit",
    "csm"."conversion_factor",
    ("cpp"."gu_price_eur" - ("vcs"."unit_price_net" * "csm"."conversion_factor")) AS "marge_absolut",
        CASE
            WHEN ("cpp"."gu_price_eur" > (0)::numeric) THEN "round"(((("cpp"."gu_price_eur" - ("vcs"."unit_price_net" * "csm"."conversion_factor")) / "cpp"."gu_price_eur") * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "marge_prozent"
   FROM ((("public"."catalog_supplier_mapping" "csm"
     JOIN "public"."catalog_positions" "cp" ON (("cp"."id" = "csm"."catalog_position_id")))
     JOIN "public"."catalog_position_prices" "cpp" ON ((("cpp"."position_id" = "cp"."id") AND (("cpp"."valid_to" IS NULL) OR ("cpp"."valid_to" > CURRENT_DATE)))))
     JOIN "public"."v_current_supplier_prices" "vcs" ON (("vcs"."supplier_article_id" = "csm"."supplier_article_id")))
  WHERE ("csm"."is_active" = true)
  ORDER BY
        CASE
            WHEN ("cpp"."gu_price_eur" > (0)::numeric) THEN "round"(((("cpp"."gu_price_eur" - ("vcs"."unit_price_net" * "csm"."conversion_factor")) / "cpp"."gu_price_eur") * (100)::numeric), 2)
            ELSE (0)::numeric
        END DESC;


ALTER VIEW "public"."v_margin_analysis" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_margin_analysis" IS 'Margen-Analyse: VK-Preis vs. EK-Preis pro Katalogposition';



CREATE OR REPLACE VIEW "public"."v_material_order_by_supplier" AS
 SELECT "pmn"."project_id",
    "pr"."supplier_id",
    "s"."name" AS "supplier_name",
    "array_agg"("pmn"."label" ORDER BY "pmn"."trade", "pmn"."label") AS "items",
    "count"(*) AS "item_count",
    "sum"("pmn"."line_total_net") AS "order_total_net"
   FROM (("public"."project_material_needs" "pmn"
     JOIN "public"."products" "pr" ON (("pr"."id" = "pmn"."product_id")))
     JOIN "public"."suppliers" "s" ON (("s"."id" = "pr"."supplier_id")))
  WHERE ("pmn"."status" = 'confirmed'::"text")
  GROUP BY "pmn"."project_id", "pr"."supplier_id", "s"."name";


ALTER VIEW "public"."v_material_order_by_supplier" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_open_measurements" AS
 SELECT "m"."id",
    "m"."project_id",
    "p"."name" AS "project_name",
    "op"."title" AS "position_title",
    "op"."quantity" AS "expected_quantity",
    "op"."unit",
    "m"."status",
    "m"."created_at"
   FROM (("public"."measurements" "m"
     JOIN "public"."projects" "p" ON (("p"."id" = "m"."project_id")))
     LEFT JOIN "public"."offer_positions" "op" ON (("op"."id" = "m"."offer_position_id")))
  WHERE ("m"."status" = ANY (ARRAY['pending'::"text", 'measured'::"text"]))
  ORDER BY "m"."created_at";


ALTER VIEW "public"."v_open_measurements" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_open_measurements" IS 'Offene Aufmaße für Monteur-Benachrichtigung';



CREATE OR REPLACE VIEW "public"."v_open_purchase_invoices" AS
 SELECT "pi"."id",
    "pi"."invoice_number",
    "pi"."invoice_date",
    "pi"."due_date",
    "pi"."total_gross",
    COALESCE("pi"."paid_amount", (0)::numeric) AS "paid_amount",
    ("pi"."total_gross" - COALESCE("pi"."paid_amount", (0)::numeric)) AS "open_amount",
    GREATEST(0, (CURRENT_DATE - "pi"."due_date")) AS "days_overdue",
    "pi"."status",
    "s"."name" AS "supplier_name",
    "p"."project_number"
   FROM (("public"."purchase_invoices" "pi"
     LEFT JOIN "public"."suppliers" "s" ON (("pi"."supplier_id" = "s"."id")))
     LEFT JOIN "public"."projects" "p" ON (("pi"."project_id" = "p"."id")))
  WHERE ("pi"."status" = ANY (ARRAY['PENDING'::"public"."purchase_invoice_status", 'APPROVED'::"public"."purchase_invoice_status"]))
  ORDER BY "pi"."due_date";


ALTER VIEW "public"."v_open_purchase_invoices" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_open_sales_invoices" AS
 SELECT "si"."id",
    "si"."invoice_number",
    "si"."invoice_date",
    "si"."due_date",
    "si"."total_gross",
    COALESCE("si"."paid_amount", (0)::numeric) AS "paid_amount",
    ("si"."total_gross" - COALESCE("si"."paid_amount", (0)::numeric)) AS "open_amount",
    GREATEST(0, (CURRENT_DATE - "si"."due_date")) AS "days_overdue",
    "si"."status",
    "c"."company_name" AS "client_name",
    "p"."project_number"
   FROM (("public"."sales_invoices" "si"
     LEFT JOIN "public"."clients" "c" ON (("si"."client_id" = "c"."id")))
     LEFT JOIN "public"."projects" "p" ON (("si"."project_id" = "p"."id")))
  WHERE ("si"."status" = ANY (ARRAY['SENT'::"public"."sales_invoice_status", 'OVERDUE'::"public"."sales_invoice_status"]))
  ORDER BY "si"."due_date";


ALTER VIEW "public"."v_open_sales_invoices" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_overhead_costs_monthly" AS
 SELECT "date_trunc"('month'::"text", ("invoice_date")::timestamp with time zone) AS "monat",
    "expense_category",
    "sum"("total_net") AS "summe"
   FROM "public"."purchase_invoices"
  WHERE (("expense_category" <> ALL (ARRAY['MATERIAL'::"public"."expense_category", 'SUBCONTRACTOR'::"public"."expense_category"])) OR ("project_id" IS NULL))
  GROUP BY ("date_trunc"('month'::"text", ("invoice_date")::timestamp with time zone)), "expense_category"
  ORDER BY ("date_trunc"('month'::"text", ("invoice_date")::timestamp with time zone)) DESC, "expense_category";


ALTER VIEW "public"."v_overhead_costs_monthly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_overhead_rate" AS
 WITH "einzelkosten" AS (
         SELECT "date_trunc"('month'::"text", ("purchase_invoices"."invoice_date")::timestamp with time zone) AS "monat",
            "sum"("purchase_invoices"."total_net") AS "ek_summe"
           FROM "public"."purchase_invoices"
          WHERE (("purchase_invoices"."expense_category" = ANY (ARRAY['MATERIAL'::"public"."expense_category", 'SUBCONTRACTOR'::"public"."expense_category"])) AND ("purchase_invoices"."project_id" IS NOT NULL))
          GROUP BY ("date_trunc"('month'::"text", ("purchase_invoices"."invoice_date")::timestamp with time zone))
        ), "gemeinkosten" AS (
         SELECT "date_trunc"('month'::"text", ("purchase_invoices"."invoice_date")::timestamp with time zone) AS "monat",
            "sum"("purchase_invoices"."total_net") AS "agk_summe"
           FROM "public"."purchase_invoices"
          WHERE (("purchase_invoices"."expense_category" <> ALL (ARRAY['MATERIAL'::"public"."expense_category", 'SUBCONTRACTOR'::"public"."expense_category"])) OR ("purchase_invoices"."project_id" IS NULL))
          GROUP BY ("date_trunc"('month'::"text", ("purchase_invoices"."invoice_date")::timestamp with time zone))
        )
 SELECT "e"."monat",
    "e"."ek_summe" AS "einzelkosten",
    COALESCE("g"."agk_summe", (0)::numeric) AS "gemeinkosten",
        CASE
            WHEN ("e"."ek_summe" > (0)::numeric) THEN "round"(((COALESCE("g"."agk_summe", (0)::numeric) / "e"."ek_summe") * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "zuschlagssatz_prozent"
   FROM ("einzelkosten" "e"
     LEFT JOIN "gemeinkosten" "g" ON (("g"."monat" = "e"."monat")))
  ORDER BY "e"."monat" DESC;


ALTER VIEW "public"."v_overhead_rate" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_overhead_rate" IS 'Monatlicher AGK-Zuschlagssatz für Kalkulation';



CREATE OR REPLACE VIEW "public"."v_pending_approvals" AS
 SELECT "a"."id",
    "a"."project_id",
    "a"."approval_type",
    "a"."status",
    "a"."requested_at",
    "a"."request_summary",
    "a"."request_data",
    "a"."expires_at",
    "a"."reminder_count",
    "p"."project_number",
    "p"."display_name" AS "project_display_name",
        CASE
            WHEN ("a"."expires_at" < "now"()) THEN true
            ELSE false
        END AS "is_overdue",
    "round"((EXTRACT(epoch FROM (COALESCE("a"."expires_at", ("now"() + '24:00:00'::interval)) - "now"())) / (3600)::numeric), 2) AS "hours_until_expiry",
    ( SELECT "jsonb_agg"("jsonb_build_object"('id', "fc"."id", 'code', "fc"."category_code", 'label', "fc"."category_label_de", 'is_rejection', "fc"."is_rejection", 'requires_reason', "fc"."requires_reason") ORDER BY "fc"."sort_order") AS "jsonb_agg"
           FROM "public"."feedback_categories" "fc"
          WHERE (("fc"."approval_type" = "a"."approval_type") AND ("fc"."is_active" = true))) AS "available_categories"
   FROM ("public"."approvals" "a"
     JOIN "public"."projects" "p" ON (("p"."id" = "a"."project_id")))
  WHERE ("a"."status" = 'PENDING'::"public"."approval_status")
  ORDER BY
        CASE
            WHEN ("a"."expires_at" < "now"()) THEN 0
            ELSE 1
        END, "a"."expires_at", "a"."requested_at";


ALTER VIEW "public"."v_pending_approvals" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_positions_with_assignments" AS
 SELECT "op"."id" AS "position_id",
    "op"."offer_id",
    "op"."description",
    "op"."quantity",
    "op"."unit",
    "op"."unit_price",
    "op"."total_price",
    "t"."id" AS "trade_id",
    "t"."name" AS "trade_name",
    "t"."color" AS "trade_color",
    "pa"."id" AS "assignment_id",
    "pa"."status" AS "assignment_status",
    "pa"."tab",
    "pa"."subcontractor_id",
    "s"."name" AS "subcontractor_name",
    "s"."short_name" AS "subcontractor_short",
    "s"."is_internal",
    COALESCE("pa"."tab", 'ERSTBEGEHUNG'::"text") AS "display_tab"
   FROM ((("public"."offer_positions" "op"
     LEFT JOIN "public"."trades" "t" ON (("op"."trade_id" = "t"."id")))
     LEFT JOIN "public"."position_assignments" "pa" ON (("op"."id" = "pa"."position_id")))
     LEFT JOIN "public"."subcontractors" "s" ON (("pa"."subcontractor_id" = "s"."id")));


ALTER VIEW "public"."v_positions_with_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_price_comparison" AS
 SELECT COALESCE("sa"."internal_sku", "sa"."internal_name", "sa"."supplier_article_name") AS "artikel",
    "sa"."category",
    "jsonb_agg"("jsonb_build_object"('supplier', "s"."short_name", 'supplier_code', "s"."supplier_code", 'article_number', "sa"."supplier_article_number", 'unit_price', "sap"."unit_price_net", 'unit', "sa"."purchase_unit", 'is_preferred', "s"."is_preferred", 'valid_from', "sap"."valid_from") ORDER BY "sap"."unit_price_net") AS "angebote",
    "min"("sap"."unit_price_net") AS "guenstigster_preis",
    "max"("sap"."unit_price_net") AS "teuerster_preis",
    ("max"("sap"."unit_price_net") - "min"("sap"."unit_price_net")) AS "preisdifferenz",
    "count"(DISTINCT "s"."id") AS "anzahl_lieferanten"
   FROM (("public"."supplier_articles" "sa"
     JOIN "public"."suppliers" "s" ON (("s"."id" = "sa"."supplier_id")))
     JOIN "public"."supplier_article_prices" "sap" ON ((("sap"."supplier_article_id" = "sa"."id") AND ("sap"."valid_to" IS NULL) AND ("sap"."min_quantity" = (1)::numeric))))
  WHERE (("sa"."is_active" = true) AND ("s"."is_active" = true) AND (("sa"."internal_sku" IS NOT NULL) OR ("sa"."internal_name" IS NOT NULL)))
  GROUP BY COALESCE("sa"."internal_sku", "sa"."internal_name", "sa"."supplier_article_name"), "sa"."category"
 HAVING ("count"(DISTINCT "s"."id") > 1);


ALTER VIEW "public"."v_price_comparison" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_price_comparison" IS 'Preisvergleich für Artikel mit mehreren Lieferanten';



CREATE OR REPLACE VIEW "public"."v_product_autocomplete" AS
 SELECT "p"."id",
    "p"."name",
    "p"."material_type",
    "p"."trade",
    "p"."category",
    "p"."supplier_id",
    "s"."name" AS "supplier_name",
    "s"."short_name" AS "supplier_short",
    "p"."sku",
    "p"."last_price_net_eur",
    "p"."unit",
    "p"."use_count",
    "p"."is_favorite"
   FROM ("public"."products" "p"
     LEFT JOIN "public"."suppliers" "s" ON (("s"."id" = "p"."supplier_id")))
  WHERE ("p"."is_active" = true)
  ORDER BY "p"."is_favorite" DESC, "p"."use_count" DESC, "p"."name";


ALTER VIEW "public"."v_product_autocomplete" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_product_autocomplete" IS 'Produkte sortiert nach Relevanz für Autocomplete';



CREATE OR REPLACE VIEW "public"."v_project_change_orders" AS
SELECT
    NULL::"uuid" AS "project_id",
    NULL::"text" AS "project_number",
    NULL::"text" AS "project_name",
    NULL::bigint AS "total_count",
    NULL::bigint AS "approved_count",
    NULL::bigint AS "pending_count",
    NULL::bigint AS "rejected_count",
    NULL::numeric AS "total_amount_net",
    NULL::numeric AS "approved_amount_net",
    NULL::numeric AS "invoiced_amount_net",
    NULL::numeric AS "open_amount_net";


ALTER VIEW "public"."v_project_change_orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_project_defects" AS
 SELECT "id"."id" AS "defect_id",
    "id"."protocol_id",
    "ip"."project_id",
    "p"."project_number",
    "ip"."protocol_type",
    "ip"."inspection_date",
    "id"."description",
    "id"."room",
    "id"."severity",
    "id"."status",
    "id"."responsible_party",
    "id"."due_date",
    "id"."photo_storage_path",
    "id"."created_at",
    "op"."title" AS "position_title",
    "op"."catalog_code"
   FROM (((("public"."inspection_defects" "id"
     JOIN "public"."inspection_protocols" "ip" ON (("ip"."id" = "id"."protocol_id")))
     JOIN "public"."projects" "p" ON (("p"."id" = "ip"."project_id")))
     LEFT JOIN "public"."inspection_protocol_items" "ipi" ON (("ipi"."id" = "id"."protocol_item_id")))
     LEFT JOIN "public"."offer_positions" "op" ON (("op"."id" = "ipi"."offer_position_id")));


ALTER VIEW "public"."v_project_defects" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_project_defects" IS 'Alle Mängel mit Projekt- und Positionskontext';



CREATE OR REPLACE VIEW "public"."v_project_event_history" AS
 SELECT "e"."project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    "e"."event_type",
    "e"."created_at",
    "e"."processed_at",
    "e"."source_flow",
        CASE
            WHEN ("e"."processed_at" IS NULL) THEN 'PENDING'::"text"
            ELSE 'DONE'::"text"
        END AS "status"
   FROM ("public"."events" "e"
     JOIN "public"."projects" "p" ON (("e"."project_id" = "p"."id")))
  ORDER BY "e"."project_id", "e"."created_at";


ALTER VIEW "public"."v_project_event_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_project_financials" AS
 SELECT "p"."id" AS "project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    "p"."status" AS "project_status",
    "c"."company_name" AS "client_name",
    COALESCE("o"."total_gross", (0)::numeric) AS "order_value",
    COALESCE("co"."approved_amount", (0)::numeric) AS "change_orders_approved",
    (COALESCE("o"."total_gross", (0)::numeric) + COALESCE("co"."approved_amount", (0)::numeric)) AS "total_order_value",
    COALESCE("si"."invoiced_net", (0)::numeric) AS "invoiced_net",
    COALESCE("si"."invoiced_gross", (0)::numeric) AS "invoiced_gross",
    COALESCE("si"."paid_amount", (0)::numeric) AS "paid_amount",
    COALESCE("pi"."costs_net", (0)::numeric) AS "costs_net",
    COALESCE("pi"."costs_gross", (0)::numeric) AS "costs_gross",
    (COALESCE("si"."invoiced_net", (0)::numeric) - COALESCE("pi"."costs_net", (0)::numeric)) AS "margin_net",
        CASE
            WHEN (COALESCE("si"."invoiced_net", (0)::numeric) > (0)::numeric) THEN "round"((((COALESCE("si"."invoiced_net", (0)::numeric) - COALESCE("pi"."costs_net", (0)::numeric)) / COALESCE("si"."invoiced_net", (0)::numeric)) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS "margin_percent",
    (COALESCE("si"."invoiced_gross", (0)::numeric) - COALESCE("si"."paid_amount", (0)::numeric)) AS "open_amount",
    "si"."invoice_count",
    "si"."last_invoice_date",
    "co"."change_order_count"
   FROM ((((("public"."projects" "p"
     LEFT JOIN "public"."clients" "c" ON (("p"."client_id" = "c"."id")))
     LEFT JOIN LATERAL ( SELECT "sum"("offers"."total_gross") AS "total_gross"
           FROM "public"."offers"
          WHERE (("offers"."project_id" = "p"."id") AND ("offers"."status" = 'ACCEPTED'::"public"."offer_status"))) "o" ON (true))
     LEFT JOIN LATERAL ( SELECT "sum"("change_orders"."amount_net") FILTER (WHERE ("change_orders"."status" = ANY (ARRAY['APPROVED'::"public"."change_order_status", 'INVOICED'::"public"."change_order_status"]))) AS "approved_amount",
            "count"(*) FILTER (WHERE ("change_orders"."status" <> 'CANCELLED'::"public"."change_order_status")) AS "change_order_count"
           FROM "public"."change_orders"
          WHERE ("change_orders"."project_id" = "p"."id")) "co" ON (true))
     LEFT JOIN LATERAL ( SELECT "sum"("sales_invoices"."total_net") AS "invoiced_net",
            "sum"("sales_invoices"."total_gross") AS "invoiced_gross",
            "sum"(COALESCE("sales_invoices"."paid_amount", (0)::numeric)) AS "paid_amount",
            "count"(*) AS "invoice_count",
            "max"("sales_invoices"."invoice_date") AS "last_invoice_date"
           FROM "public"."sales_invoices"
          WHERE (("sales_invoices"."project_id" = "p"."id") AND ("sales_invoices"."status" <> 'CANCELLED'::"public"."sales_invoice_status"))) "si" ON (true))
     LEFT JOIN LATERAL ( SELECT "sum"("purchase_invoices"."total_net") AS "costs_net",
            "sum"("purchase_invoices"."total_gross") AS "costs_gross"
           FROM "public"."purchase_invoices"
          WHERE ("purchase_invoices"."project_id" = "p"."id")) "pi" ON (true));


ALTER VIEW "public"."v_project_financials" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_project_material_overview" AS
 SELECT "pmn"."project_id",
    "p"."name" AS "project_name",
    "p"."project_number",
    "count"(*) AS "total_items",
    "count"("pmn"."product_id") AS "assigned_items",
    "count"(*) FILTER (WHERE ("pmn"."status" = 'ordered'::"text")) AS "ordered_items",
    "count"(*) FILTER (WHERE ("pmn"."status" = 'delivered'::"text")) AS "delivered_items",
    "round"(((("count"("pmn"."product_id"))::numeric / (NULLIF("count"(*), 0))::numeric) * (100)::numeric), 1) AS "assigned_pct",
    "sum"("pmn"."line_total_net") AS "total_ek_net",
    "array_agg"(DISTINCT "pmn"."trade") AS "trades"
   FROM ("public"."project_material_needs" "pmn"
     JOIN "public"."projects" "p" ON (("p"."id" = "pmn"."project_id")))
  GROUP BY "pmn"."project_id", "p"."name", "p"."project_number";


ALTER VIEW "public"."v_project_material_overview" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_project_material_status" AS
 SELECT "pm"."project_id",
    "p"."name" AS "project_name",
    "count"(*) AS "total_items",
    "count"("pm"."product_id") AS "assigned_items",
    ("count"(*) - "count"("pm"."product_id")) AS "open_items",
    "round"(((("count"("pm"."product_id"))::numeric / (NULLIF("count"(*), 0))::numeric) * (100)::numeric), 1) AS "assigned_pct",
    "sum"("pm"."line_total_net_eur") FILTER (WHERE ("pm"."product_id" IS NOT NULL)) AS "total_value_net",
    "count"(*) FILTER (WHERE ("pm"."status" = 'ordered'::"text")) AS "ordered_items",
    "count"(*) FILTER (WHERE ("pm"."status" = 'delivered'::"text")) AS "delivered_items"
   FROM ("public"."project_materials" "pm"
     JOIN "public"."projects" "p" ON (("p"."id" = "pm"."project_id")))
  GROUP BY "pm"."project_id", "p"."name";


ALTER VIEW "public"."v_project_material_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_project_material_status" IS 'Übersicht Materialstatus pro Projekt für Dashboard';



CREATE OR REPLACE VIEW "public"."v_project_order_summary" AS
 SELECT "pm"."project_id",
    "p"."name" AS "project_name",
    "pm"."product_id",
    "pr"."name" AS "product_name",
    "pr"."sku",
    "s"."name" AS "supplier_name",
    "pm"."material_type",
    COALESCE("pr"."is_consumable", true) AS "is_consumable",
        CASE
            WHEN COALESCE("pr"."is_consumable", true) THEN "sum"("pm"."quantity")
            ELSE (1)::numeric
        END AS "order_quantity",
    "pm"."quantity_unit",
    "count"(DISTINCT "pm"."offer_position_id") AS "position_count",
    "pr"."last_price_net_eur" AS "unit_price",
        CASE
            WHEN COALESCE("pr"."is_consumable", true) THEN ("sum"("pm"."quantity") * "pr"."last_price_net_eur")
            ELSE "pr"."last_price_net_eur"
        END AS "line_total"
   FROM ((("public"."project_materials" "pm"
     JOIN "public"."projects" "p" ON (("p"."id" = "pm"."project_id")))
     LEFT JOIN "public"."products" "pr" ON (("pr"."id" = "pm"."product_id")))
     LEFT JOIN "public"."suppliers" "s" ON (("s"."id" = "pr"."supplier_id")))
  GROUP BY "pm"."project_id", "p"."name", "pm"."product_id", "pr"."name", "pr"."sku", "s"."name", "pm"."material_type", "pr"."is_consumable", "pm"."quantity_unit", "pr"."last_price_net_eur";


ALTER VIEW "public"."v_project_order_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_project_order_summary" IS 'Aggregierte Bestellübersicht: Verbrauchsmaterial summiert, Werkzeuge 1x';



CREATE OR REPLACE VIEW "public"."v_project_progress" AS
 SELECT "p"."id" AS "project_id",
    "p"."project_number",
    "p"."status" AS "project_status",
    "c"."company_name" AS "client_name",
    "o"."id" AS "offer_id",
    "count"("op"."id") AS "total_positions",
    "count"("op"."id") FILTER (WHERE ("op"."progress_percent" = 100)) AS "completed_positions",
    "count"("op"."id") FILTER (WHERE (("op"."progress_percent" > 0) AND ("op"."progress_percent" < 100))) AS "in_progress_positions",
    "count"("op"."id") FILTER (WHERE ("op"."progress_percent" = 0)) AS "not_started_positions",
    "round"("avg"(COALESCE("op"."progress_percent", 0)), 1) AS "avg_progress_percent",
    "max"("op"."progress_updated_at") AS "last_progress_update"
   FROM ((("public"."projects" "p"
     LEFT JOIN "public"."clients" "c" ON (("c"."id" = "p"."client_id")))
     LEFT JOIN "public"."offers" "o" ON (("o"."project_id" = "p"."id")))
     LEFT JOIN "public"."offer_positions" "op" ON (("op"."offer_id" = "o"."id")))
  GROUP BY "p"."id", "p"."project_number", "p"."status", "c"."company_name", "o"."id";


ALTER VIEW "public"."v_project_progress" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_project_progress" IS 'Aggregierter Fortschritt pro Projekt für Dashboard';



CREATE OR REPLACE VIEW "public"."v_project_purchases" AS
 SELECT "p"."id" AS "project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    "pi"."id" AS "invoice_id",
    "pi"."invoice_number",
    "pi"."invoice_date",
    "s"."supplier_code",
    "s"."name" AS "supplier_name",
    "pi"."total_net" AS "invoice_total",
    "pi"."status" AS "invoice_status",
    "count"("pii"."id") AS "position_count",
    "sum"("pii"."total_price_net") AS "items_total"
   FROM ((("public"."projects" "p"
     JOIN "public"."purchase_invoices" "pi" ON (("pi"."project_id" = "p"."id")))
     JOIN "public"."suppliers" "s" ON (("s"."id" = "pi"."supplier_id")))
     LEFT JOIN "public"."purchase_invoice_items" "pii" ON (("pii"."invoice_id" = "pi"."id")))
  GROUP BY "p"."id", "p"."project_number", "p"."name", "pi"."id", "pi"."invoice_number", "pi"."invoice_date", "s"."supplier_code", "s"."name", "pi"."total_net", "pi"."status"
  ORDER BY "pi"."invoice_date" DESC;


ALTER VIEW "public"."v_project_purchases" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_project_purchases" IS 'Einkaufshistorie gruppiert nach Projekt';



CREATE OR REPLACE VIEW "public"."v_project_timeline" AS
SELECT
    NULL::"uuid" AS "project_id",
    NULL::"text" AS "project_number",
    NULL::"text" AS "project_name",
    NULL::"public"."project_status" AS "status",
    NULL::"date" AS "planned_start",
    NULL::"date" AS "planned_end",
    NULL::bigint AS "total_phases",
    NULL::bigint AS "completed_phases",
    NULL::bigint AS "active_phases",
    NULL::numeric AS "progress_percent",
    NULL::json AS "next_phase",
    NULL::numeric AS "total_estimated_cost",
    NULL::numeric AS "total_estimated_hours",
    NULL::"text" AS "timeline_status";


ALTER VIEW "public"."v_project_timeline" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_project_workflow_status" AS
 SELECT "ws"."project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    "ws"."step_key",
    "ws"."step_type",
    "ws"."status",
    "ws"."attempt_count",
    "ws"."max_attempts",
    ("ws"."error" ->> 'message'::"text") AS "error_message",
    "ws"."started_at",
    "ws"."completed_at",
    "ws"."payload"
   FROM ("public"."workflow_steps" "ws"
     LEFT JOIN "public"."projects" "p" ON (("ws"."project_id" = "p"."id")))
  ORDER BY "ws"."project_id" NULLS FIRST, "ws"."created_at";


ALTER VIEW "public"."v_project_workflow_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_purchase_invoices_dashboard" AS
 SELECT "pi"."id",
    "pi"."invoice_number",
    "pi"."invoice_date",
    "pi"."due_date",
    "pi"."total_gross",
    COALESCE("pi"."paid_amount", (0)::numeric) AS "paid_amount",
    ("pi"."total_gross" - COALESCE("pi"."paid_amount", (0)::numeric)) AS "open_amount",
    "pi"."status",
    "pi"."paid_at",
    "pi"."pdf_storage_path",
    "s"."id" AS "supplier_id",
    "s"."name" AS "supplier_name",
    "p"."id" AS "project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    ( SELECT "bt"."counterpart_name"
           FROM ("public"."invoice_payments" "ip"
             JOIN "public"."bank_transactions" "bt" ON (("bt"."id" = "ip"."bank_transaction_id")))
          WHERE ("ip"."purchase_invoice_id" = "pi"."id")
         LIMIT 1) AS "bank_counterpart",
    ( SELECT "bt"."reference_text"
           FROM ("public"."invoice_payments" "ip"
             JOIN "public"."bank_transactions" "bt" ON (("bt"."id" = "ip"."bank_transaction_id")))
          WHERE ("ip"."purchase_invoice_id" = "pi"."id")
         LIMIT 1) AS "bank_reference",
        CASE
            WHEN ("pi"."paid_at" IS NOT NULL) THEN 'PAID'::"text"
            WHEN ("pi"."due_date" < CURRENT_DATE) THEN 'OVERDUE'::"text"
            WHEN ("pi"."due_date" <= (CURRENT_DATE + '7 days'::interval)) THEN 'DUE_SOON'::"text"
            ELSE 'OPEN'::"text"
        END AS "payment_status",
    GREATEST((CURRENT_DATE - "pi"."due_date"), 0) AS "days_overdue",
        CASE
            WHEN ("pi"."pdf_storage_path" IS NOT NULL) THEN "pi"."pdf_storage_path"
            ELSE NULL::"text"
        END AS "pdf_url",
    "pi"."created_at",
    "pi"."updated_at"
   FROM (("public"."purchase_invoices" "pi"
     LEFT JOIN "public"."suppliers" "s" ON (("s"."id" = "pi"."supplier_id")))
     LEFT JOIN "public"."projects" "p" ON (("p"."id" = "pi"."project_id")))
  WHERE ("pi"."status" <> 'CANCELLED'::"public"."purchase_invoice_status");


ALTER VIEW "public"."v_purchase_invoices_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_receipt_queue_current" AS
 SELECT "id",
    "file_name",
    "status",
    "attempts",
    "error_message",
    "created_at",
    "processing_started_at",
    "processed_at",
        CASE
            WHEN ("status" = 'PROCESSING'::"public"."receipt_queue_status") THEN ((EXTRACT(epoch FROM ("now"() - "processing_started_at")))::integer || 's'::"text")
            WHEN ("processed_at" IS NOT NULL) THEN ((EXTRACT(epoch FROM ("processed_at" - "created_at")))::integer || 's'::"text")
            ELSE ((EXTRACT(epoch FROM ("now"() - "created_at")))::integer || 's waiting'::"text")
        END AS "duration"
   FROM "public"."receipt_queue"
  ORDER BY
        CASE "status"
            WHEN 'PROCESSING'::"public"."receipt_queue_status" THEN 1
            WHEN 'PENDING'::"public"."receipt_queue_status" THEN 2
            WHEN 'ERROR'::"public"."receipt_queue_status" THEN 3
            ELSE 4
        END, "created_at" DESC;


ALTER VIEW "public"."v_receipt_queue_current" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_receipt_queue_current" IS 'Aktuelle Queue-Übersicht mit Laufzeiten';



CREATE OR REPLACE VIEW "public"."v_receipt_queue_stats" AS
 SELECT "status",
    "count"(*) AS "count",
    "min"("created_at") AS "oldest",
    "max"("created_at") AS "newest",
    ("avg"(EXTRACT(epoch FROM ("processed_at" - "created_at"))))::integer AS "avg_processing_seconds"
   FROM "public"."receipt_queue"
  GROUP BY "status";


ALTER VIEW "public"."v_receipt_queue_stats" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_receipt_queue_stats" IS 'Aggregierte Queue-Statistiken nach Status';



CREATE OR REPLACE VIEW "public"."v_supplier_balances" AS
 SELECT "s"."id" AS "supplier_id",
    "s"."name" AS "supplier_name",
    "count"("pi"."id") AS "total_invoices",
    "count"("pi"."id") FILTER (WHERE ("pi"."paid_at" IS NULL)) AS "open_invoices",
    COALESCE("sum"("pi"."total_gross"), (0)::numeric) AS "total_invoiced",
    COALESCE("sum"("pi"."paid_amount"), (0)::numeric) AS "total_paid",
    COALESCE(("sum"("pi"."total_gross") - "sum"(COALESCE("pi"."paid_amount", (0)::numeric))), (0)::numeric) AS "open_balance",
    "min"("pi"."due_date") FILTER (WHERE ("pi"."paid_at" IS NULL)) AS "next_due_date"
   FROM ("public"."suppliers" "s"
     LEFT JOIN "public"."purchase_invoices" "pi" ON (("pi"."supplier_id" = "s"."id")))
  GROUP BY "s"."id", "s"."name"
 HAVING ("count"("pi"."id") > 0)
  ORDER BY COALESCE(("sum"("pi"."total_gross") - "sum"(COALESCE("pi"."paid_amount", (0)::numeric))), (0)::numeric) DESC;


ALTER VIEW "public"."v_supplier_balances" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_supplier_balances" IS 'Offene Salden pro Lieferant';



CREATE OR REPLACE VIEW "public"."v_team_workload" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "name",
    NULL::"text" AS "initials",
    NULL::"text" AS "role",
    NULL::"text"[] AS "skills",
    NULL::"text" AS "skill_level",
    NULL::integer AS "max_hours_per_week",
    NULL::numeric(8,2) AS "hourly_rate",
    NULL::"text" AS "avatar_color",
    NULL::bigint AS "active_projects",
    NULL::bigint AS "upcoming_projects",
    NULL::numeric AS "hours_this_week",
    NULL::boolean AS "absent_today",
    NULL::json AS "next_absence";


ALTER VIEW "public"."v_team_workload" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_unprocessed_events" AS
 SELECT "e"."id",
    "e"."project_id",
    "e"."event_type",
    "e"."payload",
    "e"."created_at",
    "e"."source_system",
    "e"."source_flow",
    "r"."target_workflow",
    "r"."webhook_url"
   FROM ("public"."events" "e"
     JOIN "public"."event_routing" "r" ON ((("e"."event_type")::"text" = "r"."event_type")))
  WHERE (("e"."processed_at" IS NULL) AND ("r"."is_active" = true) AND ("e"."created_at" < ("now"() - '00:02:00'::interval)))
  ORDER BY "e"."created_at";


ALTER VIEW "public"."v_unprocessed_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_workflow_dead_letters" AS
 SELECT "ws"."step_key",
    "ws"."project_id",
    "p"."project_number",
    "ws"."step_type",
    "ws"."attempt_count",
    "ws"."error",
    "ws"."completed_at" AS "failed_at"
   FROM ("public"."workflow_steps" "ws"
     LEFT JOIN "public"."projects" "p" ON (("ws"."project_id" = "p"."id")))
  WHERE ("ws"."status" = 'DEAD_LETTER'::"public"."workflow_step_status")
  ORDER BY "ws"."completed_at" DESC;


ALTER VIEW "public"."v_workflow_dead_letters" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_workflow_steps_retry" AS
 SELECT "ws"."step_key",
    "ws"."project_id",
    "ws"."step_type",
    "ws"."status",
    "ws"."attempt_count",
    "ws"."max_attempts",
    "ws"."next_retry_at",
    "ws"."error",
    "p"."project_number"
   FROM ("public"."workflow_steps" "ws"
     LEFT JOIN "public"."projects" "p" ON (("ws"."project_id" = "p"."id")))
  WHERE (("ws"."status" = 'FAILED'::"public"."workflow_step_status") AND ("ws"."attempt_count" < "ws"."max_attempts") AND (("ws"."next_retry_at" IS NULL) OR ("ws"."next_retry_at" <= "now"())))
  ORDER BY "ws"."next_retry_at" NULLS FIRST;


ALTER VIEW "public"."v_workflow_steps_retry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wbs_gwg_catalogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contractor_code" "text" NOT NULL,
    "catalog_name" "text" NOT NULL,
    "valid_from" "date" NOT NULL,
    "valid_to" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wbs_gwg_catalogs" OWNER TO "postgres";


COMMENT ON TABLE "public"."wbs_gwg_catalogs" IS 'Kataloge für WBS/GWG Verträge - contractor_code identifiziert Auftraggeber';



CREATE TABLE IF NOT EXISTS "public"."wbs_gwg_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_id" "uuid" NOT NULL,
    "position_code" "text" NOT NULL,
    "title_de" "text" NOT NULL,
    "title_tr" "text",
    "description_long" "text",
    "unit" "text" NOT NULL,
    "base_price_eur" numeric(10,2),
    "category" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wbs_gwg_positions" OWNER TO "postgres";


COMMENT ON TABLE "public"."wbs_gwg_positions" IS 'Leistungspositionen aus WBS/GWG Katalogen mit DE/TR Übersetzungen';



COMMENT ON COLUMN "public"."wbs_gwg_positions"."title_tr" IS 'Türkische Übersetzung für Subunternehmer-Kommunikation';



COMMENT ON COLUMN "public"."wbs_gwg_positions"."base_price_eur" IS 'Kann NULL sein - dann manuelle Preiseingabe erforderlich';



ALTER TABLE ONLY "public"."absences"
    ADD CONSTRAINT "absences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_api_keys"
    ADD CONSTRAINT "agent_api_keys_key_hash_key" UNIQUE ("key_hash");



ALTER TABLE ONLY "public"."agent_api_keys"
    ADD CONSTRAINT "agent_api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_messages"
    ADD CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_observations"
    ADD CONSTRAINT "agent_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_threads"
    ADD CONSTRAINT "agent_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agent_logs"
    ADD CONSTRAINT "ai_agent_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_iban_key" UNIQUE ("iban");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_import_logs"
    ADD CONSTRAINT "bank_import_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."bank_transactions"
    ADD CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_aliases"
    ADD CONSTRAINT "catalog_aliases_alias_title_key" UNIQUE ("alias_title");



ALTER TABLE ONLY "public"."catalog_aliases"
    ADD CONSTRAINT "catalog_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_discount_rules"
    ADD CONSTRAINT "catalog_discount_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_material_mapping"
    ADD CONSTRAINT "catalog_material_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_position_prices"
    ADD CONSTRAINT "catalog_position_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_position_prices"
    ADD CONSTRAINT "catalog_position_prices_unique" UNIQUE ("position_id", "catalog_version_id");



ALTER TABLE ONLY "public"."catalog_position_products"
    ADD CONSTRAINT "catalog_position_products_catalog_position_id_product_id_key" UNIQUE ("catalog_position_id", "product_id");



ALTER TABLE ONLY "public"."catalog_position_products"
    ADD CONSTRAINT "catalog_position_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_position_texts"
    ADD CONSTRAINT "catalog_position_texts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_position_texts"
    ADD CONSTRAINT "catalog_position_texts_role_lang_unique" UNIQUE ("position_id", "role", "language");



ALTER TABLE ONLY "public"."catalog_positions"
    ADD CONSTRAINT "catalog_positions_code_unique" UNIQUE ("catalog_version_id", "catalog_code");



ALTER TABLE ONLY "public"."catalog_positions"
    ADD CONSTRAINT "catalog_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_positions_v2"
    ADD CONSTRAINT "catalog_positions_v2_catalog_id_position_code_key" UNIQUE ("catalog_id", "position_code");



ALTER TABLE ONLY "public"."catalog_positions_v2"
    ADD CONSTRAINT "catalog_positions_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_supplier_mapping"
    ADD CONSTRAINT "catalog_supplier_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_versions"
    ADD CONSTRAINT "catalog_versions_client_name_unique" UNIQUE ("client_id", "name");



ALTER TABLE ONLY "public"."catalog_versions"
    ADD CONSTRAINT "catalog_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalogs"
    ADD CONSTRAINT "catalogs_contractor_id_code_key" UNIQUE ("contractor_id", "code");



ALTER TABLE ONLY "public"."catalogs"
    ADD CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."change_order_evidence"
    ADD CONSTRAINT "change_order_evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."change_order_items"
    ADD CONSTRAINT "change_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_change_order_number_key" UNIQUE ("change_order_number");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classified_emails"
    ADD CONSTRAINT "classified_emails_gmail_message_id_key" UNIQUE ("gmail_message_id");



ALTER TABLE ONLY "public"."classified_emails"
    ADD CONSTRAINT "classified_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_aliases"
    ADD CONSTRAINT "client_aliases_alias_name_key" UNIQUE ("alias_name");



ALTER TABLE ONLY "public"."client_aliases"
    ADD CONSTRAINT "client_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_product_defaults"
    ADD CONSTRAINT "client_product_defaults_client_id_catalog_position_id_key" UNIQUE ("client_id", "catalog_position_id");



ALTER TABLE ONLY "public"."client_product_defaults"
    ADD CONSTRAINT "client_product_defaults_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."contractors"
    ADD CONSTRAINT "contractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_positions"
    ADD CONSTRAINT "custom_positions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."custom_positions"
    ADD CONSTRAINT "custom_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."defect_comments"
    ADD CONSTRAINT "defect_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."defects"
    ADD CONSTRAINT "defects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispatch_errors"
    ADD CONSTRAINT "dispatch_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_template_key_key" UNIQUE ("template_key");



ALTER TABLE ONLY "public"."drive_folder_registry"
    ADD CONSTRAINT "drive_folder_registry_folder_key_key" UNIQUE ("folder_key");



ALTER TABLE ONLY "public"."drive_folder_registry"
    ADD CONSTRAINT "drive_folder_registry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drive_folder_templates"
    ADD CONSTRAINT "drive_folder_templates_folder_name_key" UNIQUE ("folder_name");



ALTER TABLE ONLY "public"."drive_folder_templates"
    ADD CONSTRAINT "drive_folder_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_processing_attempts"
    ADD CONSTRAINT "email_processing_attempts_pkey" PRIMARY KEY ("email_message_id");



ALTER TABLE ONLY "public"."event_consumer_receipts"
    ADD CONSTRAINT "event_consumer_receipts_consumer_name_event_id_key" UNIQUE ("consumer_name", "event_id");



ALTER TABLE ONLY "public"."event_consumer_receipts"
    ADD CONSTRAINT "event_consumer_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_routing"
    ADD CONSTRAINT "event_routing_pkey" PRIMARY KEY ("event_type", "target_workflow");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_categories"
    ADD CONSTRAINT "feedback_categories_approval_type_category_code_key" UNIQUE ("approval_type", "category_code");



ALTER TABLE ONLY "public"."feedback_categories"
    ADD CONSTRAINT "feedback_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flow_logs"
    ADD CONSTRAINT "flow_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_attachments"
    ADD CONSTRAINT "inspection_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_attendees"
    ADD CONSTRAINT "inspection_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_checklist_items"
    ADD CONSTRAINT "inspection_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_defects"
    ADD CONSTRAINT "inspection_defects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_photos"
    ADD CONSTRAINT "inspection_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_protocol_items"
    ADD CONSTRAINT "inspection_protocol_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_protocol_items"
    ADD CONSTRAINT "inspection_protocol_items_protocol_id_offer_position_id_key" UNIQUE ("protocol_id", "offer_position_id");



ALTER TABLE ONLY "public"."inspection_protocols"
    ADD CONSTRAINT "inspection_protocols_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jumbo_template_items"
    ADD CONSTRAINT "jumbo_template_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jumbo_template_items"
    ADD CONSTRAINT "jumbo_template_items_section_id_position_number_key" UNIQUE ("section_id", "position_number");



ALTER TABLE ONLY "public"."jumbo_template_sections"
    ADD CONSTRAINT "jumbo_template_sections_jumbo_id_section_number_key" UNIQUE ("jumbo_id", "section_number");



ALTER TABLE ONLY "public"."jumbo_template_sections"
    ADD CONSTRAINT "jumbo_template_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jumbo_templates"
    ADD CONSTRAINT "jumbo_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_base"
    ADD CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labor_rates"
    ADD CONSTRAINT "labor_rates_labor_group_key" UNIQUE ("labor_group");



ALTER TABLE ONLY "public"."labor_rates"
    ADD CONSTRAINT "labor_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legacy_positions"
    ADD CONSTRAINT "legacy_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lexware_sync_log"
    ADD CONSTRAINT "lexware_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_providers"
    ADD CONSTRAINT "llm_providers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."llm_providers"
    ADD CONSTRAINT "llm_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_consumption_rates"
    ADD CONSTRAINT "material_consumption_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."measurements"
    ADD CONSTRAINT "measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_entries"
    ADD CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_article_prices"
    ADD CONSTRAINT "no_overlapping_prices" EXCLUDE USING "gist" ("supplier_article_id" WITH =, "min_quantity" WITH =, "daterange"("valid_from", COALESCE("valid_to", '9999-12-31'::"date"), '[]'::"text") WITH &&);



ALTER TABLE ONLY "public"."offer_attachments"
    ADD CONSTRAINT "offer_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_history"
    ADD CONSTRAINT "offer_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_offer_id_position_number_key" UNIQUE ("offer_id", "position_number");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_sections"
    ADD CONSTRAINT "offer_sections_offer_id_section_number_key" UNIQUE ("offer_id", "section_number");



ALTER TABLE ONLY "public"."offer_sections"
    ADD CONSTRAINT "offer_sections_offer_id_title_key" UNIQUE ("offer_id", "title");



ALTER TABLE ONLY "public"."offer_sections"
    ADD CONSTRAINT "offer_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_offer_number_key" UNIQUE ("offer_number");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outbound_emails"
    ADD CONSTRAINT "outbound_emails_entity_idx" UNIQUE ("entity_type", "entity_id", "created_at");



ALTER TABLE ONLY "public"."outbound_emails"
    ADD CONSTRAINT "outbound_emails_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."outbound_emails"
    ADD CONSTRAINT "outbound_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_runs"
    ADD CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_steps"
    ADD CONSTRAINT "pipeline_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_assignments"
    ADD CONSTRAINT "position_assignments_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."position_assignments"
    ADD CONSTRAINT "position_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_assignments"
    ADD CONSTRAINT "position_assignments_position_id_key" UNIQUE ("position_id");



ALTER TABLE ONLY "public"."position_calc_equipment"
    ADD CONSTRAINT "position_calc_equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_calc_labor"
    ADD CONSTRAINT "position_calc_labor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_calc_materials"
    ADD CONSTRAINT "position_calc_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_calc_subcontractor"
    ADD CONSTRAINT "position_calc_subcontractor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_material_requirements"
    ADD CONSTRAINT "position_material_requirement_catalog_position_v2_id_materi_key" UNIQUE ("catalog_position_v2_id", "material_type");



ALTER TABLE ONLY "public"."position_material_requirements"
    ADD CONSTRAINT "position_material_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_usage_stats"
    ADD CONSTRAINT "position_usage_stats_catalog_position_id_project_type_clien_key" UNIQUE ("catalog_position_id", "project_type", "client_type");



ALTER TABLE ONLY "public"."position_usage_stats"
    ADD CONSTRAINT "position_usage_stats_custom_position_id_project_type_client_key" UNIQUE ("custom_position_id", "project_type", "client_type");



ALTER TABLE ONLY "public"."position_usage_stats"
    ADD CONSTRAINT "position_usage_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_supplier_id_sku_key" UNIQUE NULLS NOT DISTINCT ("supplier_id", "sku");



ALTER TABLE ONLY "public"."project_activities"
    ADD CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_drive_folders"
    ADD CONSTRAINT "project_drive_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_drive_folders"
    ADD CONSTRAINT "project_drive_folders_project_id_folder_name_key" UNIQUE ("project_id", "folder_name");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_file_type_file_name_key" UNIQUE ("project_id", "file_type", "file_name");



ALTER TABLE ONLY "public"."project_folders"
    ADD CONSTRAINT "project_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_material_needs"
    ADD CONSTRAINT "project_material_needs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_messages"
    ADD CONSTRAINT "project_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_packing_list"
    ADD CONSTRAINT "project_packing_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_packing_list"
    ADD CONSTRAINT "project_packing_list_project_id_item_type_item_name_key" UNIQUE ("project_id", "item_type", "item_name");



ALTER TABLE ONLY "public"."project_room_measurements"
    ADD CONSTRAINT "project_room_measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_room_measurements"
    ADD CONSTRAINT "project_room_measurements_project_id_room_name_normalized_f_key" UNIQUE ("project_id", "room_name_normalized", "floor_name");



ALTER TABLE ONLY "public"."project_sessions"
    ADD CONSTRAINT "project_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_number_key" UNIQUE ("project_number");



ALTER TABLE ONLY "public"."protocol_signatures"
    ADD CONSTRAINT "protocol_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocols"
    ADD CONSTRAINT "protocols_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocols"
    ADD CONSTRAINT "protocols_project_id_protocol_type_protocol_number_key" UNIQUE ("project_id", "protocol_type", "protocol_number");



ALTER TABLE ONLY "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_invoice_id_position_number_key" UNIQUE ("invoice_id", "position_number");



ALTER TABLE ONLY "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_supplier_id_invoice_number_key" UNIQUE ("supplier_id", "invoice_number");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipt_queue"
    ADD CONSTRAINT "receipt_queue_drive_file_id_key" UNIQUE ("drive_file_id");



ALTER TABLE ONLY "public"."receipt_queue"
    ADD CONSTRAINT "receipt_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."richtzeitwerte"
    ADD CONSTRAINT "richtzeitwerte_catalog_position_nr_catalog_id_key" UNIQUE ("catalog_position_nr", "catalog_id");



ALTER TABLE ONLY "public"."richtzeitwerte"
    ADD CONSTRAINT "richtzeitwerte_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saga_order_positions"
    ADD CONSTRAINT "saga_order_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saga_order_texts"
    ADD CONSTRAINT "saga_order_texts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saga_orders"
    ADD CONSTRAINT "saga_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_invoice_items"
    ADD CONSTRAINT "sales_invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_defaults"
    ADD CONSTRAINT "schedule_defaults_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_defaults"
    ADD CONSTRAINT "schedule_defaults_trade_key" UNIQUE ("trade");



ALTER TABLE ONLY "public"."schedule_learning"
    ADD CONSTRAINT "schedule_learning_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_learning"
    ADD CONSTRAINT "schedule_learning_project_id_trade_key" UNIQUE ("project_id", "trade");



ALTER TABLE ONLY "public"."schedule_phases"
    ADD CONSTRAINT "schedule_phases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_captures"
    ADD CONSTRAINT "site_captures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcontractors"
    ADD CONSTRAINT "subcontractors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subcontractors"
    ADD CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_aliases"
    ADD CONSTRAINT "supplier_aliases_alias_name_key" UNIQUE ("alias_name");



ALTER TABLE ONLY "public"."supplier_aliases"
    ADD CONSTRAINT "supplier_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_article_prices"
    ADD CONSTRAINT "supplier_article_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_articles"
    ADD CONSTRAINT "supplier_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_articles"
    ADD CONSTRAINT "supplier_articles_supplier_id_supplier_article_number_key" UNIQUE ("supplier_id", "supplier_article_number");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_supplier_code_key" UNIQUE ("supplier_code");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."text_blocks"
    ADD CONSTRAINT "text_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trade_aliases"
    ADD CONSTRAINT "trade_aliases_alias_key" UNIQUE ("alias");



ALTER TABLE ONLY "public"."trade_aliases"
    ADD CONSTRAINT "trade_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trade_material_types"
    ADD CONSTRAINT "trade_material_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trade_material_types"
    ADD CONSTRAINT "trade_material_types_trade_material_type_key" UNIQUE ("trade", "material_type");



ALTER TABLE ONLY "public"."trade_sequence_rules"
    ADD CONSTRAINT "trade_sequence_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unanswered_questions"
    ADD CONSTRAINT "unanswered_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_phases"
    ADD CONSTRAINT "unique_phase_per_project" UNIQUE ("project_id", "phase_number");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "unique_time_entry" UNIQUE ("project_id", "team_member_id", "date", "activity_type");



ALTER TABLE ONLY "public"."material_consumption_rates"
    ADD CONSTRAINT "uq_consumption_rate_position" UNIQUE ("catalog_position_prefix", "category");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "uq_project_materials_position_material_type" UNIQUE ("offer_position_id", "material_type");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "uq_project_materials_position_product" UNIQUE ("offer_position_id", "product_id");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "uq_project_materials_project_pos_type" UNIQUE ("project_id", "offer_position_id", "material_type");



ALTER TABLE ONLY "public"."purchase_invoices"
    ADD CONSTRAINT "uq_purchase_invoices_lexware_voucher_id" UNIQUE ("lexware_voucher_id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "uq_sales_invoices_lexware_invoice_id" UNIQUE ("lexware_invoice_id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "uq_suppliers_lexware_contact_id" UNIQUE ("lexware_contact_id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wbs_gwg_catalogs"
    ADD CONSTRAINT "wbs_gwg_catalogs_contractor_code_catalog_name_valid_from_key" UNIQUE ("contractor_code", "catalog_name", "valid_from");



ALTER TABLE ONLY "public"."wbs_gwg_catalogs"
    ADD CONSTRAINT "wbs_gwg_catalogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wbs_gwg_positions"
    ADD CONSTRAINT "wbs_gwg_positions_catalog_id_position_code_key" UNIQUE ("catalog_id", "position_code");



ALTER TABLE ONLY "public"."wbs_gwg_positions"
    ADD CONSTRAINT "wbs_gwg_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("step_key");



CREATE INDEX "idx_absences_dates" ON "public"."absences" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_absences_member" ON "public"."absences" USING "btree" ("team_member_id");



CREATE INDEX "idx_agent_api_keys_active" ON "public"."agent_api_keys" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_agent_api_keys_hash" ON "public"."agent_api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_agent_messages_position" ON "public"."agent_messages" USING "btree" ("position_id") WHERE ("position_id" IS NOT NULL);



CREATE INDEX "idx_agent_messages_thread" ON "public"."agent_messages" USING "btree" ("thread_id", "created_at");



CREATE INDEX "idx_agent_observations_catalog" ON "public"."agent_observations" USING "btree" ("catalog_code") WHERE ("catalog_code" IS NOT NULL);



CREATE INDEX "idx_agent_observations_thread" ON "public"."agent_observations" USING "btree" ("thread_id", "created_at");



CREATE INDEX "idx_agent_observations_trade" ON "public"."agent_observations" USING "btree" ("trade") WHERE ("trade" IS NOT NULL);



CREATE INDEX "idx_agent_threads_offer" ON "public"."agent_threads" USING "btree" ("offer_id") WHERE ("offer_id" IS NOT NULL);



CREATE INDEX "idx_agent_threads_user" ON "public"."agent_threads" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_ai_logs_date" ON "public"."ai_agent_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_approvals_feedback_category" ON "public"."approvals" USING "btree" ("feedback_category_id") WHERE ("feedback_category_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_approvals_no_duplicate_pending" ON "public"."approvals" USING "btree" ("project_id", "approval_type", COALESCE("reference_id", '00000000-0000-0000-0000-000000000000'::"uuid")) WHERE ("status" = 'PENDING'::"public"."approval_status");



COMMENT ON INDEX "public"."idx_approvals_no_duplicate_pending" IS 'Verhindert doppelte PENDING Approvals für dieselbe Kombination aus Projekt + Typ + Referenz';



CREATE INDEX "idx_approvals_pending" ON "public"."approvals" USING "btree" ("requested_at") WHERE ("status" = 'PENDING'::"public"."approval_status");



CREATE INDEX "idx_approvals_project" ON "public"."approvals" USING "btree" ("project_id");



CREATE INDEX "idx_approvals_status" ON "public"."approvals" USING "btree" ("status") WHERE ("status" = 'PENDING'::"public"."approval_status");



CREATE INDEX "idx_approvals_type" ON "public"."approvals" USING "btree" ("approval_type");



CREATE INDEX "idx_assignments_project" ON "public"."position_assignments" USING "btree" ("project_id");



CREATE INDEX "idx_assignments_status" ON "public"."position_assignments" USING "btree" ("status");



CREATE INDEX "idx_assignments_sub" ON "public"."position_assignments" USING "btree" ("subcontractor_id");



CREATE INDEX "idx_assignments_tab" ON "public"."position_assignments" USING "btree" ("project_id", "tab");



CREATE INDEX "idx_attendance_date" ON "public"."attendance_logs" USING "btree" ("check_in" DESC);



CREATE INDEX "idx_attendance_member" ON "public"."attendance_logs" USING "btree" ("team_member_id");



CREATE INDEX "idx_attendance_project" ON "public"."attendance_logs" USING "btree" ("project_id");



CREATE INDEX "idx_bank_accounts_status" ON "public"."bank_accounts" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_bank_transactions_amount" ON "public"."bank_transactions" USING "btree" ("amount");



CREATE INDEX "idx_bank_transactions_matched" ON "public"."bank_transactions" USING "btree" ("is_matched");



CREATE INDEX "idx_calc_equipment_position" ON "public"."position_calc_equipment" USING "btree" ("position_id");



CREATE INDEX "idx_calc_labor_position" ON "public"."position_calc_labor" USING "btree" ("position_id");



CREATE INDEX "idx_calc_materials_position" ON "public"."position_calc_materials" USING "btree" ("position_id");



CREATE INDEX "idx_calc_subcontractor_position" ON "public"."position_calc_subcontractor" USING "btree" ("position_id");



CREATE INDEX "idx_catalog_aliases_position" ON "public"."catalog_aliases" USING "btree" ("catalog_position_v2_id");



CREATE INDEX "idx_catalog_aliases_trgm" ON "public"."catalog_aliases" USING "gin" ("alias_title" "public"."gin_trgm_ops");



CREATE INDEX "idx_catalog_discount_rules_catalog_version_id" ON "public"."catalog_discount_rules" USING "btree" ("catalog_version_id");



CREATE INDEX "idx_catalog_position_prices_catalog_version_id" ON "public"."catalog_position_prices" USING "btree" ("catalog_version_id");



CREATE INDEX "idx_catalog_position_prices_position_id" ON "public"."catalog_position_prices" USING "btree" ("position_id");



CREATE INDEX "idx_catalog_position_texts_position_id" ON "public"."catalog_position_texts" USING "btree" ("position_id");



CREATE INDEX "idx_catalog_positions_catalog_code" ON "public"."catalog_positions" USING "btree" ("catalog_code");



CREATE INDEX "idx_catalog_positions_catalog_version_id" ON "public"."catalog_positions" USING "btree" ("catalog_version_id");



CREATE INDEX "idx_catalog_positions_v2_active" ON "public"."catalog_positions_v2" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_catalog_positions_v2_catalog" ON "public"."catalog_positions_v2" USING "btree" ("catalog_id");



CREATE INDEX "idx_catalog_positions_v2_code" ON "public"."catalog_positions_v2" USING "btree" ("position_code");



CREATE INDEX "idx_catalog_positions_v2_parent" ON "public"."catalog_positions_v2" USING "btree" ("parent_code") WHERE ("parent_code" IS NOT NULL);



CREATE INDEX "idx_catalog_positions_v2_title_trgm" ON "public"."catalog_positions_v2" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "idx_catalog_positions_v2_trade" ON "public"."catalog_positions_v2" USING "btree" ("trade");



CREATE INDEX "idx_catalog_positions_v2_trade_id" ON "public"."catalog_positions_v2" USING "btree" ("trade_id");



CREATE INDEX "idx_catalog_supplier_mapping_catalog" ON "public"."catalog_supplier_mapping" USING "btree" ("catalog_position_id");



CREATE INDEX "idx_catalog_supplier_mapping_supplier" ON "public"."catalog_supplier_mapping" USING "btree" ("supplier_article_id");



CREATE INDEX "idx_catalog_versions_client_id" ON "public"."catalog_versions" USING "btree" ("client_id");



CREATE INDEX "idx_catalogs_active" ON "public"."catalogs" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_catalogs_contractor" ON "public"."catalogs" USING "btree" ("contractor_id");



CREATE INDEX "idx_change_order_evidence_order" ON "public"."change_order_evidence" USING "btree" ("change_order_id");



CREATE INDEX "idx_change_order_items_catalog" ON "public"."change_order_items" USING "btree" ("catalog_position_id");



CREATE INDEX "idx_change_order_items_order" ON "public"."change_order_items" USING "btree" ("change_order_id");



CREATE INDEX "idx_change_orders_catalog_position" ON "public"."change_orders" USING "btree" ("catalog_position_id") WHERE ("catalog_position_id" IS NOT NULL);



CREATE INDEX "idx_change_orders_invoice" ON "public"."change_orders" USING "btree" ("sales_invoice_id");



CREATE INDEX "idx_change_orders_pending_approval" ON "public"."change_orders" USING "btree" ("status") WHERE ("status" = 'PENDING_APPROVAL'::"public"."change_order_status");



CREATE INDEX "idx_change_orders_pending_customer" ON "public"."change_orders" USING "btree" ("status") WHERE ("status" = 'PENDING_CUSTOMER'::"public"."change_order_status");



CREATE INDEX "idx_change_orders_project" ON "public"."change_orders" USING "btree" ("project_id");



CREATE INDEX "idx_change_orders_status" ON "public"."change_orders" USING "btree" ("status");



CREATE INDEX "idx_chat_history_conv" ON "public"."chat_history" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_chat_messages_general" ON "public"."chat_messages" USING "btree" ("user_id", "created_at") WHERE ("project_id" IS NULL);



CREATE INDEX "idx_chat_messages_project" ON "public"."chat_messages" USING "btree" ("project_id", "created_at") WHERE ("project_id" IS NOT NULL);



CREATE INDEX "idx_chat_messages_user" ON "public"."chat_messages" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_checklist_items_protocol" ON "public"."inspection_checklist_items" USING "btree" ("protocol_id");



CREATE INDEX "idx_classified_emails_gmail_id" ON "public"."classified_emails" USING "btree" ("gmail_message_id");



CREATE INDEX "idx_classified_emails_received_at" ON "public"."classified_emails" USING "btree" ("received_at" DESC);



CREATE INDEX "idx_classified_emails_review" ON "public"."classified_emails" USING "btree" ("created_at") WHERE ("doc_type" = 'OTHER'::"text");



CREATE INDEX "idx_classified_emails_routed_to" ON "public"."classified_emails" USING "btree" ("routed_to");



CREATE INDEX "idx_classified_emails_type" ON "public"."classified_emails" USING "btree" ("doc_type");



CREATE INDEX "idx_classified_emails_unprocessed" ON "public"."classified_emails" USING "btree" ("created_at") WHERE ("processed_at" IS NULL);



CREATE UNIQUE INDEX "idx_classified_superchat_msg" ON "public"."classified_emails" USING "btree" ("superchat_message_id") WHERE ("superchat_message_id" IS NOT NULL);



CREATE INDEX "idx_client_aliases_name" ON "public"."client_aliases" USING "btree" ("lower"("alias_name"));



CREATE INDEX "idx_clients_company_name" ON "public"."clients" USING "btree" ("company_name");



CREATE INDEX "idx_clients_company_name_lower" ON "public"."clients" USING "btree" ("lower"("company_name"));



CREATE INDEX "idx_clients_customer_number" ON "public"."clients" USING "btree" ("customer_number");



CREATE INDEX "idx_clients_email" ON "public"."clients" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_clients_email_domain" ON "public"."clients" USING "btree" ("email_domain") WHERE ("email_domain" IS NOT NULL);



CREATE INDEX "idx_clients_name" ON "public"."clients" USING "btree" ("last_name", "first_name");



CREATE INDEX "idx_clients_vat_id" ON "public"."clients" USING "btree" ("vat_id");



CREATE INDEX "idx_cmm_active" ON "public"."catalog_material_mapping" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_cmm_gewerk" ON "public"."catalog_material_mapping" USING "btree" ("gewerk");



CREATE INDEX "idx_cmm_position" ON "public"."catalog_material_mapping" USING "btree" ("catalog_position_nr", "catalog_source");



CREATE INDEX "idx_contractors_active" ON "public"."contractors" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_contractors_code" ON "public"."contractors" USING "btree" ("code");



CREATE INDEX "idx_cpp_catalog_position" ON "public"."catalog_position_products" USING "btree" ("catalog_position_id");



CREATE INDEX "idx_cpp_product" ON "public"."catalog_position_products" USING "btree" ("product_id");



CREATE INDEX "idx_custom_positions_active" ON "public"."custom_positions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_custom_positions_category" ON "public"."custom_positions" USING "btree" ("category");



CREATE INDEX "idx_custom_positions_code" ON "public"."custom_positions" USING "btree" ("code");



CREATE INDEX "idx_custom_positions_search" ON "public"."custom_positions" USING "gin" ("to_tsvector"('"german"'::"regconfig", ((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_custom_positions_trade" ON "public"."custom_positions" USING "btree" ("trade");



CREATE INDEX "idx_defect_comments_defect_id" ON "public"."defect_comments" USING "btree" ("defect_id");



CREATE INDEX "idx_defects_assigned_to" ON "public"."defects" USING "btree" ("assigned_to") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_defects_project_id" ON "public"."defects" USING "btree" ("project_id");



CREATE INDEX "idx_defects_severity" ON "public"."defects" USING "btree" ("severity") WHERE (("deleted_at" IS NULL) AND ("status" <> 'closed'::"public"."defect_status"));



CREATE INDEX "idx_defects_status" ON "public"."defects" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatch_errors_event_id" ON "public"."dispatch_errors" USING "btree" ("event_id");



CREATE INDEX "idx_dispatch_errors_unresolved" ON "public"."dispatch_errors" USING "btree" ("next_retry_at") WHERE ("resolved_at" IS NULL);



CREATE INDEX "idx_document_templates_key" ON "public"."document_templates" USING "btree" ("template_key");



CREATE INDEX "idx_email_attempts_status" ON "public"."email_processing_attempts" USING "btree" ("status");



CREATE INDEX "idx_event_receipts_consumer" ON "public"."event_consumer_receipts" USING "btree" ("consumer_name", "processed_at" DESC);



CREATE INDEX "idx_event_receipts_event" ON "public"."event_consumer_receipts" USING "btree" ("event_id");



CREATE INDEX "idx_events_correlation" ON "public"."events" USING "btree" ("correlation_id") WHERE ("correlation_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_events_dedupe" ON "public"."events" USING "btree" ("source_system", "dedupe_key") WHERE ("dedupe_key" IS NOT NULL);



CREATE INDEX "idx_events_occurred" ON "public"."events" USING "btree" ("occurred_at" DESC);



CREATE INDEX "idx_events_project" ON "public"."events" USING "btree" ("project_id", "occurred_at" DESC);



CREATE INDEX "idx_events_source" ON "public"."events" USING "btree" ("source_system");



CREATE INDEX "idx_events_type" ON "public"."events" USING "btree" ("event_type");



CREATE INDEX "idx_events_unprocessed" ON "public"."events" USING "btree" ("created_at") WHERE ("processed_at" IS NULL);



CREATE INDEX "idx_flow_logs_created" ON "public"."flow_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_flow_logs_flow" ON "public"."flow_logs" USING "btree" ("flow_name");



CREATE INDEX "idx_flow_logs_status" ON "public"."flow_logs" USING "btree" ("status");



CREATE INDEX "idx_folder_registry_drive_id" ON "public"."drive_folder_registry" USING "btree" ("drive_folder_id");



CREATE INDEX "idx_folder_registry_key" ON "public"."drive_folder_registry" USING "btree" ("folder_key");



CREATE INDEX "idx_folder_registry_type" ON "public"."drive_folder_registry" USING "btree" ("folder_type");



CREATE INDEX "idx_inspection_attachments_protocol" ON "public"."inspection_attachments" USING "btree" ("protocol_id");



CREATE INDEX "idx_inspection_attendees_protocol" ON "public"."inspection_attendees" USING "btree" ("protocol_id");



CREATE INDEX "idx_inspection_defects_protocol" ON "public"."inspection_defects" USING "btree" ("protocol_id");



CREATE INDEX "idx_inspection_defects_status" ON "public"."inspection_defects" USING "btree" ("status") WHERE ("status" <> 'behoben'::"text");



CREATE INDEX "idx_inspection_items_protocol" ON "public"."inspection_protocol_items" USING "btree" ("protocol_id");



CREATE INDEX "idx_inspection_photos_project" ON "public"."inspection_photos" USING "btree" ("project_id");



CREATE INDEX "idx_inspection_protocols_project" ON "public"."inspection_protocols" USING "btree" ("project_id", "protocol_type");



CREATE INDEX "idx_inspection_protocols_signature" ON "public"."inspection_protocols" USING "btree" ("project_id") WHERE ("signature_path" IS NOT NULL);



CREATE INDEX "idx_inv_pay_purchase" ON "public"."invoice_payments" USING "btree" ("purchase_invoice_id") WHERE ("purchase_invoice_id" IS NOT NULL);



CREATE INDEX "idx_inv_pay_sales" ON "public"."invoice_payments" USING "btree" ("sales_invoice_id") WHERE ("sales_invoice_id" IS NOT NULL);



CREATE INDEX "idx_inv_pay_status" ON "public"."invoice_payments" USING "btree" ("status");



CREATE INDEX "idx_inv_pay_transaction" ON "public"."invoice_payments" USING "btree" ("bank_transaction_id");



CREATE INDEX "idx_jumbo_items_jumbo" ON "public"."jumbo_template_items" USING "btree" ("jumbo_id");



CREATE INDEX "idx_jumbo_items_section" ON "public"."jumbo_template_items" USING "btree" ("section_id");



CREATE INDEX "idx_jumbo_sections_jumbo" ON "public"."jumbo_template_sections" USING "btree" ("jumbo_id");



CREATE INDEX "idx_jumbo_templates_active" ON "public"."jumbo_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_jumbo_templates_category" ON "public"."jumbo_templates" USING "btree" ("category");



CREATE INDEX "idx_leads_created" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_project" ON "public"."leads" USING "btree" ("project_id") WHERE ("project_id" IS NOT NULL);



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_legacy_positions_search" ON "public"."legacy_positions" USING "gin" ("to_tsvector"('"german"'::"regconfig", ((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_legacy_positions_source" ON "public"."legacy_positions" USING "btree" ("source_file");



CREATE INDEX "idx_legacy_positions_type" ON "public"."legacy_positions" USING "btree" ("project_type");



CREATE INDEX "idx_lexware_sync_log_entity" ON "public"."lexware_sync_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_lexware_sync_log_status" ON "public"."lexware_sync_log" USING "btree" ("sync_status") WHERE ("sync_status" = 'pending'::"text");



CREATE INDEX "idx_measurements_pending" ON "public"."measurements" USING "btree" ("project_id") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_measurements_position" ON "public"."measurements" USING "btree" ("offer_position_id") WHERE ("offer_position_id" IS NOT NULL);



CREATE INDEX "idx_measurements_project" ON "public"."measurements" USING "btree" ("project_id");



CREATE INDEX "idx_measurements_status" ON "public"."measurements" USING "btree" ("status");



CREATE INDEX "idx_memory_scope" ON "public"."memory_entries" USING "btree" ("scope", "scope_id");



CREATE INDEX "idx_memory_trade" ON "public"."memory_entries" USING "btree" ("trade") WHERE ("trade" IS NOT NULL);



CREATE INDEX "idx_memory_type" ON "public"."memory_entries" USING "btree" ("memory_type");



CREATE INDEX "idx_messages_project" ON "public"."project_messages" USING "btree" ("project_id", "created_at" DESC);



CREATE INDEX "idx_messages_sender" ON "public"."project_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_messages_type" ON "public"."project_messages" USING "btree" ("project_id", "message_type");



CREATE INDEX "idx_messages_unread" ON "public"."project_messages" USING "btree" ("project_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_offer_attachments_offer" ON "public"."offer_attachments" USING "btree" ("offer_id");



CREATE INDEX "idx_offer_history_date" ON "public"."offer_history" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_offer_history_offer" ON "public"."offer_history" USING "btree" ("offer_id");



CREATE INDEX "idx_offer_positions_active" ON "public"."offer_positions" USING "btree" ("offer_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_offer_positions_catalog_v2" ON "public"."offer_positions" USING "btree" ("catalog_position_v2_id");



CREATE INDEX "idx_offer_positions_inspection_status" ON "public"."offer_positions" USING "btree" ("inspection_status");



CREATE INDEX "idx_offer_positions_offer" ON "public"."offer_positions" USING "btree" ("offer_id");



CREATE INDEX "idx_offer_positions_phase" ON "public"."offer_positions" USING "btree" ("offer_id", "phase") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_offer_positions_progress" ON "public"."offer_positions" USING "btree" ("offer_id", "progress_percent");



CREATE INDEX "idx_offer_positions_section" ON "public"."offer_positions" USING "btree" ("section_id");



CREATE INDEX "idx_offer_positions_subcontractor" ON "public"."offer_positions" USING "btree" ("assigned_subcontractor_id") WHERE ("assigned_subcontractor_id" IS NOT NULL);



CREATE INDEX "idx_offer_positions_team_member" ON "public"."offer_positions" USING "btree" ("assigned_team_member_id") WHERE ("assigned_team_member_id" IS NOT NULL);



CREATE INDEX "idx_offer_positions_trade" ON "public"."offer_positions" USING "btree" ("trade");



CREATE INDEX "idx_offer_positions_type" ON "public"."offer_positions" USING "btree" ("position_type");



CREATE INDEX "idx_offer_positions_wbs_gwg" ON "public"."offer_positions" USING "btree" ("wbs_gwg_position_id");



CREATE INDEX "idx_offer_sections_offer" ON "public"."offer_sections" USING "btree" ("offer_id");



CREATE INDEX "idx_offer_sections_room_measurement" ON "public"."offer_sections" USING "btree" ("room_measurement_id") WHERE ("room_measurement_id" IS NOT NULL);



CREATE INDEX "idx_offer_sections_trade" ON "public"."offer_sections" USING "btree" ("trade");



CREATE INDEX "idx_offers_deleted_at" ON "public"."offers" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_offers_project" ON "public"."offers" USING "btree" ("project_id");



CREATE INDEX "idx_offers_status" ON "public"."offers" USING "btree" ("status");



CREATE INDEX "idx_outbound_emails_entity" ON "public"."outbound_emails" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_outbound_emails_pending" ON "public"."outbound_emails" USING "btree" ("status") WHERE (("status")::"text" = 'pending_approval'::"text");



CREATE INDEX "idx_outbound_emails_project" ON "public"."outbound_emails" USING "btree" ("project_id") WHERE ("project_id" IS NOT NULL);



CREATE INDEX "idx_outbound_emails_status" ON "public"."outbound_emails" USING "btree" ("status");



CREATE INDEX "idx_packing_list_project" ON "public"."project_packing_list" USING "btree" ("project_id");



CREATE INDEX "idx_packing_list_type" ON "public"."project_packing_list" USING "btree" ("item_type");



CREATE INDEX "idx_packing_list_unpacked" ON "public"."project_packing_list" USING "btree" ("project_id") WHERE ("packed" = false);



CREATE UNIQUE INDEX "idx_pmn_idempotent" ON "public"."project_material_needs" USING "btree" ("project_id", "label", COALESCE("room", '__all__'::"text"));



CREATE INDEX "idx_pmn_open" ON "public"."project_material_needs" USING "btree" ("project_id") WHERE ("product_id" IS NULL);



CREATE INDEX "idx_pmn_project_status" ON "public"."project_material_needs" USING "btree" ("project_id", "status");



CREATE INDEX "idx_pmn_project_trade" ON "public"."project_material_needs" USING "btree" ("project_id", "trade");



CREATE INDEX "idx_pmn_room" ON "public"."project_material_needs" USING "btree" ("project_id", "room") WHERE ("room" IS NOT NULL);



CREATE INDEX "idx_pmn_schedule_phase" ON "public"."project_material_needs" USING "btree" ("schedule_phase_id");



CREATE INDEX "idx_pmn_source_pos" ON "public"."project_material_needs" USING "btree" ("source_position_nr") WHERE ("source_position_nr" IS NOT NULL);



CREATE INDEX "idx_pmr_catalog_position" ON "public"."position_material_requirements" USING "btree" ("catalog_position_v2_id");



CREATE INDEX "idx_pmr_default_product" ON "public"."position_material_requirements" USING "btree" ("default_product_id") WHERE ("default_product_id" IS NOT NULL);



CREATE INDEX "idx_pmr_material_type" ON "public"."position_material_requirements" USING "btree" ("material_type");



CREATE INDEX "idx_po_items_order" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_pr_project" ON "public"."pipeline_runs" USING "btree" ("project_id");



CREATE INDEX "idx_pr_status" ON "public"."pipeline_runs" USING "btree" ("status");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_products_material_type" ON "public"."products" USING "btree" ("material_type") WHERE ("material_type" IS NOT NULL);



CREATE INDEX "idx_products_name_trgm" ON "public"."products" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_supplier" ON "public"."products" USING "btree" ("supplier_id");



CREATE INDEX "idx_products_trade" ON "public"."products" USING "btree" ("trade") WHERE ("trade" IS NOT NULL);



CREATE INDEX "idx_products_use_count" ON "public"."products" USING "btree" ("use_count" DESC);



CREATE INDEX "idx_project_activities_created" ON "public"."project_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_project_activities_project" ON "public"."project_activities" USING "btree" ("project_id");



CREATE INDEX "idx_project_activities_type" ON "public"."project_activities" USING "btree" ("activity_type");



CREATE INDEX "idx_project_assignments_dates" ON "public"."project_assignments" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_project_assignments_member" ON "public"."project_assignments" USING "btree" ("team_member_id");



CREATE INDEX "idx_project_assignments_project" ON "public"."project_assignments" USING "btree" ("project_id");



CREATE INDEX "idx_project_drive_folders_project" ON "public"."project_drive_folders" USING "btree" ("project_id");



CREATE INDEX "idx_project_drive_folders_type" ON "public"."project_drive_folders" USING "btree" ("folder_type");



CREATE INDEX "idx_project_files_folder" ON "public"."project_files" USING "btree" ("folder_id") WHERE ("folder_id" IS NOT NULL);



CREATE INDEX "idx_project_files_project" ON "public"."project_files" USING "btree" ("project_id");



CREATE INDEX "idx_project_files_room" ON "public"."project_files" USING "btree" ("project_id", "room");



CREATE INDEX "idx_project_files_tag" ON "public"."project_files" USING "btree" ("project_id", "photo_tag");



CREATE INDEX "idx_project_files_type" ON "public"."project_files" USING "btree" ("file_type");



CREATE INDEX "idx_project_folders_project" ON "public"."project_folders" USING "btree" ("project_id");



CREATE UNIQUE INDEX "idx_project_folders_unique_name" ON "public"."project_folders" USING "btree" ("project_id", "name");



CREATE INDEX "idx_project_materials_category" ON "public"."project_materials" USING "btree" ("offer_position_id", "category");



CREATE INDEX "idx_project_materials_needs_assignment" ON "public"."project_materials" USING "btree" ("project_id", "created_at") WHERE (("product_id" IS NULL) AND ("status" = 'planned'::"text"));



CREATE INDEX "idx_project_materials_open" ON "public"."project_materials" USING "btree" ("project_id") WHERE ("product_id" IS NULL);



CREATE INDEX "idx_project_materials_position" ON "public"."project_materials" USING "btree" ("offer_position_id") WHERE ("offer_position_id" IS NOT NULL);



CREATE INDEX "idx_project_materials_product" ON "public"."project_materials" USING "btree" ("product_id") WHERE ("product_id" IS NOT NULL);



CREATE INDEX "idx_project_materials_project" ON "public"."project_materials" USING "btree" ("project_id");



CREATE INDEX "idx_project_materials_project_status" ON "public"."project_materials" USING "btree" ("project_id", "status");



CREATE INDEX "idx_project_materials_status" ON "public"."project_materials" USING "btree" ("status");



CREATE INDEX "idx_project_sessions_active" ON "public"."project_sessions" USING "btree" ("project_id", "user_id") WHERE ("ended_at" IS NULL);



CREATE INDEX "idx_project_sessions_user" ON "public"."project_sessions" USING "btree" ("user_id", "started_at" DESC);



CREATE INDEX "idx_projects_bid_deadline" ON "public"."projects" USING "btree" ("bid_deadline") WHERE (("project_type" = 'BID_REQUEST'::"text") AND ("bid_deadline" IS NOT NULL));



CREATE INDEX "idx_projects_client" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_projects_inspection" ON "public"."projects" USING "btree" ("inspection_date") WHERE ("inspection_completed" = false);



CREATE INDEX "idx_projects_number" ON "public"."projects" USING "btree" ("project_number");



CREATE INDEX "idx_projects_price_catalog" ON "public"."projects" USING "btree" ("price_catalog");



CREATE INDEX "idx_projects_progress" ON "public"."projects" USING "btree" ("progress_percent") WHERE ("progress_percent" < 100);



CREATE INDEX "idx_projects_project_type" ON "public"."projects" USING "btree" ("project_type");



CREATE INDEX "idx_projects_source" ON "public"."projects" USING "btree" ("source");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_protocols_date" ON "public"."protocols" USING "btree" ("protocol_date" DESC);



CREATE INDEX "idx_protocols_project" ON "public"."protocols" USING "btree" ("project_id");



CREATE INDEX "idx_protocols_type" ON "public"."protocols" USING "btree" ("protocol_type");



CREATE INDEX "idx_ps_agent" ON "public"."pipeline_steps" USING "btree" ("agent_name");



CREATE INDEX "idx_ps_run" ON "public"."pipeline_steps" USING "btree" ("run_id");



CREATE INDEX "idx_ps_run_order" ON "public"."pipeline_steps" USING "btree" ("run_id", "step_order");



CREATE INDEX "idx_purchase_invoice_items_article" ON "public"."purchase_invoice_items" USING "btree" ("supplier_article_id") WHERE ("supplier_article_id" IS NOT NULL);



CREATE INDEX "idx_purchase_invoice_items_invoice" ON "public"."purchase_invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_purchase_invoice_items_project" ON "public"."purchase_invoice_items" USING "btree" ("project_id") WHERE ("project_id" IS NOT NULL);



CREATE INDEX "idx_purchase_invoices_date" ON "public"."purchase_invoices" USING "btree" ("invoice_date" DESC);



CREATE INDEX "idx_purchase_invoices_due" ON "public"."purchase_invoices" USING "btree" ("due_date") WHERE ("status" <> ALL (ARRAY['PAID'::"public"."purchase_invoice_status", 'CANCELLED'::"public"."purchase_invoice_status"]));



CREATE UNIQUE INDEX "idx_purchase_invoices_email_message_id" ON "public"."purchase_invoices" USING "btree" ("email_message_id") WHERE ("email_message_id" IS NOT NULL);



CREATE INDEX "idx_purchase_invoices_expense_category" ON "public"."purchase_invoices" USING "btree" ("expense_category");



CREATE INDEX "idx_purchase_invoices_invoice_type" ON "public"."purchase_invoices" USING "btree" ("invoice_type");



CREATE INDEX "idx_purchase_invoices_ocr_search" ON "public"."purchase_invoices" USING "gin" ("to_tsvector"('"german"'::"regconfig", COALESCE("ocr_raw_text", ''::"text")));



CREATE INDEX "idx_purchase_invoices_payment_status" ON "public"."purchase_invoices" USING "btree" ("due_date", "paid_at");



CREATE INDEX "idx_purchase_invoices_project" ON "public"."purchase_invoices" USING "btree" ("project_id") WHERE ("project_id" IS NOT NULL);



CREATE INDEX "idx_purchase_invoices_source_type" ON "public"."purchase_invoices" USING "btree" ("source_type");



CREATE INDEX "idx_purchase_invoices_status" ON "public"."purchase_invoices" USING "btree" ("status");



CREATE INDEX "idx_purchase_invoices_supplier" ON "public"."purchase_invoices" USING "btree" ("supplier_id");



CREATE UNIQUE INDEX "idx_purchase_invoices_supplier_invoice_number" ON "public"."purchase_invoices" USING "btree" ("supplier_id", "invoice_number") WHERE (("invoice_number" IS NOT NULL) AND ("invoice_number" !~~ 'SCAN-%'::"text") AND ("invoice_number" !~~ 'EMAIL-%'::"text") AND ("invoice_number" <> 'UNKNOWN'::"text"));



CREATE INDEX "idx_purchase_orders_project" ON "public"."purchase_orders" USING "btree" ("project_id");



CREATE INDEX "idx_purchase_orders_status" ON "public"."purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_purchase_orders_supplier" ON "public"."purchase_orders" USING "btree" ("supplier_id");



CREATE INDEX "idx_receipt_queue_pending" ON "public"."receipt_queue" USING "btree" ("created_at") WHERE ("status" = 'PENDING'::"public"."receipt_queue_status");



CREATE INDEX "idx_receipt_queue_status" ON "public"."receipt_queue" USING "btree" ("status");



CREATE INDEX "idx_room_measurements_project" ON "public"."project_room_measurements" USING "btree" ("project_id");



CREATE INDEX "idx_rzw_catalog" ON "public"."richtzeitwerte" USING "btree" ("catalog_id");



CREATE INDEX "idx_rzw_catalog_pos" ON "public"."richtzeitwerte" USING "btree" ("catalog_position_nr");



CREATE INDEX "idx_rzw_trade" ON "public"."richtzeitwerte" USING "btree" ("trade_id");



CREATE INDEX "idx_saga_orders_project_id" ON "public"."saga_orders" USING "btree" ("project_id");



CREATE INDEX "idx_sales_invoice_items_invoice" ON "public"."sales_invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_sales_invoices_client" ON "public"."sales_invoices" USING "btree" ("client_id");



CREATE INDEX "idx_sales_invoices_date" ON "public"."sales_invoices" USING "btree" ("invoice_date");



CREATE INDEX "idx_sales_invoices_project" ON "public"."sales_invoices" USING "btree" ("project_id");



CREATE INDEX "idx_sales_invoices_status" ON "public"."sales_invoices" USING "btree" ("status");



CREATE INDEX "idx_schedule_learning_trade_member" ON "public"."schedule_learning" USING "btree" ("trade", "team_member_id");



CREATE INDEX "idx_schedule_phases_dates" ON "public"."schedule_phases" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_schedule_phases_member_dates" ON "public"."schedule_phases" USING "btree" ("assigned_team_member_id", "start_date", "end_date");



CREATE INDEX "idx_schedule_phases_project" ON "public"."schedule_phases" USING "btree" ("project_id");



CREATE INDEX "idx_schedule_phases_status" ON "public"."schedule_phases" USING "btree" ("status");



CREATE INDEX "idx_signatures_protocol" ON "public"."protocol_signatures" USING "btree" ("protocol_id", "protocol_type");



CREATE INDEX "idx_subcontractors_active" ON "public"."subcontractors" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_subcontractors_trades" ON "public"."subcontractors" USING "gin" ("trades");



CREATE INDEX "idx_supplier_aliases_name" ON "public"."supplier_aliases" USING "btree" ("lower"("alias_name"));



CREATE INDEX "idx_supplier_article_prices_article" ON "public"."supplier_article_prices" USING "btree" ("supplier_article_id");



CREATE INDEX "idx_supplier_article_prices_current" ON "public"."supplier_article_prices" USING "btree" ("supplier_article_id") WHERE ("valid_to" IS NULL);



CREATE INDEX "idx_supplier_article_prices_valid" ON "public"."supplier_article_prices" USING "btree" ("valid_from", "valid_to");



CREATE INDEX "idx_supplier_articles_category" ON "public"."supplier_articles" USING "btree" ("category");



CREATE INDEX "idx_supplier_articles_ean" ON "public"."supplier_articles" USING "btree" ("ean") WHERE ("ean" IS NOT NULL);



CREATE INDEX "idx_supplier_articles_internal_sku" ON "public"."supplier_articles" USING "btree" ("internal_sku") WHERE ("internal_sku" IS NOT NULL);



CREATE INDEX "idx_supplier_articles_number" ON "public"."supplier_articles" USING "btree" ("supplier_article_number");



CREATE INDEX "idx_supplier_articles_supplier" ON "public"."supplier_articles" USING "btree" ("supplier_id");



CREATE INDEX "idx_suppliers_active" ON "public"."suppliers" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_suppliers_code" ON "public"."suppliers" USING "btree" ("supplier_code");



CREATE INDEX "idx_suppliers_preferred" ON "public"."suppliers" USING "btree" ("is_preferred") WHERE ("is_preferred" = true);



CREATE INDEX "idx_suppliers_type" ON "public"."suppliers" USING "btree" ("supplier_type");



CREATE INDEX "idx_team_members_auth_id" ON "public"."team_members" USING "btree" ("auth_id");



CREATE INDEX "idx_team_members_role_active" ON "public"."team_members" USING "btree" ("role") WHERE ("active" = true);



CREATE INDEX "idx_text_blocks_active" ON "public"."text_blocks" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_text_blocks_category" ON "public"."text_blocks" USING "btree" ("category");



CREATE INDEX "idx_time_entries_date" ON "public"."time_entries" USING "btree" ("date" DESC);



CREATE INDEX "idx_time_entries_member" ON "public"."time_entries" USING "btree" ("team_member_id");



CREATE INDEX "idx_time_entries_project" ON "public"."time_entries" USING "btree" ("project_id");



CREATE INDEX "idx_trade_aliases_alias" ON "public"."trade_aliases" USING "btree" ("alias");



CREATE INDEX "idx_usage_stats_catalog" ON "public"."position_usage_stats" USING "btree" ("catalog_position_id") WHERE ("catalog_position_id" IS NOT NULL);



CREATE INDEX "idx_wbs_gwg_catalogs_active" ON "public"."wbs_gwg_catalogs" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_wbs_gwg_catalogs_contractor" ON "public"."wbs_gwg_catalogs" USING "btree" ("contractor_code");



CREATE INDEX "idx_wbs_gwg_positions_active" ON "public"."wbs_gwg_positions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_wbs_gwg_positions_catalog" ON "public"."wbs_gwg_positions" USING "btree" ("catalog_id");



CREATE INDEX "idx_wbs_gwg_positions_category" ON "public"."wbs_gwg_positions" USING "btree" ("category");



CREATE INDEX "idx_wbs_gwg_positions_code" ON "public"."wbs_gwg_positions" USING "btree" ("position_code");



CREATE INDEX "idx_workflow_steps_project" ON "public"."workflow_steps" USING "btree" ("project_id") WHERE ("project_id" IS NOT NULL);



CREATE INDEX "idx_workflow_steps_retry" ON "public"."workflow_steps" USING "btree" ("next_retry_at") WHERE (("status" = 'FAILED'::"public"."workflow_step_status") AND ("next_retry_at" IS NOT NULL));



CREATE INDEX "idx_workflow_steps_status" ON "public"."workflow_steps" USING "btree" ("status");



CREATE INDEX "idx_workflow_steps_type_status" ON "public"."workflow_steps" USING "btree" ("step_type", "status");



CREATE INDEX "knowledge_base_embedding_idx" ON "public"."knowledge_base" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "knowledge_base_source_type_idx" ON "public"."knowledge_base" USING "btree" ("source_type");



CREATE INDEX "knowledge_base_visibility_idx" ON "public"."knowledge_base" USING "btree" ("visibility");



CREATE INDEX "unanswered_questions_created_idx" ON "public"."unanswered_questions" USING "btree" ("created_at" DESC);



CREATE INDEX "unanswered_questions_status_idx" ON "public"."unanswered_questions" USING "btree" ("status");



CREATE UNIQUE INDEX "uq_project_materials_project_wide" ON "public"."project_materials" USING "btree" ("project_id", "material_type") WHERE ("offer_position_id" IS NULL);



CREATE OR REPLACE VIEW "public"."v_project_change_orders" AS
 SELECT "p"."id" AS "project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    "count"("co"."id") AS "total_count",
    "count"("co"."id") FILTER (WHERE ("co"."status" = 'APPROVED'::"public"."change_order_status")) AS "approved_count",
    "count"("co"."id") FILTER (WHERE ("co"."status" = 'SUBMITTED'::"public"."change_order_status")) AS "pending_count",
    "count"("co"."id") FILTER (WHERE ("co"."status" = 'REJECTED'::"public"."change_order_status")) AS "rejected_count",
    COALESCE("sum"("co"."amount_net"), (0)::numeric) AS "total_amount_net",
    COALESCE("sum"("co"."amount_net") FILTER (WHERE ("co"."status" = 'APPROVED'::"public"."change_order_status")), (0)::numeric) AS "approved_amount_net",
    COALESCE("sum"("co"."amount_net") FILTER (WHERE ("co"."status" = 'INVOICED'::"public"."change_order_status")), (0)::numeric) AS "invoiced_amount_net",
    COALESCE("sum"("co"."amount_net") FILTER (WHERE ("co"."status" = 'APPROVED'::"public"."change_order_status")), (0)::numeric) AS "open_amount_net"
   FROM ("public"."projects" "p"
     LEFT JOIN "public"."change_orders" "co" ON ((("co"."project_id" = "p"."id") AND ("co"."status" <> 'CANCELLED'::"public"."change_order_status"))))
  GROUP BY "p"."id";



CREATE OR REPLACE VIEW "public"."v_project_timeline" AS
 SELECT "p"."id" AS "project_id",
    "p"."project_number",
    "p"."name" AS "project_name",
    "p"."status",
    "p"."planned_start",
    "p"."planned_end",
    "count"("sp"."id") AS "total_phases",
    "count"(
        CASE
            WHEN ("sp"."status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_phases",
    "count"(
        CASE
            WHEN ("sp"."status" = 'in_progress'::"text") THEN 1
            ELSE NULL::integer
        END) AS "active_phases",
        CASE
            WHEN ("count"("sp"."id") > 0) THEN "round"(((("count"(
            CASE
                WHEN ("sp"."status" = 'completed'::"text") THEN 1
                ELSE NULL::integer
            END))::numeric * 100.0) / ("count"("sp"."id"))::numeric))
            ELSE (0)::numeric
        END AS "progress_percent",
    ( SELECT "json_build_object"('name', "next_sp"."name", 'trade', "next_sp"."trade", 'start_date', "next_sp"."start_date", 'end_date', "next_sp"."end_date", 'assigned_to', "tm"."name") AS "json_build_object"
           FROM ("public"."schedule_phases" "next_sp"
             LEFT JOIN "public"."team_members" "tm" ON (("tm"."id" = "next_sp"."assigned_team_member_id")))
          WHERE (("next_sp"."project_id" = "p"."id") AND ("next_sp"."status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text"])))
          ORDER BY "next_sp"."start_date"
         LIMIT 1) AS "next_phase",
    COALESCE("sum"("sp"."estimated_cost"), (0)::numeric) AS "total_estimated_cost",
    COALESCE("sum"("sp"."estimated_hours"), (0)::numeric) AS "total_estimated_hours",
        CASE
            WHEN ("p"."planned_end" IS NULL) THEN 'no_schedule'::"text"
            WHEN (("p"."planned_end" < CURRENT_DATE) AND ("p"."status" <> ALL (ARRAY['COMPLETED'::"public"."project_status", 'CANCELLED'::"public"."project_status"]))) THEN 'delayed'::"text"
            WHEN (("count"(
            CASE
                WHEN ("sp"."status" = 'completed'::"text") THEN 1
                ELSE NULL::integer
            END) >= "count"("sp"."id")) AND ("count"("sp"."id") > 0)) THEN 'completed'::"text"
            ELSE 'on_track'::"text"
        END AS "timeline_status"
   FROM ("public"."projects" "p"
     LEFT JOIN "public"."schedule_phases" "sp" ON (("sp"."project_id" = "p"."id")))
  GROUP BY "p"."id";



CREATE OR REPLACE VIEW "public"."v_team_workload" AS
 SELECT "tm"."id",
    "tm"."name",
    "tm"."initials",
    "tm"."role",
    "tm"."skills",
    "tm"."skill_level",
    "tm"."max_hours_per_week",
    "tm"."hourly_rate",
    "tm"."avatar_color",
    "count"(DISTINCT
        CASE
            WHEN (("pa"."start_date" <= CURRENT_DATE) AND ("pa"."end_date" >= CURRENT_DATE)) THEN "pa"."project_id"
            ELSE NULL::"uuid"
        END) AS "active_projects",
    "count"(DISTINCT
        CASE
            WHEN ("pa"."start_date" > CURRENT_DATE) THEN "pa"."project_id"
            ELSE NULL::"uuid"
        END) AS "upcoming_projects",
    COALESCE(( SELECT "sum"("te"."hours") AS "sum"
           FROM "public"."time_entries" "te"
          WHERE (("te"."team_member_id" = "tm"."id") AND ("te"."date" >= ("date_trunc"('week'::"text", (CURRENT_DATE)::timestamp with time zone))::"date") AND ("te"."date" < (("date_trunc"('week'::"text", (CURRENT_DATE)::timestamp with time zone) + '7 days'::interval))::"date"))), (0)::numeric) AS "hours_this_week",
    (EXISTS ( SELECT 1
           FROM "public"."absences" "a"
          WHERE (("a"."team_member_id" = "tm"."id") AND ("a"."start_date" <= CURRENT_DATE) AND ("a"."end_date" >= CURRENT_DATE)))) AS "absent_today",
    ( SELECT "json_build_object"('type', "a"."type", 'start_date', "a"."start_date", 'end_date', "a"."end_date", 'note', "a"."note") AS "json_build_object"
           FROM "public"."absences" "a"
          WHERE (("a"."team_member_id" = "tm"."id") AND ("a"."end_date" >= CURRENT_DATE))
          ORDER BY "a"."start_date"
         LIMIT 1) AS "next_absence"
   FROM ("public"."team_members" "tm"
     LEFT JOIN "public"."project_assignments" "pa" ON ((("pa"."team_member_id" = "tm"."id") AND ("pa"."status" = ANY (ARRAY['planned'::"text", 'active'::"text"])))))
  WHERE ("tm"."is_active" = true)
  GROUP BY "tm"."id";



CREATE OR REPLACE TRIGGER "bank_accounts_updated_at" BEFORE UPDATE ON "public"."bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_bank_accounts_updated_at"();



CREATE OR REPLACE TRIGGER "baugenius_event_router" AFTER INSERT ON "public"."events" FOR EACH ROW WHEN ((("new"."event_type")::"text" <> 'WORKFLOW_ERROR'::"text")) EXECUTE FUNCTION "supabase_functions"."http_request"('https://n8n.srv1045913.hstgr.cloud/webhook/event-router', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "set_consumption_rates_updated_at" BEFORE UPDATE ON "public"."material_consumption_rates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_room_measurements_updated_at" BEFORE UPDATE ON "public"."project_room_measurements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_timestamp_catalog_position_prices_trg" BEFORE UPDATE ON "public"."catalog_position_prices" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp_catalog_position_prices"();



CREATE OR REPLACE TRIGGER "set_timestamp_catalog_position_texts_trg" BEFORE UPDATE ON "public"."catalog_position_texts" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp_catalog_position_texts"();



CREATE OR REPLACE TRIGGER "set_timestamp_catalog_positions_trg" BEFORE UPDATE ON "public"."catalog_positions" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp_catalog_positions"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."classified_emails" FOR EACH ROW EXECUTE FUNCTION "public"."update_classified_emails_updated_at"();



CREATE OR REPLACE TRIGGER "trg_approvals_updated" BEFORE UPDATE ON "public"."approvals" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_assignment_events" AFTER INSERT OR UPDATE ON "public"."position_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_assignment_event"();



CREATE OR REPLACE TRIGGER "trg_assignments_updated" BEFORE UPDATE ON "public"."position_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_auto_alias" AFTER UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_create_alias"();



CREATE OR REPLACE TRIGGER "trg_calc_equipment_updated" BEFORE UPDATE ON "public"."position_calc_equipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_calc_labor_updated" BEFORE UPDATE ON "public"."position_calc_labor" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_calc_materials_updated" BEFORE UPDATE ON "public"."position_calc_materials" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_calc_subcontractor_updated" BEFORE UPDATE ON "public"."position_calc_subcontractor" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_catalog_positions_v2_updated" BEFORE UPDATE ON "public"."catalog_positions_v2" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_catalogs_updated" BEFORE UPDATE ON "public"."catalogs" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_change_order_item_total" BEFORE INSERT OR UPDATE ON "public"."change_order_items" FOR EACH ROW EXECUTE FUNCTION "public"."calc_change_order_item_total"();



CREATE OR REPLACE TRIGGER "trg_change_order_number" BEFORE INSERT ON "public"."change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_change_order_number"();



CREATE OR REPLACE TRIGGER "trg_change_orders_updated" BEFORE UPDATE ON "public"."change_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_clients_updated" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_contractors_updated" BEFORE UPDATE ON "public"."contractors" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_create_default_folders" AFTER INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_project_folders"();



CREATE OR REPLACE TRIGGER "trg_custom_positions_updated" BEFORE UPDATE ON "public"."custom_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_defects_updated" BEFORE UPDATE ON "public"."defects" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_event_routing_updated" BEFORE UPDATE ON "public"."event_routing" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_event_to_activity" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."log_event_as_activity"();



CREATE OR REPLACE TRIGGER "trg_generate_customer_number" BEFORE INSERT ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."generate_customer_number"();



CREATE OR REPLACE TRIGGER "trg_generate_offer_number" BEFORE INSERT ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."generate_offer_number"();



CREATE OR REPLACE TRIGGER "trg_godmode_phase_completed" AFTER UPDATE ON "public"."schedule_phases" FOR EACH ROW WHEN ((("new"."status" = 'completed'::"text") AND ("old"."status" IS DISTINCT FROM 'completed'::"text"))) EXECUTE FUNCTION "public"."trg_fn_godmode_phase_completed"();



COMMENT ON TRIGGER "trg_godmode_phase_completed" ON "public"."schedule_phases" IS 'Godmode: Lernt automatisch wenn eine Phase abgeschlossen wird';



CREATE OR REPLACE TRIGGER "trg_inspection_items_updated" BEFORE UPDATE ON "public"."inspection_protocol_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_inspection_timestamp"();



CREATE OR REPLACE TRIGGER "trg_inspection_protocols_updated" BEFORE UPDATE ON "public"."inspection_protocols" FOR EACH ROW EXECUTE FUNCTION "public"."update_inspection_timestamp"();



CREATE OR REPLACE TRIGGER "trg_jumbo_templates_updated" BEFORE UPDATE ON "public"."jumbo_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_leads_updated" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_learn_material_choice" AFTER UPDATE ON "public"."project_material_needs" FOR EACH ROW EXECUTE FUNCTION "public"."learn_material_choice"();



CREATE OR REPLACE TRIGGER "trg_learn_product" BEFORE INSERT OR UPDATE OF "product_id" ON "public"."project_materials" FOR EACH ROW WHEN (("new"."product_id" IS NOT NULL)) EXECUTE FUNCTION "public"."learn_product_selection"();



CREATE OR REPLACE TRIGGER "trg_learn_schedule" AFTER UPDATE OF "assigned_team_member_id", "start_date", "end_date", "status" ON "public"."schedule_phases" FOR EACH ROW EXECUTE FUNCTION "public"."fn_learn_schedule"();



CREATE OR REPLACE TRIGGER "trg_map_trade_from_catalog" BEFORE INSERT OR UPDATE OF "catalog_position_v2_id" ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_map_trade_from_catalog"();



CREATE OR REPLACE TRIGGER "trg_material_auto_apply" AFTER INSERT OR UPDATE OF "product_id" ON "public"."project_materials" FOR EACH ROW EXECUTE FUNCTION "public"."trg_auto_apply_material_to_siblings"();



CREATE OR REPLACE TRIGGER "trg_measurements_updated" BEFORE UPDATE ON "public"."measurements" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_offer_positions_missing_prices" AFTER INSERT OR DELETE OR UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_offer_missing_prices"();



CREATE OR REPLACE TRIGGER "trg_offer_positions_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_offer_totals"();



CREATE OR REPLACE TRIGGER "trg_offer_positions_updated" BEFORE UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_offer_sections_updated" BEFORE UPDATE ON "public"."offer_sections" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_offers_number" BEFORE INSERT ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."generate_offer_number"();



CREATE OR REPLACE TRIGGER "trg_offers_updated" BEFORE UPDATE ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_pmn_updated_at" BEFORE UPDATE ON "public"."project_material_needs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pmr_updated" BEFORE UPDATE ON "public"."position_material_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_positions_section_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_section_totals"();



CREATE OR REPLACE TRIGGER "trg_products_updated" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_project_assignments_updated" BEFORE UPDATE ON "public"."project_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_project_materials_updated" BEFORE UPDATE ON "public"."project_materials" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_projects_display_name" BEFORE INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."generate_display_name"();



CREATE OR REPLACE TRIGGER "trg_projects_display_name_update" BEFORE UPDATE OF "object_street", "object_floor" ON "public"."projects" FOR EACH ROW WHEN ((("old"."object_street" IS DISTINCT FROM "new"."object_street") OR ("old"."object_floor" IS DISTINCT FROM "new"."object_floor"))) EXECUTE FUNCTION "public"."generate_display_name"();



CREATE OR REPLACE TRIGGER "trg_projects_number" BEFORE INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."generate_project_number"();



CREATE OR REPLACE TRIGGER "trg_projects_updated" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_protocols_number" BEFORE INSERT ON "public"."protocols" FOR EACH ROW EXECUTE FUNCTION "public"."generate_protocol_number"();



CREATE OR REPLACE TRIGGER "trg_protocols_updated" BEFORE UPDATE ON "public"."protocols" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_purchase_invoice_items_subtotal" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_subtotal"();



CREATE OR REPLACE TRIGGER "trg_purchase_invoice_items_updated" BEFORE UPDATE ON "public"."purchase_invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_purchase_invoices_updated" BEFORE UPDATE ON "public"."purchase_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_recalc_surcharges" AFTER UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_recalc_on_surcharge_change"();



CREATE OR REPLACE TRIGGER "trg_room_measurements_updated" BEFORE UPDATE ON "public"."project_room_measurements" FOR EACH ROW EXECUTE FUNCTION "public"."update_room_measurements_timestamp"();



CREATE OR REPLACE TRIGGER "trg_sales_invoice_number" BEFORE INSERT ON "public"."sales_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_invoice_number"();



CREATE OR REPLACE TRIGGER "trg_sales_invoices_updated" BEFORE UPDATE ON "public"."sales_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_schedule_phase_cost" BEFORE INSERT OR UPDATE OF "assigned_team_member_id", "estimated_hours" ON "public"."schedule_phases" FOR EACH ROW EXECUTE FUNCTION "public"."update_schedule_phase_cost"();



CREATE OR REPLACE TRIGGER "trg_site_captures_updated_at" BEFORE UPDATE ON "public"."site_captures" FOR EACH ROW EXECUTE FUNCTION "public"."fn_site_captures_updated_at"();



CREATE OR REPLACE TRIGGER "trg_subcontractors_updated" BEFORE UPDATE ON "public"."subcontractors" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_supplier_articles_updated" BEFORE UPDATE ON "public"."supplier_articles" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_suppliers_updated" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_sync_catalog_price" AFTER INSERT OR UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."trg_fn_sync_catalog_price"();



CREATE OR REPLACE TRIGGER "trg_team_members_updated" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_text_blocks_updated" BEFORE UPDATE ON "public"."text_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_trades_auto_alias" AFTER INSERT ON "public"."trades" FOR EACH ROW EXECUTE FUNCTION "public"."fn_trades_auto_alias"();



CREATE OR REPLACE TRIGGER "trg_trades_updated" BEFORE UPDATE ON "public"."trades" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_update_offer_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."offer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_offer_totals"();



CREATE OR REPLACE TRIGGER "trg_update_protocol_summary" AFTER INSERT OR DELETE OR UPDATE ON "public"."inspection_protocol_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_protocol_summary"();



CREATE OR REPLACE TRIGGER "trg_wbs_gwg_catalogs_updated" BEFORE UPDATE ON "public"."wbs_gwg_catalogs" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_wbs_gwg_positions_updated" BEFORE UPDATE ON "public"."wbs_gwg_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trg_workflow_steps_updated" BEFORE UPDATE ON "public"."workflow_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_inspection_defects_updated" BEFORE UPDATE ON "public"."inspection_defects" FOR EACH ROW EXECUTE FUNCTION "public"."update_inspection_defects_timestamp"();



CREATE OR REPLACE TRIGGER "update_invoice_payments_updated_at" BEFORE UPDATE ON "public"."invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_schedule_phases_updated_at" BEFORE UPDATE ON "public"."schedule_phases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."absences"
    ADD CONSTRAINT "absences_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_messages"
    ADD CONSTRAINT "agent_messages_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id");



ALTER TABLE ONLY "public"."agent_messages"
    ADD CONSTRAINT "agent_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."agent_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_observations"
    ADD CONSTRAINT "agent_observations_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id");



ALTER TABLE ONLY "public"."agent_observations"
    ADD CONSTRAINT "agent_observations_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."agent_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_threads"
    ADD CONSTRAINT "agent_threads_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_threads"
    ADD CONSTRAINT "agent_threads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_threads"
    ADD CONSTRAINT "agent_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_agent_logs"
    ADD CONSTRAINT "ai_agent_logs_created_offer_id_fkey" FOREIGN KEY ("created_offer_id") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."ai_agent_logs"
    ADD CONSTRAINT "ai_agent_logs_matched_jumbo_id_fkey" FOREIGN KEY ("matched_jumbo_id") REFERENCES "public"."jumbo_templates"("id");



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."catalog_aliases"
    ADD CONSTRAINT "catalog_aliases_catalog_position_v2_id_fkey" FOREIGN KEY ("catalog_position_v2_id") REFERENCES "public"."catalog_positions_v2"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_discount_rules"
    ADD CONSTRAINT "catalog_discount_rules_catalog_version_id_fkey" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."catalog_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_material_mapping"
    ADD CONSTRAINT "catalog_material_mapping_product_pool_id_fkey" FOREIGN KEY ("product_pool_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."catalog_position_prices"
    ADD CONSTRAINT "catalog_position_prices_catalog_version_id_fkey" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."catalog_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_position_prices"
    ADD CONSTRAINT "catalog_position_prices_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."catalog_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_position_products"
    ADD CONSTRAINT "catalog_position_products_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_position_products"
    ADD CONSTRAINT "catalog_position_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_position_texts"
    ADD CONSTRAINT "catalog_position_texts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."catalog_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_positions"
    ADD CONSTRAINT "catalog_positions_catalog_version_id_fkey" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."catalog_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_positions_v2"
    ADD CONSTRAINT "catalog_positions_v2_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_positions_v2"
    ADD CONSTRAINT "catalog_positions_v2_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."catalog_supplier_mapping"
    ADD CONSTRAINT "catalog_supplier_mapping_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_supplier_mapping"
    ADD CONSTRAINT "catalog_supplier_mapping_supplier_article_id_fkey" FOREIGN KEY ("supplier_article_id") REFERENCES "public"."supplier_articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalogs"
    ADD CONSTRAINT "catalogs_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id");



ALTER TABLE ONLY "public"."change_order_evidence"
    ADD CONSTRAINT "change_order_evidence_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "public"."change_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."change_order_items"
    ADD CONSTRAINT "change_order_items_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions"("id");



ALTER TABLE ONLY "public"."change_order_items"
    ADD CONSTRAINT "change_order_items_change_order_id_fkey" FOREIGN KEY ("change_order_id") REFERENCES "public"."change_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions"("id");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "public"."sales_invoices"("id");



ALTER TABLE ONLY "public"."change_orders"
    ADD CONSTRAINT "change_orders_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."offer_sections"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_aliases"
    ADD CONSTRAINT "client_aliases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_product_defaults"
    ADD CONSTRAINT "client_product_defaults_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions_v2"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_product_defaults"
    ADD CONSTRAINT "client_product_defaults_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_product_defaults"
    ADD CONSTRAINT "client_product_defaults_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."defect_comments"
    ADD CONSTRAINT "defect_comments_defect_id_fkey" FOREIGN KEY ("defect_id") REFERENCES "public"."defects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."defects"
    ADD CONSTRAINT "defects_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."subcontractors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."defects"
    ADD CONSTRAINT "defects_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."defects"
    ADD CONSTRAINT "defects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."defects"
    ADD CONSTRAINT "defects_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."offer_sections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_consumer_receipts"
    ADD CONSTRAINT "event_consumer_receipts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "fk_approvals_feedback_category" FOREIGN KEY ("feedback_category_id") REFERENCES "public"."feedback_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "fk_leads_project" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_attachments"
    ADD CONSTRAINT "inspection_attachments_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."inspection_protocols"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_attachments"
    ADD CONSTRAINT "inspection_attachments_site_capture_id_fkey" FOREIGN KEY ("site_capture_id") REFERENCES "public"."site_captures"("id");



ALTER TABLE ONLY "public"."inspection_attendees"
    ADD CONSTRAINT "inspection_attendees_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."inspection_protocols"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_checklist_items"
    ADD CONSTRAINT "inspection_checklist_items_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."inspection_checklist_items"
    ADD CONSTRAINT "inspection_checklist_items_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."inspection_protocols"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_defects"
    ADD CONSTRAINT "inspection_defects_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."inspection_protocols"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_defects"
    ADD CONSTRAINT "inspection_defects_protocol_item_id_fkey" FOREIGN KEY ("protocol_item_id") REFERENCES "public"."inspection_protocol_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_photos"
    ADD CONSTRAINT "inspection_photos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_photos"
    ADD CONSTRAINT "inspection_photos_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_photos"
    ADD CONSTRAINT "inspection_photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_photos"
    ADD CONSTRAINT "inspection_photos_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."offer_sections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_protocol_items"
    ADD CONSTRAINT "inspection_protocol_items_offer_position_id_fkey" FOREIGN KEY ("offer_position_id") REFERENCES "public"."offer_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_protocol_items"
    ADD CONSTRAINT "inspection_protocol_items_product_override_id_fkey" FOREIGN KEY ("product_override_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inspection_protocol_items"
    ADD CONSTRAINT "inspection_protocol_items_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."inspection_protocols"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspection_protocols"
    ADD CONSTRAINT "inspection_protocols_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."inspection_protocols"
    ADD CONSTRAINT "inspection_protocols_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."inspection_protocols"
    ADD CONSTRAINT "inspection_protocols_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "public"."purchase_invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jumbo_template_items"
    ADD CONSTRAINT "jumbo_template_items_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jumbo_template_items"
    ADD CONSTRAINT "jumbo_template_items_custom_position_id_fkey" FOREIGN KEY ("custom_position_id") REFERENCES "public"."custom_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jumbo_template_items"
    ADD CONSTRAINT "jumbo_template_items_jumbo_id_fkey" FOREIGN KEY ("jumbo_id") REFERENCES "public"."jumbo_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jumbo_template_items"
    ADD CONSTRAINT "jumbo_template_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."jumbo_template_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jumbo_template_sections"
    ADD CONSTRAINT "jumbo_template_sections_jumbo_id_fkey" FOREIGN KEY ("jumbo_id") REFERENCES "public"."jumbo_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."legacy_positions"
    ADD CONSTRAINT "legacy_positions_matched_custom_id_fkey" FOREIGN KEY ("matched_custom_id") REFERENCES "public"."custom_positions"("id");



ALTER TABLE ONLY "public"."material_consumption_rates"
    ADD CONSTRAINT "material_consumption_rates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."measurements"
    ADD CONSTRAINT "measurements_offer_position_id_fkey" FOREIGN KEY ("offer_position_id") REFERENCES "public"."offer_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."measurements"
    ADD CONSTRAINT "measurements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_attachments"
    ADD CONSTRAINT "offer_attachments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_history"
    ADD CONSTRAINT "offer_history_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_alternative_to_fkey" FOREIGN KEY ("alternative_to") REFERENCES "public"."offer_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_assigned_subcontractor_id_fkey" FOREIGN KEY ("assigned_subcontractor_id") REFERENCES "public"."subcontractors"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_assigned_team_member_id_fkey" FOREIGN KEY ("assigned_team_member_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_catalog_position_v2_id_fkey" FOREIGN KEY ("catalog_position_v2_id") REFERENCES "public"."catalog_positions_v2"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_change_order_item_id_fkey" FOREIGN KEY ("change_order_item_id") REFERENCES "public"."change_order_items"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_last_inspection_id_fkey" FOREIGN KEY ("last_inspection_id") REFERENCES "public"."inspection_protocols"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_replaces_position_id_fkey" FOREIGN KEY ("replaces_position_id") REFERENCES "public"."offer_positions"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."offer_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_staged_by_fkey" FOREIGN KEY ("staged_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."offer_positions"
    ADD CONSTRAINT "offer_positions_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offer_sections"
    ADD CONSTRAINT "offer_sections_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_sections"
    ADD CONSTRAINT "offer_sections_room_measurement_id_fkey" FOREIGN KEY ("room_measurement_id") REFERENCES "public"."project_room_measurements"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outbound_emails"
    ADD CONSTRAINT "outbound_emails_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."pipeline_runs"
    ADD CONSTRAINT "pipeline_runs_approval_material_id_fkey" FOREIGN KEY ("approval_material_id") REFERENCES "public"."approvals"("id");



ALTER TABLE ONLY "public"."pipeline_runs"
    ADD CONSTRAINT "pipeline_runs_approval_schedule_id_fkey" FOREIGN KEY ("approval_schedule_id") REFERENCES "public"."approvals"("id");



ALTER TABLE ONLY "public"."pipeline_runs"
    ADD CONSTRAINT "pipeline_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_steps"
    ADD CONSTRAINT "pipeline_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_assignments"
    ADD CONSTRAINT "position_assignments_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_assignments"
    ADD CONSTRAINT "position_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_assignments"
    ADD CONSTRAINT "position_assignments_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."position_calc_equipment"
    ADD CONSTRAINT "position_calc_equipment_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_calc_labor"
    ADD CONSTRAINT "position_calc_labor_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_calc_materials"
    ADD CONSTRAINT "position_calc_materials_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_calc_subcontractor"
    ADD CONSTRAINT "position_calc_subcontractor_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."offer_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_material_requirements"
    ADD CONSTRAINT "position_material_requirements_catalog_position_v2_id_fkey" FOREIGN KEY ("catalog_position_v2_id") REFERENCES "public"."catalog_positions_v2"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_material_requirements"
    ADD CONSTRAINT "position_material_requirements_default_product_id_fkey" FOREIGN KEY ("default_product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."position_usage_stats"
    ADD CONSTRAINT "position_usage_stats_catalog_position_id_fkey" FOREIGN KEY ("catalog_position_id") REFERENCES "public"."catalog_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_usage_stats"
    ADD CONSTRAINT "position_usage_stats_custom_position_id_fkey" FOREIGN KEY ("custom_position_id") REFERENCES "public"."custom_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."project_activities"
    ADD CONSTRAINT "project_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_drive_folders"
    ADD CONSTRAINT "project_drive_folders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_drive_folders"
    ADD CONSTRAINT "project_drive_folders_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."drive_folder_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."project_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_folders"
    ADD CONSTRAINT "project_folders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_material_needs"
    ADD CONSTRAINT "project_material_needs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."project_material_needs"
    ADD CONSTRAINT "project_material_needs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."project_material_needs"
    ADD CONSTRAINT "project_material_needs_schedule_phase_id_fkey" FOREIGN KEY ("schedule_phase_id") REFERENCES "public"."schedule_phases"("id");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_offer_position_id_fkey" FOREIGN KEY ("offer_position_id") REFERENCES "public"."offer_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_messages"
    ADD CONSTRAINT "project_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_messages"
    ADD CONSTRAINT "project_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."project_messages"("id");



ALTER TABLE ONLY "public"."project_messages"
    ADD CONSTRAINT "project_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."project_packing_list"
    ADD CONSTRAINT "project_packing_list_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_packing_list"
    ADD CONSTRAINT "project_packing_list_source_position_id_fkey" FOREIGN KEY ("source_position_id") REFERENCES "public"."offer_positions"("id");



ALTER TABLE ONLY "public"."project_room_measurements"
    ADD CONSTRAINT "project_room_measurements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_room_measurements"
    ADD CONSTRAINT "project_room_measurements_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."project_sessions"
    ADD CONSTRAINT "project_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_sessions"
    ADD CONSTRAINT "project_sessions_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."project_sessions"
    ADD CONSTRAINT "project_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."protocols"
    ADD CONSTRAINT "protocols_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."purchase_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_invoice_items"
    ADD CONSTRAINT "purchase_invoice_items_supplier_article_id_fkey" FOREIGN KEY ("supplier_article_id") REFERENCES "public"."supplier_articles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_invoices"
    ADD CONSTRAINT "purchase_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_offer_position_id_fkey" FOREIGN KEY ("offer_position_id") REFERENCES "public"."offer_positions"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_supplier_article_id_fkey" FOREIGN KEY ("supplier_article_id") REFERENCES "public"."supplier_articles"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."receipt_queue"
    ADD CONSTRAINT "receipt_queue_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."purchase_invoices"("id");



ALTER TABLE ONLY "public"."richtzeitwerte"
    ADD CONSTRAINT "richtzeitwerte_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id");



ALTER TABLE ONLY "public"."richtzeitwerte"
    ADD CONSTRAINT "richtzeitwerte_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id");



ALTER TABLE ONLY "public"."saga_order_positions"
    ADD CONSTRAINT "saga_order_positions_catalog_version_id_fkey" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."catalog_versions"("id");



ALTER TABLE ONLY "public"."saga_order_positions"
    ADD CONSTRAINT "saga_order_positions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."saga_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saga_order_positions"
    ADD CONSTRAINT "saga_order_positions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."catalog_positions"("id");



ALTER TABLE ONLY "public"."saga_order_texts"
    ADD CONSTRAINT "saga_order_texts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."saga_orders"("id");



ALTER TABLE ONLY "public"."saga_orders"
    ADD CONSTRAINT "saga_orders_catalog_version_id_fkey" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."catalog_versions"("id");



ALTER TABLE ONLY "public"."saga_orders"
    ADD CONSTRAINT "saga_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."sales_invoice_items"
    ADD CONSTRAINT "sales_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_invoice_items"
    ADD CONSTRAINT "sales_invoice_items_offer_position_id_fkey" FOREIGN KEY ("offer_position_id") REFERENCES "public"."offer_positions"("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."schedule_defaults"
    ADD CONSTRAINT "schedule_defaults_default_team_member_id_fkey" FOREIGN KEY ("default_team_member_id") REFERENCES "public"."team_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule_defaults"
    ADD CONSTRAINT "schedule_defaults_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule_learning"
    ADD CONSTRAINT "schedule_learning_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_learning"
    ADD CONSTRAINT "schedule_learning_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule_learning"
    ADD CONSTRAINT "schedule_learning_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule_phases"
    ADD CONSTRAINT "schedule_phases_assigned_team_member_id_fkey" FOREIGN KEY ("assigned_team_member_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."schedule_phases"
    ADD CONSTRAINT "schedule_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_phases"
    ADD CONSTRAINT "schedule_phases_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."site_captures"
    ADD CONSTRAINT "site_captures_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id");



ALTER TABLE ONLY "public"."site_captures"
    ADD CONSTRAINT "site_captures_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."supplier_aliases"
    ADD CONSTRAINT "supplier_aliases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_article_prices"
    ADD CONSTRAINT "supplier_article_prices_supplier_article_id_fkey" FOREIGN KEY ("supplier_article_id") REFERENCES "public"."supplier_articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_articles"
    ADD CONSTRAINT "supplier_articles_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."trade_aliases"
    ADD CONSTRAINT "trade_aliases_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trade_sequence_rules"
    ADD CONSTRAINT "trade_sequence_rules_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id");



ALTER TABLE ONLY "public"."unanswered_questions"
    ADD CONSTRAINT "unanswered_questions_knowledge_base_id_fkey" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wbs_gwg_positions"
    ADD CONSTRAINT "wbs_gwg_positions_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."wbs_gwg_catalogs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all client_product_defaults" ON "public"."client_product_defaults" USING (true);



CREATE POLICY "Allow all document_templates" ON "public"."document_templates" USING (true);



CREATE POLICY "Allow all inspection_attachments" ON "public"."inspection_attachments" USING (true);



CREATE POLICY "Allow all inspection_photos" ON "public"."inspection_photos" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all inspection_protocol_items" ON "public"."inspection_protocol_items" USING (true);



CREATE POLICY "Allow all inspection_protocols" ON "public"."inspection_protocols" USING (true);



CREATE POLICY "Allow all subcontractors" ON "public"."subcontractors" USING (true) WITH CHECK (true);



CREATE POLICY "Allow read classified_emails" ON "public"."classified_emails" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Authenticated users can insert outbound_emails" ON "public"."outbound_emails" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert project_material_needs" ON "public"."project_material_needs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read project_material_needs" ON "public"."project_material_needs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read trade_material_types" ON "public"."trade_material_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update outbound_emails" ON "public"."outbound_emails" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update project_material_needs" ON "public"."project_material_needs" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view outbound_emails" ON "public"."outbound_emails" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Service role full access" ON "public"."project_room_measurements" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access attendees" ON "public"."inspection_attendees" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access defects" ON "public"."inspection_defects" USING (true) WITH CHECK (true);



CREATE POLICY "Users can manage packing lists" ON "public"."project_packing_list" USING (true);



CREATE POLICY "Users can view packing lists" ON "public"."project_packing_list" FOR SELECT USING (true);



ALTER TABLE "public"."absences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "absences_all" ON "public"."absences" USING (true) WITH CHECK (true);



ALTER TABLE "public"."agent_api_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_api_keys_service_only" ON "public"."agent_api_keys" USING (false);



ALTER TABLE "public"."agent_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_observations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_read_public" ON "public"."knowledge_base" FOR SELECT USING (("visibility" = 'public'::"text"));



ALTER TABLE "public"."agent_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "am_insert" ON "public"."agent_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."agent_threads" "t"
  WHERE (("t"."id" = "agent_messages"."thread_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "am_select" ON "public"."agent_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."agent_threads" "t"
  WHERE (("t"."id" = "agent_messages"."thread_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "am_service" ON "public"."agent_messages" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "ao_insert" ON "public"."agent_observations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."agent_threads" "t"
  WHERE (("t"."id" = "agent_observations"."thread_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "ao_select" ON "public"."agent_observations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."agent_threads" "t"
  WHERE (("t"."id" = "agent_observations"."thread_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "ao_service" ON "public"."agent_observations" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assignments_policy" ON "public"."position_assignments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "at_insert" ON "public"."agent_threads" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "at_select" ON "public"."agent_threads" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "at_service" ON "public"."agent_threads" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "at_update" ON "public"."agent_threads" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."attendance_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendance_logs_all" ON "public"."attendance_logs" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."ai_agent_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."approvals" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_aliases" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_discount_rules" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_position_prices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_position_texts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_positions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_positions_v2" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_supplier_mapping" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalog_versions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."catalogs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."chat_history" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."client_aliases" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."clients" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."contractors" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."custom_positions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."dispatch_errors" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."drive_folder_registry" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."drive_folder_templates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."email_processing_attempts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."event_consumer_receipts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."event_routing" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."events" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."feedback_categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."flow_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."jumbo_template_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."jumbo_template_sections" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."jumbo_templates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."labor_rates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."leads" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."legacy_positions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."material_consumption_rates" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."measurements" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."position_calc_equipment" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."position_calc_labor" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."position_calc_materials" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."position_calc_subcontractor" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."position_material_requirements" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."position_usage_stats" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."products" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."products_backup_20260119" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."project_drive_folders" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."project_files" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."project_materials" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."protocols" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."purchase_invoices_backup_20260112" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."purchase_order_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."purchase_orders" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."receipt_queue" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."saga_order_positions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."saga_order_texts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."saga_orders" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."supplier_aliases" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."supplier_article_prices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."supplier_articles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."suppliers" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."text_blocks" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."unanswered_questions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."wbs_gwg_catalogs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."wbs_gwg_positions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_access" ON "public"."workflow_steps" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_delete_inspection_protocol_items" ON "public"."inspection_protocol_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "authenticated_delete_inspection_protocols" ON "public"."inspection_protocols" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "authenticated_insert_inspection_protocol_items" ON "public"."inspection_protocol_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_insert_inspection_protocols" ON "public"."inspection_protocols" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_read_lexware_sync_log" ON "public"."lexware_sync_log" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_inspection_protocol_items" ON "public"."inspection_protocol_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_inspection_protocols" ON "public"."inspection_protocols" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_update_inspection_protocol_items" ON "public"."inspection_protocol_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_update_inspection_protocols" ON "public"."inspection_protocols" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "ba_delete_admin" ON "public"."bank_accounts" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "ba_insert_admin" ON "public"."bank_accounts" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "ba_select_admin" ON "public"."bank_accounts" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "ba_update_admin" ON "public"."bank_accounts" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_import_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bil_delete_admin" ON "public"."bank_import_logs" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "bil_insert_admin" ON "public"."bank_import_logs" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "bil_select_admin" ON "public"."bank_import_logs" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "bil_update_admin" ON "public"."bank_import_logs" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "bt_delete_admin" ON "public"."bank_transactions" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "bt_insert_admin" ON "public"."bank_transactions" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "bt_select_admin" ON "public"."bank_transactions" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "bt_update_admin" ON "public"."bank_transactions" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."catalog_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_discount_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_material_mapping" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catalog_material_mapping_read" ON "public"."catalog_material_mapping" FOR SELECT USING (true);



CREATE POLICY "catalog_material_mapping_write" ON "public"."catalog_material_mapping" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."catalog_position_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_position_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catalog_position_products_all" ON "public"."catalog_position_products" USING (true) WITH CHECK (true);



ALTER TABLE "public"."catalog_position_texts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_positions_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_supplier_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."change_order_evidence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "change_order_evidence_all" ON "public"."change_order_evidence" USING (true) WITH CHECK (true);



ALTER TABLE "public"."change_order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "change_order_items_all" ON "public"."change_order_items" USING (true) WITH CHECK (true);



ALTER TABLE "public"."change_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "change_orders_all" ON "public"."change_orders" USING (true) WITH CHECK (true);



ALTER TABLE "public"."chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_messages_insert" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "chat_messages_select" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "chat_messages_service_insert" ON "public"."chat_messages" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "chat_messages_service_select" ON "public"."chat_messages" FOR SELECT TO "service_role" USING (true);



ALTER TABLE "public"."classified_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_product_defaults" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contractors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cs_delete_admin" ON "public"."company_settings" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "cs_insert_admin" ON "public"."company_settings" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "cs_select_auth" ON "public"."company_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "cs_update_admin" ON "public"."company_settings" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."custom_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."defect_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "defect_comments_all_access" ON "public"."defect_comments" USING (true);



ALTER TABLE "public"."defects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "defects_all_access" ON "public"."defects" USING (true);



ALTER TABLE "public"."dispatch_errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drive_folder_registry" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drive_folder_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_processing_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_consumer_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_routing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fb_insert" ON "public"."user_feedback" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("auth_user_id" = "auth"."uid"())));



CREATE POLICY "fb_select" ON "public"."user_feedback" FOR SELECT TO "authenticated" USING (("public"."fn_is_admin"() OR ("auth_user_id" = "auth"."uid"())));



CREATE POLICY "fb_service" ON "public"."user_feedback" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."feedback_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flow_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_checklist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inspection_checklist_items_all" ON "public"."inspection_checklist_items" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inspection_defects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_protocol_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_protocols" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ip_delete_admin" ON "public"."invoice_payments" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "ip_insert_admin" ON "public"."invoice_payments" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "ip_select_admin" ON "public"."invoice_payments" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "ip_update_admin" ON "public"."invoice_payments" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."jumbo_template_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jumbo_template_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jumbo_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_base" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labor_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legacy_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lexware_sync_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_providers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lp_admin" ON "public"."llm_providers" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."material_consumption_rates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "me_service" ON "public"."memory_entries" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."measurements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "oa_delete_admin" ON "public"."offer_attachments" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "oa_insert" ON "public"."offer_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_attachments"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "oa_select" ON "public"."offer_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_attachments"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "oa_update" ON "public"."offer_attachments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_attachments"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "off_delete_admin" ON "public"."offers" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "off_insert" ON "public"."offers" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_user_has_project_access"("project_id"));



CREATE POLICY "off_select" ON "public"."offers" FOR SELECT TO "authenticated" USING ("public"."fn_user_has_project_access"("project_id"));



CREATE POLICY "off_update" ON "public"."offers" FOR UPDATE TO "authenticated" USING ("public"."fn_user_has_project_access"("project_id"));



ALTER TABLE "public"."offer_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "oh_insert" ON "public"."offer_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_history"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "oh_select" ON "public"."offer_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_history"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "op_delete_admin" ON "public"."offer_positions" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "op_insert" ON "public"."offer_positions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_positions"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "op_select" ON "public"."offer_positions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_positions"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "op_update" ON "public"."offer_positions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_positions"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "os_delete_admin" ON "public"."offer_sections" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "os_insert" ON "public"."offer_sections" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_sections"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "os_select" ON "public"."offer_sections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_sections"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



CREATE POLICY "os_update" ON "public"."offer_sections" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."offers" "o"
  WHERE (("o"."id" = "offer_sections"."offer_id") AND "public"."fn_user_has_project_access"("o"."project_id")))));



ALTER TABLE "public"."outbound_emails" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "outbound_emails_all" ON "public"."outbound_emails" USING (true) WITH CHECK (true);



CREATE POLICY "pi_delete_admin" ON "public"."purchase_invoices" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "pi_insert_admin" ON "public"."purchase_invoices" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "pi_select_admin" ON "public"."purchase_invoices" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "pi_update_admin" ON "public"."purchase_invoices" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "pii_delete_admin" ON "public"."purchase_invoice_items" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "pii_insert_admin" ON "public"."purchase_invoice_items" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "pii_select_admin" ON "public"."purchase_invoice_items" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "pii_update_admin" ON "public"."purchase_invoice_items" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."pipeline_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pipeline_runs_all_service" ON "public"."pipeline_runs" TO "service_role" USING (true);



CREATE POLICY "pipeline_runs_select" ON "public"."pipeline_runs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."pipeline_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pipeline_steps_all_service" ON "public"."pipeline_steps" TO "service_role" USING (true);



CREATE POLICY "pipeline_steps_select" ON "public"."pipeline_steps" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."position_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_calc_equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_calc_labor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_calc_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_calc_subcontractor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_material_requirements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_usage_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products_backup_20260119" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proj_delete_admin" ON "public"."projects" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "proj_insert_admin" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "proj_select" ON "public"."projects" FOR SELECT TO "authenticated" USING ("public"."fn_user_has_project_access"("id"));



CREATE POLICY "proj_update" ON "public"."projects" FOR UPDATE TO "authenticated" USING ("public"."fn_user_has_project_access"("id"));



ALTER TABLE "public"."project_activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_activities_all" ON "public"."project_activities" USING (true) WITH CHECK (true);



ALTER TABLE "public"."project_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_assignments_all" ON "public"."project_assignments" USING (true) WITH CHECK (true);



ALTER TABLE "public"."project_drive_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_folders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_folders_all" ON "public"."project_folders" USING (true) WITH CHECK (true);



ALTER TABLE "public"."project_material_needs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_messages_all" ON "public"."project_messages" USING (true) WITH CHECK (true);



ALTER TABLE "public"."project_packing_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_room_measurements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protocol_signatures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "protocol_signatures_all" ON "public"."protocol_signatures" USING (true) WITH CHECK (true);



ALTER TABLE "public"."protocols" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ps_insert" ON "public"."project_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ps_select" ON "public"."project_sessions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "ps_service" ON "public"."project_sessions" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."purchase_invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_invoices_backup_20260112" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipt_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."richtzeitwerte" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "richtzeitwerte_all_service" ON "public"."richtzeitwerte" TO "service_role" USING (true);



CREATE POLICY "richtzeitwerte_select" ON "public"."richtzeitwerte" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."saga_order_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saga_order_texts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saga_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_defaults" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedule_defaults_all" ON "public"."schedule_defaults" USING (true);



CREATE POLICY "schedule_defaults_select" ON "public"."schedule_defaults" FOR SELECT USING (true);



ALTER TABLE "public"."schedule_learning" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedule_learning_all" ON "public"."schedule_learning" USING (true);



CREATE POLICY "schedule_learning_select" ON "public"."schedule_learning" FOR SELECT USING (true);



ALTER TABLE "public"."schedule_phases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedule_phases_all" ON "public"."schedule_phases" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_lexware_sync_log" ON "public"."lexware_sync_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "si_delete_admin" ON "public"."sales_invoices" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "si_insert_admin" ON "public"."sales_invoices" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "si_select_admin" ON "public"."sales_invoices" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "si_update_admin" ON "public"."sales_invoices" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "sii_delete_admin" ON "public"."sales_invoice_items" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "sii_insert_admin" ON "public"."sales_invoice_items" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "sii_select_admin" ON "public"."sales_invoice_items" FOR SELECT TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "sii_update_admin" ON "public"."sales_invoice_items" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."site_captures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_captures_insert" ON "public"."site_captures" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_user_has_project_access"("project_id"));



CREATE POLICY "site_captures_select" ON "public"."site_captures" FOR SELECT TO "authenticated" USING ("public"."fn_user_has_project_access"("project_id"));



CREATE POLICY "site_captures_update" ON "public"."site_captures" FOR UPDATE TO "authenticated" USING ("public"."fn_user_has_project_access"("project_id")) WITH CHECK ("public"."fn_user_has_project_access"("project_id"));



ALTER TABLE "public"."subcontractors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subcontractors_policy" ON "public"."subcontractors" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."supplier_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_article_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."text_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "time_entries_all" ON "public"."time_entries" USING (true) WITH CHECK (true);



CREATE POLICY "tm_delete_admin" ON "public"."team_members" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "tm_insert_admin" ON "public"."team_members" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "tm_select_self_or_admin" ON "public"."team_members" FOR SELECT TO "authenticated" USING (("public"."fn_is_admin"() OR ("auth_id" = "auth"."uid"())));



CREATE POLICY "tm_update_admin" ON "public"."team_members" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"());



ALTER TABLE "public"."trade_aliases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trade_aliases_read" ON "public"."trade_aliases" FOR SELECT USING (true);



CREATE POLICY "trade_aliases_write" ON "public"."trade_aliases" USING (true);



ALTER TABLE "public"."trade_material_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trade_sequence_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trades_policy" ON "public"."trades" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "tsr_all_service" ON "public"."trade_sequence_rules" TO "service_role" USING (true);



CREATE POLICY "tsr_select" ON "public"."trade_sequence_rules" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."unanswered_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wbs_gwg_catalogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wbs_gwg_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_steps" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."agent_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."classified_emails";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."clients";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."offer_positions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."offer_sections";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."projects";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."purchase_invoices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."sales_invoices";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
















































GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";


































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."add_defect_comment"("p_defect_id" "uuid", "p_comment" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_defect_comment"("p_defect_id" "uuid", "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_defect_comment"("p_defect_id" "uuid", "p_comment" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_packing_list_suggestions"("p_project_id" "uuid", "p_suggestions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_packing_list_suggestions"("p_project_id" "uuid", "p_suggestions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_packing_list_suggestions"("p_project_id" "uuid", "p_suggestions" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."aggregate_project_materials"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aggregate_project_materials"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aggregate_project_materials"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."aggregate_project_tools"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."aggregate_project_tools"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aggregate_project_tools"("p_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."approve_change_order"("p_change_order_id" "uuid", "p_approved_by" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_change_order"("p_change_order_id" "uuid", "p_approved_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_project_schedule"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_project_schedule"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_project_schedule"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."attach_offer_to_project"("p_project_id" "uuid", "p_offer_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."attach_offer_to_project"("p_project_id" "uuid", "p_offer_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."attach_offer_to_project"("p_project_id" "uuid", "p_offer_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_create_alias"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_create_alias"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_create_alias"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_match_bank_transactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_match_bank_transactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_match_bank_transactions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."auto_plan_full"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auto_plan_full"("p_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."auto_plan_materials"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auto_plan_materials"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_plan_project"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_plan_project"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_plan_project"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_approve_invoices"("p_invoice_ids" "uuid"[], "p_approved_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_approve_invoices"("p_invoice_ids" "uuid"[], "p_approved_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_approve_invoices"("p_invoice_ids" "uuid"[], "p_approved_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_approve_time_entries"("p_entry_ids" "uuid"[], "p_approved_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_approve_time_entries"("p_entry_ids" "uuid"[], "p_approved_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_approve_time_entries"("p_entry_ids" "uuid"[], "p_approved_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_reject_invoices"("p_invoice_ids" "uuid"[], "p_rejected_by" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_reject_invoices"("p_invoice_ids" "uuid"[], "p_rejected_by" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_reject_invoices"("p_invoice_ids" "uuid"[], "p_rejected_by" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON TABLE "public"."offer_positions" TO "anon";
GRANT ALL ON TABLE "public"."offer_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_positions" TO "service_role";



GRANT ALL ON FUNCTION "public"."book_change_order_to_positions"("p_change_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."book_change_order_to_positions"("p_change_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_change_order_to_positions"("p_change_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."calc_change_order_item_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."calc_change_order_item_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calc_change_order_item_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_match_confidence"("p_transaction_id" "uuid", "p_invoice_type" "text", "p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_match_confidence"("p_transaction_id" "uuid", "p_invoice_type" "text", "p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_match_confidence"("p_transaction_id" "uuid", "p_invoice_type" "text", "p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_order_quantities"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_order_quantities"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_order_quantities"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_position_price"("p_position_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_position_price"("p_position_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_position_price"("p_position_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_project_costs"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_project_costs"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_project_costs"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_project_materials"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_project_materials"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_project_materials"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_project_materials_v2"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_project_materials_v2"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_project_materials_v2"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_project_materials_v3"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_project_materials_v3"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_project_materials_v3"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_invoice"("p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_invoice"("p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_invoice"("p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "postgres";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "anon";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_email_duplicate"("p_message_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_duplicate"("p_message_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_duplicate"("p_message_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_expired_approvals"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_expired_approvals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_expired_approvals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_in_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_in_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_in_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_out_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_out_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_out_worker"("p_project_id" "uuid", "p_team_member_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_overdue_invoices"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_overdue_invoices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_overdue_invoices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_next_receipt"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_next_receipt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_next_receipt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_workflow_step"("p_step_key" "text", "p_project_id" "uuid", "p_step_type" "text", "p_timeout_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."claim_workflow_step"("p_step_key" "text", "p_project_id" "uuid", "p_step_type" "text", "p_timeout_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_workflow_step"("p_step_key" "text", "p_project_id" "uuid", "p_step_type" "text", "p_timeout_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_abnahme"("p_project_id" "uuid", "p_signature_path" "text", "p_inspector_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_abnahme"("p_project_id" "uuid", "p_signature_path" "text", "p_inspector_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_abnahme"("p_project_id" "uuid", "p_signature_path" "text", "p_inspector_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_erstbegehung"("p_project_id" "uuid", "p_inspector_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_erstbegehung"("p_project_id" "uuid", "p_inspector_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_erstbegehung"("p_project_id" "uuid", "p_inspector_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_receipt_processing"("p_queue_id" "uuid", "p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_receipt_processing"("p_queue_id" "uuid", "p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_receipt_processing"("p_queue_id" "uuid", "p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_workflow_step"("p_step_key" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_workflow_step"("p_step_key" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_workflow_step"("p_step_key" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_payment_match"("p_payment_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_payment_match"("p_payment_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_payment_match"("p_payment_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirm_proposed_phases"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_proposed_phases"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_approval"("p_project_id" "uuid", "p_approval_type" "public"."approval_type", "p_request_summary" "text", "p_request_data" "jsonb", "p_expires_in_hours" integer, "p_reference_id" "uuid", "p_reference_table" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_approval"("p_project_id" "uuid", "p_approval_type" "public"."approval_type", "p_request_summary" "text", "p_request_data" "jsonb", "p_expires_in_hours" integer, "p_reference_id" "uuid", "p_reference_table" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_approval"("p_project_id" "uuid", "p_approval_type" "public"."approval_type", "p_request_summary" "text", "p_request_data" "jsonb", "p_expires_in_hours" integer, "p_reference_id" "uuid", "p_reference_table" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_client"("p_client_type" "text", "p_company_name" "text", "p_salutation" "text", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_mobile" "text", "p_street" "text", "p_zip_code" "text", "p_city" "text", "p_email_domain" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_client"("p_client_type" "text", "p_company_name" "text", "p_salutation" "text", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_mobile" "text", "p_street" "text", "p_zip_code" "text", "p_city" "text", "p_email_domain" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_client"("p_client_type" "text", "p_company_name" "text", "p_salutation" "text", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_phone" "text", "p_mobile" "text", "p_street" "text", "p_zip_code" "text", "p_city" "text", "p_email_domain" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_project_folders"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_project_folders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_project_folders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_defect"("p_project_id" "uuid", "p_title" "text", "p_description" "text", "p_severity" "text", "p_position_id" "uuid", "p_section_id" "uuid", "p_assigned_to" "uuid", "p_deadline" "date", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_defect"("p_project_id" "uuid", "p_title" "text", "p_description" "text", "p_severity" "text", "p_position_id" "uuid", "p_section_id" "uuid", "p_assigned_to" "uuid", "p_deadline" "date", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_defect"("p_project_id" "uuid", "p_title" "text", "p_description" "text", "p_severity" "text", "p_position_id" "uuid", "p_section_id" "uuid", "p_assigned_to" "uuid", "p_deadline" "date", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_duplicate_check_approval"("p_new_project_id" "uuid", "p_matched_project_id" "uuid", "p_new_address" "jsonb", "p_match_confidence" numeric, "p_catalog_type" "text", "p_pdf_storage_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_duplicate_check_approval"("p_new_project_id" "uuid", "p_matched_project_id" "uuid", "p_new_address" "jsonb", "p_match_confidence" numeric, "p_catalog_type" "text", "p_pdf_storage_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_duplicate_check_approval"("p_new_project_id" "uuid", "p_matched_project_id" "uuid", "p_new_address" "jsonb", "p_match_confidence" numeric, "p_catalog_type" "text", "p_pdf_storage_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_inspection_protocol"("p_project_id" "uuid", "p_protocol_type" "text", "p_inspector_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_inspection_protocol"("p_project_id" "uuid", "p_protocol_type" "text", "p_inspector_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_inspection_protocol"("p_project_id" "uuid", "p_protocol_type" "text", "p_inspector_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_from_transaction"("p_transaction_id" "uuid", "p_category" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_from_transaction"("p_transaction_id" "uuid", "p_category" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_from_transaction"("p_transaction_id" "uuid", "p_category" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_position"("p_offer_id" "uuid", "p_section_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_internal_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_position"("p_offer_id" "uuid", "p_section_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_internal_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_position"("p_offer_id" "uuid", "p_section_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_internal_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_project"("p_name" "text", "p_client_id" "uuid", "p_status" "text", "p_source" "text", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_assigned_team" "text", "p_notes" "text", "p_project_type" "text", "p_bid_deadline" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_project"("p_name" "text", "p_client_id" "uuid", "p_status" "text", "p_source" "text", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_assigned_team" "text", "p_notes" "text", "p_project_type" "text", "p_bid_deadline" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_project"("p_name" "text", "p_client_id" "uuid", "p_status" "text", "p_source" "text", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_assigned_team" "text", "p_notes" "text", "p_project_type" "text", "p_bid_deadline" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_project_folder_entries"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_project_folder_entries"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_project_folder_entries"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_project_id" "uuid", "p_supplier_id" "uuid", "p_items" "jsonb", "p_notes" "text", "p_created_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_project_id" "uuid", "p_supplier_id" "uuid", "p_items" "jsonb", "p_notes" "text", "p_created_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("p_project_id" "uuid", "p_supplier_id" "uuid", "p_items" "jsonb", "p_notes" "text", "p_created_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_saga_order"("_external_ref" "text", "_tenant_name" "text", "_address" "text", "_pdf_url" "text", "_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_saga_order"("_external_ref" "text", "_tenant_name" "text", "_address" "text", "_pdf_url" "text", "_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_saga_order"("_external_ref" "text", "_tenant_name" "text", "_address" "text", "_pdf_url" "text", "_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_section"("p_offer_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_section"("p_offer_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_section"("p_offer_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "postgres";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "anon";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category" "text", "p_feedback_reason" "text", "p_feedback_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category" "text", "p_feedback_reason" "text", "p_feedback_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category" "text", "p_feedback_reason" "text", "p_feedback_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category_id" "uuid", "p_feedback_reason" "text", "p_feedback_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category_id" "uuid", "p_feedback_reason" "text", "p_feedback_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decide_approval"("p_approval_id" "uuid", "p_status" "public"."approval_status", "p_decided_by" "text", "p_channel" "text", "p_feedback_category_id" "uuid", "p_feedback_reason" "text", "p_feedback_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_position"("p_position_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_position"("p_position_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_position"("p_position_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_project_cascade"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_project_cascade"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_project_cascade"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_section"("p_section_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_section"("p_section_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_section"("p_section_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."discard_material_plan"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."discard_material_plan"("p_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."discard_proposed_phases"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."discard_proposed_phases"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."escalate_overdue_invoices"() TO "anon";
GRANT ALL ON FUNCTION "public"."escalate_overdue_invoices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."escalate_overdue_invoices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."export_datev_csv"("p_from_date" "date", "p_to_date" "date", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."export_datev_csv"("p_from_date" "date", "p_to_date" "date", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_datev_csv"("p_from_date" "date", "p_to_date" "date", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fail_receipt_processing"("p_queue_id" "uuid", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fail_receipt_processing"("p_queue_id" "uuid", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fail_receipt_processing"("p_queue_id" "uuid", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fail_workflow_step"("p_step_key" "text", "p_error" "jsonb", "p_retry_delay_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fail_workflow_step"("p_step_key" "text", "p_error" "jsonb", "p_retry_delay_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fail_workflow_step"("p_step_key" "text", "p_error" "jsonb", "p_retry_delay_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_matching_project"("p_street" "text", "p_city" "text", "p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_matching_project"("p_street" "text", "p_city" "text", "p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_matching_project"("p_street" "text", "p_city" "text", "p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_or_create_client"("p_company_name" "text", "p_email_domain" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_client"("p_company_name" "text", "p_email_domain" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_client"("p_company_name" "text", "p_email_domain" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_or_create_supplier_article"("p_supplier_id" "uuid", "p_article_number" "text", "p_article_name" "text", "p_unit" "public"."purchase_unit", "p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_supplier_article"("p_supplier_id" "uuid", "p_article_number" "text", "p_article_name" "text", "p_unit" "public"."purchase_unit", "p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_supplier_article"("p_supplier_id" "uuid", "p_article_number" "text", "p_article_name" "text", "p_unit" "public"."purchase_unit", "p_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_payment_matches"("p_transaction_id" "uuid", "p_min_confidence" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_payment_matches"("p_transaction_id" "uuid", "p_min_confidence" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_payment_matches"("p_transaction_id" "uuid", "p_min_confidence" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "postgres";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "anon";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "service_role";



GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_agent_einsatzplaner"("p_run_id" "uuid", "p_input" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_agent_einsatzplaner"("p_run_id" "uuid", "p_input" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_agent_einsatzplaner"("p_run_id" "uuid", "p_input" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_agent_material"("p_run_id" "uuid", "p_input" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_agent_material"("p_run_id" "uuid", "p_input" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_agent_material"("p_run_id" "uuid", "p_input" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_agent_plausibility"("p_run_id" "uuid", "p_input" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_agent_plausibility"("p_run_id" "uuid", "p_input" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_agent_plausibility"("p_run_id" "uuid", "p_input" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_agent_zeitpruefer"("p_run_id" "uuid", "p_input" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_agent_zeitpruefer"("p_run_id" "uuid", "p_input" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_agent_zeitpruefer"("p_run_id" "uuid", "p_input" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_approve_intake"("p_approval_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_approve_intake"("p_approval_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_approve_material_order"("p_approval_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_approve_material_order"("p_approval_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_approve_schedule"("p_approval_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_approve_schedule"("p_approval_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_assignment_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_assignment_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_assignment_event"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_commit_staged_longtext"("p_position_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_commit_staged_longtext"("p_position_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_end_project_session"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_end_project_session"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_end_project_session"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_export_training_data"("p_min_quality" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_export_training_data"("p_min_quality" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_export_training_data"("p_min_quality" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_fetch_unrouted_file_events"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_fetch_unrouted_file_events"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_fetch_unrouted_file_events"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_file_intake_to_folder"("p_project_id" "uuid", "p_storage_path" "text", "p_file_name" "text", "p_mime_type" "text", "p_file_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_file_intake_to_folder"("p_project_id" "uuid", "p_storage_path" "text", "p_file_name" "text", "p_mime_type" "text", "p_file_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_file_intake_to_folder"("p_project_id" "uuid", "p_storage_path" "text", "p_file_name" "text", "p_mime_type" "text", "p_file_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_get_offer_assistant_context"("p_offer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_get_offer_assistant_context"("p_offer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_godmode_learner"("p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_godmode_learner"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_godmode_report"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_godmode_report"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_godmode_report"("p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_learn_from_completed_phase"("p_phase_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_learn_from_completed_phase"("p_phase_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_learn_from_completed_phase"("p_phase_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_learn_from_offer_sessions"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_learn_from_offer_sessions"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_learn_from_offer_sessions"("p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_learn_schedule"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_learn_schedule"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_learn_schedule"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_map_trade_from_catalog"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_map_trade_from_catalog"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_map_trade_from_catalog"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_match_project_by_reference"("p_project_reference" "text", "p_delivery_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_match_project_by_reference"("p_project_reference" "text", "p_delivery_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_match_project_by_reference"("p_project_reference" "text", "p_delivery_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_match_project_by_text"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_match_project_by_text"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_match_project_by_text"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_pipeline_complete"("p_run_id" "uuid", "p_result_summary" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_pipeline_complete"("p_run_id" "uuid", "p_result_summary" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_pipeline_complete"("p_run_id" "uuid", "p_result_summary" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_pipeline_start"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_pipeline_start"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_pipeline_start"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_pipeline_step_complete"("p_step_id" "uuid", "p_output" "jsonb", "p_status" "public"."pipeline_step_status", "p_warnings" "text"[], "p_errors" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_pipeline_step_complete"("p_step_id" "uuid", "p_output" "jsonb", "p_status" "public"."pipeline_step_status", "p_warnings" "text"[], "p_errors" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_pipeline_step_complete"("p_step_id" "uuid", "p_output" "jsonb", "p_status" "public"."pipeline_step_status", "p_warnings" "text"[], "p_errors" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_pipeline_step_start"("p_run_id" "uuid", "p_agent_name" "text", "p_step_order" integer, "p_input" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_pipeline_step_start"("p_run_id" "uuid", "p_agent_name" "text", "p_step_order" integer, "p_input" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_pipeline_step_start"("p_run_id" "uuid", "p_agent_name" "text", "p_step_order" integer, "p_input" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_reject_intake"("p_approval_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_reject_intake"("p_approval_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_request_agent_task"("p_agent_function" "text", "p_agent_input" "jsonb", "p_project_id" "uuid", "p_idempotency_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_request_agent_task"("p_agent_function" "text", "p_agent_input" "jsonb", "p_project_id" "uuid", "p_idempotency_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_request_agent_task"("p_agent_function" "text", "p_agent_input" "jsonb", "p_project_id" "uuid", "p_idempotency_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_resolve_duplicate_check"("p_approval_id" "uuid", "p_decision" "text", "p_decided_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_resolve_duplicate_check"("p_approval_id" "uuid", "p_decision" "text", "p_decided_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_resolve_duplicate_check"("p_approval_id" "uuid", "p_decision" "text", "p_decided_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_route_file_to_folder"("p_project_id" "uuid", "p_doc_type" "text", "p_file_name" "text", "p_storage_path" "text", "p_mime_type" "text", "p_file_size_bytes" integer, "p_source_ref" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_route_file_to_folder"("p_project_id" "uuid", "p_doc_type" "text", "p_file_name" "text", "p_storage_path" "text", "p_mime_type" "text", "p_file_size_bytes" integer, "p_source_ref" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_route_file_to_folder"("p_project_id" "uuid", "p_doc_type" "text", "p_file_name" "text", "p_storage_path" "text", "p_mime_type" "text", "p_file_size_bytes" integer, "p_source_ref" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_site_captures_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_site_captures_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_site_captures_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_start_project_session"("p_project_id" "uuid", "p_user_id" "uuid", "p_device_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_start_project_session"("p_project_id" "uuid", "p_user_id" "uuid", "p_device_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_start_project_session"("p_project_id" "uuid", "p_user_id" "uuid", "p_device_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_trades_auto_alias"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_trades_auto_alias"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_trades_auto_alias"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_catalog_prices_from_offer"("p_offer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_catalog_prices_from_offer"("p_offer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_catalog_prices_from_offer"("p_offer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_user_has_project_access"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_user_has_project_access"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_user_has_project_access"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_user_team_member_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_user_team_member_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_user_team_member_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_wabs_create_site_inspection"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_wabs_create_site_inspection"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_wabs_create_site_inspection"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_all_project_materials"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_all_project_materials"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_all_project_materials"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_change_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_change_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_change_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_customer_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_display_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_display_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_display_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_offer_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_offer_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_offer_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_offer_pdf"("p_offer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_offer_pdf"("p_offer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_offer_pdf"("p_offer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_packing_list"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_packing_list"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_packing_list"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_materials"("p_project_id" "uuid", "p_offer_position_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_materials"("p_project_id" "uuid", "p_offer_position_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_materials"("p_project_id" "uuid", "p_offer_position_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_schedule"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_schedule"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_schedule"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_protocol_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_protocol_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_protocol_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_sales_invoice_pdf"("p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_sales_invoice_pdf"("p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_sales_invoice_pdf"("p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_5_second_project_check"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_5_second_project_check"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_5_second_project_check"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cheapest_supplier"("p_internal_sku" "text", "p_internal_name" "text", "p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cheapest_supplier"("p_internal_sku" "text", "p_internal_name" "text", "p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cheapest_supplier"("p_internal_sku" "text", "p_internal_name" "text", "p_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_setting"("p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_setting"("p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_setting"("p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_folder_from_registry"("p_folder_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_folder_from_registry"("p_folder_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_folder_from_registry"("p_folder_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inspection_protocol_details"("p_protocol_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_inspection_protocol_details"("p_protocol_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inspection_protocol_details"("p_protocol_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lexware_sync_queue"("p_entity_type" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lexware_sync_queue"("p_entity_type" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lexware_sync_queue"("p_entity_type" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_marge_dashboard"("p_include_completed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_marge_dashboard"("p_include_completed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marge_dashboard"("p_include_completed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_matching_bank_transactions"("p_invoice_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_matching_bank_transactions"("p_invoice_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_matching_bank_transactions"("p_invoice_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monteur_auftrag"("p_project_id" "uuid", "p_trade" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_monteur_auftrag"("p_project_id" "uuid", "p_trade" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monteur_auftrag"("p_project_id" "uuid", "p_trade" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monteur_auftrag_data"("p_project_id" "uuid", "p_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_monteur_auftrag_data"("p_project_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monteur_auftrag_data"("p_project_id" "uuid", "p_language" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_open_bid_requests"("p_days_ahead" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_open_bid_requests"("p_days_ahead" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_open_bid_requests"("p_days_ahead" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_zb_protocol"("p_project_id" "uuid", "p_inspector_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_zb_protocol"("p_project_id" "uuid", "p_inspector_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_zb_protocol"("p_project_id" "uuid", "p_inspector_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_parent_info"("p_folder_type" "text", "p_year" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_parent_info"("p_folder_type" "text", "p_year" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parent_info"("p_folder_type" "text", "p_year" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_position_context"("p_position_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_position_context"("p_position_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_position_context"("p_position_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_positions_for_language"("p_position_ids" "uuid"[], "p_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_positions_for_language"("p_position_ids" "uuid"[], "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_positions_for_language"("p_position_ids" "uuid"[], "p_language" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_activities"("p_project_id" "uuid", "p_limit" integer, "p_offset" integer, "p_activity_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_activities"("p_project_id" "uuid", "p_limit" integer, "p_offset" integer, "p_activity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_activities"("p_project_id" "uuid", "p_limit" integer, "p_offset" integer, "p_activity_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_change_orders"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_change_orders"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_change_orders"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_materials_summary"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_materials_summary"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_materials_summary"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_packing_list"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_packing_list"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_packing_list"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_saga_order_payload"("_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_saga_order_payload"("_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_saga_order_payload"("_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sub_auftrag_data"("p_project_id" "uuid", "p_position_ids" "uuid"[], "p_supplier_id" "uuid", "p_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sub_auftrag_data"("p_project_id" "uuid", "p_position_ids" "uuid"[], "p_supplier_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sub_auftrag_data"("p_project_id" "uuid", "p_position_ids" "uuid"[], "p_supplier_id" "uuid", "p_language" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_capacity"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_capacity"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_capacity"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "postgres";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "anon";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."import_bank_transaction"("p_account_iban" "text", "p_booking_date" "date", "p_amount" numeric, "p_counterpart_name" "text", "p_counterpart_iban" "text", "p_reference_text" "text", "p_transaction_type" "text", "p_external_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."import_bank_transaction"("p_account_iban" "text", "p_booking_date" "date", "p_amount" numeric, "p_counterpart_name" "text", "p_counterpart_iban" "text", "p_reference_text" "text", "p_transaction_type" "text", "p_external_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_bank_transaction"("p_account_iban" "text", "p_booking_date" "date", "p_amount" numeric, "p_counterpart_name" "text", "p_counterpart_iban" "text", "p_reference_text" "text", "p_transaction_type" "text", "p_external_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "postgres";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "anon";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_event_processed"("p_consumer_name" "text", "p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_event_processed"("p_consumer_name" "text", "p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_event_processed"("p_consumer_name" "text", "p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."learn_material_choice"() TO "anon";
GRANT ALL ON FUNCTION "public"."learn_material_choice"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."learn_material_choice"() TO "service_role";



GRANT ALL ON FUNCTION "public"."learn_product_selection"() TO "anon";
GRANT ALL ON FUNCTION "public"."learn_product_selection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."learn_product_selection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."list_baugenius_rpcs"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_baugenius_rpcs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_baugenius_rpcs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_bank_import"("p_filename" "text", "p_format" "text", "p_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."log_bank_import"("p_filename" "text", "p_format" "text", "p_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_bank_import"("p_filename" "text", "p_format" "text", "p_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text", "p_dedupe_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text", "p_dedupe_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_event"("p_event_type" "public"."event_type", "p_project_id" "uuid", "p_source_system" "text", "p_payload" "jsonb", "p_correlation_id" "uuid", "p_source_flow" "text", "p_dedupe_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_event_as_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_event_as_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_event_as_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_event_processed"("p_consumer_name" "text", "p_event_id" "uuid", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_event_processed"("p_consumer_name" "text", "p_event_id" "uuid", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_event_processed"("p_consumer_name" "text", "p_event_id" "uuid", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_invoice_paid"("p_invoice_id" "uuid", "p_paid_amount" numeric, "p_paid_at" timestamp with time zone, "p_bank_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_invoice_paid"("p_invoice_id" "uuid", "p_paid_amount" numeric, "p_paid_at" timestamp with time zone, "p_bank_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_invoice_paid"("p_invoice_id" "uuid", "p_paid_amount" numeric, "p_paid_at" timestamp with time zone, "p_bank_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_lexware_synced"("p_entity_type" "text", "p_entity_id" "uuid", "p_lexware_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_lexware_synced"("p_entity_type" "text", "p_entity_id" "uuid", "p_lexware_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_lexware_synced"("p_entity_type" "text", "p_entity_id" "uuid", "p_lexware_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_catalog_position"("p_contractor_code" "text", "p_position_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."match_catalog_position"("p_contractor_code" "text", "p_position_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_catalog_position"("p_contractor_code" "text", "p_position_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_catalog_position"("p_title" "text", "p_trade" "text", "p_contractor_code" "text", "p_position_code" "text", "p_similarity_threshold" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."match_catalog_position"("p_title" "text", "p_trade" "text", "p_contractor_code" "text", "p_position_code" "text", "p_similarity_threshold" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_catalog_position"("p_title" "text", "p_trade" "text", "p_contractor_code" "text", "p_position_code" "text", "p_similarity_threshold" numeric) TO "service_role";






GRANT ALL ON FUNCTION "public"."normalize_room_name"("raw_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_room_name"("raw_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_room_name"("raw_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "postgres";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "anon";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_project_material_needs"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_project_material_needs"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_project_material_needs"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_invoice_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_payment_reference" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_invoice_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_payment_reference" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_invoice_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_payment_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_price_from_invoice"("p_supplier_article_id" "uuid", "p_unit_price" numeric, "p_invoice_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_price_from_invoice"("p_supplier_article_id" "uuid", "p_unit_price" numeric, "p_invoice_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_price_from_invoice"("p_supplier_article_id" "uuid", "p_unit_price" numeric, "p_invoice_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_protocol_stats"("p_protocol_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_protocol_stats"("p_protocol_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_protocol_stats"("p_protocol_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_folder"("p_folder_type" "text", "p_folder_key" "text", "p_drive_folder_id" "text", "p_parent_folder_id" "text", "p_full_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."register_folder"("p_folder_type" "text", "p_folder_key" "text", "p_drive_folder_id" "text", "p_parent_folder_id" "text", "p_full_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_folder"("p_folder_type" "text", "p_folder_key" "text", "p_drive_folder_id" "text", "p_parent_folder_id" "text", "p_full_path" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_change_order"("p_change_order_id" "uuid", "p_rejected_by" "text", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_change_order"("p_change_order_id" "uuid", "p_rejected_by" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_monteur_auftrag_pdf"("p_project_id" "uuid", "p_trade" "text", "p_requested_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_monteur_auftrag_pdf"("p_project_id" "uuid", "p_trade" "text", "p_requested_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_monteur_auftrag_pdf"("p_project_id" "uuid", "p_trade" "text", "p_requested_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reschedule_project"("p_project_id" "uuid", "p_new_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."reschedule_project"("p_project_id" "uuid", "p_new_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reschedule_project"("p_project_id" "uuid", "p_new_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_invoice_status"("p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reset_invoice_status"("p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_invoice_status"("p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_stale_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_stale_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_stale_processing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_trade_id"("p_trade_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_trade_id"("p_trade_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_trade_id"("p_trade_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_position_status"("p_position_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revert_position_status"("p_position_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_position_status"("p_position_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_positions"("search_term" "text", "limit_results" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_positions"("search_term" "text", "limit_results" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_positions"("search_term" "text", "limit_results" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_products"("p_query" "text", "p_material_type" "text", "p_trade" "text", "p_supplier_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_products"("p_query" "text", "p_material_type" "text", "p_trade" "text", "p_supplier_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_products"("p_query" "text", "p_material_type" "text", "p_trade" "text", "p_supplier_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_change_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_change_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_change_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_position_prices"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_position_prices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_position_prices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_position_texts"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_position_texts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_position_texts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_positions"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_positions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timestamp_catalog_positions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."skip_receipt_processing"("p_queue_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."skip_receipt_processing"("p_queue_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."skip_receipt_processing"("p_queue_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_change_order"("p_change_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_change_order"("p_change_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_change_order"("p_change_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."suggest_purchase_orders"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."suggest_purchase_orders"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggest_purchase_orders"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_auto_apply_material_to_siblings"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_auto_apply_material_to_siblings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_auto_apply_material_to_siblings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_fn_godmode_phase_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_fn_godmode_phase_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_fn_godmode_phase_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_fn_sync_catalog_price"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_fn_sync_catalog_price"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_fn_sync_catalog_price"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_recalc_on_surcharge_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_recalc_on_surcharge_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_recalc_on_surcharge_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bank_accounts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bank_accounts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bank_accounts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_classified_emails_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_classified_emails_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_classified_emails_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_defect_status"("p_defect_id" "uuid", "p_status" "text", "p_comment" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_defect_status"("p_defect_id" "uuid", "p_status" "text", "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_defect_status"("p_defect_id" "uuid", "p_status" "text", "p_comment" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inspection_defects_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inspection_defects_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inspection_defects_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inspection_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inspection_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inspection_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invoice_subtotal"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invoice_subtotal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invoice_subtotal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_offer_missing_prices"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_offer_missing_prices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_offer_missing_prices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_offer_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_offer_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_offer_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_position"("p_position_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_position_number" integer, "p_internal_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_position"("p_position_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_position_number" integer, "p_internal_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_position"("p_position_id" "uuid", "p_title" "text", "p_description" "text", "p_unit" "text", "p_unit_price" numeric, "p_quantity" numeric, "p_trade" "text", "p_is_optional" boolean, "p_position_number" integer, "p_internal_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_position_progress"("p_position_id" "uuid", "p_progress_percent" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_position_progress"("p_position_id" "uuid", "p_progress_percent" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_position_progress"("p_position_id" "uuid", "p_progress_percent" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project"("p_project_id" "uuid", "p_name" "text", "p_status" "public"."project_status", "p_client_id" "uuid", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_notes" "text", "p_assigned_team" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_project"("p_project_id" "uuid", "p_name" "text", "p_status" "public"."project_status", "p_client_id" "uuid", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_notes" "text", "p_assigned_team" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project"("p_project_id" "uuid", "p_name" "text", "p_status" "public"."project_status", "p_client_id" "uuid", "p_object_street" "text", "p_object_zip" "text", "p_object_city" "text", "p_object_floor" "text", "p_object_type" "text", "p_object_size_sqm" numeric, "p_planned_start" "date", "p_planned_end" "date", "p_notes" "text", "p_assigned_team" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_protocol_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_protocol_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_protocol_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_invoice"("p_invoice_id" "uuid", "p_invoice_number" "text", "p_subtotal_net" numeric, "p_vat_percent" numeric, "p_invoice_date" "date", "p_due_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_invoice"("p_invoice_id" "uuid", "p_invoice_number" "text", "p_subtotal_net" numeric, "p_vat_percent" numeric, "p_invoice_date" "date", "p_due_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_invoice"("p_invoice_id" "uuid", "p_invoice_number" "text", "p_subtotal_net" numeric, "p_vat_percent" numeric, "p_invoice_date" "date", "p_due_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_room_measurements_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_room_measurements_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_room_measurements_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_schedule_phase_cost"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_schedule_phase_cost"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_schedule_phase_cost"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_section"("p_section_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_section"("p_section_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_section"("p_section_id" "uuid", "p_title" "text", "p_trade" "text", "p_section_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_section_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_section_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_section_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_room_measurement"("p_project_id" "uuid", "p_floor_name" "text", "p_room_name" "text", "p_floor_area_m2" numeric, "p_wall_area_m2" numeric, "p_wall_area_with_openings_m2" numeric, "p_room_height_m" numeric, "p_volume_m3" numeric, "p_perimeter_m" numeric, "p_ceiling_perimeter_m" numeric, "p_door_area_m2" numeric, "p_window_area_m2" numeric, "p_source_file" "text", "p_source_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_room_measurement"("p_project_id" "uuid", "p_floor_name" "text", "p_room_name" "text", "p_floor_area_m2" numeric, "p_wall_area_m2" numeric, "p_wall_area_with_openings_m2" numeric, "p_room_height_m" numeric, "p_volume_m3" numeric, "p_perimeter_m" numeric, "p_ceiling_perimeter_m" numeric, "p_door_area_m2" numeric, "p_window_area_m2" numeric, "p_source_file" "text", "p_source_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_room_measurement"("p_project_id" "uuid", "p_floor_name" "text", "p_room_name" "text", "p_floor_area_m2" numeric, "p_wall_area_m2" numeric, "p_wall_area_with_openings_m2" numeric, "p_room_height_m" numeric, "p_volume_m3" numeric, "p_perimeter_m" numeric, "p_ceiling_perimeter_m" numeric, "p_door_area_m2" numeric, "p_window_area_m2" numeric, "p_source_file" "text", "p_source_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."write_calculated_materials"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."write_calculated_materials"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."write_calculated_materials"("p_project_id" "uuid") TO "service_role";






























GRANT ALL ON TABLE "public"."absences" TO "anon";
GRANT ALL ON TABLE "public"."absences" TO "authenticated";
GRANT ALL ON TABLE "public"."absences" TO "service_role";



GRANT ALL ON TABLE "public"."agent_api_keys" TO "anon";
GRANT ALL ON TABLE "public"."agent_api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."agent_messages" TO "anon";
GRANT ALL ON TABLE "public"."agent_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_messages" TO "service_role";



GRANT ALL ON TABLE "public"."agent_observations" TO "anon";
GRANT ALL ON TABLE "public"."agent_observations" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_observations" TO "service_role";



GRANT ALL ON TABLE "public"."agent_threads" TO "anon";
GRANT ALL ON TABLE "public"."agent_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_threads" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_logs" TO "service_role";



GRANT ALL ON TABLE "public"."approvals" TO "anon";
GRANT ALL ON TABLE "public"."approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."approvals" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."bank_import_logs" TO "anon";
GRANT ALL ON TABLE "public"."bank_import_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_import_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_transactions" TO "anon";
GRANT ALL ON TABLE "public"."bank_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_aliases" TO "anon";
GRANT ALL ON TABLE "public"."catalog_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_discount_rules" TO "anon";
GRANT ALL ON TABLE "public"."catalog_discount_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_discount_rules" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_material_mapping" TO "anon";
GRANT ALL ON TABLE "public"."catalog_material_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_material_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_position_prices" TO "anon";
GRANT ALL ON TABLE "public"."catalog_position_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_position_prices" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_position_products" TO "anon";
GRANT ALL ON TABLE "public"."catalog_position_products" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_position_products" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_position_texts" TO "anon";
GRANT ALL ON TABLE "public"."catalog_position_texts" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_position_texts" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_positions" TO "anon";
GRANT ALL ON TABLE "public"."catalog_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_positions" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_positions_v2" TO "anon";
GRANT ALL ON TABLE "public"."catalog_positions_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_positions_v2" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_supplier_mapping" TO "anon";
GRANT ALL ON TABLE "public"."catalog_supplier_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_supplier_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_versions" TO "anon";
GRANT ALL ON TABLE "public"."catalog_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_versions" TO "service_role";



GRANT ALL ON TABLE "public"."catalogs" TO "anon";
GRANT ALL ON TABLE "public"."catalogs" TO "authenticated";
GRANT ALL ON TABLE "public"."catalogs" TO "service_role";



GRANT ALL ON TABLE "public"."change_order_evidence" TO "anon";
GRANT ALL ON TABLE "public"."change_order_evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."change_order_evidence" TO "service_role";



GRANT ALL ON TABLE "public"."change_order_items" TO "anon";
GRANT ALL ON TABLE "public"."change_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."change_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."change_orders" TO "anon";
GRANT ALL ON TABLE "public"."change_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."change_orders" TO "service_role";



GRANT ALL ON TABLE "public"."chat_history" TO "anon";
GRANT ALL ON TABLE "public"."chat_history" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_history" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."classified_emails" TO "anon";
GRANT ALL ON TABLE "public"."classified_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."classified_emails" TO "service_role";



GRANT ALL ON TABLE "public"."client_aliases" TO "anon";
GRANT ALL ON TABLE "public"."client_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."client_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."client_product_defaults" TO "anon";
GRANT ALL ON TABLE "public"."client_product_defaults" TO "authenticated";
GRANT ALL ON TABLE "public"."client_product_defaults" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."contractors" TO "anon";
GRANT ALL ON TABLE "public"."contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."contractors" TO "service_role";



GRANT ALL ON TABLE "public"."custom_positions" TO "anon";
GRANT ALL ON TABLE "public"."custom_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_positions" TO "service_role";



GRANT ALL ON TABLE "public"."defect_comments" TO "anon";
GRANT ALL ON TABLE "public"."defect_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."defect_comments" TO "service_role";



GRANT ALL ON TABLE "public"."defects" TO "anon";
GRANT ALL ON TABLE "public"."defects" TO "authenticated";
GRANT ALL ON TABLE "public"."defects" TO "service_role";



GRANT ALL ON TABLE "public"."dispatch_errors" TO "anon";
GRANT ALL ON TABLE "public"."dispatch_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."dispatch_errors" TO "service_role";



GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."drive_folder_registry" TO "anon";
GRANT ALL ON TABLE "public"."drive_folder_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."drive_folder_registry" TO "service_role";



GRANT ALL ON TABLE "public"."drive_folder_templates" TO "anon";
GRANT ALL ON TABLE "public"."drive_folder_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."drive_folder_templates" TO "service_role";



GRANT ALL ON TABLE "public"."email_processing_attempts" TO "anon";
GRANT ALL ON TABLE "public"."email_processing_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."email_processing_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."event_consumer_receipts" TO "anon";
GRANT ALL ON TABLE "public"."event_consumer_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."event_consumer_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."event_routing" TO "anon";
GRANT ALL ON TABLE "public"."event_routing" TO "authenticated";
GRANT ALL ON TABLE "public"."event_routing" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_categories" TO "anon";
GRANT ALL ON TABLE "public"."feedback_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_categories" TO "service_role";



GRANT ALL ON TABLE "public"."flow_logs" TO "anon";
GRANT ALL ON TABLE "public"."flow_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."flow_logs" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_attachments" TO "anon";
GRANT ALL ON TABLE "public"."inspection_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_attendees" TO "anon";
GRANT ALL ON TABLE "public"."inspection_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."inspection_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_defects" TO "anon";
GRANT ALL ON TABLE "public"."inspection_defects" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_defects" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_photos" TO "anon";
GRANT ALL ON TABLE "public"."inspection_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_photos" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_protocol_items" TO "anon";
GRANT ALL ON TABLE "public"."inspection_protocol_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_protocol_items" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_protocols" TO "anon";
GRANT ALL ON TABLE "public"."inspection_protocols" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_protocols" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_payments" TO "anon";
GRANT ALL ON TABLE "public"."invoice_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_payments" TO "service_role";



GRANT ALL ON TABLE "public"."jumbo_template_items" TO "anon";
GRANT ALL ON TABLE "public"."jumbo_template_items" TO "authenticated";
GRANT ALL ON TABLE "public"."jumbo_template_items" TO "service_role";



GRANT ALL ON TABLE "public"."jumbo_template_sections" TO "anon";
GRANT ALL ON TABLE "public"."jumbo_template_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."jumbo_template_sections" TO "service_role";



GRANT ALL ON TABLE "public"."jumbo_templates" TO "anon";
GRANT ALL ON TABLE "public"."jumbo_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."jumbo_templates" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."labor_rates" TO "anon";
GRANT ALL ON TABLE "public"."labor_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."labor_rates" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_positions" TO "anon";
GRANT ALL ON TABLE "public"."legacy_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_positions" TO "service_role";



GRANT ALL ON TABLE "public"."lexware_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."lexware_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."lexware_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."llm_providers" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."llm_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_providers" TO "service_role";



GRANT ALL ON TABLE "public"."material_consumption_rates" TO "anon";
GRANT ALL ON TABLE "public"."material_consumption_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."material_consumption_rates" TO "service_role";



GRANT ALL ON TABLE "public"."measurements" TO "anon";
GRANT ALL ON TABLE "public"."measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."measurements" TO "service_role";



GRANT ALL ON TABLE "public"."memory_entries" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."memory_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_entries" TO "service_role";



GRANT ALL ON TABLE "public"."offer_attachments" TO "anon";
GRANT ALL ON TABLE "public"."offer_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."offer_history" TO "anon";
GRANT ALL ON TABLE "public"."offer_history" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."offer_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."offer_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."offer_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."offer_sections" TO "anon";
GRANT ALL ON TABLE "public"."offer_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_sections" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."outbound_emails" TO "anon";
GRANT ALL ON TABLE "public"."outbound_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."outbound_emails" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_runs" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_runs" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_steps" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_steps" TO "service_role";



GRANT ALL ON TABLE "public"."position_assignments" TO "anon";
GRANT ALL ON TABLE "public"."position_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."position_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."position_calc_equipment" TO "anon";
GRANT ALL ON TABLE "public"."position_calc_equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."position_calc_equipment" TO "service_role";



GRANT ALL ON TABLE "public"."position_calc_labor" TO "anon";
GRANT ALL ON TABLE "public"."position_calc_labor" TO "authenticated";
GRANT ALL ON TABLE "public"."position_calc_labor" TO "service_role";



GRANT ALL ON TABLE "public"."position_calc_materials" TO "anon";
GRANT ALL ON TABLE "public"."position_calc_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."position_calc_materials" TO "service_role";



GRANT ALL ON TABLE "public"."position_calc_subcontractor" TO "anon";
GRANT ALL ON TABLE "public"."position_calc_subcontractor" TO "authenticated";
GRANT ALL ON TABLE "public"."position_calc_subcontractor" TO "service_role";



GRANT ALL ON TABLE "public"."position_material_requirements" TO "anon";
GRANT ALL ON TABLE "public"."position_material_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."position_material_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."position_usage_stats" TO "anon";
GRANT ALL ON TABLE "public"."position_usage_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."position_usage_stats" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."products_backup_20260119" TO "anon";
GRANT ALL ON TABLE "public"."products_backup_20260119" TO "authenticated";
GRANT ALL ON TABLE "public"."products_backup_20260119" TO "service_role";



GRANT ALL ON TABLE "public"."project_activities" TO "anon";
GRANT ALL ON TABLE "public"."project_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."project_activities" TO "service_role";



GRANT ALL ON TABLE "public"."project_assignments" TO "anon";
GRANT ALL ON TABLE "public"."project_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."project_drive_folders" TO "anon";
GRANT ALL ON TABLE "public"."project_drive_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."project_drive_folders" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON TABLE "public"."project_folders" TO "anon";
GRANT ALL ON TABLE "public"."project_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."project_folders" TO "service_role";



GRANT ALL ON TABLE "public"."project_material_needs" TO "anon";
GRANT ALL ON TABLE "public"."project_material_needs" TO "authenticated";
GRANT ALL ON TABLE "public"."project_material_needs" TO "service_role";



GRANT ALL ON TABLE "public"."project_materials" TO "anon";
GRANT ALL ON TABLE "public"."project_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."project_materials" TO "service_role";



GRANT ALL ON TABLE "public"."project_messages" TO "anon";
GRANT ALL ON TABLE "public"."project_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."project_messages" TO "service_role";



GRANT ALL ON TABLE "public"."project_packing_list" TO "anon";
GRANT ALL ON TABLE "public"."project_packing_list" TO "authenticated";
GRANT ALL ON TABLE "public"."project_packing_list" TO "service_role";



GRANT ALL ON TABLE "public"."project_room_measurements" TO "anon";
GRANT ALL ON TABLE "public"."project_room_measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."project_room_measurements" TO "service_role";



GRANT ALL ON TABLE "public"."project_sessions" TO "anon";
GRANT ALL ON TABLE "public"."project_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."protocol_signatures" TO "anon";
GRANT ALL ON TABLE "public"."protocol_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."protocol_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."protocols" TO "anon";
GRANT ALL ON TABLE "public"."protocols" TO "authenticated";
GRANT ALL ON TABLE "public"."protocols" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_invoices" TO "anon";
GRANT ALL ON TABLE "public"."purchase_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_invoices_backup_20260112" TO "anon";
GRANT ALL ON TABLE "public"."purchase_invoices_backup_20260112" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_invoices_backup_20260112" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_order_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."receipt_queue" TO "anon";
GRANT ALL ON TABLE "public"."receipt_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."receipt_queue" TO "service_role";



GRANT ALL ON TABLE "public"."richtzeitwerte" TO "anon";
GRANT ALL ON TABLE "public"."richtzeitwerte" TO "authenticated";
GRANT ALL ON TABLE "public"."richtzeitwerte" TO "service_role";



GRANT ALL ON TABLE "public"."saga_order_positions" TO "anon";
GRANT ALL ON TABLE "public"."saga_order_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."saga_order_positions" TO "service_role";



GRANT ALL ON TABLE "public"."saga_order_texts" TO "anon";
GRANT ALL ON TABLE "public"."saga_order_texts" TO "authenticated";
GRANT ALL ON TABLE "public"."saga_order_texts" TO "service_role";



GRANT ALL ON TABLE "public"."saga_orders" TO "anon";
GRANT ALL ON TABLE "public"."saga_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."saga_orders" TO "service_role";



GRANT ALL ON TABLE "public"."sales_invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales_invoices" TO "anon";
GRANT ALL ON TABLE "public"."sales_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_defaults" TO "anon";
GRANT ALL ON TABLE "public"."schedule_defaults" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_defaults" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_learning" TO "anon";
GRANT ALL ON TABLE "public"."schedule_learning" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_learning" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_phases" TO "anon";
GRANT ALL ON TABLE "public"."schedule_phases" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_phases" TO "service_role";



GRANT ALL ON TABLE "public"."site_captures" TO "anon";
GRANT ALL ON TABLE "public"."site_captures" TO "authenticated";
GRANT ALL ON TABLE "public"."site_captures" TO "service_role";



GRANT ALL ON TABLE "public"."subcontractors" TO "anon";
GRANT ALL ON TABLE "public"."subcontractors" TO "authenticated";
GRANT ALL ON TABLE "public"."subcontractors" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_aliases" TO "anon";
GRANT ALL ON TABLE "public"."supplier_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_article_prices" TO "anon";
GRANT ALL ON TABLE "public"."supplier_article_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_article_prices" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_articles" TO "anon";
GRANT ALL ON TABLE "public"."supplier_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_articles" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."team_members_public" TO "anon";
GRANT ALL ON TABLE "public"."team_members_public" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members_public" TO "service_role";



GRANT ALL ON TABLE "public"."text_blocks" TO "anon";
GRANT ALL ON TABLE "public"."text_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."text_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."time_entries" TO "anon";
GRANT ALL ON TABLE "public"."time_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."time_entries" TO "service_role";



GRANT ALL ON TABLE "public"."trade_aliases" TO "anon";
GRANT ALL ON TABLE "public"."trade_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."trade_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."trade_material_types" TO "anon";
GRANT ALL ON TABLE "public"."trade_material_types" TO "authenticated";
GRANT ALL ON TABLE "public"."trade_material_types" TO "service_role";



GRANT ALL ON TABLE "public"."trade_sequence_rules" TO "anon";
GRANT ALL ON TABLE "public"."trade_sequence_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."trade_sequence_rules" TO "service_role";



GRANT ALL ON TABLE "public"."trades" TO "anon";
GRANT ALL ON TABLE "public"."trades" TO "authenticated";
GRANT ALL ON TABLE "public"."trades" TO "service_role";



GRANT ALL ON TABLE "public"."unanswered_questions" TO "anon";
GRANT ALL ON TABLE "public"."unanswered_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."unanswered_questions" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."v_approval_audit" TO "anon";
GRANT ALL ON TABLE "public"."v_approval_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."v_approval_audit" TO "service_role";



GRANT ALL ON TABLE "public"."v_assignments_by_subcontractor" TO "anon";
GRANT ALL ON TABLE "public"."v_assignments_by_subcontractor" TO "authenticated";
GRANT ALL ON TABLE "public"."v_assignments_by_subcontractor" TO "service_role";



GRANT ALL ON TABLE "public"."v_bank_transactions_unmatched" TO "anon";
GRANT ALL ON TABLE "public"."v_bank_transactions_unmatched" TO "authenticated";
GRANT ALL ON TABLE "public"."v_bank_transactions_unmatched" TO "service_role";



GRANT ALL ON TABLE "public"."v_catalog_positions_active" TO "anon";
GRANT ALL ON TABLE "public"."v_catalog_positions_active" TO "authenticated";
GRANT ALL ON TABLE "public"."v_catalog_positions_active" TO "service_role";



GRANT ALL ON TABLE "public"."v_catalog_with_translations" TO "anon";
GRANT ALL ON TABLE "public"."v_catalog_with_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."v_catalog_with_translations" TO "service_role";



GRANT ALL ON TABLE "public"."v_cheapest_supplier" TO "anon";
GRANT ALL ON TABLE "public"."v_cheapest_supplier" TO "authenticated";
GRANT ALL ON TABLE "public"."v_cheapest_supplier" TO "service_role";



GRANT ALL ON TABLE "public"."v_current_supplier_prices" TO "anon";
GRANT ALL ON TABLE "public"."v_current_supplier_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."v_current_supplier_prices" TO "service_role";



GRANT ALL ON TABLE "public"."v_direct_costs_monthly" TO "anon";
GRANT ALL ON TABLE "public"."v_direct_costs_monthly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_direct_costs_monthly" TO "service_role";



GRANT ALL ON TABLE "public"."v_feedback_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_feedback_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_feedback_stats" TO "service_role";



GRANT ALL ON TABLE "public"."v_finance_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_finance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_finance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_steps" TO "service_role";



GRANT ALL ON TABLE "public"."v_global_workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."v_global_workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."v_global_workflow_steps" TO "service_role";



GRANT ALL ON TABLE "public"."v_inspection_protocols_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_inspection_protocols_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_inspection_protocols_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_margin_analysis" TO "anon";
GRANT ALL ON TABLE "public"."v_margin_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."v_margin_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."v_material_order_by_supplier" TO "anon";
GRANT ALL ON TABLE "public"."v_material_order_by_supplier" TO "authenticated";
GRANT ALL ON TABLE "public"."v_material_order_by_supplier" TO "service_role";



GRANT ALL ON TABLE "public"."v_open_measurements" TO "anon";
GRANT ALL ON TABLE "public"."v_open_measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."v_open_measurements" TO "service_role";



GRANT ALL ON TABLE "public"."v_open_purchase_invoices" TO "anon";
GRANT ALL ON TABLE "public"."v_open_purchase_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."v_open_purchase_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."v_open_sales_invoices" TO "anon";
GRANT ALL ON TABLE "public"."v_open_sales_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."v_open_sales_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."v_overhead_costs_monthly" TO "anon";
GRANT ALL ON TABLE "public"."v_overhead_costs_monthly" TO "authenticated";
GRANT ALL ON TABLE "public"."v_overhead_costs_monthly" TO "service_role";



GRANT ALL ON TABLE "public"."v_overhead_rate" TO "anon";
GRANT ALL ON TABLE "public"."v_overhead_rate" TO "authenticated";
GRANT ALL ON TABLE "public"."v_overhead_rate" TO "service_role";



GRANT ALL ON TABLE "public"."v_pending_approvals" TO "anon";
GRANT ALL ON TABLE "public"."v_pending_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."v_pending_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."v_positions_with_assignments" TO "anon";
GRANT ALL ON TABLE "public"."v_positions_with_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."v_positions_with_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."v_price_comparison" TO "anon";
GRANT ALL ON TABLE "public"."v_price_comparison" TO "authenticated";
GRANT ALL ON TABLE "public"."v_price_comparison" TO "service_role";



GRANT ALL ON TABLE "public"."v_product_autocomplete" TO "anon";
GRANT ALL ON TABLE "public"."v_product_autocomplete" TO "authenticated";
GRANT ALL ON TABLE "public"."v_product_autocomplete" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_change_orders" TO "anon";
GRANT ALL ON TABLE "public"."v_project_change_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_change_orders" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_defects" TO "anon";
GRANT ALL ON TABLE "public"."v_project_defects" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_defects" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_event_history" TO "anon";
GRANT ALL ON TABLE "public"."v_project_event_history" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_event_history" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_financials" TO "anon";
GRANT ALL ON TABLE "public"."v_project_financials" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_financials" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_material_overview" TO "anon";
GRANT ALL ON TABLE "public"."v_project_material_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_material_overview" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_material_status" TO "anon";
GRANT ALL ON TABLE "public"."v_project_material_status" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_material_status" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_order_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_project_order_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_order_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_progress" TO "anon";
GRANT ALL ON TABLE "public"."v_project_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_progress" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_purchases" TO "anon";
GRANT ALL ON TABLE "public"."v_project_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_timeline" TO "anon";
GRANT ALL ON TABLE "public"."v_project_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."v_project_workflow_status" TO "anon";
GRANT ALL ON TABLE "public"."v_project_workflow_status" TO "authenticated";
GRANT ALL ON TABLE "public"."v_project_workflow_status" TO "service_role";



GRANT ALL ON TABLE "public"."v_purchase_invoices_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_purchase_invoices_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_purchase_invoices_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."v_receipt_queue_current" TO "anon";
GRANT ALL ON TABLE "public"."v_receipt_queue_current" TO "authenticated";
GRANT ALL ON TABLE "public"."v_receipt_queue_current" TO "service_role";



GRANT ALL ON TABLE "public"."v_receipt_queue_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_receipt_queue_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_receipt_queue_stats" TO "service_role";



GRANT ALL ON TABLE "public"."v_supplier_balances" TO "anon";
GRANT ALL ON TABLE "public"."v_supplier_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."v_supplier_balances" TO "service_role";



GRANT ALL ON TABLE "public"."v_team_workload" TO "anon";
GRANT ALL ON TABLE "public"."v_team_workload" TO "authenticated";
GRANT ALL ON TABLE "public"."v_team_workload" TO "service_role";



GRANT ALL ON TABLE "public"."v_unprocessed_events" TO "anon";
GRANT ALL ON TABLE "public"."v_unprocessed_events" TO "authenticated";
GRANT ALL ON TABLE "public"."v_unprocessed_events" TO "service_role";



GRANT ALL ON TABLE "public"."v_workflow_dead_letters" TO "anon";
GRANT ALL ON TABLE "public"."v_workflow_dead_letters" TO "authenticated";
GRANT ALL ON TABLE "public"."v_workflow_dead_letters" TO "service_role";



GRANT ALL ON TABLE "public"."v_workflow_steps_retry" TO "anon";
GRANT ALL ON TABLE "public"."v_workflow_steps_retry" TO "authenticated";
GRANT ALL ON TABLE "public"."v_workflow_steps_retry" TO "service_role";



GRANT ALL ON TABLE "public"."wbs_gwg_catalogs" TO "anon";
GRANT ALL ON TABLE "public"."wbs_gwg_catalogs" TO "authenticated";
GRANT ALL ON TABLE "public"."wbs_gwg_catalogs" TO "service_role";



GRANT ALL ON TABLE "public"."wbs_gwg_positions" TO "anon";
GRANT ALL ON TABLE "public"."wbs_gwg_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."wbs_gwg_positions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































