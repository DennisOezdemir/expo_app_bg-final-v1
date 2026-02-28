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

export async function captureAndUploadPhoto(
  options: CapturePhotoOptions
): Promise<CapturePhotoResult | null> {
  // 1. Request camera permissions
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Kamera-Zugriff benötigt",
        "Bitte erlauben Sie den Kamera-Zugriff in den Einstellungen."
      );
      return null;
    }
  }

  // 2. Launch camera (or image library on web)
  // Request base64 on native to avoid the fetch+blob issue
  let result: ImagePicker.ImagePickerResult;
  if (Platform.OS === "web") {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
  } else {
    result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
      base64: true,
    });
  }

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  // 3. Upload to Supabase Storage
  const timestamp = Date.now();
  const sectionPart = options.sectionId || "general";
  const positionPart = options.positionId || "none";
  const storagePath = `photos/${options.projectId}/${options.inspectionType}/${sectionPart}/${positionPart}/${timestamp}.jpg`;

  let fileSize = 0;

  try {
    if (Platform.OS === "web") {
      // Web: fetch + blob works fine
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      fileSize = blob.size;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        Alert.alert("Upload fehlgeschlagen", uploadError.message);
        return null;
      }
    } else {
      // Native: use base64 from ImagePicker directly, decode to ArrayBuffer
      const base64 = asset.base64;
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

  // 4. Insert into inspection_photos
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
