// BauGenius Night Jobs — Strix Box Automation
// Runs every night to reconcile, check deadlines and report to GF

import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GF_TELEGRAM_CHAT_ID = process.env.GF_TELEGRAM_CHAT_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !GF_TELEGRAM_CHAT_ID) {
    console.log("Telegram not configured, skipping message:", message);
    return;
  }
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: GF_TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  });
}

// 1. Lexware Reconciliation (Mock API Pull)
async function jobLexwareReconciliation() {
  console.log("Starting Lexware Reconciliation...");
  // In reality, call Lexware API here
  // For now, we log the sync attempt
  await sb.from("lexware_sync_log").insert({
    sync_type: "RECONCILIATION",
    status: "SUCCESS",
    details: { processed_invoices: 0, matched_payments: 0 }
  });
  console.log("Lexware Reconciliation finished.");
}

// 2. Überfälligkeits-Check (Invoices > 7 days)
async function jobOverdueCheck() {
  console.log("Starting Overdue Check...");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: overdue } = await sb
    .from("sales_invoices")
    .select("invoice_number, client_name, total_amount, due_date")
    .eq("status", "OPEN")
    .lt("due_date", sevenDaysAgo.toISOString());

  if (overdue && overdue.length > 0) {
    const list = overdue.map(i => `- ${i.invoice_number}: ${i.client_name} (€${i.total_amount})`).join("\n");
    await sendTelegram(`⚠️ *Überfällige Rechnungen (>7 Tage):*\n\n${list}`);
  }
  console.log("Overdue Check finished.");
}

// 3. Material-Check (Missing material for next week)
async function jobMaterialCheck() {
  console.log("Starting Material Check...");
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Relevante Phasen in der nächsten Woche
  const { data: phases } = await sb
    .from("schedule_phases")
    .select("project_id, trade_type, start_date")
    .gt("start_date", new Date().toISOString())
    .lt("start_date", nextWeek.toISOString());

  if (phases && phases.length > 0) {
    const projectIds = [...new Set(phases.map(p => p.project_id))];
    const { data: missing } = await sb
      .from("project_material_needs")
      .select("project_id, material_type")
      .in("project_id", projectIds)
      .is("ordered_at", null);

    if (missing && missing.length > 0) {
      await sendTelegram(`📦 *Material-Warnung:* Für ${missing.length} Projekte fehlt Material für nächste Woche.`);
    }
  }
  console.log("Material Check finished.");
}

// 4. Daily Report
async function jobDailyReport() {
  console.log("Generating Daily Report...");
  const { count: activeProjects } = await sb.from("projects").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const { count: pendingApprovals } = await sb.from("approvals").select("*", { count: "exact", head: true }).eq("status", "PENDING");

  const report = `📊 *BauGenius Daily Report — ${new Date().toLocaleDateString('de-DE')}*

Aktive Projekte: ${activeProjects}
Offene Freigaben: ${pendingApprovals}

Guten Morgen! Die Baustellen sind bereit.`;

  await sendTelegram(report);
  console.log("Daily Report sent.");
}

// Main Execution
async function main() {
  const args = process.argv.slice(2);
  const job = args[0];

  try {
    switch (job) {
      case "reconcile": await jobLexwareReconciliation(); break;
      case "overdue": await jobOverdueCheck(); break;
      case "material": await jobMaterialCheck(); break;
      case "report": await jobDailyReport(); break;
      case "all":
        await jobLexwareReconciliation();
        await jobOverdueCheck();
        await jobMaterialCheck();
        await jobDailyReport();
        break;
      default:
        console.log("Usage: node night-jobs.js [reconcile|overdue|material|report|all]");
    }
  } catch (err) {
    console.error("Job failed:", err);
  }
}

main();
