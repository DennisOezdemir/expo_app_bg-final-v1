# Flow-Bereinigung 2026-03-23

> 16 tote Flows deaktiviert, 9 Event-Routes bereinigt

## Kontext

Forensische Analyse aller 100 n8n Workflows ergab: 16 aktive Flows liefen nie
oder waren durch neuere Systeme ersetzt. Zusaetzlich 9 Event-Routes in der
`event_routing` Tabelle deaktiviert.

## Deaktivierte Flows

### Google Drive (ersetzt durch Supabase Storage + project_folders)

| Flow | ID | Ersetzt durch |
|------|----|--------------|
| M1_04a_Prepare_Drive | kdXetd4FMCISdE4J | DB-Trigger `create_default_project_folders()` (Migration 20260308) |
| M1_04b_Create_Project_Tree | P0ETfL7ZozQKEeM6 | Gleicher DB-Trigger, 9 Ordner automatisch |
| M1_04c_Sync_Initial_Files | RNifQ36TwyKqKxOJ | `fn_file_intake_to_folder()` + `project_files` Tabelle |
| MX_02_Folder_Manager | ZcAhUCdouxnfP4HB | `project_folders` Tabelle + DB-Funktionen |
| M6_01e_Folder_Route | RCBLxz6jItpRNO8Z | MX_08_File_Router (Supabase Storage + DB) |

### M2 Baustelle (Scaffolding, nie implementiert)

| Flow | ID | Grund |
|------|----|-------|
| M2_04_Inspection_Finalize | fkP3zcOg0WCCSmz3I-ivp | Feature nicht implementiert, veraltetes Pattern |
| M2_10_Sub_Order_Generator | Kqp7EajcP0ZmJ-A1-PJUI | Sub-Auftraege nicht implementiert |
| M2_10b_Schedule_Notification | DKR3TSn8J7sa01m3 | Ersetzt durch M2_10a (Approval + Notification) |

### M4 Material (unfertige Event-Kette)

| Flow | ID | Grund |
|------|----|-------|
| M4_03a_Order_Approve | INJkwNIVjAn8TKox | Webhook nie aufgerufen |
| M4_03b_Order_Suggester | UlyBjJpyUsCi2rSs | Upstream-Event existiert nie |
| M4_05_Material_List_Generator | S5gFkRmPiZ0OZYAt_Ap7T | Upstream M4_01 laeuft nie |
| M4_06_Order_Agent | fPY6wSReqQ4ksxlG | Duplikat von M4_03b |
| M4_07_Order_Send | BOkKFTEUCyKagfC0 | Approval-Buttons fuehren ins Leere |

### M6 Lexware (Webhooks nie konfiguriert, Pull-Modell aktiv)

| Flow | ID | Ersetzt durch |
|------|----|--------------|
| M6_04a_Lexware_Webhook_Router | RbUQUOpAzYQ4Lsae | M6_03 (stuendlicher Pull) + M6_10 (taeglicher Abgleich) |
| M6_04b_Lexware_Payment_Handler | ORyFbRUD5EpA6uh0 | M6_10_Lexware_Reconciliation |
| M6_04c_Lexware_Invoice_Sync | HK788ajphACicmwL | M6_03_Lexware_Pull_Sales |

## Deaktivierte Event-Routes

| Event | Target | Grund |
|-------|--------|-------|
| PROJECT_CREATED | M1_04a_Prepare_Drive | Drive tot |
| OFFER_CREATED | M1_04a_Prepare_Drive | Drive tot |
| DRIVE_YEAR_READY | M1_04b_Create_Project_Tree | Drive tot |
| DRIVE_TREE_CREATED | M1_04c_Sync_Initial_Files | Drive tot |
| DRIVE_SETUP_COMPLETE | M1_05_Notification | Drive tot |
| PURCHASE_INVOICE_CREATED | M6_01e_Folder_Route | Ruft toten MX_02 |
| LEXWARE_INVOICE_CHANGED | M6_04c_Lexware_Invoice_Sync | Pull-Modell aktiv |
| LEXWARE_PAYMENT_CHANGED | M6_04b_Lexware_Payment_Handler | Pull-Modell aktiv |
| LEXWARE_VOUCHER_CHANGED | M6_04d_Lexware_Voucher_Status | Pull-Modell aktiv |

## Offene Punkte

1. **M1_03 Position Extractor** - Routing fehlt (`PDF_PARSED` Event wird nie an M1_03 geroutet). Kritische Luecke.
2. **M1_05 Notification** - Bedingt aktiv, Events feuern nicht. Pruefen ob `OFFER_ATTACHED` Events generiert werden.
3. **Bestellung-Screen** (`app/bestellung/index.tsx`) - Zeigt 100% Dummy-Daten (hardcoded MEGA eG + Sueding).
