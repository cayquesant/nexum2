Diagnóstico do Problema
A lógica parece correta. Vamos debugar isso passo a passo. Execute estes passos:

1. Verificar dados do usuário no console
Abra o DevTools (F12) no navegador e cole:


// Verificar estado do usuário
console.log('User:', localStorage.getItem('nexum-auth-storage'));
console.log('Company:', localStorage.getItem('nexum-company-storage'));
2. Verificar resposta da API
Na aba Network do DevTools, procure por requisições para o endpoint /rest/v1/usuarios e veja:

O que foi retornado
Se há algum erro na query
Se os dados incluem empresa_id
3. Verificar se o role está correto
Execute esta query no Supabase:


SELECT 
    id,
    email,
    role,
    empresa_id,
    ativo
FROM public.usuarios
WHERE email = 'email-do-usuario-logado@example.com';
Possíveis causas do problema:

Cache do Zustand - O estado persistido pode estar desatualizado
Role diferente do esperado - O usuário pode ter role visualizador ao invés de admin
Empresa não está sendo carregada - O loadCompanies pode estar falhando
Solução rápida para testar:

Limpe o localStorage e faça login novamente:


localStorage.clear();
location.reload();
Depois faça login e verifique se os componentes aparecem.

Você consegue me informar qual é o email do usuário que está com esse problema? Posso verificar direto no banco para confirmar o role e empresa_id.