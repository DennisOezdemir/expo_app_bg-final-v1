import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function AngeboteLayout() {
  return (
    <RoleGuard screen="angebote">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
