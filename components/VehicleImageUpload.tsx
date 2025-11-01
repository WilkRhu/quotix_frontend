'use client';

import { useState, useRef } from 'react';
import { resolveImageUrl } from '../lib/images';
import { API_BASE_URL } from '../lib/api';

interface VehicleImageUploadProps {
  onImagesChange: (images: any[]) => void;
  maxImages?: number;
  pasta?: string;
}

export default function VehicleImageUpload({ 
  onImagesChange, 
  maxImages = 5,
  pasta = 'veiculos'
}: VehicleImageUploadProps) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let files: FileList | null = null;
    if ('dataTransfer' in event) {
      files = event.dataTransfer.files;
    } else {
      files = event.target.files;
    }
    if (!files || images.length >= maxImages) return;

    setUploading(true);
    const newImages: any[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, maxImages - images.length); i++) {
        const file = files[i];
        
        // Converter para base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove prefixo data:image/...
          };
          reader.readAsDataURL(file);
        });
        
        // Criar objeto com URL blob e dados base64
        const blobUrl = URL.createObjectURL(file);
        const imageData = {
          url: blobUrl,
          base64: base64,
          name: file.name
        };
        
        newImages.push(imageData);
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="mb-3">
      <label className="form-label">Imagens do Veículo</label>
      {images.length < maxImages && (
        <div
          className="mb-3 border border-2 rounded d-flex flex-column align-items-center justify-content-center bg-light"
          style={{ minHeight: 180, cursor: 'pointer', position: 'relative' }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.preventDefault(); handleFileSelect(e); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: 120 }}>
            <i className="fas fa-car fa-3x text-secondary mb-2"></i>
            <span className="text-muted">Arraste e solte ou clique para enviar</span>
          </div>
          <small className="text-muted position-absolute bottom-0 mb-2">
            Máximo {maxImages} imagens. {images.length}/{maxImages} enviadas.
          </small>
        </div>
      )}

      {uploading && (
        <div className="text-center mb-3">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Enviando...</span>
          </div>
          <span className="ms-2">Enviando imagens...</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="row">
          {images.map((image, index) => (
            <div key={index} className="col-md-12 mb-3">
              <div className="card">
                <img
                  src={typeof image === 'string' ? resolveImageUrl(image) : image.url}
                  alt={`Veículo ${index + 1}`}
                  className="card-img-top"
                  style={{ height: '150px', objectFit: 'cover' }}
                />
                <div className="card-body p-2">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm w-100"
                    onClick={() => removeImage(index)}
                  >
                    <i className="fas fa-trash"></i> Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}