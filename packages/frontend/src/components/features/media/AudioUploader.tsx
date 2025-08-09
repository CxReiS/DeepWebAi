import { useState } from "react";
import { useAudioTranscription } from "../../../hooks/useMediaProcessing";

export function AudioUploader() {
  const [file, setFile] = useState<File | null>(null);
  const { transcribe, isTranscribing, transcript } = useAudioTranscription();

  const handleUpload = async () => {
    if (file) {
      await transcribe(file);
    }
  };

  return (
    <div className="audio-uploader">
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={!file || isTranscribing}>
        {isTranscribing ? "Transcribing..." : "Transcribe Audio"}
      </button>
      {transcript && (
        <div className="transcript">
          <h3>Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
