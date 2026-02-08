import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

type ImportType = "projekte" | "kunden" | "lieferanten" | "produkte" | "katalog" | "rechnungen";
type Step = 1 | 2 | 3 | 4;

interface ImportTypeInfo {
  id: ImportType;
  label: string;
  format: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const IMPORT_TYPES: ImportTypeInfo[] = [
  { id: "projekte", label: "Projekte", format: "CSV/Excel", icon: "clipboard-outline" },
  { id: "kunden", label: "Kunden", format: "CSV/Excel", icon: "people-outline" },
  { id: "lieferanten", label: "Lieferanten", format: "CSV/Excel", icon: "storefront-outline" },
  { id: "produkte", label: "Produkte", format: "CSV/Excel", icon: "cube-outline" },
  { id: "katalog", label: "Katalog", format: "GAEB/CSV", icon: "book-outline" },
  { id: "rechnungen", label: "Rechnungen", format: "PDF bulk", icon: "receipt-outline" },
];

interface MappingRow {
  source: string;
  target: string;
}

interface PreviewRow {
  label: string;
  detail: string;
  status: "valid" | "warning" | "error";
}

const MAPPING_TARGETS = [
  "-- Ignorieren --",
  "Firmenname",
  "Straße",
  "PLZ",
  "Ort",
  "Telefon",
  "Ansprechpartner",
  "E-Mail",
  "Kundennummer",
];

const MOCK_MAPPINGS: MappingRow[] = [
  { source: "Firma", target: "Firmenname" },
  { source: "Str.", target: "Straße" },
  { source: "PLZ", target: "PLZ" },
  { source: "Ort", target: "Ort" },
  { source: "Tel", target: "Telefon" },
  { source: "Ansprech.", target: "Ansprechpartner" },
  { source: "Column 7", target: "-- Ignorieren --" },
];

const MOCK_PREVIEW: PreviewRow[] = [
  { label: "SAGA GWG", detail: "Beispielstr. 1, Hamburg", status: "valid" },
  { label: "GWG Hamburg", detail: "Musterweg 5, Hamburg", status: "valid" },
  { label: "BDS", detail: "Straße fehlt!", status: "warning" },
  { label: "Privat Müller", detail: "Hauptstr. 12, Bergedorf", status: "valid" },
  { label: "[Leerzeile]", detail: "wird übersprungen", status: "error" },
];

const GAEB_PREVIEW = [
  { pos: "01.01.0010", text: "Wandflächen grundieren", price: "€3,20/m²" },
  { pos: "01.01.0020", text: "Wandflächen streichen", price: "€4,80/m²" },
  { pos: "01.01.0030", text: "Raufaser tapezieren", price: "€8,40/m²" },
  { pos: "01.02.0010", text: "Heizkörper lackieren", price: "€12,50/Stk" },
  { pos: "01.02.0020", text: "Türrahmen streichen", price: "€18,00/Stk" },
];

const PDF_FILES = [
  { name: "Rechnung_MEGA_2026-001.pdf", size: "1.2MB", status: "valid" as const },
  { name: "Rechnung_Sueding_4521.pdf", size: "0.8MB", status: "valid" as const },
  { name: "Lieferschein_Wuerth.pdf", size: "0.4MB", status: "warning" as const },
  { name: "Rechnung_Hilti_R-9920.pdf", size: "1.5MB", status: "valid" as const },
];

const PDF_AI_RESULTS = [
  { vendor: "MEGA eG", ref: "RE-4521", amount: "€709,80", status: "valid" as const },
  { vendor: "Süding", ref: "RE-8834", amount: "€53,10", status: "valid" as const },
  { vendor: "Würth", ref: "Lieferschein erkannt", amount: "", status: "warning" as const },
  { vendor: "Hilti", ref: "RE-9920", amount: "€1.240,00", status: "valid" as const },
];

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [mappings, setMappings] = useState<MappingRow[]>(MOCK_MAPPINGS);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [expandedMapping, setExpandedMapping] = useState<number | null>(null);
  const [pdfAiDone, setPdfAiDone] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);

  const isGaeb = selectedType === "katalog";
  const isPdf = selectedType === "rechnungen";

  const openDialog = useCallback((type: ImportType) => {
    setSelectedType(type);
    setStep(1);
    setFileUploaded(false);
    setFileName("");
    setFileSize("");
    setMappings(MOCK_MAPPINGS);
    setImporting(false);
    setImportDone(false);
    setImportProgress(0);
    setExpandedMapping(null);
    setPdfAiDone(false);
    setPdfProcessing(false);
    setDialogVisible(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogVisible(false);
    setSelectedType(null);
  }, []);

  const simulateUpload = useCallback(() => {
    if (isPdf) {
      setFileName("12 PDFs ausgewählt");
      setFileSize("8.4MB");
    } else if (isGaeb) {
      setFileName("SAGA_WBS_Katalog_2026.x83");
      setFileSize("2.1MB");
    } else {
      setFileName("kunden_export_2026.csv");
      setFileSize("245KB");
    }
    setFileUploaded(true);
  }, [isGaeb, isPdf]);

  const simulateImport = useCallback(() => {
    setImporting(true);
    setImportProgress(0);
    const total = isGaeb ? 620 : 45;
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 3;
      if (current >= total) {
        current = total;
        clearInterval(interval);
        setTimeout(() => {
          setImporting(false);
          setImportDone(true);
        }, 300);
      }
      setImportProgress(current / total);
    }, 120);
  }, [isGaeb]);

  const simulatePdfAi = useCallback(() => {
    setPdfProcessing(true);
    setTimeout(() => {
      setPdfProcessing(false);
      setPdfAiDone(true);
    }, 2500);
  }, []);

  const updateMapping = useCallback((index: number, target: string) => {
    setMappings(prev => {
      const next = [...prev];
      next[index] = { ...next[index], target };
      return next;
    });
    setExpandedMapping(null);
  }, []);

  const stepLabel = useMemo(() => {
    if (isPdf) return ["Hochladen", "KI-Erkennung", "Übernehmen"];
    if (isGaeb) return ["Hochladen", "Vorschau", "Import"];
    return ["Hochladen", "Zuordnung", "Vorschau", "Import"];
  }, [isPdf, isGaeb]);

  const maxSteps = stepLabel.length;

  const typeInfo = IMPORT_TYPES.find(t => t.id === selectedType);

  const statusIcon = (status: "valid" | "warning" | "error") => {
    if (status === "valid") return <Ionicons name="checkmark-circle" size={18} color={Colors.raw.emerald500} />;
    if (status === "warning") return <Ionicons name="warning" size={18} color={Colors.raw.amber500} />;
    return <Ionicons name="close-circle" size={18} color={Colors.raw.rose500} />;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {stepLabel.map((label, i) => {
        const stepNum = i + 1;
        const active = step >= stepNum;
        const current = step === stepNum;
        return (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, active && styles.stepDotActive, current && styles.stepDotCurrent]}>
              {active && step > stepNum ? (
                <Ionicons name="checkmark" size={12} color="#000" />
              ) : (
                <Text style={[styles.stepDotText, active && styles.stepDotTextActive]}>{stepNum}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            {i < maxSteps - 1 && <View style={[styles.stepLine, active && step > stepNum && styles.stepLineActive]} />}
          </View>
        );
      })}
    </View>
  );

  const renderUploadStep = () => (
    <View>
      <Pressable
        style={({ pressed }) => [styles.dropZone, pressed && { borderColor: Colors.raw.amber500, backgroundColor: "rgba(245, 158, 11, 0.05)" }]}
        onPress={simulateUpload}
        testID="import-upload-zone"
      >
        {fileUploaded ? (
          <View style={styles.fileInfo}>
            <Ionicons name="document-attach" size={36} color={Colors.raw.amber500} />
            <Text style={styles.fileNameText}>{fileName}</Text>
            <Text style={styles.fileSizeText}>{fileSize}</Text>
            <Pressable
              onPress={() => { setFileUploaded(false); setFileName(""); setFileSize(""); }}
              style={styles.removeFileBtn}
            >
              <Ionicons name="close-circle" size={22} color={Colors.raw.zinc500} />
            </Pressable>
          </View>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={44} color={Colors.raw.zinc500} />
            <Text style={styles.dropZoneText}>Datei hierher ziehen</Text>
            <Text style={styles.dropZoneOr}>oder</Text>
            <View style={styles.selectFileBtn}>
              <Text style={styles.selectFileBtnText}>Datei auswählen</Text>
            </View>
            <Text style={styles.dropZoneHint}>
              {isPdf ? "PDF • Mehrfachauswahl möglich" : isGaeb ? "GAEB (.x83, .x84, .d83, .d84) oder CSV • Max 10MB" : "CSV, XLSX, XLS • Max 10MB"}
            </Text>
          </>
        )}
      </Pressable>

      {fileUploaded && (
        <Pressable
          style={styles.nextBtn}
          onPress={() => setStep(2)}
          testID="import-next-step"
        >
          <Text style={styles.nextBtnText}>Weiter</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </Pressable>
      )}
    </View>
  );

  const renderMappingStep = () => (
    <View>
      <Text style={styles.dialogSectionTitle}>Spalten-Zuordnung</Text>
      <Text style={styles.dialogHint}>Automatisch erkannt. Tippe zum Ändern.</Text>
      {mappings.map((row, i) => (
        <View key={i}>
          <Pressable
            style={styles.mappingRow}
            onPress={() => setExpandedMapping(expandedMapping === i ? null : i)}
          >
            <View style={styles.mappingSource}>
              <Text style={styles.mappingSourceText}>"{row.source}"</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.raw.zinc600} />
            <View style={styles.mappingTarget}>
              <Text style={[styles.mappingTargetText, row.target === "-- Ignorieren --" && { color: Colors.raw.zinc600 }]}>
                {row.target}
              </Text>
              <Ionicons name="chevron-down" size={14} color={Colors.raw.zinc600} />
            </View>
          </Pressable>
          {expandedMapping === i && (
            <View style={styles.mappingDropdown}>
              {MAPPING_TARGETS.map(target => (
                <Pressable
                  key={target}
                  style={[styles.mappingOption, row.target === target && styles.mappingOptionActive]}
                  onPress={() => updateMapping(i, target)}
                >
                  <Text style={[styles.mappingOptionText, row.target === target && styles.mappingOptionTextActive]}>
                    {target}
                  </Text>
                  {row.target === target && <Ionicons name="checkmark" size={16} color={Colors.raw.amber500} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
      <View style={styles.stepBtnRow}>
        <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc300} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={() => setStep(3)} testID="import-mapping-next">
          <Text style={styles.nextBtnText}>Weiter</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );

  const renderPreviewStep = () => (
    <View>
      <Text style={styles.dialogSectionTitle}>Vorschau (erste 5 Einträge)</Text>
      {MOCK_PREVIEW.map((row, i) => (
        <View key={i} style={styles.previewRow}>
          {statusIcon(row.status)}
          <View style={styles.previewRowContent}>
            <Text style={styles.previewLabel}>{row.label}</Text>
            <Text style={[styles.previewDetail, row.status === "warning" && { color: Colors.raw.amber500 }, row.status === "error" && { color: Colors.raw.rose500 }]}>
              {row.detail}
            </Text>
          </View>
        </View>
      ))}
      <View style={styles.previewSummary}>
        <View style={styles.previewSummaryLine}>
          <Text style={styles.previewSummaryLabel}>Gesamt:</Text>
          <Text style={styles.previewSummaryValue}>48 Zeilen</Text>
        </View>
        <View style={styles.previewSummaryLine}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.raw.emerald500} />
          <Text style={[styles.previewSummaryValue, { color: Colors.raw.emerald500 }]}>45 gültig</Text>
        </View>
        <View style={styles.previewSummaryLine}>
          <Ionicons name="warning" size={14} color={Colors.raw.amber500} />
          <Text style={[styles.previewSummaryValue, { color: Colors.raw.amber500 }]}>2 unvollständig (werden importiert mit Warnung)</Text>
        </View>
        <View style={styles.previewSummaryLine}>
          <Ionicons name="close-circle" size={14} color={Colors.raw.rose500} />
          <Text style={[styles.previewSummaryValue, { color: Colors.raw.rose500 }]}>1 ungültig (wird übersprungen)</Text>
        </View>
      </View>
      <View style={styles.stepBtnRow}>
        <Pressable style={styles.backBtn} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc300} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={() => setStep(4)} testID="import-preview-next">
          <Text style={styles.nextBtnText}>Importieren</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );

  const renderImportStep = () => (
    <View>
      {!importing && !importDone && (
        <>
          <View style={styles.importOptions}>
            <Pressable style={styles.radioRow}>
              <View style={styles.radioOuter}>
                <View style={styles.radioInner} />
              </View>
              <Text style={styles.radioText}>Nur neue hinzufügen (Standard)</Text>
            </Pressable>
            <Pressable style={styles.radioRow}>
              <View style={styles.radioOuter} />
              <Text style={styles.radioText}>Duplikate überschreiben</Text>
            </Pressable>
          </View>
          <Pressable style={styles.importBtn} onPress={simulateImport} testID="import-start-btn">
            <Ionicons name="download-outline" size={20} color="#000" />
            <Text style={styles.importBtnText}>45 Einträge importieren</Text>
          </Pressable>
        </>
      )}

      {importing && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Importiere... {Math.round(importProgress * 45)} von 45</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(importProgress * 100)}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(importProgress * 100)}%</Text>
        </View>
      )}

      {importDone && (
        <View style={styles.importDoneContainer}>
          <Ionicons name="checkmark-circle" size={52} color={Colors.raw.emerald500} />
          <Text style={styles.importDoneTitle}>Import abgeschlossen!</Text>
          <View style={styles.importDoneStats}>
            <Text style={styles.importDoneStat}>45 importiert</Text>
            <Text style={[styles.importDoneStat, { color: Colors.raw.amber500 }]}>2 mit Warnungen</Text>
            <Text style={[styles.importDoneStat, { color: Colors.raw.rose500 }]}>1 übersprungen</Text>
          </View>
          <View style={styles.importDoneBtns}>
            <Pressable style={styles.reportBtn} onPress={() => Alert.alert("Bericht", "Detaillierter Import-Bericht wird generiert...")}>
              <Ionicons name="clipboard-outline" size={16} color={Colors.raw.amber500} />
              <Text style={styles.reportBtnText}>Bericht ansehen</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={closeDialog} testID="import-done-btn">
              <Ionicons name="checkmark" size={16} color="#000" />
              <Text style={styles.doneBtnText}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  const renderGaebStep2 = () => (
    <View>
      <View style={styles.gaebInfo}>
        <Ionicons name="information-circle" size={20} color={Colors.raw.amber500} />
        <Text style={styles.gaebInfoText}>GAEB Datei erkannt</Text>
      </View>
      <View style={styles.gaebMeta}>
        <View style={styles.gaebMetaRow}>
          <Text style={styles.gaebMetaLabel}>Format:</Text>
          <Text style={styles.gaebMetaValue}>GAEB XML 3.2</Text>
        </View>
        <View style={styles.gaebMetaRow}>
          <Text style={styles.gaebMetaLabel}>Leistungsverzeichnis:</Text>
          <Text style={styles.gaebMetaValue}>"SAGA WBS Katalog 2026"</Text>
        </View>
        <View style={styles.gaebMetaRow}>
          <Text style={styles.gaebMetaLabel}>Positionen:</Text>
          <Text style={styles.gaebMetaValue}>620</Text>
        </View>
        <View style={styles.gaebMetaRow}>
          <Text style={styles.gaebMetaLabel}>Gewerke:</Text>
          <Text style={styles.gaebMetaValue}>6</Text>
        </View>
      </View>

      <Text style={[styles.dialogSectionTitle, { marginTop: 16 }]}>Vorschau</Text>
      {GAEB_PREVIEW.map((item, i) => (
        <View key={i} style={styles.gaebRow}>
          <Text style={styles.gaebPos}>{item.pos}</Text>
          <Text style={styles.gaebText} numberOfLines={1}>{item.text}</Text>
          <Text style={styles.gaebPrice}>{item.price}</Text>
        </View>
      ))}
      <Text style={styles.gaebMore}>... und 615 weitere Positionen</Text>

      <View style={styles.stepBtnRow}>
        <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc300} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={() => setStep(3)} testID="gaeb-import-next">
          <Text style={styles.nextBtnText}>Weiter</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );

  const renderGaebStep3 = () => (
    <View>
      {!importing && !importDone && (
        <Pressable style={styles.importBtn} onPress={simulateImport} testID="gaeb-import-btn">
          <Ionicons name="download-outline" size={20} color="#000" />
          <Text style={styles.importBtnText}>620 Positionen importieren</Text>
        </Pressable>
      )}
      {importing && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Importiere... {Math.round(importProgress * 620)} von 620</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(importProgress * 100)}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(importProgress * 100)}%</Text>
        </View>
      )}
      {importDone && (
        <View style={styles.importDoneContainer}>
          <Ionicons name="checkmark-circle" size={52} color={Colors.raw.emerald500} />
          <Text style={styles.importDoneTitle}>Import abgeschlossen!</Text>
          <Text style={styles.importDoneStat}>620 Positionen in 6 Gewerken importiert</Text>
          <View style={styles.importDoneBtns}>
            <Pressable style={styles.doneBtn} onPress={closeDialog}>
              <Ionicons name="checkmark" size={16} color="#000" />
              <Text style={styles.doneBtnText}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  const renderPdfStep2 = () => (
    <View>
      <Text style={styles.dialogSectionTitle}>Hochgeladen: {PDF_FILES.length} PDFs</Text>
      {PDF_FILES.map((file, i) => (
        <View key={i} style={styles.pdfFileRow}>
          <Ionicons name="document-outline" size={18} color={Colors.raw.zinc400} />
          <Text style={styles.pdfFileName} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.pdfFileSize}>{file.size}</Text>
          {statusIcon(file.status)}
        </View>
      ))}
      {file_status_warning()}

      {!pdfProcessing && !pdfAiDone && (
        <Pressable style={styles.aiBtn} onPress={simulatePdfAi} testID="pdf-ai-btn">
          <Ionicons name="sparkles" size={18} color="#000" />
          <Text style={styles.aiBtnText}>KI-Erkennung starten</Text>
        </Pressable>
      )}

      {pdfProcessing && (
        <View style={styles.aiProcessing}>
          <ActivityIndicator size="small" color={Colors.raw.amber500} />
          <Text style={styles.aiProcessingText}>KI analysiert Rechnungen...</Text>
        </View>
      )}

      {pdfAiDone && (
        <View>
          <View style={styles.gaebInfo}>
            <Ionicons name="sparkles" size={18} color={Colors.raw.amber500} />
            <Text style={styles.gaebInfoText}>KI-Erkennung abgeschlossen</Text>
          </View>
          {PDF_AI_RESULTS.map((r, i) => (
            <View key={i} style={styles.aiResultRow}>
              {statusIcon(r.status)}
              <View style={styles.aiResultContent}>
                <Text style={styles.aiResultVendor}>{r.vendor}</Text>
                <Text style={styles.aiResultRef}>{r.ref}{r.amount ? ` — ${r.amount}` : ""}</Text>
              </View>
              <Pressable style={styles.aiResultAction}>
                <Text style={styles.aiResultActionText}>{r.status === "warning" ? "Zuordnen" : "Prüfen"}</Text>
                <Ionicons name="arrow-forward" size={12} color={Colors.raw.amber500} />
              </Pressable>
            </View>
          ))}
          <View style={styles.stepBtnRow}>
            <Pressable style={styles.backBtn} onPress={() => { setStep(1); setPdfAiDone(false); }}>
              <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc300} />
              <Text style={styles.backBtnText}>Zurück</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={() => setStep(3)} testID="pdf-import-next">
              <Text style={styles.nextBtnText}>Alle übernehmen</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  const renderPdfStep3 = () => (
    <View>
      {!importDone ? (
        <View style={styles.importDoneContainer}>
          <Ionicons name="checkmark-circle" size={52} color={Colors.raw.emerald500} />
          <Text style={styles.importDoneTitle}>Rechnungen übernommen!</Text>
          <View style={styles.importDoneStats}>
            <Text style={styles.importDoneStat}>3 Rechnungen importiert</Text>
            <Text style={[styles.importDoneStat, { color: Colors.raw.amber500 }]}>1 Lieferschein zur Zuordnung</Text>
          </View>
          <View style={styles.importDoneBtns}>
            <Pressable style={styles.doneBtn} onPress={closeDialog}>
              <Ionicons name="checkmark" size={16} color="#000" />
              <Text style={styles.doneBtnText}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderDialogContent = () => {
    if (isPdf) {
      if (step === 1) return renderUploadStep();
      if (step === 2) return renderPdfStep2();
      return renderPdfStep3();
    }
    if (isGaeb) {
      if (step === 1) return renderUploadStep();
      if (step === 2) return renderGaebStep2();
      return renderGaebStep3();
    }
    if (step === 1) return renderUploadStep();
    if (step === 2) return renderMappingStep();
    if (step === 3) return renderPreviewStep();
    return renderImportStep();
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backArrow} testID="import-back">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View>
          <Text style={styles.title}>Daten importieren</Text>
          <Text style={styles.subtitle}>Projekte, Kontakte, Katalog und mehr</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {IMPORT_TYPES.map((type) => (
            <Pressable
              key={type.id}
              style={({ pressed }) => [styles.typeCard, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
              onPress={() => openDialog(type.id)}
              testID={`import-type-${type.id}`}
            >
              <View style={styles.typeIconWrap}>
                <Ionicons name={type.icon} size={28} color={Colors.raw.amber500} />
              </View>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={styles.typeFormat}>{type.format}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.raw.zinc500} />
          <Text style={styles.infoText}>
            Importiere Daten aus bestehenden Systemen. Unterstützte Formate: CSV, Excel (XLSX/XLS), GAEB (Kataloge) und PDF (Rechnungen).
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={dialogVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDialog}
      >
        <View style={[styles.dialogContainer, { paddingTop: topPad }]}>
          <View style={styles.dialogHeader}>
            <Pressable onPress={closeDialog} style={styles.dialogClose} testID="import-dialog-close">
              <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
            </Pressable>
            <View style={styles.dialogTitleWrap}>
              {typeInfo && <Ionicons name={typeInfo.icon} size={22} color={Colors.raw.amber500} />}
              <Text style={styles.dialogTitle}>{typeInfo?.label} importieren</Text>
            </View>
          </View>

          {renderStepIndicator()}

          <ScrollView
            style={styles.dialogScroll}
            contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
            showsVerticalScrollIndicator={false}
          >
            {renderDialogContent()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function file_status_warning() {
  return (
    <View style={styles.pdfWarning}>
      <Ionicons name="warning" size={14} color={Colors.raw.amber500} />
      <Text style={styles.pdfWarningText}>1 Datei ist möglicherweise kein Rechnungsformat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  backArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  typeCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "46%",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  typeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  typeFormat: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginTop: 20,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    lineHeight: 19,
  },
  dialogContainer: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  dialogClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dialogTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
  },
  dialogScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dialogSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.zinc300,
    marginBottom: 10,
  },
  dialogHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 14,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 0,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: Colors.raw.amber500,
  },
  stepDotCurrent: {
    backgroundColor: Colors.raw.amber500,
    shadowColor: Colors.raw.amber500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  stepDotText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  stepDotTextActive: {
    color: "#000",
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc600,
    marginRight: 4,
  },
  stepLabelActive: {
    color: Colors.raw.zinc300,
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.raw.zinc800,
    marginRight: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.raw.amber500,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.raw.zinc600,
    borderRadius: 16,
    backgroundColor: Colors.raw.zinc800,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dropZoneText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
    marginTop: 8,
  },
  dropZoneOr: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
  },
  selectFileBtn: {
    backgroundColor: Colors.raw.zinc700,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  selectFileBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  dropZoneHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginTop: 8,
  },
  fileInfo: {
    alignItems: "center",
    gap: 6,
  },
  fileNameText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  fileSizeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  removeFileBtn: {
    marginTop: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  nextBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  stepBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  backBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc800,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  backBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  mappingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
    gap: 10,
  },
  mappingSource: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mappingSourceText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  mappingTarget: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mappingTargetText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  mappingDropdown: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 6,
    marginTop: -2,
    overflow: "hidden",
  },
  mappingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  mappingOptionActive: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  mappingOptionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  mappingOptionTextActive: {
    color: Colors.raw.amber500,
    fontFamily: "Inter_600SemiBold",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 6,
    gap: 10,
  },
  previewRowContent: {
    flex: 1,
  },
  previewLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  previewDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc400,
    marginTop: 2,
  },
  previewSummary: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    gap: 8,
  },
  previewSummaryLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewSummaryLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  previewSummaryValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  importOptions: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.raw.amber500,
  },
  radioText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  importBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  progressContainer: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  progressLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.raw.amber500,
  },
  progressPercent: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.amber500,
  },
  importDoneContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  importDoneTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  importDoneStats: {
    gap: 4,
    alignItems: "center",
  },
  importDoneStat: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  importDoneBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  reportBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.amber500,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  doneBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#000",
  },
  gaebInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 14,
  },
  gaebInfoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  gaebMeta: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  gaebMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gaebMetaLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  gaebMetaValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.white,
  },
  gaebRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    gap: 10,
  },
  gaebPos: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
    width: 76,
  },
  gaebText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  gaebPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  gaebMore: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  pdfFileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    gap: 8,
  },
  pdfFileName: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  pdfFileSize: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginRight: 4,
  },
  pdfWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  pdfWarningText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  aiBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  aiProcessing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    paddingVertical: 20,
    gap: 12,
  },
  aiProcessingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  aiResultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
    gap: 10,
  },
  aiResultContent: {
    flex: 1,
  },
  aiResultVendor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  aiResultRef: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc400,
    marginTop: 2,
  },
  aiResultAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiResultActionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
});
