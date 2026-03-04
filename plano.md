# Migração Next.js para Vite 8.0 - Plano Completo

> **Para Claude:** SKILL SUB-REQUISITO: Use superpowers:executing-plans para implementar este plano tarefa por tarefa.

**Objetivo:** Migrar o projeto Nexum (Sistema de Gestão Empresarial) de Next.js 14.2.3 para Vite 8.0 com React Router v6, mantendo toda a funcionalidade atual.

**Arquitetura:** A migração transformará a aplicação de um framework full-stack com SSR para uma SPA (Single Page Application) pura com renderização no cliente, mantendo o backend Supabase para autenticação e dados.

**Tech Stack:**
- **Frontend:** Vite 8.0, React 18.3.1, React Router v6, TypeScript 5.4.5
- **Estilização:** Tailwind CSS 3.4.3 (com plugin @tailwindcss/vite)
- **Backend:** Supabase (mantido)
- **Estado:** Zustand 4.5.2 (mantido)
- **UI:** Recharts, FullCalendar, Lucide React, Tabler Icons (mantidos)

---

## 📊 Análise do Projeto Atual

### Características Next.js Identificadas:
- ✅ Next.js 14.2.3 com App Router (`src/app/`)
- ✅ 37 componentes client-side (com "use client")
- ✅ 9 API Routes em `src/app/api/`
- ✅ Middleware complexo para autenticação (`src/middleware.ts`)
- ✅ Layout root em `src/app/layout.tsx`
- ✅ 16 páginas no App Router
- ✅ Supabase com SSR e browser clients
- ✅ Variáveis de ambiente com prefixo `NEXT_PUBLIC_`
- ✅ Metadata API para SEO

---

## ⚠️ Avisos Importantes

### O Que Será Perdido:
1. **SSR (Server-Side Rendering)** - A aplicação será uma SPA pura
2. **Next.js API Routes** - Serão substituídas por um servidor Express separado
3. **Next.js Middleware** - Será substituído por guards client-side
4. **Next.js Metadata API** - Será substituído por React Helmet
5. **SSG/ISR capabilities** - Não aplicável para SPA

### Alternativas Consideradas:
| Opção | Vantagens | Desvantagens |
|-------|-----------|--------------|
| **Vite + React Router** (escolhido) | Mais simples, comunidade grande, manutenção fácil | Sem SSR, SEO reduzido |
| [Vike](https://vike.dev/) | Mantém SSR com Vite | Curva de aprendizado, menos documentação |
| [Vinext](https://vinext.io/) | Compatível com Next.js API | Cloudflare-only, beta |

---

## 📋 Plano de Migração - Fase por Fase

### FASE 1: Preparação e Backup

**Objetivo:** Criar branch de migração e backup do projeto atual.

---

#### Task 1: Criar branch de migração

**Arquivos:**
- Git branch

**Step 1: Criar e mudar para branch de migração**

```bash
git checkout -b migrate-to-vite
git status
```

**Step 2: Verificar commit**

Run: `git log --oneline -1`
Expected: Mostra o commit atual (deve ser `ec067be` ou posterior)

**Step 3: Commit**

```bash
# Branch criado, pronto para migração
```

---

#### Task 2: Documentar estrutura atual

**Arquivos:**
- Create: `docs/nextjs-structure-analysis.md`

**Step 1: Criar documento de análise**

```markdown
# Análise da Estrutura Next.js Atual

## Páginas (App Router)
- / - Login/Redirect
- /login - Página de login
- /superadmin - Super admin
- /atividades - Dashboard principal
- /calendario - Calendário
- /configuracao/* - 6 páginas de configuração
- /financeiro/* - 3 páginas financeiras
- /alterar-senha - Troca de senha

## API Routes
- /api/admin/usuarios - CRUD de usuários
- /api/auth/alterar-senha - Alteração de senha
- /api/clientes - CRUD de clientes
- /api/clientes/[id]/historico - Histórico do cliente
- /api/objetivos - Objetivos
- /api/servicos - Serviços

## Componentes Principais
- src/components/layout/DashboardLayout.tsx
- src/components/auth/ProtectedRoute.tsx
- src/components/company/CompanySelector.tsx
- Componentes de clientes (7 arquivos)
- Componentes de configuração (6 arquivos)

## Estado Global (Zustand)
- useAuthStore - Autenticação e sessão
- useCompanyStore - Seleção de empresa
- useLayoutStore - Modo de layout

## Supabase Clients
- src/lib/supabase/browser.ts - Client-side
- src/lib/supabase/server.ts - Server-side (será removido)
```

**Step 2: Commit**

```bash
git add docs/nextjs-structure-analysis.md
git commit -m "docs: adicionar análise da estrutura Next.js atual"
```

---

### FASE 2: Setup do Vite

**Objetivo:** Instalar e configurar Vite 8.0 e dependências necessárias.

---

#### Task 3: Instalar Vite e dependências

**Arquivos:**
- Modify: `package.json`

**Step 1: Remover Next.js**

```bash
npm uninstall next @next/font @supabase/ssr
```

**Step 2: Instalar Vite 8.0 e dependências**

```bash
# Vite 8.0 (latest) e plugins
npm install -D vite@^8.0.0 @vitejs/plugin-react@^5.0.0 @tailwindcss/vite@^4.0.0 tailwindcss@^4.0.0

# React Router para roteamento
npm install react-router-dom@^7.0.0

# React Helmet para SEO (substitui Metadata API)
npm install react-helmet-async@^2.0.0

# TypeScript types
npm install -D @types/react@^18.3.0 @types/react-dom@^18.3.0 vite-tsconfig-paths@^5.0.0
```

**Step 3: Verificar instalação**

Run: `npm list vite react-router-dom react-helmet-async`
Expected: Mostra as versões instaladas

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: instalar Vite 8.0 e React Router"
```

---

#### Task 4: Criar configuração do Vite

**Arquivos:**
- Create: `vite.config.ts`
- Modify: `tsconfig.json`

**Step 1: Criar vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

**Step 2: Atualizar tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Commit**

```bash
git add vite.config.ts tsconfig.json
git commit -m "chore: configurar Vite 8.0"
```

---

#### Task 5: Criar estrutura de diretórios Vite

**Arquivos:**
- Create: `src/main.tsx`
- Create: `index.html`

**Step 1: Criar index.html**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexum - Sistema de Gestão</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 2: Criar src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './app/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
```

**Step 3: Commit**

```bash
git add index.html src/main.tsx
git commit -m "feat: criar entry point Vite"
```

---

### FASE 3: Migração de Rotas

**Objetivo:** Converter file-based routing do Next.js para React Router.

---

#### Task 6: Criar estrutura de rotas

**Arquivos:**
- Create: `src/App.tsx`
- Create: `src/router.tsx`

**Step 1: Criar src/App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import LoginPage from './pages/LoginPage'
import SuperAdminPage from './pages/SuperAdminPage'
import DashboardLayout from './components/layout/DashboardLayout'
import AtividadesPage from './pages/AtividadesPage'
import CalendarioPage from './pages/CalendarioPage'
import AlterarSenhaPage from './pages/AlterarSenhaPage'
import ConfiguracaoPage from './pages/ConfiguracaoPage'
import EmpresaPage from './pages/EmpresaPage'
import EquipePage from './pages/EquipePage'
import GestaoClientesPage from './pages/GestaoClientesPage'
import IAAutomacaoPage from './pages/IAAutomacaoPage'
import RegrasFinanceirasPage from './pages/RegrasFinanceirasPage'
import FinanceiroPage from './pages/FinanceiroPage'
import VisaoGeralPage from './pages/VisaoGeralPage'
import LancamentosPage from './pages/LancamentosPage'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Rota raiz - redireciona baseado na autenticação */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/atividades" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Página de Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas protegidas com layout */}
      <Route
        path="/atividades"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AtividadesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CalendarioPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin"
        element={
          <ProtectedRoute requireRole="SUPER_ADMIN">
            <DashboardLayout>
              <SuperAdminPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alterar-senha"
        element={
          <ProtectedRoute>
            <AlterarSenhaPage />
          </ProtectedRoute>
        }
      />

      {/* Configuração - página principal */}
      <Route
        path="/configuracao"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ConfiguracaoPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Configuração - sub-páginas */}
      <Route
        path="/configuracao/empresa"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EmpresaPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracao/equipe"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EquipePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracao/gestao-clientes"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <GestaoClientesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracao/ia-automacao"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <IAAutomacaoPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracao/regras-financeiras"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RegrasFinanceirasPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Financeiro - página principal */}
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <FinanceiroPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/financeiro/visao-geral"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <VisaoGeralPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/financeiro/lancamentos"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LancamentosPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: criar estrutura de rotas React Router"
```

---

#### Task 7: Mover páginas para estrutura Vite

**Arquivos:**
- Move: `src/app/login/page.tsx` → `src/pages/LoginPage.tsx`
- Move: `src/app/atividades/page.tsx` → `src/pages/AtividadesPage.tsx`
- Move: `src/app/calendario/page.tsx` → `src/pages/CalendarioPage.tsx`
- Move: `src/app/superadmin/page.tsx` → `src/pages/SuperAdminPage.tsx`
- Move: `src/app/alterar-senha/page.tsx` → `src/pages/AlterarSenhaPage.tsx`
- Move: `src/app/configuracao/page.tsx` → `src/pages/ConfiguracaoPage.tsx`
- Move: `src/app/configuracao/empresa/page.tsx` → `src/pages/EmpresaPage.tsx`
- Move: `src/app/configuracao/equipe/page.tsx` → `src/pages/EquipePage.tsx`
- Move: `src/app/configuracao/gestao-clientes/page.tsx` → `src/pages/GestaoClientesPage.tsx`
- Move: `src/app/configuracao/ia-automacao/page.tsx` → `src/pages/IAAutomacaoPage.tsx`
- Move: `src/app/configuracao/regras-financeiras/page.tsx` → `src/pages/RegrasFinanceirasPage.tsx`
- Move: `src/app/financeiro/page.tsx` → `src/pages/FinanceiroPage.tsx`
- Move: `src/app/financeiro/visao-geral/page.tsx` → `src/pages/VisaoGeralPage.tsx`
- Move: `src/app/financeiro/lancamentos/page.tsx` → `src/pages/LancamentosPage.tsx`
- Move: `src/app/page.tsx` → (remover - redirecionado no App.tsx)

**Step 1: Criar diretório de páginas**

```bash
mkdir -p src/pages
```

**Step 2: Mover páginas (exemplo para login, repetir para outras)**

```bash
# Mover página de login
cp src/app/login/page.tsx src/pages/LoginPage.tsx
```

**Step 3: Atualizar imports em cada página (exemplo LoginPage)**

```typescript
// Remover ou substituir:
// import { useRouter } from 'next/navigation'
// import { redirect } from 'next/navigation'

// Adicionar:
// import { useNavigate } from 'react-router-dom'
// const navigate = useNavigate()
// navigate('/destination')
```

**Step 4: Commit (fazer após mover todas as páginas)**

```bash
git add src/pages/
git commit -m "refactor: mover páginas Next.js para estrutura Vite"
```

---

#### Task 8: Atualizar navegação em componentes

**Arquivos:**
- Modify: `src/components/layout/DashboardLayout.tsx`

**Step 1: Ler arquivo atual**

Run: `cat src/components/layout/DashboardLayout.tsx`

**Step 2: Substituir useRouter por useNavigate**

```typescript
// Remover:
import { useRouter, useSearchParams } from 'next/navigation'

// Adicionar:
import { useNavigate, useSearchParams } from 'react-router-dom'

// No componente:
const router = useRouter()
// Substituir todas as chamadas router.push('/path') por navigate('/path')
```

**Step 3: Atualizar shallow routing (se usado)**

```typescript
// Next.js shallow routing não existe no React Router
// Substituir:
// router.push('/path', { shallow: true })
// Por:
// navigate('/path')
```

**Step 4: Commit**

```bash
git add src/components/layout/DashboardLayout.tsx
git commit -m "refactor: atualizar navegação no DashboardLayout"
```

---

### FASE 4: Migração de Autenticação

**Objetivo:** Substituir middleware Next.js por guards client-side.

---

#### Task 9: Atualizar ProtectedRoute

**Arquivos:**
- Modify: `src/components/auth/ProtectedRoute.tsx`

**Step 1: Ler arquivo atual**

Run: `cat src/components/auth/ProtectedRoute.tsx`

**Step 2: Atualizar para React Router**

```typescript
'use client'

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: string
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated, checkSession, loading } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      await checkSession()

      if (!isAuthenticated) {
        navigate('/login', { replace: true })
        return
      }

      // Verificar senha provisória
      if (user?.senha_provisoria && window.location.pathname !== '/alterar-senha') {
        navigate('/alterar-senha', { replace: true })
        return
      }

      // Verificar se conta está ativa
      if (!user?.ativo) {
        await useAuthStore.getState().logout()
        navigate('/login?error=conta_desativada', { replace: true })
        return
      }

      // Verificar role se necessário
      if (requireRole && user?.role !== requireRole) {
        navigate('/atividades', { replace: true })
        return
      }
    }

    checkAuth()
  }, [isAuthenticated, user, navigate, requireRole, checkSession])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nexum-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

**Step 3: Commit**

```bash
git add src/components/auth/ProtectedRoute.tsx
git commit -m "refactor: atualizar ProtectedRoute para React Router"
```

---

#### Task 10: Atualizar useAuthStore

**Arquivos:**
- Modify: `src/store/index.ts`

**Step 1: Ler arquivo atual**

Run: `cat src/store/index.ts`

**Step 2: Atualizar checkSession para usar navigate**

```typescript
// No useAuthStore, substituir:
// import { redirect } from 'next/navigation'

// Por:
// Não usar redirect no store, deixar que o ProtectedRoute lide com redirecionamento

// Atualizar a função checkSession para apenas atualizar o estado:
checkSession: async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      set({
        user: usuario as User,
        session,
        isAuthenticated: true,
        loading: false,
      })
    } else {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        loading: false,
      })
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      loading: false,
    })
  }
},
```

**Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "refactor: atualizar useAuthStore para não usar redirects"
```

---

### FASE 5: Migração de API Routes

**Objetivo:** Criar servidor Express para substituir API routes do Next.js.

---

#### Task 11: Configurar servidor Express

**Arquivos:**
- Create: `server/index.ts`
- Modify: `package.json`

**Step 1: Instalar dependências do servidor**

```bash
npm install express cors helmet morgan
npm install -D @types/express @types/cors @types/morgan
```

**Step 2: Criar servidor Express**

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3001

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(morgan('dev'))

// Helper para verificar autenticação
async function verifyAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  req.user = user
  next()
}

// Rotas Admin - Usuários
app.get('/api/admin/usuarios', verifyAuth, async (req: any, res) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', req.user.id)
      .single()

    if (!usuario?.empresa_id) {
      return res.status(404).json({ error: 'Empresa não encontrada' })
    }

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, cargo, role, ativo')
      .eq('empresa_id', usuario.empresa_id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const usuariosFormatados = usuarios?.map(u => ({
      id: u.id,
      name: u.nome,
      email: u.email,
      role: u.role,
      cargo: u.cargo,
    }))

    res.json(usuariosFormatados)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Rotas Clientes
app.get('/api/clientes', verifyAuth, async (req: any, res) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', req.user.id)
      .single()

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', usuario!.empresa_id)
      .order('criado_em', { ascending: false })

    if (error) throw error

    res.json(clientes)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Rotas Auth - Alterar Senha
app.post('/api/auth/alterar-senha', verifyAuth, async (req: any, res) => {
  try {
    const { novaSenha } = req.body

    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) throw error

    // Atualizar campo senha_provisoria
    await supabase
      .from('usuarios')
      .update({ senha_provisoria: false })
      .eq('id', req.user.id)

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Rotas Objetivos
app.get('/api/objetivos', verifyAuth, async (req: any, res) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', req.user.id)
      .single()

    const { data: objetivos, error } = await supabase
      .from('objetivos')
      .select('*')
      .eq('empresa_id', usuario!.empresa_id)
      .order('criado_em', { ascending: false })

    if (error) throw error

    res.json(objetivos)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Rotas Serviços
app.get('/api/servicos', verifyAuth, async (req: any, res) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', req.user.id)
      .single()

    const { data: servicos, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('empresa_id', usuario!.empresa_id)
      .order('nome', { ascending: true })

    if (error) throw error

    res.json(servicos)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Rotas de Cliente por ID
app.get('/api/clientes/:id', verifyAuth, async (req: any, res) => {
  try {
    const { id } = req.params

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    res.json(cliente)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.patch('/api/clientes/:id', verifyAuth, async (req: any, res) => {
  try {
    const { id } = req.params

    const { data: cliente, error } = await supabase
      .from('clientes')
      .update(req.body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json(cliente)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/clientes/:id', verifyAuth, async (req: any, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Histórico do Cliente
app.get('/api/clientes/:id/historico', verifyAuth, async (req: any, res) => {
  try {
    const { id } = req.params

    const { data: historico, error } = await supabase
      .from('cliente_historico')
      .select('*')
      .eq('cliente_id', id)
      .order('criado_em', { ascending: false })

    if (error) throw error

    res.json(historico)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Usuário por ID (Admin)
app.get('/api/admin/usuarios/:id', verifyAuth, async (req: any, res) => {
  try {
    const { id } = req.params

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    res.json(usuario)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.patch('/api/admin/usuarios/:id', verifyAuth, async (req: any, res) => {
  try {
    const { id } = req.params

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update(req.body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json(usuario)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
```

**Step 3: Adicionar script no package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "start": "vite preview",
    "server": "tsx server/index.ts",
    "dev:full": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

**Step 4: Instalar concurrently**

```bash
npm install -D concurrently
```

**Step 5: Commit**

```bash
git add server/ package.json
git commit -m "feat: criar servidor Express para API routes"
```

---

### FASE 6: Migração de Variáveis de Ambiente

**Objetivo:** Atualizar prefixos de variáveis de ambiente.

---

#### Task 12: Atualizar variáveis de ambiente

**Arquivos:**
- Modify: `src/lib/supabase/browser.ts`
- Create: `.env.example`
- Modify: `.env.local` (se existir)

**Step 1: Criar .env.example**

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Step 2: Atualizar src/lib/supabase/browser.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Atualizar server/index.ts para usar variáveis**

```typescript
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
```

**Step 4: Commit**

```bash
git add .env.example src/lib/supabase/browser.ts server/index.ts
git commit -m "refactor: atualizar variáveis de ambiente para VITE_"
```

---

#### Task 13: Remover lib supabase/server.ts

**Arquivos:**
- Delete: `src/lib/supabase/server.ts`

**Step 1: Verificar se há referências**

```bash
grep -r "from '@/lib/supabase/server'" src/
```

**Step 2: Se houver referências, atualizar para usar browser client**

**Step 3: Remover arquivo**

```bash
rm src/lib/supabase/server.ts
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remover supabase/server.ts (não mais necessário)"
```

---

### FASE 7: Migração de SEO/Metadata

**Objetivo:** Implementar SEO com React Helmet.

---

#### Task 14: Criar componente SEO

**Arquivos:**
- Create: `src/components/SEO.tsx`

**Step 1: Criar componente SEO**

```typescript
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
}

export default function SEO({ title = 'Nexum - Sistema de Gestão', description = 'Plataforma de gestão empresarial Nexum' }: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Helmet>
  )
}
```

**Step 2: Adicionar SEO nas páginas principais**

```typescript
// Em src/pages/AtividadesPage.tsx
import SEO from '@/components/SEO'

export default function AtividadesPage() {
  return (
    <>
      <SEO title="Atividades - Nexum" description="Gerencie suas atividades no Nexum" />
      {/* Resto do componente */}
    </>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/SEO.tsx
git commit -m "feat: adicionar componente SEO com React Helmet"
```

---

### FASE 8: Limpeza e Remoção de Arquivos Next.js

**Objetivo:** Remover arquivos desnecessários do Next.js.

---

#### Task 15: Remover arquivos Next.js

**Arquivos:**
- Delete: `next.config.js`
- Delete: `next-env.d.ts`
- Delete: `postcss.config.js` (substituído pelo plugin @tailwindcss/vite)
- Delete: `.next/` (diretório de build do Next.js)

**Step 1: Remover arquivos de configuração Next.js**

```bash
rm next.config.js
rm next-env.d.ts
rm postcss.config.js
rm -rf .next/
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remover arquivos de configuração do Next.js"
```

---

#### Task 16: Remover diretório src/app/

**Arquivos:**
- Delete: `src/app/` (exceto `src/app/globals.css`)

**Step 1: Verificar conteúdo restante em src/app/**

```bash
ls -la src/app/
```

**Step 2: Mover globals.css para src/ se ainda estiver em src/app/**

```bash
cp src/app/globals.css src/
```

**Step 3: Remover diretório src/app/**

```bash
rm -rf src/app/
```

**Step 4: Atualizar import do globals.css em main.tsx**

```typescript
import './globals.css'
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remover diretório src/app/ do Next.js"
```

---

### FASE 9: Atualizar Scripts e Configurações

**Objetivo:** Finalizar configuração do projeto Vite.

---

#### Task 17: Atualizar package.json completo

**Arquivos:**
- Modify: `package.json`

**Step 1: Ler package.json atual**

Run: `cat package.json`

**Step 2: Atualizar scripts**

```json
{
  "name": "nexum",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx server/index.ts\"",
    "build": "tsc && vite build",
    "start": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "server": "tsx server/index.ts",
    "setup:seed": "npx tsx scripts/setup-seed-user.ts"
  },
  "dependencies": {
    "@fullcalendar/daygrid": "^6.1.20",
    "@fullcalendar/interaction": "^6.1.20",
    "@fullcalendar/list": "^6.1.20",
    "@fullcalendar/react": "^6.1.20",
    "@fullcalendar/timegrid": "^6.1.20",
    "@supabase/supabase-js": "^2.98.0",
    "@tabler/icons-react": "^3.38.0",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "lucide-react": "^0.378.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-helmet-async": "^2.0.0",
    "react-router-dom": "^7.0.0",
    "recharts": "^2.12.7",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "autoprefixer": "^10.4.19",
    "concurrently": "^8.2.2",
    "cors": "^2.8.5",
    "dotenv": "^17.3.1",
    "morgan": "^1.10.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.4.5",
    "vite": "^8.0.0",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: atualizar package.json final com scripts Vite"
```

---

#### Task 18: Criar .gitignore atualizado

**Arquivos:**
- Modify: `.gitignore`

**Step 1: Criar .gitignore atualizado**

```bash
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Playwright logs
.playwright-mcp/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: atualizar .gitignore para Vite"
```

---

### FASE 10: Testes e Validação

**Objetivo:** Testar a aplicação migrada.

---

#### Task 19: Instalar dependências e iniciar servidor

**Arquivos:**
- None

**Step 1: Limpar node_modules e reinstalar**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Step 2: Iniciar servidor de desenvolvimento**

```bash
npm run dev
```

**Step 3: Verificar se servidor inicia**

Run: `curl http://localhost:3002`
Expected: HTML da aplicação

**Step 4: Verificar se servidor de API inicia**

Run: `curl http://localhost:3001/api/objetivos`
Expected: JSON (você precisará de um token de autenticação válido)

**Step 5: Commit**

```bash
# Se tudo estiver funcionando
git commit -m "chore: instalar dependências e testar inicialização"
```

---

#### Task 20: Testar fluxo de autenticação

**Arquivos:**
- None

**Step 1: Testar página de login**

Run: Abra http://localhost:3002/login no navegador
Expected: Página de login carrega

**Step 2: Testar autenticação (requer credenciais válidas)**

1. Faça login com credenciais Supabase válidas
2. Verifique redirecionamento para /atividades
3. Verifique se ProtectedRoute está funcionando

**Step 3: Testar logout**

1. Faça logout
2. Verifique redirecionamento para /login

**Step 4: Commit (após correções se necessário)**

```bash
git commit -m "fix: corrigir fluxo de autenticação após testes"
```

---

#### Task 21: Testar todas as páginas

**Arquivos:**
- None

**Step 1: Testar cada página**

```bash
# Testar manualmente cada rota:
# - /atividades
# - /calendario
# - /superadmin (se tiver permissão)
# - /alterar-senha
# - /configuracao
# - /configuracao/empresa
# - /configuracao/equipe
# - /configuracao/gestao-clientes
# - /configuracao/ia-automacao
# - /configuracao/regras-financeiras
# - /financeiro
# - /financeiro/visao-geral
# - /financeiro/lancamentos
```

**Step 2: Documentar bugs encontrados**

Create: `docs/migration-bugs.md`

**Step 3: Commit**

```bash
git add docs/migration-bugs.md
git commit -m "docs: registrar bugs encontrados durante migração"
```

---

#### Task 22: Testar build de produção

**Arquivos:**
- None

**Step 1: Build de produção**

```bash
npm run build
```

**Step 2: Verificar se build foi bem-sucedido**

Run: `ls -la dist/`
Expected: Diretório dist com arquivos de build

**Step 3: Testar preview de produção**

```bash
npm run start
```

**Step 4: Testar aplicação em produção**

Run: Abra http://localhost:4173 no navegador
Expected: Aplicação funcionando

**Step 5: Commit**

```bash
git commit -m "test: build de produção bem-sucedido"
```

---

### FASE 11: Documentação Final

**Objetivo:** Documentar a migração completa.

---

#### Task 23: Criar README de migração

**Arquivos:**
- Create: `docs/MIGRATION_GUIDE.md`

**Step 1: Criar guia de migração**

```markdown
# Guia de Migração: Next.js → Vite 8.0

## Resumo

O projeto Nexum foi migrado de Next.js 14.2.3 para Vite 8.0 com React Router v6.

## Principais Mudanças

### Arquitetura
- **Antes:** Next.js com SSR e API Routes
- **Depois:** Vite (SPA) + Express (API server)

### Estrutura de Arquivos
- `src/app/` → `src/pages/`
- `src/app/api/` → `server/`
- `src/middleware.ts` → Removido (substituído por ProtectedRoute)
- `next.config.js` → `vite.config.ts`

### Dependências Adicionadas
- `vite@8.0.0` - Build tool
- `@vitejs/plugin-react` - Plugin React para Vite
- `@tailwindcss/vite` - Plugin Tailwind para Vite
- `react-router-dom@7.0.0` - Roteamento
- `react-helmet-async` - SEO
- `express` - Servidor API

### Dependências Removidas
- `next` - Framework Next.js
- `@next/font` - Fontes do Next.js
- `@supabase/ssr` - Supabase SSR (mantido apenas browser)

## Como Rodar

### Desenvolvimento
```bash
npm run dev
```
Isso inicia:
- Vite dev server (http://localhost:3002)
- Express API server (http://localhost:3001)

### Build de Produção
```bash
npm run build
npm run start
```

### Apenas API Server
```bash
npm run server
```

## Variáveis de Ambiente

Mudança de prefixo:
- `NEXT_PUBLIC_SUPABASE_URL` → `VITE_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `VITE_SUPABASE_ANON_KEY`

O `SUPABASE_SERVICE_ROLE_KEY` permanece igual (usado pelo servidor).

## Rotas API

As rotas API agora são servidas pelo servidor Express:

- `GET /api/admin/usuarios` - Listar usuários
- `GET /api/admin/usuarios/:id` - Obter usuário
- `PATCH /api/admin/usuarios/:id` - Atualizar usuário
- `POST /api/auth/alterar-senha` - Alterar senha
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Obter cliente
- `PATCH /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente
- `GET /api/clientes/:id/historico` - Histórico do cliente
- `GET /api/objetivos` - Listar objetivos
- `GET /api/servicos` - Listar serviços

## Compatibilidade

### Funcionalidades Mantidas
- ✅ Autenticação com Supabase
- ✅ Roteamento (React Router)
- ✅ Estado global (Zustand)
- ✅ Todos os componentes de UI
- ✅ Tailwind CSS
- ✅ Recharts, FullCalendar, Ícones

### Funcionalidades Alteradas
- 🔄 SSR → CSR (Client-Side Rendering)
- 🔄 API Routes → Express
- 🔄 Middleware → ProtectedRoute client-side
- 🔄 Metadata API → React Helmet

### Funcionalidades Removidas
- ❌ Server-Side Rendering
- ❌ Server Components
- ❌ Static Site Generation
- ❌ Next.js Image optimization

## Troubleshooting

### Erro de CORS
Se encontrar erros de CORS, verifique a configuração no `server/index.ts`:
```typescript
app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true,
}))
```

### Erro de Autenticação
Verifique se as variáveis de ambiente estão configuradas corretamente e se o token está sendo enviado no header:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Build falha
Verifique se o TypeScript está compilando sem erros:
```bash
npx tsc --noEmit
```

## Deploy

Para fazer deploy, você precisará:
1. Build do frontend: `npm run build`
2. Deploy do `dist/` em um hosting estático (Vercel, Netlify, etc.)
3. Deploy do servidor Express em um backend service (Railway, Render, etc.)
4. Atualizar URLs no código

## Próximos Passos

Considere:
- Implementar SSR com [Vike](https://vike.dev/) se SEO for crítico
- Adicionar testes E2E com Playwright
- Configurar CI/CD para automação
- Implementar cache no servidor Express

## Recursos

- [Vite Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Vike - SSR com Vite](https://vike.dev/)
- [Vinext - Next.js no Vite](https://vinext.io/)
```

**Step 2: Commit**

```bash
git add docs/MIGRATION_GUIDE.md
git commit -m "docs: adicionar guia completo de migração"
```

---

#### Task 24: Atualizar CLAUDE.md

**Arquivos:**
- Modify: `CLAUDE.md`

**Step 1: Atualizar CLAUDE.md com informações Vite**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexum is a Brazilian business management system (Sistema de Gestão Empresarial) built with **Vite 8.0**, React 18, Express for the API server, and Supabase for backend/auth. The UI uses a dark glass-morphism theme with Tailwind CSS.

**Note:** This project was migrated from Next.js to Vite. See `docs/MIGRATION_GUIDE.md` for migration details.

## Commands

```bash
npm run dev          # Start development servers (Vite on 3002, Express on 3001)
npm run build        # Production build
npm run start        # Start production server (Vite preview)
npm run lint         # Run ESLint
npm run server        # Start only Express API server
npm run setup:seed   # Create seed SUPER_ADMIN user (requires SUPABASE_SERVICE_ROLE_KEY in .env)
```

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (only for seed script and server)

**Note:** Vite uses `VITE_` prefix instead of `NEXT_PUBLIC_` for client-side variables.

## Architecture

### Directory Structure
- `src/pages/` - React pages (formerly src/app/)
- `src/components/` - React components organized by domain (`auth/`, `company/`)
- `src/lib/supabase/` - Supabase browser client only
- `src/store/` - Zustand stores (`useAuthStore`, `useCompanyStore`)
- `src/types/` - TypeScript types and database schema definitions
- `src/hooks/` - Custom hooks (`usePermissions`, `useRequireAuth`, `useCompanyContext`)
- `server/` - Express API server (formerly src/app/api/)
- `supabase/` - SQL migration files for database schema and RLS policies

### Path Alias
`@/*` maps to `./src/*` (e.g., `@/lib/supabase`, `@/types`, `@/store`)

### Supabase Client Usage
- **All components**: `import { createClient } from '@/lib/supabase/browser'`
- **Server routes**: `import { createClient } from '@supabase/supabase-js'` (async function in server/)

### Authentication & Authorization

**User Roles** (defined in `src/types/index.ts`):
- `SUPER_ADMIN` - Full system access, manages all companies
- `admin` - Company administrator
- `editor` - Can create/edit content within company
- `visualizador` - Read-only access

**Route Protection**:
- React Router handles routing
- `ProtectedRoute` component handles auth checks
- SUPER_ADMIN redirects to `/superadmin`
- Other authenticated users redirect to `/atividades`
- Use `usePermissions()` hook for client-side permission checks

**API Authentication**:
- Express API server uses JWT tokens from Supabase
- Send token in Authorization header: `Bearer ${token}`
- Server verifies token with Supabase auth.getUser()

### Database Tables

| Table | Purpose |
|-------|---------|
| `empresas` | Companies/tenants |
| `usuarios` | User profiles (linked to `auth.users`) |
| `tarefas` | Tasks (company-scoped) |
| `empresa_configuracoes` | Company financial settings |

### State Management Pattern

Zustand stores in `src/store/index.ts`:
- `useAuthStore` - Auth state, login/logout, session checking
- `useCompanyStore` - Company selection and management

### UI Patterns

- Dark theme with custom colors defined in `tailwind.config.js` (`nexum-primary`, `nexum-secondary`, `nexum-dark`, etc.)
- Glass-morphism cards using `.dark-card` class
- Icons from `lucide-react` and `@tabler/icons-react`
- Charts via `recharts`
- Calendar via `@fullcalendar/react`

## API Routes

Express server provides API endpoints:
- `GET /api/admin/usuarios` - List users
- `POST /api/auth/alterar-senha` - Change password
- `GET /api/clientes` - List clients
- `GET /api/objetivos` - List objectives
- `GET /api/servicos` - List services

See `server/index.ts` for complete API reference.

## Database Migrations

Execute SQL files in Supabase SQL Editor in order:
1. `supabase/01-schema.sql` - Tables and functions
2. `supabase/02-rls.sql` - Row Level Security policies
3. `supabase/03-seed.sql` - Initial seed data
4. `supabase/04-add-empresa-campos-configuracoes.sql` - Schema updates
5. `supabase/05-add-usuario-campos.sql` - Adiciona campos email, cargo, aprovador, ativo, senha_provisoria na tabela usuarios

## Language

UI and code comments are in Portuguese (pt-BR). Database columns use Portuguese naming (`criado_em`, `empresa_id`, `nome`, etc.).

## Migration Notes

This project was migrated from Next.js 14 to Vite 8.0. Key changes:
- File-based routing → React Router v6
- Next.js API Routes → Express server
- Middleware → ProtectedRoute client component
- Server Components → All client components
- SSR → CSR (Client-Side Rendering)

See `docs/MIGRATION_GUIDE.md` for complete migration details.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: atualizar CLAUDE.md com informações Vite"
```

---

#### Task 25: Merge para main

**Arquivos:**
- Git

**Step 1: Mudar para branch main**

```bash
git checkout main
```

**Step 2: Merge branch de migração**

```bash
git merge migrate-to-vite
```

**Step 3: Resolver conflitos se houver**

```bash
# Se houver conflitos, resolva manualmente
git add .
git commit -m "merge: migrar de Next.js para Vite 8.0"
```

**Step 4: Tag da versão**

```bash
git tag -a v2.0.0 -m "Migrado para Vite 8.0"
git push origin main --tags
```

---

## 🔍 Checklist de Validação

- [ ] Branch `migrate-to-vite` criado
- [ ] Análise da estrutura documentada
- [ ] Vite 8.0 instalado e configurado
- [ ] React Router v6 configurado
- [ ] Todas as páginas movidas para `src/pages/`
- [ ] Navegação atualizada em todos os componentes
- [ ] ProtectedRoute atualizado
- [ ] useAuthStore atualizado
- [ ] Servidor Express criado com todas as rotas
- [ ] Variáveis de ambiente atualizadas
- [ ] SEO implementado com React Helmet
- [ ] Arquivos Next.js removidos
- [ ] Scripts atualizados no package.json
- [ ] Desenvolvimento local testado
- [ ] Autenticação testada
- [ ] Todas as páginas testadas
- [ ] Build de produção testado
- [ ] Documentação criada
- [ ] CLAUDE.md atualizado
- [ ] Merge para main realizado
- [ ] Tag v2.0.0 criada

---

## 📚 Recursos e Referências

### Vite 8.0
- [Official Docs](https://cn.vitejs.dev)
- [Vite 8 Release Notes](https://cn.vitejs.dev/blog/announcing-vite7.html)
- [Rolldown - Rust Bundler](https://rolldown.rs/)

### React Router v6/v7
- [Official Docs](https://reactrouter.com/)
- [Migration Guide](https://reactrouter.com/upgrading/v6)

### Alternativas para SSR
- [Vike - SSR com Vite](https://vike.dev/)
- [Vinext - Next.js no Vite](https://vinext.io/)
- [Vike GitHub](https://github.com/vikejs/vike-photon)

### Supabase + Vite
- [Supabase with Vite](https://supabase.com/docs/guides/getting-started/vite)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

### Tailwind CSS v4
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [@tailwindcss/vite Plugin](https://tailwindcss.com/blog/tailwindcss-v4-alpha)

---

## 📝 Notas Importantes

### Performance
- Vite 8.0 com Rolldown pode ser **30x mais rápido** que o Next.js esbuild
- O desenvolvimento deve ser muito mais rápido
- O build de produção também deve ser mais rápido

### SEO Impact
- Como migramos para SPA pura, o SEO será impactado
- Considere usar Vike se SEO for crítico
- Para pré-renderização, considere implementar SSG com Vite

### Deploy Changes
- Deploy mudou de "one-click" Next.js para separado:
  - Frontend: Vite build em hosting estático
  - Backend: Express server em backend service

---

## 🎓 Aprendizados da Migração

### O que funcionou bem:
- Vite configurado facilmente com plugin React
- React Router substituiu file-based routing bem
- Express server foi simples de configurar
- Tailwind CSS v4 plugin funciona nativamente com Vite

### Desafios encontrados:
- Autenticação middleware complexa precisou ser refeita
- API routes precisaram de servidor separado
- SEO foi comprometido (esperado em SPA)
- Algumas features do Next.js não têm equivalente direto

### Recomendações:
1. Considere Vike para projetos que precisam de SSR
2. Vinext é uma opção interessante se quiser manter APIs Next.js
3. Teste extensivamente antes de fazer merge
4. Documente bem as mudanças para a equipe

---

**Plano completo salvo em plano.md**

Sources:
- [Vite 8 Documentation](https://cn.vitejs.dev)
- [React Router Documentation](https://reactrouter.com/)
- [Vike - SSR Framework for Vite](https://vike.dev/)
- [Vinext - Cloudflare's Vite-based Next.js](https://vinext.io/)
- [Rolldown - Rust-powered Bundler](https://rolldown.rs/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Supabase with Vite Guide](https://supabase.com/docs/guides/getting-started/vite)
