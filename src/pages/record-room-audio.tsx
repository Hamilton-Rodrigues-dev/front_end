import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowBigLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

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
  }

  if (!params.roomId) {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="relative min-h-screen">
      <Link to={`/room/${params.roomId}`} className="absolute top-6 left-10">
        <Button
          className="cursor-pointer hover:[#1b1718] px-4 py-2 rounded-md shadow-md"
          variant="default"
        >
          <ArrowBigLeft />
          Voltar para a Sala
        </Button>
      </Link>
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="flex flex-col items-center justify-center p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Gravar áudio da Sala</h1>
          <Select
            value={selectedDeviceId}
            onValueChange={setSelectedDeviceId}
            disabled={!isRecordingSupported}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Selecione um dispositivo de áudio" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Dispositivos de Áudio</SelectLabel>
                {audioDevices.map((device) => (
                  <SelectItem
                    className="cursor-pointer"
                    key={device.deviceId}
                    value={device.deviceId}
                  >
                    {device.label || "Dispositivo sem nome"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            className="mt-4 w-full cursor-pointer"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isRecordingSupported || !selectedDeviceId}
          >
            {isRecording ? "Parar Gravação" : "Iniciar Gravação"}
          </Button>
          {isRecording ? <p>Gravando...</p> : <p>Pausado</p>}
        </Card>
      </div>
    </div>
  );
}
