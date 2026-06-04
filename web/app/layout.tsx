import './globals.css'
import { Inter } from 'next/font/google'

// الاستيراد من نفس المجلد الحالي
import ClerkProviderWrapper from './ClerkProviderWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DropLogic - Smart Commerce',
  description: 'Built with logic',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProviderWrapper>
          {children}
        </ClerkProviderWrapper>
      </body>
    </html>
  )
}