import React, { useState, useCallback } from 'react';
import QRCode from 'qrcode';

const QRGenerator = ({ userId, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [friendLink, setFriendLink] = useState('');

  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const link = `${window.location.origin}/add-friend/${userId}`;
        setFriendLink(link);
        
        const qrUrl = await QRCode.toDataURL(link, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    };

    if (userId) generateQR();
  }, [userId]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(friendLink);
    alert('Đã copy link!');
  }, [friendLink]);

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={e => e.stopPropagation()}>
        <div className="qr-header">
          <h3>Chia sẻ link kết bạn</h3>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="qr-content">
          {qrCodeUrl && (
            <div className="qr-code">
              <img src={qrCodeUrl} alt="QR Code" />
              <p>Quét mã QR để kết bạn</p>
            </div>
          )}
          
          <div className="friend-link">
            <input value={friendLink} readOnly />
            <button onClick={copyLink}>Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;