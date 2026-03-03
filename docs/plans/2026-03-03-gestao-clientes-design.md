# Design: Gestão de Clientes

**Data:** 2026-03-03
**Status:** Aprovado
**Escopo:** Página `/configuracao/gestao-clientes`

---

## Visão Geral

Página interna para administração completa dos clientes cadastrados no sistema. Permite criação, edição, controle de status, atribuição de equipe, definição de escopo contratado e gerenciamento de informações financeiras e estratégicas.

---

## Requisitos Funcionais

### Listagem de Clientes
- Listar todos os clientes da empresa ativa
- Filtro por status (ativo, pausado, cancelado)
- Busca por nome do cliente
- Card com informações resumidas (nome, status, MRR)
- Botão "Novo Cliente" para usuários com permissão

### Modal de Detalhes (6 abas)
1. **Dados** - Informações básicas do cliente
2. **Financeiro** - MRR, vencimento, régua de cobrança, status
3. **Escopo** - Serviços contratados e descrição do escopo
4. **Equipe** - Membros vinculados ao cliente
5. **Estratégia** - Objetivos e canais de atuação com credenciais
6. **Histórico** - Timeline de mudanças de status

### Funcionalidades Específicas
- **Serviços:** Lista pré-definida, criada on-demand pelos usuários
- **Objetivos:** Select múltiplo com opções criadas pelos usuários
- **Canais de atuação:** Cofre de credenciais (usuário, senha, observações)
- **Régua de cobrança:** Toggle simples (participa/não participa)
- **Histórico de status:** Visual, focado em negócio
- **Log de auditoria:** Registro de alterações relevantes

### Permissões
- **admin/SUPER_ADMIN:** Visualizar, criar, editar, excluir
- **editor/visualizador:** Apenas visualizar

---

## Database Schema

### Tabela Principal: `clientes`

```sql
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,

    -- Dados básicos
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    website VARCHAR(255),
    instagram VARCHAR(100),
    briefing TEXT,
    escopo TEXT,

    -- Financeiro e status
    status VARCHAR(20) NOT NULL DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'pausado', 'cancelado')),
    mrr DECIMAL(10,2),
    dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
    participa_regua_cobranca BOOLEAN DEFAULT false,

    -- Canais com credenciais (JSONB)
    canais JSONB DEFAULT '[]'::jsonb,

    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID REFERENCES public.usuarios(id)
);
```

### Tabelas Auxiliares

```sql
-- Serviços pré-definidos por empresa
CREATE TABLE public.servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Objetivos pré-definidos por empresa
CREATE TABLE public.objetivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction: Cliente x Serviços
CREATE TABLE public.cliente_servicos (
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, servico_id)
);

-- Junction: Cliente x Objetivos
CREATE TABLE public.cliente_objetivos (
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    objetivo_id UUID REFERENCES public.objetivos(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, objetivo_id)
);

-- Junction: Cliente x Equipe
CREATE TABLE public.cliente_equipe (
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, usuario_id)
);

-- Histórico de Status (visual)
CREATE TABLE public.cliente_historico_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20) NOT NULL,
    alterado_por UUID REFERENCES public.usuarios(id),
    alterado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de Auditoria (administrativo)
CREATE TABLE public.cliente_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    campo VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    alterado_por UUID REFERENCES public.usuarios(id),
    alterado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Índices Recomendados

```sql
CREATE INDEX idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_nome ON public.clientes USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_servicos_empresa_id ON public.servicos(empresa_id);
CREATE INDEX idx_objetivos_empresa_id ON public.objetivos(empresa_id);
CREATE INDEX idx_cliente_historico_cliente_id ON public.cliente_historico_status(cliente_id);
CREATE INDEX idx_cliente_logs_cliente_id ON public.cliente_logs(cliente_id);
```

---

## TypeScript Types

```typescript
// ============================================
// Tipos de Status
// ============================================
export type ClienteStatus = 'ativo' | 'pausado' | 'cancelado'

// ============================================
// Canal de Atuação (JSONB)
// ============================================
export type TipoCanal = 'facebook' | 'instagram' | 'google' | 'meta_ads' | 'tiktok' | 'linkedin' | 'youtube'

export interface ClienteCanal {
  canal: TipoCanal
  usuario: string
  senha: string
  observacoes?: string
}

// ============================================
// Entidade Principal
// ============================================
export interface Cliente {
  id: string
  empresaId: string

  // Dados básicos
  nome: string
  email?: string | null
  telefone?: string | null
  website?: string | null
  instagram?: string | null
  briefing?: string | null
  escopo?: string | null

  // Financeiro e status
  status: ClienteStatus
  mrr?: number | null
  diaVencimento?: number | null
  participaReguaCobranca: boolean

  // Canais (JSONB)
  canais: ClienteCanal[]

  // Relacionamentos
  servicos?: Servico[]
  objetivos?: Objetivo[]
  equipe?: Usuario[]

  // Metadata
  criadoEm: Date
  atualizadoEm: Date
  criadoPor?: string
}

// ============================================
// Entidades Auxiliares
// ============================================
export interface Servico {
  id: string
  empresaId: string
  nome: string
  criadoEm: Date
}

export interface Objetivo {
  id: string
  empresaId: string
  nome: string
  criadoEm: Date
}

export interface ClienteHistoricoStatus {
  id: string
  clienteId: string
  statusAnterior?: ClienteStatus | null
  statusNovo: ClienteStatus
  alteradoPor?: string | null
  alteradoEm: Date
  alteradoPorNome?: string
}

export interface ClienteLog {
  id: string
  clienteId: string
  campo: string
  valorAnterior?: string | null
  valorNovo?: string | null
  alteradoPor?: string | null
  alteradoEm: Date
  alteradoPorNome?: string
}

// ============================================
// DTO para Formulário
// ============================================
export interface ClienteFormData {
  nome: string
  email?: string
  telefone?: string
  website?: string
  instagram?: string
  briefing?: string
  escopo?: string
  status: ClienteStatus
  mrr?: number
  diaVencimento?: number
  participaReguaCobranca: boolean
  servicosIds: string[]
  objetivosIds: string[]
  equipeIds: string[]
  canais: ClienteCanal[]
}

// ============================================
// Constantes
// ============================================
export const TIPOS_CANAL = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
] as const

export const STATUS_CLIENTE = [
  { value: 'ativo', label: 'Ativo', color: 'green' },
  { value: 'pausado', label: 'Pausado', color: 'yellow' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' },
] as const
```

---

## Estrutura de Componentes

```
src/
├── app/configuracao/gestao-clientes/
│   └── page.tsx                    # Página principal
│
├── components/clientes/
│   ├── ClienteList.tsx             # Lista com filtros e busca
│   ├── ClienteCard.tsx             # Card individual
│   ├── ClienteModal.tsx            # Modal com abas
│   ├── ClienteFormDados.tsx        # Aba: Dados básicos
│   ├── ClienteFormFinanceiro.tsx   # Aba: Financeiro + Status
│   ├── ClienteFormEscopo.tsx       # Aba: Escopo e serviços
│   ├── ClienteFormEquipe.tsx       # Aba: Equipe vinculada
│   ├── ClienteFormEstrategia.tsx   # Aba: Objetivos + Canais
│   ├── ClienteHistorico.tsx        # Aba: Histórico
│   ├── CanaisCredenciais.tsx       # Editor de canais com senhas
│   ├── MultiSelectCreatable.tsx    # Select com criação de opções
│   └── StatusBadge.tsx             # Badge de status
```

---

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/clientes` | Lista clientes (filtros: status, busca) |
| POST | `/api/clientes` | Cria novo cliente + logs iniciais |
| GET | `/api/clientes/[id]` | Detalhes com relacionamentos |
| PUT | `/api/clientes/[id]` | Atualiza + logs + histórico |
| DELETE | `/api/clientes/[id]` | Remove cliente |
| GET | `/api/clientes/[id]/historico` | Histórico de status |
| GET | `/api/servicos` | Lista serviços da empresa |
| POST | `/api/servicos` | Cria novo serviço |
| GET | `/api/objetivos` | Lista objetivos da empresa |
| POST | `/api/objetivos` | Cria novo objetivo |

---

## RLS Policies

```sql
-- CLIENTES
CREATE POLICY "clientes_select" ON public.clientes
    FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "clientes_insert" ON public.clientes
    FOR INSERT WITH CHECK (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "clientes_update" ON public.clientes
    FOR UPDATE USING (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "clientes_delete" ON public.clientes
    FOR DELETE USING (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

-- SERVIÇOS e OBJETIVOS: mesmo padrão (select para todos, insert para admin)

-- HISTÓRICO e LOGS: select para todos da empresa, insert via backend
```

---

## Matriz de Permissões

| Role | Visualizar | Criar | Editar | Excluir |
|------|:----------:|:-----:|:------:|:-------:|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| editor | ✅ | ❌ | ❌ | ❌ |
| visualizador | ✅ | ❌ | ❌ | ❌ |

---

## Campos Auditados (Log Administrativo)

- `mrr`
- `dia_vencimento`
- `participa_regua_cobranca`
- `escopo`
- `equipe` (mudança de membros vinculados)
- `servicos` (mudança de serviços contratados)

---

## Notas de Implementação

1. **Canais em JSONB:** Permite flexibilidade sem novas migrations
2. **Serviços/Objetivos criados on-demand:** Usar API separada para criar antes de vincular
3. **Senhas em texto:** Considerar criptografia no futuro (atualmente não crítico para uso interno)
4. **Trigger atualizado_em:** Adicionar trigger para atualizar `atualizado_em` automaticamente
