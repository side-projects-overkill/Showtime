import Link from 'next/link';

/**
 * Home Page Component.
 * Landing page with feature overview and quick links.
 */
export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <h1 className="text-6xl md:text-7xl font-bold">
                        <span className="text-gradient">Showtime</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300">
                        Stream your media from anywhere. Connect to WebDAV, FTP, or SMB drives and enjoy your content with rich metadata from TMDB.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center pt-8">
                        <Link href="/settings" className="btn btn-primary text-lg px-8 py-4">
                            Get Started
                        </Link>
                        <Link href="/library" className="btn btn-secondary text-lg px-8 py-4">
                            Browse Library
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 mt-24 animate-slide-up">
                    <div className="card card-hover text-center">
                        <div className="text-5xl mb-4">🌐</div>
                        <h3 className="text-xl font-bold mb-2">Multiple Storage Types</h3>
                        <p className="text-gray-400">
                            Connect to WebDAV, FTP, and SMB/CIFS drives seamlessly
                        </p>
                    </div>

                    <div className="card card-hover text-center">
                        <div className="text-5xl mb-4">🎬</div>
                        <h3 className="text-xl font-bold mb-2">Rich Metadata</h3>
                        <p className="text-gray-400">
                            Automatic metadata fetching from TMDB for movies and TV shows
                        </p>
                    </div>

                    <div className="card card-hover text-center">
                        <div className="text-5xl mb-4">📱</div>
                        <h3 className="text-xl font-bold mb-2">Modern Streaming</h3>
                        <p className="text-gray-400">
                            Smooth playback with Video.js and responsive design
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-24 glass-dark rounded-2xl p-8">
                    <h2 className="text-3xl font-bold mb-8 text-center">Supported Formats</h2>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {['MP4', 'MKV', 'AVI', 'MOV', 'WebM', 'M4V'].map((format) => (
                            <div key={format} className="px-6 py-3 bg-primary-500/20 rounded-lg border border-primary-500/30">
                                <span className="font-mono font-bold text-primary-400">{format}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
