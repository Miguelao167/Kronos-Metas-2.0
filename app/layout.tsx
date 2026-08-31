import type { Metadata } from 'next'; import './globals.css'; export const metadata:Metadata={title:'Kronos — Operação 100K',description:'Painel de execução comercial para alcançar R$ 100 mil em 30 dias.'}; export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" className="dark"><body>{children}</body></html>}

