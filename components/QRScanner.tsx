"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, Maximize, Flashlight, RefreshCcw } from 'lucide-react';
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

  useEffect(() => {
    const initScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const scanner = new Html5Qrcode("qr-reader");
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            handleScan,
            () => { /* ignore */ }
          );

          // Check if torch is supported
          const track = scanner.getRunningTrackCameraCapabilities();
          if (track && track.torchFeature()?.isSupported()) {
            setHasTorch(true);
          }
        }
      } catch (err) {
        console.error("Camera init error", err);
        setScanResult({ type: 'error', error: "Camera not found or permissions denied." });
        setScanning(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleScan = async (decodedText: string) => {
    if (!scanning) return;
    
    setScanning(false);
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.pause();
    }

    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (scannerRef.current?.getState() === 2) { // 2 = PAUSED
      await scannerRef.current.resume();
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
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }} 
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      <header className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0">
        <button onClick={onClose} className="p-2 text-muted hover:text-white transition rounded-full hover:bg-background">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black text-white">QR Scanner</h1>
        <div className="w-10 flex justify-end">
          {hasTorch && (
            <button onClick={toggleTorch} className={`p-2 rounded-full ${torchOn ? 'text-primary' : 'text-muted'}`}>
              <Flashlight className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className={`absolute inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md ${
                scanResult.type === 'success' ? 'bg-primary/95' : 
                scanResult.type === 'warning' ? 'bg-warning/95' : 'bg-danger/95'
              }`}
            >
              <div className="text-center bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
                {scanResult.type === 'success' && <CheckCircle className="h-24 w-24 text-primary mb-4" />}
                {scanResult.type === 'warning' && <AlertTriangle className="h-24 w-24 text-warning mb-4" />}
                {scanResult.type === 'error' && <XCircle className="h-24 w-24 text-danger mb-4" />}
                
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  {scanResult.type === 'success' && "Food Collected!"}
                  {scanResult.type === 'warning' && "Already Collected"}
                  {scanResult.type === 'error' && "Scan Failed"}
                </h2>
                
                {scanResult.name && (
                  <p className="text-xl text-gray-600 font-bold mb-2">
                    {scanResult.name} {scanResult.type === 'success' ? 'has successfully collected food' : ''}
                  </p>
                )}
                
                {scanResult.time && (
                  <p className="text-sm text-gray-500 font-bold mb-6 flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="uppercase text-[10px] tracking-wider text-gray-400">Time:</span> {scanResult.time}
                  </p>
                )}
                
                {scanResult.error && (
                  <p className="text-lg text-danger font-bold mb-6">{scanResult.error}</p>
                )}
                
                <button 
                  onClick={scanNext} 
                  className={`w-full py-4 text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg ${
                    scanResult.type === 'success' ? 'bg-primary hover:bg-primary-dark' : 
                    scanResult.type === 'warning' ? 'bg-warning hover:bg-yellow-600' : 'bg-danger hover:bg-red-700'
                  }`}
                >
                  <RefreshCcw className="h-5 w-5" /> Scan Next
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border border-border">
            <Maximize className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-white">Align QR within frame</span>
          </div>
          
          <div id="qr-reader" className="w-full min-h-[300px]"></div>
          
          <div className="p-6 bg-card border-t border-border text-center">
            <p className="text-sm text-muted">Scanning for student lunch verification codes.</p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
