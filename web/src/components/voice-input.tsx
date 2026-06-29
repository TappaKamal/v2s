"use client";

import { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTask } from "@/app/actions/tasks";

export default function VoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setStatus("error");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("listening");
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      const current = event.results[event.results.length - 1];
      setTranscript(current[0].transcript);
    };

    recognition.onend = async () => {
      setIsListening(false);
      if (transcript) {
        await processVoice(transcript);
      } else {
        setStatus("idle");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatus("error");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const processVoice = async (text: string) => {
    setIsProcessing(true);
    setStatus("processing");

    try {
      const response = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) throw new Error("Failed to process voice");

      const taskData = await response.json();
      await createTask(taskData);
      setStatus("success");
      setTranscript("");

      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        className={`gap-2 rounded-full transition-all ${
          isListening
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
            : "border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-400"
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        {isListening ? "Stop" : isProcessing ? "Creating..." : "Voice Task"}
      </Button>

      {transcript && (
        <span className="text-sm text-muted-foreground italic max-w-xs truncate">
          "{transcript}"
        </span>
      )}

      {status === "success" && (
        <span className="text-sm text-green-500 font-medium">✓ Task created!</span>
      )}

      {status === "error" && (
        <span className="text-sm text-red-400">Voice not supported or failed</span>
      )}
    </div>
  );
}
