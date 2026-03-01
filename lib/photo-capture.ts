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

export async function captureAndUploadPhoto(
  options: CapturePhotoOptions
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

  // Insert into inspection_photos
  const { data: insertData, error: insertError } = await supabase
    .from("inspection_photos")
    .insert({
      project_id: options.projectId,
      section_id: options.sectionId || null,
      position_id: options.positionId || null,
      inspection_type: options.inspectionType,
      storage_path: storagePath,
      room_name: options.roomName || null,
      position_title: options.positionTitle || null,
      file_size_bytes: fileSize,
    })
    .select("id")
    .single();

  if (insertError) {
    Alert.alert("Speichern fehlgeschlagen", insertError.message);
    return null;
  }

  return {
    id: insertData.id,
    storagePath,
  };
}
