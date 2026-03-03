# Configuração Shallow Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar navegação com shallow routing no menu de configuração para evitar recarregamento completo da página ao navegar entre submenus.

**Architecture:** Modificar DashboardLayout.tsx para usar router.push com { shallow: true } em submenus de configuração e financeiro, mantendo o estado atual com currentPath e adicionando useEffect nas páginas de configuração para detectar mudanças de rota.

**Tech Stack:** Next.js 14 App Router, React hooks (useState, useEffect), TypeScript, Zustand stores

---

## Task 1: Adicionar estado currentPath ao DashboardLayout

**Files:**
- Modify: `src/components/layout/DashboardLayout.tsx:37-47`

**Step 1: Adicionar estado currentPath após a linha 38**

```typescript
const [isCheckingAuth, setIsCheckingAuth] = useState(true)
const [showCompanySelector, setShowCompanySelector] = useState(false)
const [showUserDropdown, setShowUserDropdown] = useState(false)
const [configSubmenuOpen, setConfigSubmenuOpen] = useState(false)
const [financeiroSubmenuOpen, setFinanceiroSubmenuOpen] = useState(false)
const [currentPath, setCurrentPath] = useState(pathname)
const dropdownRef = useRef<HTMLDivElement>(null)
```

**Step 2: Adicionar useEffect para detectar mudanças de rota após a linha 74**

```typescript
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      loadCompanies()
    }
  }, [isCheckingAuth, isAuthenticated, loadCompanies])

  // Detectar mudanças de rota para shallow routing
  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])
```

**Step 3: Substituir pathname por currentPath na linha 159**

```typescript
                const submenuOpen = menu.id === 'financeiro' ? financeiroSubmenuOpen : menu.id === 'configuracao' ? configSubmenuOpen : false
                return (
                  <div key={menu.id}>
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        currentPath.startsWith('/' + menu.id)  // Mudar de activeMenu para currentPath
                          ? 'bg-nexum-primary/20 text-white border border-nexum-primary/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
```

**Step 4: Substituir pathname por currentPath na linha 188**

```typescript
                          const isActive = currentPath === submenu.path
                          return (
                            <button
                              key={submenu.id}
                              onClick={() => handleSubmenuClick(submenu.path)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                                isActive
                                  ? 'text-white bg-white/10'
                                  : 'text-white/50 hover:text-white hover:bg-white/5'
                              }`}
                            >
```

**Step 5: Testar no navegador**

Run: `npm run dev` (já deve estar rodando)
Expected: DashboardLayout carrega normalmente, menus funcionam como antes

**Step 6: Commit**

```bash
git add src/components/layout/DashboardLayout.tsx
git commit -m "feat: adicionar estado currentPath ao DashboardLayout para shallow routing"
```

---

## Task 2: Modificar handleSubmenuClick para usar shallow routing

**Files:**
- Modify: `src/components/layout/DashboardLayout.tsx:99-101`

**Step 1: Substituir handleSubmenuClick completo**

```typescript
  const handleSubmenuClick = (submenuPath: string) => {
    const isConfigOrFinanceiroPath =
      submenuPath.startsWith('/configuracao/') ||
      submenuPath.startsWith('/financeiro/')

    if (isConfigOrFinanceiroPath) {
      // Shallow routing para configuração e financeiro
      // Usamos replace para evitar novo histórico e manter estado do componente
      router.replace(submenuPath)
    } else {
      // Navegação normal para outras rotas
      router.push(submenuPath)
    }
  }
```

**Step 2: Testar shallow routing no navegador**

Run: Abrir navegador em http://localhost:3002/configuracao/empresa
Teste: Abrir DevTools Network, clicar em "Equipe" no menu de configuração
Expected: URL muda para /configuracao/equipe, sidebar permanece aberta, estado interno mantido

**Step 3: Commit**

```bash
git add src/components/layout/DashboardLayout.tsx
git commit -m "feat: implementar shallow routing em submenus de configuração e financeiro"
```

---

## Task 3: Adicionar useEffect à página Empresa para detectar mudanças de rota

**Files:**
- Modify: `src/app/configuracao/empresa/page.tsx:27-56`

**Step 1: Modificar useEffect existente para reagir a mudanças de pathname**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconBuilding, IconLoader2 } from '@tabler/icons-react'

export default function EmpresaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    whatsapp: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/empresa') {
      loadCompanyData()
    }
  }, [currentCompany, pathname])
```

**Step 2: Testar navegação shallow no navegador**

Run: Abrir em http://localhost:3002/configuracao/empresa
Teste 1: Preencher um campo, clicar em "Equipe", voltar para "Empresa"
Expected: Campo permanece preenchido (shallow routing mantém estado)

**Step 3: Commit**

```bash
git add src/app/configuracao/empresa/page.tsx
git commit -m "feat: adicionar useEffect para detectar mudanças de rota na página Empresa"
```

---

## Task 4: Adicionar useEffect à página Equipe

**Files:**
- Modify: `src/app/configuracao/equipe/page.tsx:1-50`

**Step 1: Ler arquivo para identificar estrutura atual**

Run: `head -50 src/app/configuracao/equipe/page.tsx`
Expected: Ver estrutura atual da página Equipe

**Step 2: Adicionar usePathname e modificar useEffect**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconUsers, IconLoader2, IconPlus, IconTrash } from '@tabler/icons-react'

export default function EquipePage() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  // ... restante do código ...

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/equipe') {
      loadEquipeData()
    }
  }, [currentCompany, pathname])
```

**Step 3: Commit**

```bash
git add src/app/configuracao/equipe/page.tsx
git commit -m "feat: adicionar useEffect para detectar mudanças de rota na página Equipe"
```

---

## Task 5: Adicionar useEffect às páginas restantes de configuração

**Files:**
- Modify: `src/app/configuracao/gestao-clientes/page.tsx`
- Modify: `src/app/configuracao/ia-automacao/page.tsx`
- Modify: `src/app/configuracao/regras-financeiras/page.tsx`

**Step 1: Ler estrutura de cada página**

Run: `head -50 src/app/configuracao/gestao-clientes/page.tsx src/app/configuracao/ia-automacao/page.tsx src/app/configuracao/regras-financeiras/page.tsx`
Expected: Ver estrutura atual das páginas

**Step 2: Adicionar usePathname e modificar useEffect em cada página**

**Para gestao-clientes:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// ... restante dos imports ...

export default function GestaoClientesPage() {
  const router = useRouter()
  const pathname = usePathname()
  // ... restante do código ...

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/gestao-clientes') {
      loadClientesData()
    }
  }, [currentCompany, pathname])
```

**Para ia-automacao:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// ... restante dos imports ...

export default function IAAutomacaoPage() {
  const router = useRouter()
  const pathname = usePathname()
  // ... restante do código ...

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/ia-automacao') {
      loadAutomacaoData()
    }
  }, [currentCompany, pathname])
```

**Para regras-financeiras:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// ... restante dos imports ...

export default function RegrasFinanceirasPage() {
  const router = useRouter()
  const pathname = usePathname()
  // ... restante do código ...

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/regras-financeiras') {
      loadRegrasData()
    }
  }, [currentCompany, pathname])
```

**Step 3: Commit para cada página**

```bash
git add src/app/configuracao/gestao-clientes/page.tsx
git commit -m "feat: adicionar useEffect para detectar mudanças de rota na página Gestão de Clientes"

git add src/app/configuracao/ia-automacao/page.tsx
git commit -m "feat: adicionar useEffect para detectar mudanças de rota na página IA & Automação"

git add src/app/configuracao/regras-financeiras/page.tsx
git commit -m "feat: adicionar useEffect para detectar mudanças de rota na página Regras Financeiras"
```

---

## Task 6: Teste Completo de Navegação Shallow

**Files:**
- Test: Manual verification

**Step 1: Testar navegação entre todos os submenus de configuração**

Run: Abrir em http://localhost:3002/configuracao/empresa

Teste checklist:
- [ ] Clicar em "Equipe" → URL muda, conteúdo atualiza, sidebar permanece aberta
- [ ] Clicar em "Regras Financeiras" → URL muda, conteúdo atualiza, sidebar permanece aberta
- [ ] Clicar em "IA & Automação" → URL muda, conteúdo atualiza, sidebar permanece aberta
- [ ] Clicar em "Gestão de Clientes" → URL muda, conteúdo atualiza, sidebar permanece aberta
- [ ] Voltar para "Empresa" → URL muda, conteúdo anterior permanece (estado mantido)

**Step 2: Testar destaque do menu**

Teste checklist:
- [ ] Submenu ativo tem classe `bg-white/10` (brilho)
- [ ] Menu pai "Configuração" permanece com submenu aberto
- [ ] Seta do menu está rotacionada (indicando aberto)

**Step 3: Testar navegação normal (não shallow)**

Teste checklist:
- [ ] Clicar em "Atividades" → Navegação normal, página recarrega
- [ ] Clicar em "Relatórios" → Navegação normal, página recarrega
- [ ] Botão "Voltar" do navegador funciona corretamente

**Step 4: Verificar no DevTools Network**

Run: Abrir DevTools → Network
Teste: Navegar entre submenus de configuração
Expected: NENHUMA requisição de documento (page) é feita, apenas chamadas de API se necessário

**Step 5: Commit final**

```bash
git commit --allow-empty -m "test: shallow routing implementado e testado com sucesso"
```

---

## Task 7: Verificar Edge Cases

**Files:**
- Test: Manual verification

**Step 1: Testar navegação direta via URL**

Run: Abrir navegador em http://localhost:3002/configuracao/empresa
Teste: Digitar diretamente http://localhost:3002/configuracao/equipe e dar Enter
Expected: Página carrega normalmente (comportamento padrão)

**Step 2: Testar botão Voltar do navegador**

Run: Navegar: Empresa → Equipe → Regras Financeiras
Teste: Clicar em "Voltar" duas vezes
Expected: Volta para Equipe, depois para Empresa

**Step 3: Testar mudança de layout**

Run: Abrir menu de usuário, mudar para layout "Compacto"
Teste: Navegar entre submenus de configuração
Expected: Shallow routing continua funcionando

**Step 4: Testar persistência de formulários**

Run: Abrir página Empresa, preencher formulário com dados de teste
Teste: Clicar em "Equipe", depois voltar para "Empresa"
Expected: Dados permanecem no formulário

**Step 5: Commit final**

```bash
git commit --allow-empty -m "test: edge cases verificados - navegação shallow funcionando corretamente"
```

---

## Documentação Adicional

### Links Úteis

- [Next.js Shallow Routing](https://nextjs.org/docs/app/building-your-application/routing/link-and-nav#pushing-the-url-object)
- Design doc: `docs/plans/2026-03-03-configuracao-shallow-routing-design.md`

### Observações

1. Shallow routing NÃO executa getStaticProps ou getServerSideProps - apenas atualiza a URL
2. Componentes podem detectar mudanças via `usePathname()` hook
3. O estado dos componentes é mantido entre navegações shallow
4. Para recarregar dados, use `useEffect` que reage a mudanças de `pathname`
