# FLOW_REGISTER_LIVE.md

> Auto-generiert aus n8n API am 2026-02-27 23:06
> **42 aktive Flows** | 62 inaktive/archivierte | 104 gesamt

---

## AKTIVE FLOWS (Produktion)

### M1: Intake

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **M1_02_PDF_Parser_Vision** | `8KDtJKgrTI` | 17 | 2026-02-11 |
| **M1_03_Position_Extractor_V3** | `eVbTku3Jsy` | 20 | 2026-01-19 |
| **M1_04a_Prepare_Drive** | `kdXetd4FMC` | 22 | 2026-01-13 |
| **M1_04b_Create_Project_Tree** | `P0ETfL7Zoz` | 25 | 2026-01-03 |
| **M1_04c_Sync_Initial_Files** | `RNifQ36Twy` | 29 | 2026-01-03 |
| **M1_05_Notification** | `ixnrOVeJhF` | 13 | 2026-01-03 |

### M2: Baustelle

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **M2_01_Monteur_Auftrag_PDF** | `v2b5w05D-C` | 7 | 2026-01-17 |
| **M2_02_Sync_ZB_Progress** | `TQoWuDki_q` | 12 | 2026-02-20 |
| **M2_03_Generate_Protocol_PDF** | `lDrZnW4bYM` | 13 | 2026-02-20 |
| **M2_04_Inspection_Finalize** | `fkP3zcOg0W` | 16 | 2026-02-11 |
| **M2_10_Sub_Order_Generator** | `Kqp7EajcP0` | 7 | 2026-01-17 |
| **M2_10a_Schedule_Approve** | `t3HR7lIWYU` | 9 | 2026-02-20 |
| **M2_10b_Schedule_Notification** | `DKR3TSn8J7` | 11 | 2026-02-20 |

### M4: Material

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **M4_01_Material_Planner** | `tywkXZoNvD` | 10 | 2026-01-28 |
| **M4_01a_Receipt_Intake** | `sw2yaCHpua` | 4 | 2026-02-02 |
| **M4_01b_Receipt_Processor_V2_MX02** | `WSy5sWWXY2` | 27 | 2026-02-02 |
| **M4_03a_Order_Approve** | `INJkwNIVjA` | 9 | 2026-02-23 |
| **M4_03b_Order_Suggester** | `UlyBjJpyUs` | 13 | 2026-02-23 |
| **M4_05_Material_List_Generator** | `S5gFkRmPiZ` | 18 | 2026-02-11 |
| **M4_06_Order_Agent** | `fPY6wSReqQ` | 13 | 2026-02-23 |
| **M4_07_Order_Send** | `BOkKFTEUCy` | 13 | 2026-02-23 |
| **M4_08_Schedule_Order_Trigger** | `Ycs3lFXe5J` | 6 | 2026-02-23 |
| **M4_10_MagicPlan_Parser** | `Tjbz4nIiHl` | 14 | 2026-01-25 |

### M5: Freigabe

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **M5_01_Approval_Dispatcher** | `zCs5Hwy9Nm` | 21 | 2026-02-11 |

### M6: Finance

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **M6_01_Invoice_Processor** | `NKVnbTeEpf` | 34 | 2026-02-10 |
| **M6_02a_Lexware_Push_Prepare** | `B4IOCwfxNg` | 15 | 2026-02-18 |
| **M6_02b_Lexware_Contact_Sync** | `ilYyrjOQoG` | 14 | 2026-02-18 |
| **M6_02c_Lexware_Push_Voucher** | `6C8MshufHT` | 15 | 2026-02-19 |
| **M6_03_Lexware_Pull_Sales** | `AjRF0GnZVa` | 14 | 2026-02-18 |
| **M6_04a_Lexware_Webhook_Router** | `RbUQUOpAzY` | 7 | 2026-02-18 |
| **M6_04b_Lexware_Payment_Handler** | `ORyFbRUD5E` | 16 | 2026-02-18 |
| **M6_04c_Lexware_Invoice_Sync** | `HK788ajphA` | 13 | 2026-02-18 |
| **M6_04d_Lexware_Voucher_Status** | `pkJmfUhp9V` | 13 | 2026-02-18 |

### MX: Infrastructure

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **MX_00_Event_Router v2** | `eNHx0TACVc` | 14 | 2026-01-17 |
| **MX_01_Error_Handler_v2** | `zAFieMcnwA` | 12 | 2026-02-26 |
| **MX_02_Folder_Manager** | `ZcAhUCdoux` | 30 | 2026-01-03 |
| **MX_03_V2_Superchat_Intake** | `9eBOez2Q0v` | 27 | 2026-02-23 |
| **MX_04_Dispatch_Doctor** | `wT9ubypWwa` | 29 | 2026-02-11 |
| **MX_05_Attachment_Processor** | `qAiKaCpDUF` | 13 | 2026-01-28 |
| **MX_07_Flow_Monitor** | `GBkSxBPeJU` | 14 | 2026-02-23 |
| **MX_AI_Analyze_With_Fallback** | `FuXYPv6Jtv` | 10 | 2026-02-23 |

### Sonstige

| Flow | ID | Nodes | Letztes Update |
|------|----|-------|----------------|
| **Flow 2: Offer Sender (AI Agent Edition) TEST** | `us00SoDXhB` | 24 | 2025-11-13 |

---

## INAKTIVE / ARCHIVIERTE FLOWS

| Flow | ID | Kategorie |
|------|----|-----------|
| (ALT) MX_00_Event_Router | `2e5jCRJhyN` | Veraltet |
| (ALT)M1_01_Email_Trigger | `w88yvZIQx1` | Veraltet |
| (ALT)M1_02_PDF_Parser_Vision | `eSxZ8b9Oy8` | Veraltet |
| (ALT)M1_03_Position_Extractor_Refactored | `EYnWqD8pOn` | Veraltet |
| (ALT)M4_02_Mail_Invoice_Scanner_V2_MX02 | `a0tUjmuVkj` | Veraltet |
| (ALT)MX_03_Document_Classifier | `GppS6IEk3x` | Veraltet |
| (ALT)MX_03_Document_Classifier v2 | `sDg2E6zWCq` | Veraltet |
| (Veraltet) M4_01b_Receipt_Processor__FINAL_HTTP_FOLDERS | `dK3DMDmdJr` | Veraltet |
| (Veraltet) M4_02_Mail_Invoice_Scanner | `asV6PHbqaS` | Veraltet |
| (alt) M1_02_PDF_Parser_Vision | `x0xf0fEOEz` | Veraltet |
| AI Circle - Linear (5 Agents) | `e63Wpae4nH` | Inaktiv |
| AI Circle - Multi-AI Review mit Rückfragen | `KVRNwuGtio` | Inaktiv |
| AI Personal Assistant | `Rxou1npHLd` | Inaktiv |
| AI agent chat | `0rJX6hHJAM` | Inaktiv |
| Angie, personal AI assistant with Telegram voice and text | `Qmv5G4Kdyf` | Inaktiv |
| BG_Katalog_Kundentexte_Generator | `4SOUzEMkv0` | Inaktiv |
| Build your own N8N workflows MCP server | `sQ2m2wNtfx` | MCP Gateway |
| E-Mail Agent Workflow/Claude | `ahQbODn5bK` | Inaktiv |
| Eingescannte Belege copy | `6hnc2HhEOs` | Kopie |
| Fix&Flip Deal Analyzer | `M6SOsXcmR1` | Inaktiv |
| Fix&Flip TEST - Einzeltest | `hjjCzny1iJ` | Inaktiv |
| Flow 1: Price Calculator (Final) | `KTWLGKsQnk` | Legacy |
| Flow 1: Price Calculator/Final Edition | `tQMW76RStg` | Legacy |
| Flow 2: Offer Sender/FInal Edition | `DmdSnbP8xU` | Legacy |
| Flow 3.1: Reaktiver Follow-Up Agent (mit AI Agent) | `OjDQQmMWm1` | Legacy |
| Flow 3: Follow-Up Agent | `5D3nIT9gZy` | Legacy |
| Flow 3A - Follow-up Scheduler Veraltet | `punte8syjj` | Legacy |
| Flow 3A Scheduler Final | `FAYHirqEgD` | Legacy |
| Flow 3B Fetcher Final | `TREGBvpyug` | Legacy |
| Flow 3B Response Handler | `D0kk6LWtHM` | Legacy |
| Flow 3C AI Engine Final | `JpyrQ1Aqpu` | Legacy |
| Flow 3D - Dispatcher (WhatsApp + Email Fallback) | `6zPhqBDKPO` | Legacy |
| Generate AI viral videos with NanoBanana & VEO3, shared on socials via Blotato | `ZoEHpGWq3v` | Inaktiv |
| M1_01_Email_Trigger | `Q2z4kwisOw` | Inaktiv |
| M1_03_Position_Extractor_V2 | `mDNj0tyrGQ` | Inaktiv |
| M1_10_WhatsApp_Trigger | `ZieSUGnvXP` | Inaktiv |
| M2_10_Sub_Order_Generator | `845caUjFxh` | Inaktiv |
| M4_01_Receipt_Scanner nur noch bis Ende 2025 | `tENxGnDlYv` | Inaktiv |
| M4_01_Receipt_Scanner v1 alt | `T074tqgzwB` | Inaktiv |
| M6_01_Invoice_Processor | `bv98IPeeJ7` | Inaktiv |
| M6_02_Lexware_Push_Invoice | `FCI4VdYDCG` | Inaktiv |
| M6_03_Lexware_Pull_Sales | `S34jrLFejU` | Inaktiv |
| M6_04_Lexware_Payment_Webhook | `V2BHSw5z7r` | Inaktiv |
| M6_04_Lexware_Payment_Webhook | `eSp4teMwbr` | Inaktiv |
| MCP Gateway SUPABASE | `oqIQngMG6x` | MCP Gateway |
| MCP Github Gateway | `4fCcJcUcZW` | MCP Gateway |
| MX_00_Event_Router | `nnx6BhC6PC` | Inaktiv |
| MX_01_Error_Handler | `apmJoMCbOc` | Inaktiv |
| MX_03_Superchat_Intake | `IdxGMYvUAQ` | Inaktiv |
| MX_03_V2_Superchat_Intake | `XvPkC3_OJ6` | Inaktiv |
| Mail Agent | `F3B3DR51Cl` | Inaktiv |
| My workflow | `y36pWbL5SD` | Test |
| My workflow 10 | `53mf0y3sza` | Test |
| My workflow 2 | `fjgNiElgE7` | Test |
| My workflow 3 | `KtdLcLoLxh` | Test |
| My workflow 4 | `NrWKtwqpaq` | Test |
| My workflow 5 | `WqMFBGcuGq` | Test |
| My workflow 6 | `wpMiaErFXS` | Test |
| My workflow 7 | `YCVTeAv-yc` | Test |
| My workflow 8 | `eqAakqWfcz` | Test |
| My workflow 9 | `qFujNzwPO1` | Test |
| Telegram Multi-Agent System | `l6QrjeHfv9` | Inaktiv |

---

## MODUL-ZUSAMMENFASSUNG

- **M1: Intake**: 6 aktiv, 3 inaktiv
- **M2: Baustelle**: 7 aktiv, 1 inaktiv
- **M4: Material**: 10 aktiv, 2 inaktiv
- **M5: Freigabe**: 1 aktiv, 0 inaktiv
- **M6: Finance**: 9 aktiv, 5 inaktiv
- **MX: Infrastructure**: 8 aktiv, 4 inaktiv
- **Sonstige**: 1 aktiv, 47 inaktiv
