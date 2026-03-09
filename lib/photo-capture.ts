import * as ImagePicker from "expo-image-picker";
import { Platform, Alert } from "react-native";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

export interface CapturePhotoOptions {
  projectId: string;
  inspectionType: "erstbegehung" | "zwischenbegehung" | "abnahme";
  sectionId?: string;
  positionId?: string;
  roomName?: string;
  positionTitle?: string;
}

export interface CapturePhotoResult {
  id: string;
  storagePath: string;
  queued?: boolean;
}

export interface QueuedPhotoUploadData {
  storagePath: string;
  projectId: string;
  inspectionType: "erstbegehung" | "zwischenbegehung" | "abnahme";
  sectionId?: string;
  positionId?: string;
  roomName?: string;
  positionTitle?: string;
  fileSizeBytes: number;
  contentType: string;
  base64Data: string;
}

interface QueueOfflineUploadInput {
  label: string;
  detail: string;
  data: QueuedPhotoUploadData;
}

/**
 * On web/iPad: opens native file picker with camera capture via <input capture>.
 * Returns a File/Blob or null if cancelled.
 */
function pickFileFromWebCamera(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // rear camera on iPad/mobile
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      document.body.removeChild(input);
      resolve(file);
    });

    // User cancelled the file picker
    input.addEventListener("cancel", () => {
      document.body.removeChild(input);
      resolve(null);
    });

    // Fallback: if focus returns without change, treat as cancel
    const onFocus = () => {
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
          resolve(null);
        }
      }, 500);
      window.removeEventListener("focus", onFocus);
    };
    window.addEventListener("focus", onFocus);

    input.click();
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Datei konnte nicht gelesen werden"));
        return;
      }
      const [, base64] = reader.result.split(",");
      if (!base64) {
        reject(new Error("Keine Bilddaten erhalten"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

async function insertInspectionPhotoRecord(data: {
  projectId: string;
  sectionId?: string;
  positionId?: string;
  inspectionType: "erstbegehung" | "zwischenbegehung" | "abnahme";
  storagePath: string;
  roomName?: string;
  positionTitle?: string;
  fileSizeBytes: number;
}): Promise<CapturePhotoResult> {
  const { data: insertData, error: insertError } = await supabase
    .from("inspection_photos")
    .insert({
      project_id: data.projectId,
      section_id: data.sectionId || null,
      position_id: data.positionId || null,
      inspection_type: data.inspectionType,
      storage_path: data.storagePath,
      room_name: data.roomName || null,
      position_title: data.positionTitle || null,
      file_size_bytes: data.fileSizeBytes,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  return {
    id: insertData.id,
    storagePath: data.storagePath,
  };
}

export async function uploadQueuedPhoto(data: QueuedPhotoUploadData): Promise<CapturePhotoResult> {
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(data.storagePath, decode(data.base64Data), {
      contentType: data.contentType || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  return insertInspectionPhotoRecord({
    projectId: data.projectId,
    sectionId: data.sectionId,
    positionId: data.positionId,
    inspectionType: data.inspectionType,
    storagePath: data.storagePath,
    roomName: data.roomName,
    positionTitle: data.positionTitle,
    fileSizeBytes: data.fileSizeBytes,
  });
}

export async function captureAndUploadPhoto(
  options: CapturePhotoOptions & {
    isOnline?: boolean;
    queueOfflineUpload?: (input: QueueOfflineUploadInput) => void;
  }
): Promise<CapturePhotoResult | null> {
  const timestamp = Date.now();
  const sectionPart = options.sectionId || "general";
  const positionPart = options.positionId || "none";
  const storagePath = `photos/${options.projectId}/${options.inspectionType}/${sectionPart}/${positionPart}/${timestamp}.jpg`;

  let fileSize = 0;

  try {
    if (Platform.OS === "web") {
      // Web: use native HTML file input with capture for camera access
      const file = await pickFileFromWebCamera();
      if (!file) return null;

      fileSize = file.size;

       if (options.isOnline === false && options.queueOfflineUpload) {
        const base64Data = await readFileAsBase64(file);
        options.queueOfflineUpload({
          label: "Foto-Upload",
          detail: options.positionTitle || options.roomName || "Projektfoto",
          data: {
            storagePath,
            projectId: options.projectId,
            inspectionType: options.inspectionType,
            sectionId: options.sectionId,
            positionId: options.positionId,
            roomName: options.roomName,
            positionTitle: options.positionTitle,
            fileSizeBytes: fileSize,
            contentType: file.type || "image/jpeg",
            base64Data,
          },
        });
        return { id: `queued-${timestamp}`, storagePath, queued: true };
      }

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        Alert.alert("Upload fehlgeschlagen", uploadError.message);
        return null;
      }
    } else {
      // Native: request camera permissions + launch camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Kamera-Zugriff benötigt",
          "Bitte erlauben Sie den Kamera-Zugriff in den Einstellungen."
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const base64 = result.assets[0].base64;
      if (!base64) {
        Alert.alert("Fehler", "Kein Bilddaten erhalten");
        return null;
      }
      fileSize = Math.round(base64.length * 0.75);

      if (options.isOnline === false && options.queueOfflineUpload) {
        options.queueOfflineUpload({
          label: "Foto-Upload",
          detail: options.positionTitle || options.roomName || "Projektfoto",
          data: {
            storagePath,
            projectId: options.projectId,
            inspectionType: options.inspectionType,
            sectionId: options.sectionId,
            positionId: options.positionId,
            roomName: options.roomName,
            positionTitle: options.positionTitle,
            fileSizeBytes: fileSize,
            contentType: "image/jpeg",
            base64Data: base64,
          },
        });
        return { id: `queued-${timestamp}`, storagePath, queued: true };
      }

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, decode(base64), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        Alert.alert("Upload fehlgeschlagen", uploadError.message);
        return null;
      }
    }
  } catch (err: any) {
    Alert.alert("Upload fehlgeschlagen", err.message || "Unbekannter Fehler");
    return null;
  }

  try {
    return await insertInspectionPhotoRecord({
      projectId: options.projectId,
      sectionId: options.sectionId,
      positionId: options.positionId,
      inspectionType: options.inspectionType,
      storagePath,
      roomName: options.roomName,
      positionTitle: options.positionTitle,
      fileSizeBytes: fileSize,
    });
  } catch (err: any) {
    Alert.alert("Speichern fehlgeschlagen", err.message || "Unbekannter Fehler");
    return null;
  }
}
