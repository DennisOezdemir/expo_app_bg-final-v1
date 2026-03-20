import { Stack } from "expo-router";
import { RoleGuard } from "@/components/RoleGuard";

export default function FreigabeLayout() {
  return (
    <RoleGuard screen="freigaben">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
