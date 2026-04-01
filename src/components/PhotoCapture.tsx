import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PhotoCaptureProps {
  onCapture: (base64Image: string) => void;
  currentPhoto?: string;
  className?: string;
}

export default function PhotoCapture({ onCapture, currentPhoto, className }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCapturing(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        setPreview(base64);
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500/30 group">
        {preview ? (
          <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
            <Camera size={40} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Upload Photo"
          >
            <Upload size={18} />
          </button>
          <button 
            onClick={startCamera}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Take Photo"
          >
            <Camera size={18} />
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <AnimatePresence>
        {isCapturing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4"
          >
            <div className="relative max-w-md w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
                <button 
                  onClick={stopCamera}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                  <X size={24} />
                </button>
                <button 
                  onClick={capturePhoto}
                  className="p-4 bg-cyan-500 hover:bg-cyan-400 rounded-full text-black transition-all transform active:scale-95"
                >
                  <Check size={24} />
                </button>
              </div>
            </div>
            <p className="mt-4 text-zinc-400 font-medium">Position yourself in the frame</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
