/**
 * 3-stage levels for body-text expand and small-text boost (0 = off).
 */
export type TextAdjustLevel = 0 | 1 | 2 | 3;

export interface BodyTextExpandLevelConfig {
    scale: number;
    minPx: number;
}

export interface SmallTextBoostLevelConfig {
    minPx: number;
    addPx: number;
}

export const BODY_TEXT_EXPAND_CONFIG: Record<
    1 | 2 | 3,
    BodyTextExpandLevelConfig
> = {
    1: { scale: 1.15, minPx: 16 },
    2: { scale: 1.25, minPx: 16 },
    3: { scale: 1.35, minPx: 16 },
};

export const SMALL_TEXT_BOOST_CONFIG: Record<
    1 | 2 | 3,
    SmallTextBoostLevelConfig
> = {
    1: { minPx: 14, addPx: 2 },
    2: { minPx: 16, addPx: 3 },
    3: { minPx: 18, addPx: 4 },
};

export const TEXT_ADJUST_LEVELS: TextAdjustLevel[] = [0, 1, 2, 3];

export function normalizeTextAdjustLevel(n: unknown): TextAdjustLevel {
    if (n === 0 || n === 1 || n === 2 || n === 3) return n;
    return 0;
}

export function bodyTextExpandConfig(
    level: TextAdjustLevel,
): BodyTextExpandLevelConfig | null {
    if (level === 1 || level === 2 || level === 3)
        return BODY_TEXT_EXPAND_CONFIG[level];
    return null;
}

export function smallTextBoostConfig(
    level: TextAdjustLevel,
): SmallTextBoostLevelConfig | null {
    if (level === 1 || level === 2 || level === 3)
        return SMALL_TEXT_BOOST_CONFIG[level];
    return null;
}

/**
 * A supplementary label like "1.25×". Derived mechanically from the config
 * value, so it can never drift out of sync. Digits and symbols only, so it's
 * language-independent.
 */
export function bodyTextExpandHint(level: TextAdjustLevel): string {
    const cfg = bodyTextExpandConfig(level);
    return cfg ? `${cfg.scale}×` : "";
}

/** A supplementary label like "16px+". Also language-independent. */
export function smallTextBoostHint(level: TextAdjustLevel): string {
    const cfg = smallTextBoostConfig(level);
    return cfg ? `${cfg.minPx}px+` : "";
}

/** Elements below this computed size are candidates for small-text boost. */
export const SMALL_TEXT_THRESHOLD_PX = 16;

export function computeBodyTextTargetPx(
    originalPx: number,
    level: TextAdjustLevel,
): number {
    const cfg = bodyTextExpandConfig(level);
    if (!cfg) return originalPx;
    return Math.max(cfg.minPx, Math.round(originalPx * cfg.scale * 100) / 100);
}

export function computeSmallTextTargetPx(
    originalPx: number,
    level: TextAdjustLevel,
): number {
    const cfg = smallTextBoostConfig(level);
    if (!cfg) return originalPx;
    return Math.max(
        cfg.minPx,
        Math.round((originalPx + cfg.addPx) * 100) / 100,
    );
}
