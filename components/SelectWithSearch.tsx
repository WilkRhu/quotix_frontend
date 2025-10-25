import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectWithSearchProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export default function SelectWithSearch({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = 'form-control'
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Encontrar a opção selecionada
  const selectedOption = options.find(option => option.value === value)

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Resetar busca quando o dropdown fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  const handleSelectClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
  }

  const handleOptionClick = (option: Option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
    }
  }

  return (
    <div className="position-relative" ref={selectRef}>
      <div
        className={`${className} d-flex align-items-center cursor-pointer ${disabled ? 'bg-light' : ''}`}
        onClick={handleSelectClick}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <input
          ref={inputRef}
          type="text"
          className="form-control border-0 p-0"
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : '')}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          required={required}
          style={{ background: 'transparent', boxShadow: 'none' }}
        />
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`}></i>
      </div>

      {isOpen && (
        <div
          className="position-absolute w-100 bg-white border rounded shadow-sm"
          style={{
            zIndex: 1050,
            maxHeight: '200px',
            overflowY: 'auto',
            top: '100%'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer ${
                  option.value === value ? 'bg-primary text-white' :
                  index === highlightedIndex ? 'bg-light' : 'hover-bg-light'
                }`}
                onClick={() => handleOptionClick(option)}
                style={{ cursor: 'pointer' }}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-muted">
              Nenhuma opção encontrada
            </div>
          )}
        </div>
      )}
    </div>
  )
}