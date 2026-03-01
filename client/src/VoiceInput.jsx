import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import api from './api';

export default function VoiceInput({ onItemsRecognized }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);

        const formData = new FormData();
        formData.append('audio', blob, 'voice_command.webm');

        try {
          const res = await api.post('/api/voice-command', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (res.data.matches && res.data.matches.length > 0) {
            onItemsRecognized(res.data.matches);
          } else {
            // Optional: notify user of no match
            console.log("No items matched");
          }
        } catch (err) {
          console.error('Voice command failed', err);
          // Optional: notify user of error
        } finally {
          setIsProcessing(false);
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied', err);
      alert('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={toggleRecording}
      disabled={isProcessing}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
        isRecording 
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-red-300' 
          : isProcessing 
            ? 'bg-blue-50 text-blue-500 cursor-wait' 
            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
      }`}
      title={isRecording ? "Stop Recording" : "Voice Command (Speak items)"}
    >
      {isProcessing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={18} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}
