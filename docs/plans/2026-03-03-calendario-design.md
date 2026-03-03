# Design: Página de Calendário

**Data:** 2026-03-03
**Status:** Aprovado

## Resumo

Criar uma página de calendário em `/calendario` utilizando a biblioteca FullCalendar para visualização de tarefas do sistema. O calendário terá visualizações de Mês, Semana e Dia, com design consistente ao tema atual (glass-morphism escuro).

## Requisitos

### Funcionalidades
- Visualização de tarefas da tabela `tarefas` usando `data_vencimento`
- Alternância entre visualizações: Mês, Semana, Dia
- Clique em evento para ver detalhes da tarefa (modal)
- Navegação entre períodos (anterior/próximo)
- Botão "Hoje" para voltar à data atual

### Cores de Eventos (por prioridade)
- **Alta:** Vermelho (#ef4444)
- **Média:** Amarelo (#eab308)
- **Baixa:** Verde (#22c55e)

### Estilo Visual
- Tema glass-morphism escuro (igual ao restante do sistema)
- Fundo com imagem e gradiente
- Cards com backdrop-blur e bordas sutis

## Arquitetura

### Estrutura de Arquivos

```
src/app/calendario/
  page.tsx           # Página principal (~300 linhas)
  CalendarModal.tsx  # Modal de detalhes da tarefa (~100 linhas)
```

### Dependências (já instaladas)
- `@fullcalendar/react`
- `@fullcalendar/daygrid`
- `@fullcalendar/timegrid`
- `@fullcalendar/interaction`
- `@fullcalendar/list`

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [Sidebar 264px]  │           Main Content                       │
│                   │  ┌──────────────────────────────────────────┐│
│  Nexum            │  │ Header                                  ││
│  • Atividades     │  │ [← Voltar]              [🔔] [⚙️]        ││
│  • Organizador    │  └──────────────────────────────────────────┘│
│  • Relatórios     │  ┌──────────────────────────────────────────┐│
│  • IA Agente      │  │ Calendário                    [<] [>]    ││
│  ◉ Calendário     │  │ ┌────────────────────────────────────┐   ││
│  • Financeiro     │  │ │ [Mês] [Semana] [Dia]   [Hoje]     │   ││
│  ▼ Configuração   │  │ └────────────────────────────────────┘   ││
│                   │  │                                          ││
│                   │  │  Calendário FullCalendar                 ││
│                   │  │                                          ││
│  [👤 Usuário]     │  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### Carregamento
1. `useEffect` dispara `loadTasks()` ao montar
2. `loadTasks()` busca tarefas do Supabase com filtro por `empresa_id`
3. Tarefas são transformadas em eventos via `taskToEvent()`
4. Eventos passados para o FullCalendar

### Interação
1. Usuário clica em evento
2. FullCalendar dispara `eventClick`
3. Handler abre `CalendarModal` com a tarefa selecionada
4. Modal exibe detalhes (título, status, prioridade, vencimento, descrição)
5. Usuário pode navegar para página de atividades

### Transformação de Dados

```typescript
const taskToEvent = (task: Task) => ({
  id: task.id,
  title: task.titulo,
  start: task.dataVencimento,
  backgroundColor: getPriorityColor(task.prioridade),
  borderColor: getPriorityColor(task.prioridade),
  extendedProps: {
    status: task.status,
    descricao: task.descricao,
    prioridade: task.prioridade
  }
})

const getPriorityColor = (prioridade: string) => {
  switch (prioridade) {
    case 'high': return '#ef4444'
    case 'medium': return '#eab308'
    case 'low': return '#22c55e'
    default: return '#6366f1'
  }
}
```

## Componentes

### page.tsx

| Seção | Descrição |
|-------|-----------|
| Imports | FullCalendar, plugins, hooks, ícones |
| State | tasks, loading, modalOpen, selectedTask |
| Auth Check | Verificar autenticação e carregar empresa |
| loadTasks() | Buscar tarefas do Supabase com filtro empresa |
| taskToEvent() | Transformar tarefas em eventos do calendário |
| handleEventClick() | Abrir modal com detalhes da tarefa |
| Render | Layout com sidebar, header, calendário, modal |

### CalendarModal.tsx

| Prop | Tipo |
|------|------|
| isOpen | boolean |
| onClose | () => void |
| task | Task \| null |

**Conteúdo:**
- Título da tarefa
- Status com ícone colorido
- Prioridade com badge colorido
- Data de vencimento formatada (pt-BR)
- Descrição (se houver)
- Botão para navegar para página de atividades

## Estilos Customizados

Adicionar em `globals.css`:

```css
/* FullCalendar Dark Theme */
.fc {
  --fc-border-color: rgba(255, 255, 255, 0.1);
  --fc-button-bg-color: rgba(255, 255, 255, 0.1);
  --fc-button-border-color: rgba(255, 255, 255, 0.2);
  --fc-button-text-color: rgba(255, 255, 255, 0.8);
  --fc-button-hover-bg-color: rgba(255, 255, 255, 0.15);
  --fc-button-hover-border-color: rgba(255, 255, 255, 0.3);
  --fc-button-active-bg-color: #6366f1;
  --fc-button-active-border-color: #6366f1;
  --fc-today-bg-color: rgba(99, 102, 241, 0.1);
  --fc-event-bg-color: #6366f1;
  --fc-event-border-color: #6366f1;
}

.fc .fc-toolbar-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.fc .fc-col-header-cell-cushion {
  color: rgba(255, 255, 255, 0.6);
}

.fc .fc-daygrid-day-number {
  color: rgba(255, 255, 255, 0.8);
}

.fc .fc-daygrid-day.fc-day-today {
  background-color: rgba(99, 102, 241, 0.15);
}

.fc-event {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
}

.fc-event:hover {
  filter: brightness(1.1);
}
```

## Filtros de Empresa

- **SUPER_ADMIN:** Vê tarefas da empresa selecionada em `currentCompany`
- **Outros roles:** Vê tarefas da própria empresa (`user.empresaId`)

## Checklist de Implementação

1. [ ] Criar `src/app/calendario/page.tsx` com layout completo
2. [ ] Criar `src/app/calendario/CalendarModal.tsx`
3. [ ] Adicionar estilos do FullCalendar em `globals.css`
4. [ ] Atualizar sidebar em `atividades/page.tsx` para navegar para `/calendario`
5. [ ] Testar visualizações Mês/Semana/Dia
6. [ ] Testar clique em eventos e modal de detalhes
7. [ ] Testar filtros por empresa
