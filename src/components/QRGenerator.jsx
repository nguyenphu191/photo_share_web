import React, { useState, useCallback, useEffect } from 'react';

const QRGenerator = ({ userId, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [friendLink, setFriendLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError('');

        // Create friend link
        const link = `${window.location.origin}/add-friend/${userId}`;
        setFriendLink(link);
        
        // Import QRCode dynamically to avoid SSR issues
        const QRCode = await import('qrcode');
        
        const qrUrl = await QRCode.toDataURL(link, {
          width: 256,
          margin: 2,
          color: { 
            dark: '#000000', 
            light: '#FFFFFF' 
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR:', error);
        setError('Không thể tạo mã QR. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      generateQR();
    }
  }, [userId]);

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(friendLink);
      alert('Đã copy link vào clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = friendLink;
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã copy link!');
    }
  }, [friendLink]);

  // Share via Web Share API (if available)
  const shareLink = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kết bạn với tôi trên Photo Share',
          text: 'Hãy kết bạn với tôi!',
          url: friendLink
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyLink(); // Fallback to copy
        }
      }
    } else {
      copyLink(); // Fallback to copy
    }
  }, [friendLink, copyLink]);

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

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-modal-header">
          <h3>Chia sẻ link kết bạn</h3>
          <button 
            className="qr-modal-close"
            onClick={onClose}
            title="Đóng"
            type="button"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="qr-modal-content">
          {loading ? (
            <div className="qr-loading">
              <div className="loading-spinner"></div>
              <p>Đang tạo mã QR...</p>
            </div>
          ) : error ? (
            <div className="qr-error">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button 
                className="retry-btn"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="qr-code-section">
                  <div className="qr-code-container">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code kết bạn" 
                      className="qr-code-image"
                    />
                  </div>
                  <p className="qr-instruction">
                    📱 Quét mã QR này để kết bạn với tôi
                  </p>
                </div>
              )}
              
              {/* Link Section */}
              <div className="friend-link-section">
                <label className="link-label">Hoặc chia sẻ link:</label>
                <div className="link-container">
                  <input 
                    value={friendLink} 
                    readOnly 
                    className="link-input"
                    onClick={(e) => e.target.select()}
                  />
                  <button 
                    className="copy-btn"
                    onClick={copyLink}
                    title="Copy link"
                    type="button"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="qr-actions">
                <button 
                  className="share-btn primary"
                  onClick={shareLink}
                  type="button"
                >
                  📤 Chia sẻ
                </button>
                <button 
                  className="close-btn secondary"
                  onClick={onClose}
                  type="button"
                >
                  Đóng
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;