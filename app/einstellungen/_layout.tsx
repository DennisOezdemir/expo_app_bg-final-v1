import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function EinstellungenLayout() {
  return (
    <RoleGuard screen="einstellungen">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
