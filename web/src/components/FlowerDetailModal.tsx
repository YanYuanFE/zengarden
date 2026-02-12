import { useState, useEffect, useCallback } from 'react';
import { flowersApi } from '@/services/api';
import { X, ExternalLink, Clock, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function shortenHash(hash: string, chars = 6): string {
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

function getExplorerTxUrl(txHash: string): string {
    if (txHash.startsWith('0x')) {
        return `https://bscscan.com/tx/${txHash}`;
    }
    return `https://solscan.io/tx/${txHash}`;
}

// ─── Types ───────────────────────────────────────────────

export interface FlowerDetailData {
    id: string;
    imageUrl?: string;
    createdAt: string;
    txHash?: string;
    tokenId?: string;
    metadataUrl?: string;
    minted?: boolean;
    session: { reason: string; durationSeconds: number };
}

// ─── Component ───────────────────────────────────────────

interface FlowerDetailModalProps {
    flower: FlowerDetailData;
    onClose: () => void;
}

export function FlowerDetailModal({ flower, onClose }: FlowerDetailModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [metadataExpanded, setMetadataExpanded] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    }, [onClose]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleClose]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
            onClick={handleClose}
        >
            <div
                className={`relative w-full max-w-sm max-h-[90vh] bg-card rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[90vh] scrollbar-hide">
                    {/* Image */}
                    {flower.imageUrl && (
                        <img
                            src={flower.imageUrl}
                            alt="Flower"
                            className="w-full aspect-square object-cover"
                        />
                    )}

                    {/* Details */}
                    <div className="p-5 space-y-4">
                        {/* Focus Info */}
                        <div>
                            <h2 className="font-display text-lg font-bold text-charcoal">{flower.session.reason}</h2>
                            <div className="flex items-center gap-1.5 mt-1 text-stone text-sm">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatDuration(flower.session.durationSeconds)}</span>
                                <span className="mx-1">·</span>
                                <span>{formatDate(flower.createdAt)}</span>
                            </div>
                        </div>

                        {/* NFT Info */}
                        {flower.minted && (
                            <div className="rounded-xl bg-cream p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                                    <Sparkles className="w-4 h-4 text-sage" />
                                    NFT Info
                                </div>

                                {flower.tokenId && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-stone">Token ID</span>
                                        <span className="font-mono text-charcoal font-medium text-xs">
                                            {flower.tokenId.length > 12
                                                ? `${flower.tokenId.slice(0, 6)}...${flower.tokenId.slice(-4)}`
                                                : `#${flower.tokenId}`}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-stone">Status</span>
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Minted
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Links */}
                        <div className="space-y-2">
                            {flower.txHash && (
                                <a
                                    href={getExplorerTxUrl(flower.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-border hover:bg-cream transition-colors text-sm"
                                >
                                    <div className="flex items-center gap-2 text-charcoal">
                                        <ExternalLink className="w-4 h-4 text-sage" />
                                        <span>View Transaction</span>
                                    </div>
                                    <span className="font-mono text-xs text-stone">{shortenHash(flower.txHash)}</span>
                                </a>
                            )}

                            {flower.metadataUrl && (
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <button
                                        onClick={async () => {
                                            if (!metadataExpanded && !metadata) {
                                                setMetadataLoading(true);
                                                try {
                                                    const result = await flowersApi.getMetadata(flower.id);
                                                    setMetadata(result.metadata);
                                                } catch {
                                                    setMetadata({ error: 'Failed to load metadata' });
                                                } finally {
                                                    setMetadataLoading(false);
                                                }
                                            }
                                            setMetadataExpanded(!metadataExpanded);
                                        }}
                                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-cream transition-colors text-sm"
                                    >
                                        <div className="flex items-center gap-2 text-charcoal">
                                            <Sparkles className="w-4 h-4 text-sage" />
                                            <span>Metadata</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-stone">
                                            <span className="text-xs">JSON</span>
                                            {metadataExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </div>
                                    </button>
                                    {metadataExpanded && (
                                        <div className="border-t border-border px-4 py-3 bg-cream/50">
                                            {metadataLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="w-4 h-4 animate-spin text-sage" />
                                                </div>
                                            ) : metadata ? (
                                                <pre className="text-xs text-charcoal font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-60 overflow-y-auto scrollbar-hide">
                                                    {JSON.stringify(metadata, null, 2)}
                                                </pre>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
