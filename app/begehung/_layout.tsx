import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function BegehungLayout() {
  return (
    <RoleGuard screen="begehung">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
