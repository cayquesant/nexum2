'use client'

import { useState } from 'react'
import { IconPlus, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react'

interface Option {
  id: string
  nome: string
}

interface MultiSelectCreatableProps {
  options: Option[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  onCreateOption?: (nome: string) => Promise<Option | null>
  placeholder?: string
  disabled?: boolean
}

export function MultiSelectCreatable({
  options,
  selectedIds,
  onChange,
  onCreateOption,
  placeholder = 'Selecionar...',
  disabled = false
}: MultiSelectCreatableProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const filteredOptions = options.filter(opt =>
    opt.nome.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id))

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const handleCreate = async () => {
    if (!search.trim() || !onCreateOption) return

    setIsCreating(true)
    try {
      const newOption = await onCreateOption(search.trim())
      if (newOption) {
        onChange([...selectedIds, newOption.id])
        setSearch('')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const showCreateOption = search.trim() && !filteredOptions.some(o => o.nome.toLowerCase() === search.toLowerCase())

  if (disabled) {
    return (
      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/40">
        {selectedOptions.length > 0
          ? selectedOptions.map(o => o.nome).join(', ')
          : placeholder
        }
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-left text-white flex items-center justify-between hover:border-white/20 transition-colors"
      >
        <span className={selectedOptions.length > 0 ? '' : 'text-white/40'}>
          {selectedOptions.length > 0
            ? selectedOptions.map(o => o.nome).join(', ')
            : placeholder
          }
        </span>
        <IconChevronDown
          size={18}
          className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-nexum-dark border border-white/10 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ou criar..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-nexum-primary"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleOption(option.id)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors text-white text-sm"
              >
                <span>{option.nome}</span>
                {selectedIds.includes(option.id) && (
                  <IconCheck size={16} className="text-nexum-primary" />
                )}
              </button>
            ))}

            {filteredOptions.length === 0 && !showCreateOption && (
              <p className="px-4 py-2 text-white/40 text-sm">Nenhum resultado</p>
            )}
          </div>

          {showCreateOption && onCreateOption && (
            <div className="p-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full px-4 py-2 flex items-center gap-2 bg-nexum-primary/20 hover:bg-nexum-primary/30 rounded-lg text-nexum-primary text-sm transition-colors disabled:opacity-50"
              >
                <IconPlus size={16} />
                {isCreating ? 'Criando...' : `Criar "${search.trim()}"`}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedOptions.length > 0 && !isOpen && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-nexum-primary/20 text-nexum-primary text-xs rounded-lg"
            >
              {option.nome}
              <button
                type="button"
                onClick={() => toggleOption(option.id)}
                className="hover:text-white"
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
