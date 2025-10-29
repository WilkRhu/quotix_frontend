import React, { useRef, useState } from 'react'

interface UploadWithPreviewProps {
  value: File | null
  onChange: (file: File | null) => void
  required?: boolean
  label?: string
  accept?: string
}

export default function UploadWithPreview({ value, onChange, required, label = 'Foto de Perfil', accept = 'image/*' }: UploadWithPreviewProps) {
  const [preview, setPreview] = useState<string | null>(value ? URL.createObjectURL(value) : null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (file: File | null) => {
    if (file) {
      setPreview(URL.createObjectURL(file))
      onChange(file)
    } else {
      setPreview(null)
      onChange(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0] || null
    handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  return (
    <div className="upload-preview-wrapper mb-3">
      {label && <label className="form-label mb-2">{label} {required && <span className="text-danger">*</span>}</label>}
      <div
        className={`upload-dropzone ${dragActive ? 'active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ cursor: 'pointer', borderRadius: '12px', border: dragActive ? '2px solid #764ba2' : '2px dashed #e9ecef', background: dragActive ? '#f6f0fa' : '#fafbfc', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      >
        {preview ? (
          <div className="preview-img-container text-center">
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: 120, maxHeight: 120, borderRadius: '50%', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', objectFit: 'cover', border: '3px solid #764ba2' }}
            />
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={e => { e.stopPropagation(); handleFile(null) }}
              >Remover</button>
            </div>
          </div>
        ) : (
          <div className="text-center w-100">
            <i className="fas fa-cloud-upload-alt fa-2x text-primary mb-2"></i>
            <div className="text-muted">Arraste uma imagem aqui ou clique para selecionar</div>
            <div className="small text-muted">Formatos aceitos: JPG, PNG, JPEG</div>
          </div>
        )}
        <input
          type="file"
          ref={inputRef}
          style={{ display: 'none' }}
          accept={accept}
          required={required}
          onChange={handleInputChange}
        />
      </div>
      <style jsx>{`
        .upload-dropzone.active {
          border-color: #764ba2;
          background: #f6f0fa;
        }
        .preview-img-container img {
          transition: box-shadow 0.2s;
        }
        .preview-img-container img:hover {
          box-shadow: 0 4px 24px rgba(102,126,234,0.18);
        }
      `}</style>
    </div>
  )
}
