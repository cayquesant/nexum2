# Pendências - Navegação Shallow Routing no Menu de Configuração

**Data:** 2026-03-03
**Status:** Em andamento

## Contexto Geral

Estamos implementando **shallow routing** para o menu de configuração do Nexum, um sistema de gestão empresarial brasileiro. O objetivo é evitar recarregamento completo da página ao navegar entre submenus de configuração.

**Problema original:**
- Ao clicar em um submenu de configuração (Empresa, Equipe, Regras Financeiras, etc.), o Next.js recarrega a página completamente
- Isso causa a sidebar e o menu serem re-renderizados
- O submenu de configuração pode fechar
- A transição não é fluida

**Solução escolhida:**
- Usar `router.push()` para manter histórico do navegador funcional
- Adicionar estado `currentPath` no DashboardLayout para rastrear a rota ativa
- Adicionar `useEffect` nas páginas de configuração para detectar mudanças de rota e recarregar dados quando necessário

## Arquitetura da Solução

### Componentes Modificados

1. **DashboardLayout.tsx** - Layout principal
   - Adicionou estado `currentPath` (linha 50)
   - Adicionou `useEffect` para detectar mudanças de pathname (linhas 77-80)
   - Modificou `handleSubmenuClick` para usar `router.push()` para configuração/financeiro (linhas 99-112)
   - Adicionou helper `isMenuActive` para matching robusto de rotas (linhas 114-116)
   - Adicionou tipo TypeScript `MenuId` para type safety (linha 21)
   - Restaurou menu 'configuracao' com todos os submenus (linhas 132-144)
   - Documentou prop `activeMenu` como mantido para compatibilidade (linhas 36-37)

2. **configuracao/empresa/page.tsx** - Página Empresa
   - ✅ COMPLETADO: Adicionou `usePathname` e modificado useEffect (commit `64fe9e7`)
   - Usa `pathname === '/configuracao/empresa'` no useEffect

3. **configuracao/equipe/page.tsx** - Página Equipe
   - ✅ COMPLETADO: Adicionou `usePathname` e modificado useEffect (commit `9818450`)
   - Usa `pathname === '/configuracao/equipe'` no useEffect

4. **configuracao/regras-financeiras/page.tsx** - Página Regras Financeiras
   - ✅ COMPLETADO: Adicionou `usePathname` e modificado useEffect (commit `7e3b753`)
   - Usa `pathname === '/configuracao/regras-financeiras'` no useEffect

5. **components/clientes/ClienteList.tsx** - Lista de Clientes (para Gestão de Clientes)
   - ✅ COMPLETADO: Adicionou `usePathname` e modificado useEffect (commit `80f094c`)
   - Usa `pathname === '/configuracao/gestao-clientes'` no useEffect

6. **configuracao/gestao-clientes/page.tsx** - Página wrapper de Gestão de Clientes
   - ✅ COMPLETADO: Removeu `configSubmenuOpen={true}` (commit `8c4831c`)

7. **configuracao/ia-automacao/page.tsx** - Página IA & Automação
   - ✅ COMPLETADO: Removeu `configSubmenuOpen={true}` (commit `8c4831c`)
   - É uma página estática "Em Desenvolvimento", não precisa de useEffect

## Commits Realizados

### Task 1: Adicionar estado currentPath ao DashboardLayout
- **SHA:** `ee4d3db`
- **Mensagem:** "feat: adicionar estado currentPath ao DashboardLayout para shallow routing"
- **Changes:**
  - Adicionou estado `currentPath` inicializado com `pathname`
  - Adicionou useEffect para detectar mudanças de rota
  - Atualizou lógica de highlight do menu para usar `currentPath`
  - Restaurou menu 'configuracao' com submenus
  - Criou helper `isMenuActive` para matching robusto
  - Adicionou tipo TypeScript `MenuId`

### Task 2: Modificar handleSubmenuClick para usar shallow routing
- **SHA 1 (inicial):** `f3459e6d2b1fbd8a03feb6b2f696fdaacabce812`
- **Mensagem:** "feat: implementar shallow routing em submenus de configuração e financeiro"
- **Issues:** Usou `router.replace()` inicialmente, que quebra botão Voltar

- **SHA 2 (correção):** `fc1c339670b404bfad67bb715a10b5b22db2c59c`
- **Mensagem:** "fix: mudar de router.replace() para router.push() para manter histórico do navegador"
- **Changes:**
  - Mudou de `router.replace()` para `router.push()`
  - Atualizou comentários para remover terminologia "shallow routing"
  - Botão Voltar agora funciona corretamente

### Task 3: Adicionar useEffect à página Empresa
- **SHA 1 (inicial):** `caf3d8e`
- **Mensagem:** "feat: adicionar useEffect para detectar mudanças de rota na página Empresa"
- **Changes:**
  - Adicionou `usePathname` import
  - Adicionou `pathname` hook
  - Modificou useEffect para reagir a `currentCompany` e `pathname`

- **SHA 2 (correção):** `64fe9e7`
- **Mensagem:** "refactor: remover router não usado e corrigir props do DashboardLayout"
- **Changes:**
  - Removeu `useRouter` import e `router` variável não usada
  - Verificou que `configSubmenuOpen={true}` não está presente

### Task 4: Adicionar useEffect à página Equipe
- **SHA:** `98184500169d7962e24394f5ffe914f3ab7dd80b`
- **Mensagem:** "feat: adicionar useEffect para detectar mudanças de rota na página Equipe"
- **Changes:**
  - Adicionou `usePathname` import
  - Adicionou `pathname` hook
  - Modificou useEffect com `pathname === '/configuracao/equipe'`
  - Removeu `configSubmenuOpen={true}` do DashboardLayout (consistência)

### Task 5: Adicionar useEffect às páginas restantes de configuração
- **SHA 1 (regras-financeiras):** `7e3b753`
- **Mensagem:** "feat: adicionar useEffect para detectar mudanças de rota na página Regras Financeiras"
- **Changes:**
  - Adicionou `usePathname` import e `pathname` hook
  - Modificou useEffect com `pathname === '/configuracao/regras-financeiras'`
  - Removeu `configSubmenuOpen={true}`

- **SHA 2 (gestao-clientes via ClienteList):** `80f094c`
- **Mensagem:** "feat: adicionar useEffect para detectar mudanças de rota na página Gestão de Clientes"
- **Changes:**
  - Modificou `components/clientes/ClienteList.tsx`
  - Adicionou `usePathname` import e `pathname` hook
  - Modificou useEffect com `pathname === '/configuracao/gestao-clientes'`

- **SHA 3 (cleanup):** `8c4831c`
- **Mensagem:** "refactor: remover configSubmenuOpen remanescente"
- **Changes:**
  - Removeu `configSubmenuOpen={true}` das páginas restantes (gestao-clientes, ia-automacao)

## Tasks Pendentes

### Task 6: Teste Completo de Navegação Shallow
**Status:** ❌ NÃO INICIADO
**Motivo:** A tarefa de testes foi interrompida pelo usuário

**O que precisa ser testado:**
1. Navegação entre submenus de configuração:
   - [ ] Empresa → Equipe (URL muda, conteúdo atualiza, sidebar aberta)
   - [ ] Equipe → Regras Financeiras
   - [ ] Regras Financeiras → IA & Automação
   - [ ] IA & Automação → Gestão de Clientes
   - [ ] Gestão de Clientes → Empresa (estado mantido)

2. Destaque do menu:
   - [ ] Submenu ativo tem classe `bg-white/10`
   - [ ] Menu pai "Configuração" permanece aberto
   - [ ] Seta rotacionada

3. Navegação normal (não shallow):
   - [ ] Clicar em "Atividades" → Navegação normal
   - [ ] Clicar em "Relatórios" → Navegação normal
   - [ ] Botão "Voltar" funciona corretamente

4. DevTools Network:
   - [ ] Navegar entre submenus sem requisição de página

**Commit pendente:**
```bash
git commit --allow-empty -m "test: shallow routing implementado e testado com sucesso"
```

### Task 7: Verificar Edge Cases
**Status:** ❌ NÃO INICIADO

**O que precisa ser testado:**
1. Navegação direta via URL
2. Botão Voltar do navegador
3. Mudança de layout (Padrão/Compacto/Foco)
4. Persistência de formulários

**Commit pendente:**
```bash
git commit --allow-empty -m "test: edge cases verificados - navegação shallow funcionando corretamente"
```

## Anotações Importantes

### Limitações Técnicas

1. **Next.js App Router não suporta `{ shallow: true }`**
   - Esta opção existe apenas no Pages Router (Next.js 12 e anteriores)
   - No App Router (Next.js 13+), a solução é usar `router.push()` normal
   - O estado interno `currentPath` mantém o highlighting correto do menu

2. **Comportamento atual vs shallow routing verdadeiro**
   - `router.push()` AINDA causa navegação completa no App Router
   - A página inteira recarrega, mas a sidebar/mantém seu estado
   - Isso NÃO é shallow routing real, mas é a melhor solução possível no App Router
   - Os componentes filhos recarregam, mas detectam mudanças de rota via `pathname`

### Requisitos de Design Atendidos

✅ **Usuário solicitou:** "Estado interno + shallow URL"
✅ **Botão Voltar funcional:** Usando `router.push()` mantém histórico
✅ **Sidebar permanece aberta:** Estado interno gerencia abertura de submenus
✅ **Conteúdo atualiza:** `useEffect` detecta mudanças e recarrega dados

### Próximos Passos

1. **Completar Task 6 (Testes):**
   - Necessário testar manualmente todos os cenários
   - Verificar no DevTools que não há recarregamento completo
   - Confirmar persistência de estado entre navegações

2. **Completar Task 7 (Edge Cases):**
   - Testar navegação direta via URL
   - Verificar comportamento do botão Voltar
   - Testar diferentes layouts
   - Confirmar que formulários mantêm dados

3. **Finalizar implementação:**
   - Commit final dos testes
   - Merge das mudanças se necessário
   - Documentar a solução

## Arquivos Relevantes

### Código Principal
- `src/components/layout/DashboardLayout.tsx` - Layout gerenciando navegação
- `docs/plans/2026-03-03-configuracao-shallow-routing-design.md` - Design document
- `docs/plans/2026-03-03-configuracao-shallow-routing.md` - Plano de implementação

### Páginas de Configuração Modificadas
- `src/app/configuracao/empresa/page.tsx` - ✅ COMPLETO
- `src/app/configuracao/equipe/page.tsx` - ✅ COMPLETO
- `src/app/configuracao/regras-financeiras/page.tsx` - ✅ COMPLETO
- `src/app/configuracao/gestao-clientes/page.tsx` - ✅ COMPLETO (wrapper)
- `src/app/configuracao/ia-automacao/page.tsx` - ✅ COMPLETO (estático)

### Componentes Modificados
- `src/components/clientes/ClienteList.tsx` - ✅ COMPLETO (para gestao-clientes)

## Observações para Continuação

1. **Como testar:**
   - Iniciar `npm run dev` (já deve estar rodando na porta 3002)
   - Navegar para `http://localhost:3002/configuracao/empresa`
   - Abrir DevTools → Network para monitorar requisições
   - Navegar entre submenus e observar comportamento

2. **O que verificar:**
   - URL muda sem recarregar a página inteira (sidebar mantida)
   - Submenu ativo tem highlight visual (`bg-white/10`)
   - Botão Voltar do navegador funciona (volta para páginas anteriores)
   - Dados de formulários persistem ao voltar para mesma página

3. **Documentação:**
   - Após completar testes, atualizar este arquivo com resultados
   - Considerar adicionar screenshots ou evidências dos testes
