import React, { useRef, useEffect, useState, useCallback } from 'react';

const QRScanner = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Start camera and scan QR
  useEffect(() => {
    let animationId;
    let jsQR;

    const initializeScanner = async () => {
      try {
        setLoading(true);
        setError('');

        // Import jsQR dynamically
        const jsQRModule = await import('jsqr');
        jsQR = jsQRModule.default;

        // Start camera
        await startCamera();
        
        setLoading(false);
        
        // Start scanning loop
        scanQR();
      } catch (error) {
        console.error('Scanner initialization error:', error);
        setError(getErrorMessage(error));
        setLoading(false);
      }
    };

    const startCamera = async () => {
      try {
        // Try back camera first (better for QR scanning)
        let constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          // Fallback to any available camera
          constraints = { video: true };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        throw new Error(`Camera access failed: ${error.message}`);
      }
    };

    const scanQR = () => {
      if (!scanning || !jsQR) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        animationId = requestAnimationFrame(scanQR);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          console.log('🔍 QR Code detected:', code.data);
          setScanning(false);
          onScanSuccess(code.data);
          return;
        }
      }
      
      animationId = requestAnimationFrame(scanQR);
    };

    const getErrorMessage = (error) => {
      if (error.name === 'NotAllowedError') {
        return 'Bạn cần cấp quyền truy cập camera để quét QR code';
      } else if (error.name === 'NotFoundError') {
        return 'Không tìm thấy camera trên thiết bị';
      } else if (error.name === 'NotSupportedError') {
        return 'Trình duyệt không hỗ trợ camera';
      } else if (error.name === 'NotReadableError') {
        return 'Camera đang được sử dụng bởi ứng dụng khác';
      } else {
        return `Lỗi camera: ${error.message}`;
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      setScanning(false);
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [scanning, onScanSuccess]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleRetry = useCallback(() => {
    setError('');
    setLoading(true);
    setScanning(true);
  }, []);

  const handleManualInput = useCallback(() => {
    const link = prompt('Nhập link kết bạn:');
    if (link && link.trim()) {
      onScanSuccess(link.trim());
    }
  }, [onScanSuccess]);

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scanner-header">
          <h3>Quét mã QR kết bạn</h3>
          <button 
            className="scanner-close"
            onClick={onClose}
            title="Đóng"
            type="button"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="scanner-content">
          {loading ? (
            <div className="scanner-loading">
              <div className="loading-spinner"></div>
              <p>Đang khởi động camera...</p>
            </div>
          ) : error ? (
            <div className="scanner-error">
              <div className="error-icon">📷</div>
              <p>{error}</p>
              <div className="error-actions">
                <button className="retry-btn" onClick={handleRetry}>
                  Thử lại
                </button>
                <button className="manual-btn" onClick={handleManualInput}>
                  Nhập link thủ công
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Video Scanner */}
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  className="scanner-video"
                  playsInline
                  muted
                />
                <canvas 
                  ref={canvasRef} 
                  className="scanner-canvas"
                />
                
                {/* Scan Frame Overlay */}
                <div className="scan-frame">
                  <div className="scan-corners">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                  <div className="scan-line"></div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="scanner-instructions">
                <p className="instruction-text">
                  📱 Hướng camera vào mã QR để kết bạn
                </p>
                <p className="instruction-tip">
                  Đảm bảo mã QR nằm trong khung quét
                </p>
              </div>

              {/* Action Buttons */}
              <div className="scanner-actions">
                <button 
                  className="manual-input-btn"
                  onClick={handleManualInput}
                  type="button"
                >
                  ⌨️ Nhập link thủ công
                </button>
                <button 
                  className="cancel-btn"
                  onClick={onClose}
                  type="button"
                >
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;