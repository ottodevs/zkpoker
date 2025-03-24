import Providers from '@/components/providers'
import { exo } from '@/lib/fonts'
import './globals.css'

export { metadata, viewport } from '@/lib/metadata'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en'>
            <body className={`${exo.variable} font-sans antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
