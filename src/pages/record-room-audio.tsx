import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function" &&
  typeof window.MediaRecorder === "function";

type RoomParams = {
  roomId: string;
};

export function RecordRoomAudio() {
  const params = useParams<RoomParams>();
  const [isRecording, setIsRecording] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const recorder = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    async function loadDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      setAudioDevices(audioInputs);

      const stereoMix = audioInputs.find((d) =>
        d.label.toLowerCase().includes("stereo mix")
      );
      if (stereoMix) setSelectedDeviceId(stereoMix.deviceId);
    }
    loadDevices();
  }, []);

  function stopRecording() {
    setIsRecording(false);

    if (recorder.current && recorder.current.state !== "inactive") {
      recorder.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  async function uploadAudio(audio: Blob) {
    const formData = new FormData();
    formData.append("file", audio, "audio.webm");
    const response = await fetch(
      `http://localhost:3333/rooms/${params.roomId}/audio`,
      {
        method: "POST",
        body: formData,
      }
    );
    const result = await response.json();
    console.log(result);
  }

  function createRecorder(audio: MediaStream) {
    recorder.current = new MediaRecorder(audio, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 64_000,
    });

    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        uploadAudio(event.data);
      }
    };

    recorder.current.onstart = () => {
      console.log("Gravação iniciada!");
    };

    recorder.current.onstop = () => {
      console.log("Gravação encerrada/pausada");
    };

    recorder.current.start();
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      alert("O seu navegador não suporta gravação");
      return;
    }
    if (!selectedDeviceId) {
      alert("Selecione um dispositivo de áudio.");
      return;
    }

    setIsRecording(true);

    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: selectedDeviceId,
        echoCancellation: false,
        noiseSuppression: false,
        sampleRate: 44_100,
      },
    });

    createRecorder(audioStream);

    intervalRef.current = setInterval(() => {
      recorder.current?.stop();
      createRecorder(audioStream);
    }, 5000);
    ///Podemos mudar a quantidade de tempo de gravação aqui
  }

  if (!params.roomId) {
    return <Navigate replace to="/" />;
  }

  return (
    //Melhorar o select com SHADCN
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      {/* Seleção dos dispositivos de entrada */}
      <div>
        <label htmlFor="audioDevice">Dispositivo de Áudio:</label>
        <select
          id="audioDevice"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {audioDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Dispositivo ${d.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      {isRecording ? (
        <Button onClick={stopRecording}>Pausar gravação</Button>
      ) : (
        <Button onClick={startRecording}>Gravar áudio</Button>
      )}
      {isRecording ? <p>Gravando...</p> : <p>Pausado</p>}
    </div>
  );
}
