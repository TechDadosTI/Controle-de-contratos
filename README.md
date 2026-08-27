# Controle de Contratos — Agrobiotech, Pilar, Tarpon Franca, Tarpon Araxá

Sistema de controle de contratos das 4 empresas do grupo, com dados salvos automaticamente
no Supabase (Postgres). Reimplementação em Next.js/React do sistema original (um único
arquivo HTML), preservando exatamente o mesmo visual, tema por empresa e comportamento.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Não é necessário configurar nada antes de rodar: as credenciais do Supabase já têm um
valor padrão em `lib/supabaseClient.js`. Para apontar para outro projeto Supabase (ex.:
um ambiente de teste), copie `.env.local.example` para `.env.local` e ajuste os valores.

## Se o Supabase estiver fora do ar (modo offline)

Se o carregamento inicial não conseguir falar com o Supabase (sem internet, banco fora do
ar, chave errada), o app cai automaticamente para um snapshot de dados salvo em
`data/*.json` (o último estado válido de cada empresa), mostra um aviso vermelho na tela
("Modo offline") e desabilita o salvamento real - assim a pessoa nunca vê uma tela em
branco. Esses arquivos em `data/` são só um fallback de leitura; a fonte de verdade real é
sempre o Supabase.

## Estrutura

- `app/page.js` - toda a interface e lógica (client component único, como no app original).
- `app/globals.css` - estilos (idênticos ao app original, com fontes servidas de
  `public/fonts/` em vez de embutidas em base64).
- `lib/supabaseClient.js` - cliente Supabase.
- `lib/companies.js` - config visual e de dados de cada empresa (logos, cores do tema,
  dados de fallback).
- `lib/contracts.js` - lógica de negócio (cálculo de alerta de vencimento, formatação,
  import/export .xlsx/.csv).
- `data/*.json` - snapshot de fallback offline por empresa.
- `public/logos/`, `public/fonts/` - assets estáticos.

## Deploy

Este projeto é feito para ser publicado no [Vercel](https://vercel.com) a partir de um
repositório no GitHub (deploy automático a cada push, com histórico para reverter caso
algo quebre). Nas configurações do projeto no Vercel, as variáveis de ambiente opcionais
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem ser definidas (ver
`.env.local.example`); se não forem definidas, o app usa os valores padrão já embutidos.
