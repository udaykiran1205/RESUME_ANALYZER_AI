import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a14' },
  ],
};

export const metadata = {
  title: {
    default: 'AI Resume Analyzer — ATS Scoring & Career Intelligence',
    template: '%s | AI Resume Analyzer',
  },
  description:
    'AI-powered ATS resume analyzer. Get instant resume scores, keyword suggestions, skill gap analysis, and professional improvement recommendations.',
  keywords: ['resume analyzer', 'ATS score', 'AI resume', 'job application', 'career'],
  authors: [{ name: 'AI Resume Analyzer' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgb(15 15 30)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                  maxWidth: '380px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: { primary: 'rgb(34,197,94)', secondary: 'white' },
                },
                error: {
                  iconTheme: { primary: 'rgb(239,68,68)', secondary: 'white' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
