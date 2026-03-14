import { Platform, Alert } from "react-native";
import { supabase } from "./supabase";

// expo-av is optional — native only
let Audio: any = null;
try {
  Audio = require("expo-av").Audio;
} catch {
  // Web or expo-av not installed — audio recording unavailable
}

export interface AudioRecording {
  stop: () => Promise<{ uri: string; durationMs: number }>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  getStatus: () => Promise<{ isRecording: boolean; durationMs: number }>;
}

export async function requestAudioPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  if (!Audio) {
    Alert.alert("Fehler", "Audio-Aufnahme ist auf dieser Plattform nicht verfügbar.");
    return false;
  }

  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) {
    Alert.alert("Mikrofon-Zugriff benötigt", "Bitte erlauben Sie den Mikrofon-Zugriff in den Einstellungen.");
  }
  return granted;
}

// Web recording via MediaRecorder
let webRecorder: MediaRecorder | null = null;
let webChunks: Blob[] = [];
let webStartTime = 0;

export async function startRecording(): Promise<AudioRecording | null> {
  if (Platform.OS === "web") {
    return startWebRecording();
  }
  return startNativeRecording();
}

async function startWebRecording(): Promise<AudioRecording | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    webChunks = [];
    webStartTime = Date.now();
    webRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    webRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) webChunks.push(e.data);
    };

    webRecorder.start(1000); // collect chunks every second

    return {
      stop: () =>
        new Promise((resolve) => {
          if (!webRecorder) {
            resolve({ uri: "", durationMs: 0 });
            return;
          }
          webRecorder.onstop = () => {
            const blob = new Blob(webChunks, { type: "audio/webm" });
            const uri = URL.createObjectURL(blob);
            const durationMs = Date.now() - webStartTime;
            stream.getTracks().forEach((t) => t.stop());
            webRecorder = null;
            resolve({ uri, durationMs });
          };
          webRecorder.stop();
        }),
      pause: async () => {
        webRecorder?.pause();
      },
      resume: async () => {
        webRecorder?.resume();
      },
      getStatus: async () => ({
        isRecording: webRecorder?.state === "recording",
        durationMs: Date.now() - webStartTime,
      }),
    };
  } catch (err: any) {
    Alert.alert("Aufnahme fehlgeschlagen", err.message || "Mikrofon nicht verfügbar");
    return null;
  }
}

async function startNativeRecording(): Promise<AudioRecording | null> {
  if (!Audio) {
    Alert.alert("Fehler", "expo-av nicht verfügbar");
    return null;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    return {
      stop: async () => {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI() || "";
        const status = await recording.getStatusAsync();
        return { uri, durationMs: status.durationMillis || 0 };
      },
      pause: async () => {
        await recording.pauseAsync();
      },
      resume: async () => {
        await recording.startAsync();
      },
      getStatus: async () => {
        const status = await recording.getStatusAsync();
        return {
          isRecording: status.isRecording || false,
          durationMs: status.durationMillis || 0,
        };
      },
    };
  } catch (err: any) {
    Alert.alert("Aufnahme fehlgeschlagen", err.message || "Unbekannter Fehler");
    return null;
  }
}

export async function uploadAudioFile(
  projectId: string,
  fileUri: string,
  durationMs: number
): Promise<{ storagePath: string } | null> {
  const timestamp = Date.now();
  const ext = Platform.OS === "web" ? "webm" : "m4a";
  const storagePath = `audio/${projectId}/capture_${timestamp}.${ext}`;

  try {
    if (Platform.OS === "web") {
      // fileUri is a blob URL on web
      const resp = await fetch(fileUri);
      const blob = await resp.blob();

      const { error } = await supabase.storage
        .from("project-files")
        .upload(storagePath, blob, {
          contentType: ext === "webm" ? "audio/webm" : "audio/mp4",
          upsert: false,
        });

      if (error) throw error;
    } else {
      // Native: read file and upload
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from("project-files")
        .upload(storagePath, blob, {
          contentType: "audio/mp4",
          upsert: false,
        });

      if (error) throw error;
    }

    return { storagePath };
  } catch (err: any) {
    Alert.alert("Audio-Upload fehlgeschlagen", err.message || "Unbekannter Fehler");
    return null;
  }
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
