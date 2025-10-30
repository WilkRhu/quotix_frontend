import VehicleImageUpload from './VehicleImageUpload';
import React from 'react';

const PARTS = [
  { key: 'frente', label: 'Frente' },
  { key: 'verso', label: 'Verso' },
  { key: 'lado_direito', label: 'Lado Direito' },
  { key: 'lado_esquerdo', label: 'Lado Esquerdo' },
  { key: 'painel_interno', label: 'Painel Interno' },
  { key: 'pneus', label: 'Pneus' },
];

export interface VehicleImagesByPart {
  [key: string]: string[];
}

interface VehicleImageUploadCardsProps {
  imagesByPart: VehicleImagesByPart;
  onImagesChange: (images: VehicleImagesByPart) => void;
}

export default function VehicleImageUploadCards({ imagesByPart, onImagesChange }: VehicleImageUploadCardsProps) {
  const handlePartImagesChange = (partKey: string, images: string[]) => {
    const updated = { ...imagesByPart, [partKey]: images };
    onImagesChange(updated);
  };

  return (
    <div className="row">
      {PARTS.map(part => (
        <div className="col-md-4 mb-4" key={part.key}>
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              {part.label}
            </div>
            <div className="card-body">
              <VehicleImageUpload
                onImagesChange={imgs => handlePartImagesChange(part.key, imgs)}
                maxImages={2}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
