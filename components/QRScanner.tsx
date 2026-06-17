"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, Maximize, Flashlight, RefreshCcw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onClose: () => void;
  onScanSuccess: () => void;
}

export default function QRScanner({ onClose, onScanSuccess }: QRScannerProps) {
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const scanner = new Html5Qrcode("qr-reader");
          scannerRef.current = scanner;

          try {
            await scanner.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              handleScan,
              () => { /* ignore */ }
            );
          } catch (e) {
            // Fallback to first available camera (useful for laptops without rear camera)
            await scanner.start(
              cameras[0].id,
              { fps: 10, qrbox: { width: 250, height: 250 } },
              handleScan,
              () => { /* ignore */ }
            );
          }

          const track = scanner.getRunningTrackCameraCapabilities();
          if (track && track.torchFeature()?.isSupported()) {
            setHasTorch(true);
          }
        }
      } catch (err) {
        console.error("Camera init error", err);
        setScanResult({ type: 'error', error: "Camera not found or permissions denied. Ensure you are on HTTPS (or Localtunnel) and have granted camera access." });
        setScanning(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          scannerRef.current.stop().catch(console.error);
        }
      }
    };
  }, []);

  const stopScannerSafe = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        }
      } catch (e) {
        console.error("Failed to stop scanner cleanly", e);
      }
    }
  };

  const handleClose = async () => {
    await stopScannerSafe();
    onClose();
  };

  const handleScan = async (decodedText: string) => {
    if (!scanning) return;
    
    setScanning(false);
    await stopScannerSafe();

    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ userId: decodedText })
      });
      const data = await res.json();
      
      if (data.success) {
        setScanResult({ type: 'success', name: data.studentName, time: data.timestamp });
        onScanSuccess();
      } else if (data.alreadyCollected) {
        setScanResult({ type: 'warning', name: data.studentName, time: data.timestamp });
      } else {
        setScanResult({ type: 'error', error: data.error });
      }
    } catch (e) {
      setScanResult({ type: 'error', error: "Network error during scan" });
    }
  };

  const scanNext = async () => {
    setScanResult(null);
    setScanning(true);
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        try {
          await scannerRef.current?.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            handleScan,
            () => { /* ignore */ }
          );
        } catch (e) {
          await scannerRef.current?.start(
            cameras[0].id,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            handleScan,
            () => { /* ignore */ }
          );
        }
      }
    } catch (e) {
      console.error("Failed to restart scanner", e);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Torch error", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className="w-full max-w-md h-[80vh] max-h-[800px] flex flex-col relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
    >
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={handleClose} className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full transition-all">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Scanner Active</span>
        </div>
        <div className="w-10 flex justify-end">
          {hasTorch && (
            <button onClick={toggleTorch} className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${torchOn ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'}`}>
              <Flashlight className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative bg-black">
        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className={`absolute inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl ${
                scanResult.type === 'success' ? 'bg-primary/90' : 
                scanResult.type === 'warning' ? 'bg-warning/90' : 'bg-danger/90'
              }`}
            >
              <div className="text-center glass-panel border-white/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
                {scanResult.type === 'success' && <div className="p-4 bg-white/20 rounded-full mb-6"><CheckCircle className="h-16 w-16 text-white" /></div>}
                {scanResult.type === 'warning' && <div className="p-4 bg-white/20 rounded-full mb-6"><AlertTriangle className="h-16 w-16 text-white" /></div>}
                {scanResult.type === 'error' && <div className="p-4 bg-white/20 rounded-full mb-6"><XCircle className="h-16 w-16 text-white" /></div>}
                
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                  {scanResult.type === 'success' && "Food Collected!"}
                  {scanResult.type === 'warning' && "Already Collected"}
                  {scanResult.type === 'error' && "Scan Failed"}
                </h2>
                
                {scanResult.name && (
                  <p className="text-lg text-white/90 font-medium mb-4">
                    {scanResult.name} {scanResult.type === 'success' ? 'verified' : ''}
                  </p>
                )}
                
                {scanResult.time && (
                  <p className="text-xs text-white/70 font-bold mb-8 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl">
                    <Clock className="h-3.5 w-3.5" /> {scanResult.time}
                  </p>
                )}
                
                {scanResult.error && (
                  <p className="text-lg text-white font-bold mb-8 bg-black/20 px-4 py-3 rounded-xl">{scanResult.error}</p>
                )}
                
                <button 
                  onClick={scanNext} 
                  className="w-full py-4 bg-white hover:bg-slate-100 text-black font-black rounded-xl flex justify-center items-center gap-2 shadow-xl transition-all active:scale-[0.98]"
                >
                  <RefreshCcw className="h-5 w-5" /> Scan Next
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-full relative group">
          <div className="absolute inset-0 pointer-events-none z-10 border-[40px] border-black/40 mix-blend-multiply" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-primary/50 rounded-3xl z-10 pointer-events-none">
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-3xl" />
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }} 
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-primary/80 shadow-[0_0_10px_rgba(16,185,129,0.8)]" 
            />
          </div>
          
          <div id="qr-reader" className="w-full h-full object-cover [&>video]:object-cover [&>video]:h-full"></div>
        </div>
      </main>
    </motion.div>
  );
}
