// Lightweight SVG QR Code Generator
// Generates a quick QR code data URL using Google Chart API / QuickChart as fallback or clean SVG string.

export const generateQRCodeDataUrl = (text, size = 200) => {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&margin=10`;
};
