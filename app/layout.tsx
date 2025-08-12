export const metadata = { title: 'Notes Feed', description: 'Notes app estilo Synopsis' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="font-body">{children}</body>
    </html>
  );
}
