# Notes App — Next.js + Tailwind (Vercel)

## Requisitos
- Node 18+
- (Opcional) arquivos de fonte Madera em `public/fonts/`

## Instalação
```bash
npm i  # ou pnpm i / yarn
npm run dev  # http://localhost:3000
```

## Deploy na Vercel
1. Suba este projeto para o GitHub.
2. Na Vercel: **New Project** → selecione o repositório → Deploy (padrão Next.js).
3. Se quiser a tipografia Madera, coloque os arquivos `.ttf` em `public/fonts/`.

## Observações
- Anexos ficam em memória (Blob local). Para produção, avalie S3/Cloudinary/Supabase.
- Dados persistem em `localStorage`.

## Variáveis Supabase
```ini
NEXT_PUBLIC_SUPABASE_URL=https://fusqcehzxsocgedayjtf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c3FjZWh6eHNvY2dlZGF5anRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTc3MzgsImV4cCI6MjA3MDU5MzczOH0.dz568jxuGoLMats9d5xRjbti4E7q6e39jvq_NChDN7w
```
