"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./NameVerification.module.css";


// Props for NameVerification: callback when name is verified (with optional video)
interface NameVerificationProps {
  onVerified: (name: string, videoBlob?: Blob) => void;
}


export default function NameVerification({ onVerified }: NameVerificationProps) {
  // State for video stream, name input, recording status, and error
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [name, setName] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  // Refs for video element, media recorder, and recorded chunks
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Request camera and mic access on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setError("Camera and microphone access is required."));
    // Cleanup: stop all tracks on unmount
    return () => {
      if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start recording a short video clip
  const startRecording = () => {
    if (!videoStream) return;
    recordedChunks.current = [];
    const recorder = new MediaRecorder(videoStream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      onVerified(name, blob);
    };
    recorder.start();
    setRecording(true);
    setTimeout(() => {
      recorder.stop();
      setRecording(false);
    }, 3000); // Record for 3 seconds
  };

  // Handle verify button click
  const handleVerify = () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    startRecording();
  };

  return (
        <div className={styles["verification-overlay"]}>
          <div className={styles["verification-modal"]}>
            <h2 className={styles.glow}>Welcome! Please verify your name</h2>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-preview"
              style={{ borderRadius: 16, width: 320, height: 240, background: "#111", boxShadow: "0 0 32px #00fff7" }}
            />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Type your name and say it aloud"
              className={styles["name-input"]}
              disabled={recording}
            />
            <button
              className={styles["verify-btn"]}
              onClick={handleVerify}
              disabled={recording}
            >
              {recording ? "Recording..." : "Verify & Continue"}
            </button>
            {error && <p className={styles["error-msg"]}>{error}</p>}
          </div>
    </div>
  );
}
