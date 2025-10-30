import React, { useState, useRef } from 'react';
import { uploadImage, resolveImageUrl } from '../lib/images';

export interface DynamicCard {
  id: number;
  title: string;
  images: string[];
}

interface DynamicVehicleImageUploadCardsProps {
  cards: DynamicCard[];
  onCardsChange: (cards: DynamicCard[]) => void;
  maxCards?: number;
  idVeiculo?: string;
  tipoVeiculo?: string;
  clienteId?: string;
}

export default function DynamicVehicleImageUploadCards({ cards, onCardsChange, maxCards = 15, idVeiculo, tipoVeiculo, clienteId }: DynamicVehicleImageUploadCardsProps) {
  // Gera id único para cada card
  const generateId = () => Date.now() + Math.floor(Math.random() * 10000);
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});

  const handleAddCard = () => {
    if (cards.length >= maxCards) return;
    const newCard = { id: generateId(), title: '', images: [] };
    onCardsChange([...cards, newCard]);
  };

  const handleTitleChange = (id: number, title: string) => {
    onCardsChange(cards.map(card => card.id === id ? { ...card, title: title.slice(0, 30) } : card));
  };

  const handleFileSelect = async (cardId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.images.length >= 2) return;

    setUploading(prev => ({ ...prev, [cardId]: true }));

    const filesToProcess = Array.from(files).slice(0, 2 - card.images.length);
    const currentImages = [...card.images];

    try {
      for (const file of filesToProcess) {
        // Criar preview imediato
        const previewUrl = URL.createObjectURL(file);
        currentImages.push(previewUrl);
        
        // Atualizar estado com preview
        onCardsChange(cards.map(c => 
          c.id === cardId ? { ...c, images: [...currentImages] } : c
        ));

        // Fazer upload
        const pasta = clienteId && idVeiculo ? `vendedores/${clienteId}/${idVeiculo}` : 'veiculos';
        const imageUrl = await uploadImage(file, pasta);
        
        // Substituir preview pela URL real
        const index = currentImages.indexOf(previewUrl);
        if (index !== -1 && imageUrl) {
          URL.revokeObjectURL(previewUrl);
          currentImages[index] = imageUrl;
          onCardsChange(cards.map(c => 
            c.id === cardId ? { ...c, images: [...currentImages] } : c
          ));
        }
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(prev => ({ ...prev, [cardId]: false }));
    }
  };

  const handleRemoveImage = (cardId: number, imageIndex: number) => {
    onCardsChange(cards.map(card => 
      card.id === cardId 
        ? { ...card, images: card.images.filter((_, i) => i !== imageIndex) }
        : card
    ));
  };

  const handleRemoveCard = (id: number) => {
    onCardsChange(cards.filter(card => card.id !== id));
  };

  const getVehicleIcon = () => {
    switch (tipoVeiculo?.toLowerCase()) {
      case 'carro':
        return 'fas fa-car';
      case 'moto':
        return 'fas fa-motorcycle';
      case 'caminhão':
      case 'caminhao':
        return 'fas fa-truck';
      case 'ônibus':
      case 'onibus':
        return 'fas fa-bus';
      default:
        return 'fas fa-camera';
    }
  };

  return (
    <div className="row">
      {cards.map((card) => (
        <div className="col-md-4 mb-4" key={card.id}>
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between text-white" style={{ backgroundColor: '#5e72e4' }}>
              <input
                type="text"
                className="form-control form-control-sm me-2"
                placeholder="Título da parte do veículo"
                value={card.title}
                maxLength={30}
                onChange={e => handleTitleChange(card.id, e.target.value)}
                style={{ 
                  width: '70%', 
                  backgroundColor: '#5e72e4',
                  border: 'none', 
                  color: 'white'
                }}
              />
              <button type="button" className="btn btn-danger btn-sm" title="Remover card" onClick={() => handleRemoveCard(card.id)}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
            <div className="card-body">
              {/* Preview das imagens reais ou placeholder */}
              <div className="mb-3 d-flex flex-wrap gap-2 justify-content-center">
                {[0, 1].map((slotIdx) => {
                  const img = card.images[slotIdx];
                  return img ? (
                    <div key={slotIdx} className="position-relative">
                      <img
                        src={img.startsWith('blob:') || img.startsWith('data:') ? img : resolveImageUrl(img)}
                        alt={`Preview ${slotIdx + 1}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                        onError={(e) => {
                          console.log('Erro ao carregar imagem:', img);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5Ij5JbWFnZW08L3RleHQ+Cjwvc3ZnPg==';
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute top-0 end-0"
                        style={{ transform: 'translate(50%, -50%)', width: 20, height: 20, padding: 0, fontSize: 10 }}
                        onClick={() => handleRemoveImage(card.id, slotIdx)}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div key={slotIdx} className="d-flex align-items-center justify-content-center bg-light" style={{ width: 80, height: 80, borderRadius: 8, border: '1px dashed #bbb' }}>
                      <i className="fas fa-camera text-secondary fa-lg" />
                    </div>
                  );
                })}
              </div>
              
              {/* Upload area */}
              {card.images.length < 2 && (
                <div className="text-center">
                  <label className="btn btn-outline-secondary w-100" style={{ cursor: 'pointer', minHeight: 60 }}>
                    {uploading[card.id] ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className={`${getVehicleIcon()} me-2`}></i>
                        Adicionar Imagem
                      </>
                    )}
                    <input
                      type="file"
                      className="d-none"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileSelect(card.id, e)}
                      disabled={uploading[card.id]}
                    />
                  </label>
                  <small className="text-muted d-block mt-1">
                    {card.images.length}/2 imagens
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {cards.length < maxCards && (
        <div className="col-md-4 mb-4 d-flex align-items-center justify-content-center">
          <button type="button" className="btn btn-outline-primary btn-lg" style={{ height: 120, width: '100%' }} onClick={handleAddCard}>
            <i className="fas fa-plus fa-2x"></i>
            <div>Adicionar Card</div>
          </button>
        </div>
      )}
    </div>
  );
}
