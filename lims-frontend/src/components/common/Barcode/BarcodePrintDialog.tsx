import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';

interface BarcodePrintDialogProps {
  open: boolean;
  onClose: () => void;
  barcodeNumber: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  registrationDate?: Date;
}

export const BarcodePrintDialog: React.FC<BarcodePrintDialogProps> = ({
  open,
  onClose,
  barcodeNumber,
  patientName,
  patientAge,
  patientGender,
  registrationDate,
}) => {
  const [copies, setCopies] = useState<number>(1);
  const [rotate, setRotate] = useState<boolean>(false);

  // Format gender for display
  const genderDisplay = patientGender
    ? patientGender === 'MALE' ? 'M' : patientGender === 'FEMALE' ? 'F' : 'O'
    : '';

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    const hour12 = d.getHours() % 12 || 12;
    return `${day}/${month}/${year} ${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Build patient info line
  const patientInfo = [
    patientName.toUpperCase(),
    patientAge ? `${patientAge} years` : '',
    genderDisplay ? `(${genderDisplay})` : ''
  ].filter(Boolean).join(' ');

  const dateInfo = formatDate(registrationDate || new Date());

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print barcodes');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes - ${patientName}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <style>
            body {
              margin: 0;
              padding: 10px;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .barcode-wrapper {
              width: ${rotate ? '25mm' : '50mm'};
              height: ${rotate ? '50mm' : '25mm'};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px dashed #ccc;
              box-sizing: border-box;
              page-break-inside: avoid;
              overflow: hidden;
              padding: 2mm;
            }
            .barcode-svg {
              flex-shrink: 0;
            }
            .patient-info {
              font-size: 7pt;
              text-align: center;
              line-height: 1.2;
              margin-top: 1mm;
              font-weight: bold;
            }
            .date-info {
              font-size: 6pt;
              text-align: center;
              color: #333;
            }
            /* Hide border when printing */
            @media print {
              .barcode-wrapper {
                border: none;
              }
            }
            svg {
              max-width: 100%;
              height: auto;
              ${rotate ? 'transform: rotate(90deg);' : ''} 
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${Array.from({ length: copies }).map(() => `
              <div class="barcode-wrapper">
                 <svg class="barcode barcode-svg"
                      jsbarcode-value="${barcodeNumber}"
                      jsbarcode-width="1.2"
                      jsbarcode-height="25"
                      jsbarcode-fontSize="10"
                      jsbarcode-margin="0"
                      jsbarcode-displayValue="true">
                 </svg>
                 <div class="patient-info">${patientInfo}</div>
                 <div class="date-info">${dateInfo}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = () => {
              JsBarcode(".barcode").init();
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Patient Barcodes</DialogTitle>
          <DialogDescription>
            Generate barcode stickers for {patientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Barcode Number</p>
              <p className="text-2xl font-mono tracking-wider font-bold text-primary">{barcodeNumber}</p>
            </div>
            <Printer className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="copies">Number of Copies</Label>
              <Input
                id="copies"
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="vertical"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={rotate}
                  onChange={(e) => setRotate(e.target.checked)}
                />
                <Label htmlFor="vertical" className="font-normal cursor-pointer">
                  Vertical (Rotate 90°)
                </Label>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Size: {rotate ? '2.5 x 5 cm (Vertical)' : '5 x 2.5 cm (Horizontal)'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Stickers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
