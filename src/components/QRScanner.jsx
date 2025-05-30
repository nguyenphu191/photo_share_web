import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQR();
      } catch (error) {
        console.error('Camera error:', error);
        alert('Không thể truy cập camera');
      }
    };

    const scanQR = () => {
      if (!scanning) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setScanning(false);
          onScanSuccess(code.data);
          return;
        }
      }
      
      requestAnimationFrame(scanQR);
    };

    startCamera();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning, onScanSuccess]);

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner" onClick={e => e.stopPropagation()}>
        <div className="scanner-header">
          <h3>Quét mã QR</h3>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="scanner-content">
          <video ref={videoRef} style={{ width: '100%', maxWidth: '400px' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p>Hướng camera vào mã QR để kết bạn</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;