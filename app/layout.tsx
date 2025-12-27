import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StorageProvider } from '@/contexts/StorageContext';
import { MediaProvider } from '@/contexts/MediaContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Showtime - Stream Your Media',
    description: 'Stream media from WebDAV, FTP, and SMB drives with rich metadata from TMDB',
};

/**
 * Root Layout Component.
 * Wraps the entire application with necessary providers (Storage, Media).
 * Sets up global font and metadata.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link
                    href="https://vjs.zencdn.net/8.17.4/video-js.css"
                    rel="stylesheet"
                />
            </head>
            <body className={inter.className}>
                <StorageProvider>
                    <MediaProvider>
                        {children}
                    </MediaProvider>
                </StorageProvider>
            </body>
        </html>
    );
}
