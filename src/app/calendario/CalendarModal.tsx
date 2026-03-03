'use client'

import { X, Clock, CheckCircle2, AlertCircle, Calendar, ChevronRight, AlertTriangle } from 'lucide-react'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { useRouter } from 'next/navigation'

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}

const getStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendente',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        Icon: Clock
      }
    case 'in_progress':
      return {
        label: 'Em Andamento',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        Icon: AlertCircle
      }
    case 'completed':
      return {
        label: 'Concluído',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        Icon: CheckCircle2
      }
    default:
      return {
        label: status,
        color: 'text-white/60',
        bg: 'bg-white/5',
        border: 'border-white/10',
        Icon: Clock
      }
  }
}

const getPriorityConfig = (priority: TaskPriority) => {
  switch (priority) {
    case 'high':
      return {
        label: 'Alta',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      }
    case 'medium':
      return {
        label: 'Média',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30'
      }
    case 'low':
      return {
        label: 'Baixa',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30'
      }
    default:
      return {
        label: priority,
        color: 'text-white/60',
        bg: 'bg-white/5',
        border: 'border-white/10'
      }
  }
}

export default function CalendarModal({ isOpen, onClose, task }: CalendarModalProps) {
  const router = useRouter()

  if (!isOpen || !task) return null

  const statusConfig = getStatusConfig(task.status)
  const priorityConfig = getPriorityConfig(task.prioridade)
  const StatusIcon = statusConfig.Icon

  const handleGoToTask = () => {
    onClose()
    router.push('/atividades')
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Sem data definida'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6 pr-8">
          {task.titulo}
        </h2>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bg} ${statusConfig.border} border`}>
              <StatusIcon className={statusConfig.color} size={20} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Status</p>
              <p className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
            </div>
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${priorityConfig.bg} ${priorityConfig.border} border`}>
              <AlertTriangle className={priorityConfig.color} size={20} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Prioridade</p>
              <p className={`font-medium ${priorityConfig.color}`}>{priorityConfig.label}</p>
            </div>
          </div>

          {/* Data de Vencimento */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-nexum-primary/10 border border-nexum-primary/30">
              <Calendar className="text-nexum-primary" size={20} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Vencimento</p>
              <p className="text-white font-medium capitalize">{formatDate(task.dataVencimento)}</p>
            </div>
          </div>

          {/* Descrição */}
          {task.descricao && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/40 text-sm mb-2">Descrição</p>
              <p className="text-white/80 text-sm leading-relaxed">
                {task.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Botão para ir para atividades */}
        <button
          onClick={handleGoToTask}
          className="mt-6 w-full py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Ir para Atividades
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
