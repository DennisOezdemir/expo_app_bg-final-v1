import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function PlanungLayout() {
  return (
    <RoleGuard screen="planung">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
