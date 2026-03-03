# Design: Navegação Shallow Routing no Menu de Configuração

**Data:** 2026-03-03
**Autor:** Claude Sonnet
**Status:** Aprovado

## Resumo

Implementar navegação com **shallow routing** no menu de configuração do DashboardLayout para evitar recarregamento completo da página ao navegar entre submenus, mantendo a sidebar aberta e proporcionando uma experiência de usuário mais fluida.

## Problema

Atualmente, ao clicar em um submenu de configuração (Empresa, Equipe, Regras Financeiras, etc.):
- O Next.js recarrega a página completamente
- A sidebar e o menu são re-renderizados
- O submenu de configuração pode fechar
- A transição não é fluida

## Solução Proposta

Usar **shallow routing** do Next.js (`router.push(path, { shallow: true })`) ao navegar entre submenus de configuração e financeiro. Isso atualiza a URL sem recarregar a página, mantendo o estado da aplicação.

## Arquitetura

### Componentes Modificados

1. **DashboardLayout.tsx** - Layout principal
   - Adicionar estado `currentPath` para rastrear a rota ativa
   - Modificar `handleSubmenuClick` para usar shallow routing
   - Usar `currentPath` em vez de `pathname` para destacar menus ativos

2. **Páginas de configuração** - `/configuracao/*/page.tsx`
   - Adicionar `useEffect` que detecta mudanças no pathname
   - Carregar conteúdo dinamicamente quando a rota muda

### Fluxo de Navegação

```
Usuário clica submenu
  ↓
DashboardLayout: handleSubmenuClick()
  ↓
router.push(path, { shallow: true })
  ↓
URL atualiza (sem recarregar página)
  ↓
useEffect atualiza currentPath
  ↓
Sidebar recalcula menu ativo
  ↓
Componente filho detecta mudança (via useEffect no pathname)
  ↓
Conteúdo atualiza
```

## Implementação

### DashboardLayout.tsx

```typescript
// Adicionar estado
const [currentPath, setCurrentPath] = useState(pathname)

// Detectar mudanças de rota
useEffect(() => {
  setCurrentPath(pathname)
}, [pathname])

// Modificar handleSubmenuClick
const handleSubmenuClick = (submenuPath: string) => {
  const isConfigOrFinanceiroPath =
    submenuPath.startsWith('/configuracao/') ||
    submenuPath.startsWith('/financeiro/')

  if (isConfigOrFinanceiroPath) {
    // Shallow routing para configuração e financeiro
    router.push(submenuPath, { shallow: true })
  } else {
    // Navegação normal para outras rotas
    router.push(submenuPath)
  }
}

// Usar currentPath para destacar menus ativos
const isActive = currentPath === submenu.path
```

### Páginas de Configuração

```typescript
useEffect(() => {
  // Recarregar dados quando pathname muda
  if (pathname === '/configuracao/empresa' && currentCompany) {
    loadCompanyData()
  }
}, [pathname, currentCompany])
```

## Edge Cases

| Cenário | Comportamento |
|---------|---------------|
| Navegação direta via URL | Recarrega página (comportamento normal) |
| Botão Voltar do navegador | Funciona naturalmente |
| Mudança de layout | Não afeta shallow routing |
| Sair de configuração | Navegação normal (não shallow) |

## Testes

### Cenários de Teste

1. **Navegação shallow entre submenus**
   - [ ] Clicar em "Empresa" → URL muda, conteúdo atualiza, menu fica aberto
   - [ ] Clicar em "Equipe" → URL muda, conteúdo atualiza, destaque atualiza

2. **Destaque do menu**
   - [ ] Submenu ativo tem classe de ativo
   - [ ] Menu pai "Configuração" permanece com submenu aberto

3. **Navegação normal**
   - [ ] Clicar em "Atividades" → Navegação normal
   - [ ] Voltar via botão do navegador → Funciona como esperado

4. **Persistência de dados**
   - [ ] Formulários preenchidos permanecem ao navegar entre tabs

## Considerações

### Ordem de Implementação

1. Modificar `DashboardLayout.tsx`
2. Modificar páginas de configuração (adicionar useEffect)

### Impacto

- **Mínimo:** Apenas `DashboardLayout.tsx` precisa de mudanças significativas
- **Zero impacto:** Outras seções do sistema permanecem inalteradas

### Transições Visuais

- Transição automática via classe `transition-all` já existente
- Nenhuma animação adicional necessária

## Referências

- [Next.js Shallow Routing](https://nextjs.org/docs/app/building-your-application/routing/link-and-nav#pushing-the-url-object)
- Arquivo: `src/components/layout/DashboardLayout.tsx`
- Arquivo: `src/app/configuracao/*/page.tsx`
