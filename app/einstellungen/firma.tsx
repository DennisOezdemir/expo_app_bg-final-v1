import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useCompanySettings } from "@/hooks/queries/useSettings";
import { useSaveCompanySettings } from "@/hooks/mutations/useSettingsMutations";

interface FormState {
  firmenname: string;
  companySince: string;
  rechtsform: string;
  geschaeftsfuehrer: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  website: string;
  steuernummer: string;
  ustIdNr: string;
  handelsregister: string;
  finanzamt: string;
  bank: string;
  iban: string;
  bic: string;
  zahlungsziel: string;
  skontoPercent: string;
  skontoTage: string;
  mahnfrist1: string;
  mahnfrist2: string;
  verzugszinsen: string;
}

function FormRow({
  label,
  value,
  onChangeText,
  keyboardType,
  flex,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  flex?: number;
  placeholder?: string;
}) {
  return (
    <View style={[rowStyles.row, flex !== undefined && { flex }]}>
      <Text style={rowStyles.label}>{label}</Text>
      <TextInput
        style={rowStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.raw.zinc600}
        keyboardType={keyboardType || "default"}
        selectionColor={Colors.raw.amber500}
      />
    </View>
  );
}

const FORM_TO_DB_KEY: Record<keyof FormState, string> = {
  firmenname: "company_name",
  companySince: "company_since",
  rechtsform: "rechtsform",
  geschaeftsfuehrer: "geschaeftsfuehrer",
  strasse: "address_street",
  plz: "address_zip",
  ort: "address_city",
  telefon: "phone",
  email: "email",
  website: "website",
  steuernummer: "tax_id",
  ustIdNr: "vat_id",
  handelsregister: "handelsregister",
  finanzamt: "finanzamt",
  bank: "bank",
  iban: "iban",
  bic: "bic",
  zahlungsziel: "zahlungsziel",
  skontoPercent: "skonto_percent",
  skontoTage: "skonto_tage",
  mahnfrist1: "mahnfrist_1",
  mahnfrist2: "mahnfrist_2",
  verzugszinsen: "verzugszinsen",
};

const DEFAULT_FORM: FormState = {
  firmenname: "Deine Baulöwen GmbH",
  companySince: "Seit Januar 2025",
  rechtsform: "GmbH",
  geschaeftsfuehrer: "Dennis",
  strasse: "Musterstraße 12",
  plz: "20095",
  ort: "Hamburg",
  telefon: "040-123456",
  email: "info@bauloewen.de",
  website: "www.bauloewen.de",
  steuernummer: "41/123/45678",
  ustIdNr: "DE123456789",
  handelsregister: "HRB 12345 Hamburg",
  finanzamt: "Hamburg-Nord",
  bank: "Hamburger Sparkasse",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "HASPDEHHXXX",
  zahlungsziel: "14",
  skontoPercent: "2",
  skontoTage: "7",
  mahnfrist1: "14",
  mahnfrist2: "14",
  verzugszinsen: "5",
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    width: 120,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
  },
});

function InlineNumberInput({
  value,
  onChangeText,
  width,
}: {
  value: string;
  onChangeText: (t: string) => void;
  width?: number;
}) {
  return (
    <TextInput
      style={[inlineStyles.input, width ? { width } : {}]}
      value={value}
      onChangeText={onChangeText}
      keyboardType="numeric"
      selectionColor={Colors.raw.amber500}
    />
  );
}

const inlineStyles = StyleSheet.create({
  input: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
    textAlign: "center",
    width: 52,
    marginHorizontal: 6,
  },
});

export default function FirmaScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const { data: companySettings, isLoading: loading } = useCompanySettings();
  const saveMutation = useSaveCompanySettings();
  const saving = saveMutation.isPending;

  // Populate form when settings load
  useEffect(() => {
    if (!companySettings) return;
    const map = companySettings;
    setForm({
      firmenname: map.company_name ?? DEFAULT_FORM.firmenname,
      companySince: map.company_since ?? DEFAULT_FORM.companySince,
      rechtsform: map.rechtsform ?? DEFAULT_FORM.rechtsform,
      geschaeftsfuehrer: map.geschaeftsfuehrer ?? DEFAULT_FORM.geschaeftsfuehrer,
      strasse: map.address_street ?? DEFAULT_FORM.strasse,
      plz: map.address_zip ?? DEFAULT_FORM.plz,
      ort: map.address_city ?? DEFAULT_FORM.ort,
      telefon: map.phone ?? DEFAULT_FORM.telefon,
      email: map.email ?? DEFAULT_FORM.email,
      website: map.website ?? DEFAULT_FORM.website,
      steuernummer: map.tax_id ?? DEFAULT_FORM.steuernummer,
      ustIdNr: map.vat_id ?? DEFAULT_FORM.ustIdNr,
      handelsregister: map.handelsregister ?? DEFAULT_FORM.handelsregister,
      finanzamt: map.finanzamt ?? DEFAULT_FORM.finanzamt,
      bank: map.bank ?? DEFAULT_FORM.bank,
      iban: map.iban ?? DEFAULT_FORM.iban,
      bic: map.bic ?? DEFAULT_FORM.bic,
      zahlungsziel: map.zahlungsziel ?? DEFAULT_FORM.zahlungsziel,
      skontoPercent: map.skonto_percent ?? DEFAULT_FORM.skontoPercent,
      skontoTage: map.skonto_tage ?? DEFAULT_FORM.skontoTage,
      mahnfrist1: map.mahnfrist_1 ?? DEFAULT_FORM.mahnfrist1,
      mahnfrist2: map.mahnfrist_2 ?? DEFAULT_FORM.mahnfrist2,
      verzugszinsen: map.verzugszinsen ?? DEFAULT_FORM.verzugszinsen,
    });
  }, [companySettings]);

  const update = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const rows = (Object.keys(form) as (keyof FormState)[]).map((k) => ({
      key: FORM_TO_DB_KEY[k],
      value: form[k] ?? "",
    }));
    saveMutation.mutate(rows, {
      onSuccess: () => {
        Alert.alert("Gespeichert", "Firmendaten wurden erfolgreich gespeichert.");
      },
      onError: (error) => {
        Alert.alert("Fehler", error.message);
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Firma</Text>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
          </View>
        ) : (
        <>

        <Text style={styles.sectionLabel}>Firmendaten</Text>
        <View style={styles.card}>
          <FormRow label="Firmenname" value={form.firmenname} onChangeText={update("firmenname")} />
          <View style={styles.divider} />
          <FormRow label="Untertitel im Profil" value={form.companySince} onChangeText={update("companySince")} placeholder="z. B. Seit Januar 2025" />
          <View style={styles.divider} />
          <FormRow label="Rechtsform" value={form.rechtsform} onChangeText={update("rechtsform")} />
          <View style={styles.divider} />
          <FormRow label="Geschäftsführer" value={form.geschaeftsfuehrer} onChangeText={update("geschaeftsfuehrer")} />
          <View style={styles.divider} />
          <FormRow label="Straße" value={form.strasse} onChangeText={update("strasse")} />
          <View style={styles.divider} />
          <View style={styles.splitRow}>
            <View style={{ flex: 1 }}>
              <FormRow label="PLZ" value={form.plz} onChangeText={update("plz")} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1.5, marginLeft: 10 }}>
              <FormRow label="Ort" value={form.ort} onChangeText={update("ort")} />
            </View>
          </View>
          <View style={styles.divider} />
          <FormRow label="Telefon" value={form.telefon} onChangeText={update("telefon")} keyboardType="phone-pad" />
          <View style={styles.divider} />
          <FormRow label="Email" value={form.email} onChangeText={update("email")} keyboardType="email-address" />
          <View style={styles.divider} />
          <FormRow label="Website" value={form.website} onChangeText={update("website")} />
        </View>

        <Text style={styles.sectionLabel}>Steuer & Recht</Text>
        <View style={styles.card}>
          <FormRow label="Steuernummer" value={form.steuernummer} onChangeText={update("steuernummer")} />
          <View style={styles.divider} />
          <FormRow label="USt-IdNr." value={form.ustIdNr} onChangeText={update("ustIdNr")} />
          <View style={styles.divider} />
          <FormRow label="Handelsregister" value={form.handelsregister} onChangeText={update("handelsregister")} />
          <View style={styles.divider} />
          <FormRow label="Finanzamt" value={form.finanzamt} onChangeText={update("finanzamt")} />
        </View>

        <Text style={styles.sectionLabel}>Bankverbindung</Text>
        <View style={styles.card}>
          <FormRow label="Bank" value={form.bank} onChangeText={update("bank")} />
          <View style={styles.divider} />
          <FormRow label="IBAN" value={form.iban} onChangeText={update("iban")} />
          <View style={styles.divider} />
          <FormRow label="BIC" value={form.bic} onChangeText={update("bic")} />
          <View style={styles.divider} />
          <Pressable style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
            <Text style={styles.addText}>Weitere Bankverbindung</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Zahlungsbedingungen</Text>
        <View style={styles.card}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Standard-Zahlungsziel:</Text>
            <View style={styles.paymentInline}>
              <InlineNumberInput value={form.zahlungsziel} onChangeText={update("zahlungsziel")} />
              <Text style={styles.paymentUnit}>Tage</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Skonto:</Text>
            <View style={styles.paymentInline}>
              <InlineNumberInput value={form.skontoPercent} onChangeText={update("skontoPercent")} width={44} />
              <Text style={styles.paymentUnit}>% bei Zahlung innerhalb</Text>
              <InlineNumberInput value={form.skontoTage} onChangeText={update("skontoTage")} width={44} />
              <Text style={styles.paymentUnit}>Tage</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Mahnfrist 1. Mahnung:</Text>
            <View style={styles.paymentInline}>
              <InlineNumberInput value={form.mahnfrist1} onChangeText={update("mahnfrist1")} />
              <Text style={styles.paymentUnit}>Tage</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Mahnfrist 2. Mahnung:</Text>
            <View style={styles.paymentInline}>
              <InlineNumberInput value={form.mahnfrist2} onChangeText={update("mahnfrist2")} />
              <Text style={styles.paymentUnit}>Tage</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Verzugszinsen:</Text>
            <View style={styles.paymentInline}>
              <InlineNumberInput value={form.verzugszinsen} onChangeText={update("verzugszinsen")} width={44} />
              <Text style={styles.paymentUnit}>% über Basiszins</Text>
            </View>
          </View>
        </View>
        </>
        )}
      </ScrollView>

      <View style={[styles.stickyBottom, { paddingBottom: bottomInset + 16 }]}>
        <Pressable
          onPress={handleSave}
          disabled={loading || saving}
          style={({ pressed }) => [styles.saveButton, { opacity: loading || saving || pressed ? 0.7 : 1 }]}
          testID="save-button"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveText}>Speichern</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 24,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.zinc400,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.raw.zinc800,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  addText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    flexWrap: "wrap",
    gap: 4,
  },
  paymentLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  paymentInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.raw.zinc950,
  },
  saveButton: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
});
