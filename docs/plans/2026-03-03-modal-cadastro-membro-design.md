# Design: Modal de Cadastro de Membro

**Data:** 2026-03-03
**Status:** Aprovado
**Abordagem:** Criação Direta de Usuário

## 1. Visão Geral

Modificar o modal "Convidar Membro" da página `/configuracao/equipe` para incluir campos completos de cadastro e criar o usuário diretamente no sistema, eliminando a necessidade de tabela intermediária de convites.

## 2. Requisitos

### 2.1 Campos do Modal

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome completo | Texto | Sim | Não vazio |
| Email | Texto | Sim | Formato de email válido |
| Senha provisória | Senha | Sim | Mínimo 6 caracteres |
| Cargo | Texto livre | Não | - |
| Perfil de acesso | Dropdown | Sim | admin, editor, visualizador |
| Aprovador | Toggle | Não | Default: desativado |
| Status da conta | Toggle | Não | Default: ativado |

### 2.2 Comportamentos

- **Senha provisória:** Usuário deve trocar no primeiro acesso
- **Status da conta:** Pode ser alterado no cadastro e na listagem de membros
- **Aprovador:** Pode validar qualquer item que exija aprovação no sistema

## 3. Alterações no Banco de Dados

### 3.1 Tabela `usuarios` - Novos Campos

```sql
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS cargo VARCHAR(255),
ADD COLUMN IF NOT EXISTS aprovador BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS senha_provisoria BOOLEAN DEFAULT TRUE;
```

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `email` | VARCHAR(255) | - | Email do usuário (espelho do auth.users) |
| `cargo` | VARCHAR(255) | - | Cargo/função na empresa |
| `aprovador` | BOOLEAN | FALSE | Se pode aprovar itens no sistema |
| `ativo` | BOOLEAN | TRUE | Se a conta está ativa para login |
| `senha_provisoria` | BOOLEAN | TRUE | Se precisa trocar senha no primeiro acesso |

## 4. Arquitetura

### 4.1 Fluxo de Criação de Membro

```
Admin preenche formulário
        ↓
Frontend valida (nome, email, senha ≥6 chars, perfil)
        ↓
POST /api/admin/usuarios
        ↓
Backend usa SERVICE_ROLE_KEY para:
  a) Criar usuário em auth.users
  b) Inserir registro em public.usuarios
        ↓
Retorna sucesso/erro
        ↓
Frontend atualiza lista de membros
```

### 4.2 Fluxo de Login com Senha Provisória

```
Usuário faz login normal
        ↓
Middleware verifica senha_provisoria = TRUE?
        ↓ (sim)
Redireciona para /alterar-senha (obrigatório)
        ↓
Usuário define nova senha
        ↓
Atualiza senha_provisoria = FALSE
        ↓
Libera acesso normal ao sistema
```

### 4.3 Verificação de Conta Ativa

```
Login → Verifica ativo = TRUE → Permite login
              ↓
        ativo = FALSE → Bloqueia com mensagem
                        "Conta desativada. Contate o administrador."
```

## 5. API Routes

| Rota | Método | Função |
|------|--------|--------|
| `/api/admin/usuarios` | POST | Criar novo usuário |
| `/api/admin/usuarios/[id]` | PATCH | Atualizar status/ativo |
| `/api/auth/alterar-senha` | POST | Trocar senha provisória |

## 6. Interface

### 6.1 Modal de Cadastro

```
┌─────────────────────────────────────────────┐
│  Convidar Membro                         ✕  │
├─────────────────────────────────────────────┤
│                                             │
│  Nome completo *                            │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Email *                                    │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Senha provisória *            👁           │
│  ┌─────────────────────────────────────┐    │
│  │ ••••••                              │    │
│  └─────────────────────────────────────┘    │
│  Mínimo 6 caracteres                       │
│                                             │
│  Cargo                                      │
│  ┌─────────────────────────────────────┐    │
│  │ Ex: Gerente, Analista...            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Perfil de acesso *                         │
│  ┌─────────────────────────────────────┐    │
│  │ Editor                        ▼      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  🔘 Aprovador                               │
│     Pode aprovar tarefas e validações       │
│                                             │
│  🔘 Conta ativa                             │
│     Usuário pode fazer login                │
│                                             │
├─────────────────────────────────────────────┤
│  [ Cancelar ]        [ Criar Membro ]       │
└─────────────────────────────────────────────┘
```

### 6.2 Listagem de Membros

Cada card terá:
- Avatar com inicial do nome
- Nome e email
- Badge de perfil (Admin/Editor/Visualizador)
- Badge "Aprovador" (se aplicável)
- Toggle de status (Ativo/Inativo)

## 7. Arquivos

### 7.1 Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/app/configuracao/equipe/page.tsx` | Novo modal com todos os campos, toggle de status na listagem |
| `src/middleware.ts` | Verificar `senha_provisoria` e `ativo` no login |
| `src/types/index.ts` | Adicionar campos novos ao tipo User |
| `supabase/01-schema.sql` | Adicionar migration dos novos campos |

### 7.2 Criar

| Arquivo | Função |
|---------|--------|
| `src/app/api/admin/usuarios/route.ts` | POST para criar usuário |
| `src/app/api/admin/usuarios/[id]/route.ts` | PATCH para atualizar status |
| `src/app/alterar-senha/page.tsx` | Página obrigatória de troca de senha |
| `src/app/api/auth/alterar-senha/route.ts` | POST para trocar senha provisória |
| `supabase/05-add-usuario-campos.sql` | Migration SQL dos novos campos |

## 8. Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Fluxo de criação | Criação direta | Usuário já nasce ativo, sem complexidade de convites |
| Campo Cargo | Texto livre | Flexibilidade para diferentes estruturas organizacionais |
| Requisitos de senha | Mínimo 6 caracteres | Equilíbrio entre segurança e usabilidade |
| Tipo de toggle | Switch visual | Mais intuitivo que checkbox para ativar/desativar |
