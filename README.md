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
