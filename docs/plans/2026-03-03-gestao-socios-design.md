# Design: Gestão de Sócios da Empresa

**Data:** 2026-03-03
**Status:** Aprovado

## Objetivo

Refazer a página `/configuracao/regras-financeiras` para gerenciar sócios da empresa e suas porcentagens de participação.

## Requisitos

- Cadastrar sócios com nome e porcentagem
- Editar e excluir sócios
- Aviso visual se soma das porcentagens ≠ 100% (não bloqueia)
- Remover completamente as regras financeiras atuais

## Solção

### Banco de Dados

Nova tabela `empresa_socios`:

```sql
CREATE TABLE public.empresa_socios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    porcentagem DECIMAL(5,2) NOT NULL CHECK (porcentagem >= 0 AND porcentagem <= 100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_empresa_socios_empresa_id ON public.empresa_socios(empresa_id);
```

**RLS:**
- Usuários podem gerenciar sócios apenas da própria empresa
- Usa função `get_current_user_empresa_id()` para isolamento

### Tipos TypeScript

```typescript
export interface Socio {
  id: string
  empresaId: string
  nome: string
  porcentagem: number
  criadoEm: Date
  atualizadoEm: Date
}
```

### Interface

- Lista de sócios em tabela
- Modal para criar/editar
- Botões de editar e excluir por linha
- Indicador de total (verde = 100%, amarelo ≠ 100%)
- Botão "Adicionar Sócio"

### Validações

- Nome: obrigatório, mínimo 2 caracteres
- Porcentagem: 0-100%
- Total: aviso visual se ≠ 100% (não impede salvamento)

## Arquivos

**Novos:**
- `supabase/06-add-empresa-socios.sql`
- `src/components/configuracao/SocioModal.tsx`

**Modificados:**
- `src/app/configuracao/regras-financeiras/page.tsx`
- `src/types/index.ts`
