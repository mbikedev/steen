'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Camera } from 'lucide-react';

interface ResidentBadgeData {
  badgeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  ovNumber: string;
  roomNumber: string;
  photo?: string;
}

interface BadgeGeneratorProps {
  resident: ResidentBadgeData;
  onPhotoUpload?: (photo: string) => void;
}

export default function BadgeGenerator({ resident, onPhotoUpload }: BadgeGeneratorProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<string>(resident.photo || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('BadgeGenerator received resident data:', resident);
    console.log('OVN Number:', resident.ovNumber);
    console.log('Room Number:', resident.roomNumber);
  }, [resident]);

  // Update photo when resident changes
  useEffect(() => {
    setPhoto(resident.photo || '');
  }, [resident.badgeNumber, resident.photo]); // Re-run when badge number or photo changes

  // Generate barcode
  const generateBarcode = () => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, resident.badgeNumber, {
      format: "CODE128",
      width: 1.5,
      height: 50,
      displayValue: false,
      margin: 0,
    });
    return canvas.toDataURL('image/png');
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
        onPhotoUpload?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    const printContent = badgeRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'width=1016,height=648');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Badge Print</title>
            <style>
              @page {
                size: 85.6mm 54mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .badge-container {
                width: 85.6mm;
                height: 54mm;
                position: relative;
                page-break-after: always;
              }
              ${badgeStyles}
            </style>
          </head>
          <body>
            <div class="badge-container">
              ${printContent}
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const badgeStyles = `
    .badge-container {
      font-family: Arial, sans-serif;
    }
    .badge-content {
      width: 100%;
      height: 100%;
      display: flex;
      background: white;
      position: relative;
      overflow: hidden;
    }
    .badge-left {
      flex: 1;
      width: 55.6mm;
      display: flex;
      flex-direction: column;
      position: relative;
      border-right: 1px solid #000;
    }
    .badge-right {
      width: 30mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 1mm;
    }
    .barcode-row {
      height: 11mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #000;
      background: white;
    }
    .barcode-image {
      height: 9mm;
      width: auto;
    }
    .badge-number-row {
      height: 7mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #000;
      font-size: 16pt;
      font-weight: bold;
    }
    .info-row {
      height: 6.5mm;
      border-bottom: 1px solid #000;
      padding: 0 2mm;
      font-size: 10pt;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .info-row.lastname {
      height: 7mm;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      justify-content: center;
      text-align: center;
    }
    .info-row.firstname {
      height: 7mm;
      font-size: 13pt;
      font-weight: bold;
      justify-content: center;
      text-align: center;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .photo-container {
      width: 25mm;
      height: 32mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      overflow: hidden;
      margin-top: 5mm;
      border: 1px solid #ddd;
    }
    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .facility-info {
      text-align: center;
      font-size: 8pt;
      line-height: 1.4;
      font-weight: bold;
      margin-top: auto;
      padding-bottom: 2mm;
    }
  `;

  return (
    <div className="badge-generator">
      {/* Badge Preview */}
      <div className="badge-preview mb-6">
        <h3 className="text-lg font-bold mb-3">Badge Preview</h3>
        <div 
          ref={badgeRef}
          className="badge-container"
          style={{
            width: '85.6mm',
            height: '54mm',
            border: '2px solid #333',
            borderRadius: '4px',
            overflow: 'hidden',
            background: 'white',
            margin: '0 auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: badgeStyles }} />
          <div className="badge-content">
            <div className="badge-left">
              {/* Barcode Row */}
              <div className="barcode-row">
                <img 
                  src={generateBarcode()} 
                  alt="Barcode"
                  className="barcode-image"
                />
              </div>
              
              {/* Badge Number Row */}
              <div className="badge-number-row">{resident.badgeNumber}</div>
              
              {/* Last Name Row */}
              <div className="info-row lastname">{(resident.lastName || '').toUpperCase()}</div>
              
              {/* First Name Row */}
              <div className="info-row firstname">{resident.firstName}</div>
              
              {/* Birth Date Row */}
              <div className="info-row">Geboorte : {resident.dateOfBirth}</div>
              
              {/* Nationality Row */}
              <div className="info-row">Nationaliteit : {resident.nationality}</div>
              
              {/* OVN Row */}
              <div className="info-row">OVN : {resident.ovNumber || ''}</div>
              
              {/* Room Number Row */}
              <div className="info-row">Kamer : {resident.roomNumber || ''}</div>
            </div>
            
            <div className="badge-right">
              {/* Photo */}
              <div className="photo-container">
                {photo ? (
                  <img src={photo} alt="Resident" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Camera className="h-8 w-8 mb-1" />
                    <span className="text-xs">No Photo</span>
                  </div>
                )}
              </div>
              
              {/* Facility Info */}
              <div className="facility-info">
                <div>Keizerinlaan 2,</div>
                <div>1820 Steenokkerzeel</div>
                <div style={{ marginTop: '2mm' }}>02/755 23 60</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="badge-controls flex gap-4 justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Upload Photo
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Print Badge (Zebra ZC 350)
        </button>
      </div>

      {/* Printer Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-bold text-sm mb-2">Zebra ZC 350 Printer Settings:</h4>
        <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
          <li>• Card Size: CR80 (85.6mm x 54mm / 3.375" x 2.125")</li>
          <li>• Orientation: Landscape</li>
          <li>• Print Quality: High</li>
          <li>• Color Mode: Color (if using color ribbon)</li>
          <li>• Ensure the printer driver is set to "Actual Size" or "100%" scaling</li>
        </ul>
      </div>
    </div>
  );
}