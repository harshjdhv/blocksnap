'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CaptureMetadata {
    url: string;
    title: string;
    elementType: string;
    label: string;
    dimensions: { width: number; height: number };
    capturedAt: number;
}

interface CaptureData {
    imageDataUrl: string;
    metadata: CaptureMetadata;
    timestamp: number;
}

export default function PreviewPage() {
    const [capture, setCapture] = useState<CaptureData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for messages from the extension content script
        const handleMessage = (event: MessageEvent) => {
            // We only accept messages from our extension (via window.postMessage)
            if (event.data?.type === 'BLOCKSNAP_CAPTURE_DATA') {
                console.log('Received capture data:', event.data.payload);
                setCapture(event.data.payload);
                setLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);

        // Also check if data was already injected on window load
        const contentScriptData = (window as any).__BLOCKSNAP_CAPTURE__;
        if (contentScriptData) {
            console.log('Found injected capture data:', contentScriptData);
            setCapture(contentScriptData);
            setLoading(false);
        } else {
            // Set a timeout to show empty state if no data arrives
            const timer = setTimeout(() => {
                if (!capture) setLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-gray-400 font-mono text-sm">Loading capture...</p>
                </div>
            </div>
        );
    }

    if (!capture) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
                <div className="max-w-md text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Ready to Capture</h1>
                    <p className="text-gray-400">
                        Install the BlockSnap extension and click an element to see it here.
                    </p>
                    <div className="pt-8">
                        <a href="/" className="text-primary hover:underline text-sm font-medium">← Back to Home</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                        BS
                    </div>
                    <span className="font-semibold tracking-tight">BlockSnap</span>
                    <span className="text-gray-600 mx-2">/</span>
                    <span className="text-sm text-gray-400 font-mono">Preview</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = capture.imageDataUrl;
                            link.download = `blocksnap-${Date.now()}.png`;
                            link.click();
                        }}
                        className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PNG
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

                {/* Left: Metadata */}
                <aside className="lg:w-80 shrink-0 space-y-6">
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Metadata</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Source URL</div>
                                <div className="text-sm font-medium truncate" title={capture.metadata.url}>
                                    {new URL(capture.metadata.url).hostname}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Element</div>
                                    <div className="text-sm font-mono text-purple-400 lowercase border border-purple-500/20 bg-purple-500/5 px-2 py-1 rounded w-fit">
                                        {capture.metadata.elementType}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Dimensions</div>
                                    <div className="text-sm font-mono text-gray-300">
                                        {capture.metadata.dimensions.width} × {capture.metadata.dimensions.height}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 mb-1">Captured At</div>
                                <div className="text-sm text-gray-400">
                                    {new Date(capture.metadata.capturedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right: Preview Canvas */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-8 flex items-center justify-center min-h-[400px] overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

                        <motion.img
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            src={capture.imageDataUrl}
                            alt="Captured Block"
                            className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border border-white/10 relative z-10"
                        />

                        <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            100% Scale
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
