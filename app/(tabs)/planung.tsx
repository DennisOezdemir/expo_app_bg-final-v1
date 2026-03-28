import { Redirect } from "expo-router";

// Planung-Tab leitet auf die bestehende Planungs-Route weiter
export default function PlanungTab() {
  return <Redirect href="/planung" />;
}
