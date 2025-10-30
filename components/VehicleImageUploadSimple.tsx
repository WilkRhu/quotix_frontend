'use client';

import React, { useState } from 'react';
import { uploadImage, resolveImageUrl } from '../lib/images';

interface VehicleImageUploadSimpleProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  idVeiculo?: string;
}

export default function VehicleImageUploadSimple({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  idVeiculo 
}: VehicleImageUploadSimpleProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const filesToProcess = Array.from(files).slice(0, maxImages - images.length);
    const currentImages = [...images];

    try {
      for (const file of filesToProcess) {
        // Criar preview imediato
        const previewUrl = URL.createObjectURL(file);
        currentImages.push(previewUrl);
        onImagesChange([...currentImages]);

        // Fazer upload
        const imageUrl = await uploadImage(file, idVeiculo ? `veiculos/${idVeiculo}` : 'veiculos');
        
        // Substituir preview pela URL real
        const index = currentImages.indexOf(previewUrl);
        if (index !== -1 && imageUrl) {
          URL.revokeObjectURL(previewUrl);
          currentImages[index] = imageUrl;
          onImagesChange([...currentImages]);
        }
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-4">
      <h5 className="text-primary mb-3">Imagens do Veículo</h5>
      
      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="row mb-3">
          {images.map((img, index) => (
            <div key={index} className="col-md-3 col-sm-4 col-6 mb-3">
              <div className="position-relative">
                <img
                  src={img.startsWith('blob:') || img.startsWith('data:') ? img : resolveImageUrl(img)}
                  alt={`Veículo ${index + 1}`}
                  className="img-fluid rounded"
                  style={{ width: '100%', height: 150, objectFit: 'cover' }}
                  onError={(e) => {
                    console.log('Erro ao carregar imagem:', img);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSI+SW1hZ2VtPC90ZXh0Pgo8L3N2Zz4=';
                  }}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                  onClick={() => handleRemoveImage(index)}
                  style={{ width: 30, height: 30, padding: 0 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < maxImages && (
        <div className="text-center">
          <label className="btn btn-outline-primary btn-lg" style={{ cursor: 'pointer', minHeight: 100, width: '100%' }}>
            {uploading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" />
                <div>Enviando imagens...</div>
              </>
            ) : (
              <>
                <i className="fas fa-camera fa-2x d-block mb-2"></i>
                <div>Clique para adicionar imagens</div>
                <small className="text-muted">Máximo {maxImages} imagens ({images.length}/{maxImages})</small>
              </>
            )}
            <input
              type="file"
              className="d-none"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}