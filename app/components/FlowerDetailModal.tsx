import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Animated,
    Linking,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { flowersApi } from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

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

function formatTokenId(tokenId: string): string {
    if (tokenId.length > 12) {
        return `${tokenId.slice(0, 6)}...${tokenId.slice(-4)}`;
    }
    return `#${tokenId}`;
}

// ─── Component ───────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlowerDetailModalProps {
    flower: FlowerDetailData | null;
    visible: boolean;
    onClose: () => void;
}

export function FlowerDetailModal({ flower, visible, onClose }: FlowerDetailModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [metadataExpanded, setMetadataExpanded] = useState(false);

    useEffect(() => {
        if (visible) {
            setMetadata(null);
            setMetadataExpanded(false);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.95);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    const handleLoadMetadata = async () => {
        if (!metadataExpanded && !metadata && flower) {
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
    };

    if (!flower) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.card,
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        activeOpacity={0.7}
                    >
                        <Feather name="x" size={16} color="#fff" />
                    </TouchableOpacity>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        style={styles.scrollView}
                    >
                        {/* Image */}
                        {flower.imageUrl && (
                            <Image
                                source={{ uri: flower.imageUrl }}
                                style={styles.image}
                            />
                        )}

                        {/* Details */}
                        <View style={styles.details}>
                            {/* Focus Info */}
                            <View>
                                <Text style={[styles.reason, { color: colors.text }]}>
                                    {flower.session.reason}
                                </Text>
                                <View style={styles.metaRow}>
                                    <Feather name="clock" size={13} color={colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {formatDuration(flower.session.durationSeconds)}
                                    </Text>
                                    <Text style={[styles.metaDot, { color: colors.textSecondary }]}>·</Text>
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {formatDate(flower.createdAt)}
                                    </Text>
                                </View>
                            </View>

                            {/* NFT Info */}
                            {flower.minted && (
                                <View style={[styles.nftCard, { backgroundColor: colors.warm }]}>
                                    <View style={styles.nftHeader}>
                                        <Feather name="star" size={14} color={colors.primary} />
                                        <Text style={[styles.nftTitle, { color: colors.text }]}>NFT Info</Text>
                                    </View>

                                    {flower.tokenId && (
                                        <View style={styles.nftRow}>
                                            <Text style={[styles.nftLabel, { color: colors.textSecondary }]}>Token ID</Text>
                                            <Text style={[styles.nftValue, { color: colors.text }]}>
                                                {formatTokenId(flower.tokenId)}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.nftRow}>
                                        <Text style={[styles.nftLabel, { color: colors.textSecondary }]}>Status</Text>
                                        <View style={styles.mintedBadge}>
                                            <View style={styles.mintedDot} />
                                            <Text style={styles.mintedText}>Minted</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Links */}
                            <View style={styles.links}>
                                {flower.txHash && (
                                    <TouchableOpacity
                                        style={[styles.linkButton, { borderColor: colors.border }]}
                                        onPress={() => Linking.openURL(getExplorerTxUrl(flower.txHash!))}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.linkLeft}>
                                            <Feather name="external-link" size={14} color={colors.primary} />
                                            <Text style={[styles.linkText, { color: colors.text }]}>View Transaction</Text>
                                        </View>
                                        <Text style={[styles.linkHash, { color: colors.textSecondary }]}>
                                            {shortenHash(flower.txHash)}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {flower.metadataUrl && (
                                    <View style={[styles.metadataContainer, { borderColor: colors.border }]}>
                                        <TouchableOpacity
                                            style={styles.metadataButton}
                                            onPress={handleLoadMetadata}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.linkLeft}>
                                                <Feather name="code" size={14} color={colors.primary} />
                                                <Text style={[styles.linkText, { color: colors.text }]}>Metadata</Text>
                                            </View>
                                            <View style={styles.metadataRight}>
                                                <Text style={[styles.jsonLabel, { color: colors.textSecondary }]}>JSON</Text>
                                                <Feather
                                                    name={metadataExpanded ? 'chevron-up' : 'chevron-down'}
                                                    size={16}
                                                    color={colors.textSecondary}
                                                />
                                            </View>
                                        </TouchableOpacity>

                                        {metadataExpanded && (
                                            <View style={[styles.metadataContent, { borderTopColor: colors.border, backgroundColor: colors.warm }]}>
                                                {metadataLoading ? (
                                                    <View style={styles.metadataLoading}>
                                                        <ActivityIndicator size="small" color={colors.primary} />
                                                    </View>
                                                ) : metadata ? (
                                                    <ScrollView
                                                        horizontal={false}
                                                        style={styles.metadataScroll}
                                                        nestedScrollEnabled
                                                    >
                                                        <Text style={[styles.metadataText, { color: colors.text }]}>
                                                            {JSON.stringify(metadata, null, 2)}
                                                        </Text>
                                                    </ScrollView>
                                                ) : null}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: SCREEN_WIDTH - 48,
        maxHeight: '85%',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flexGrow: 0,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
    },
    details: {
        padding: 20,
        gap: 16,
    },
    reason: {
        fontSize: 18,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    metaText: {
        fontSize: 13,
    },
    metaDot: {
        fontSize: 13,
        marginHorizontal: 2,
    },
    // NFT Info
    nftCard: {
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    nftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nftTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    nftRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nftLabel: {
        fontSize: 13,
    },
    nftValue: {
        fontSize: 12,
        fontFamily: 'SpaceMono',
        fontWeight: '500',
    },
    mintedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mintedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    mintedText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#16a34a',
    },
    // Links
    links: {
        gap: 8,
    },
    linkButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    linkText: {
        fontSize: 14,
    },
    linkHash: {
        fontSize: 11,
        fontFamily: 'SpaceMono',
    },
    // Metadata
    metadataContainer: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    metadataButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    metadataRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    jsonLabel: {
        fontSize: 12,
    },
    metadataContent: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    metadataLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    metadataScroll: {
        maxHeight: 200,
    },
    metadataText: {
        fontSize: 11,
        fontFamily: 'SpaceMono',
        lineHeight: 16,
    },
});
