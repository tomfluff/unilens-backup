/**
 * Lab card: five background/foreground pairs used when high-contrast
 * paints a solid plate under host glyphs, and how far high contrast reaches
 * (body text / + parts / everything).
 */
import { t } from "./accessibilityI18n";
import { announce, Card, ChoiceGroup } from "./accessibilityPanelUI";
import {
    HC_TEXT_SCOPES,
    type HcTextScope,
    patchA11ySettings,
    TEXT_PLATE_PAIRS,
    TEXT_PLATE_STYLES,
    type TextPlateStyle,
} from "./accessibilityStore";
import { useSettings } from "./settings";

function TextPlatePreview({
    bg,
    fg,
    name,
}: {
    bg: string;
    fg: string;
    name: string;
}) {
    return (
        <span aria-hidden="true" className="unilens-a11y-text-plate-option">
            <span
                className="unilens-a11y-text-plate-preview"
                style={{ background: bg, color: fg }}
            >
                {t().previewSample}
            </span>
            <span className="unilens-a11y-text-plate-name">{name}</span>
        </span>
    );
}

export function TextPlateCard() {
    const plateStyle = useSettings((s) => s.textPlateStyle);
    const scope = useSettings((s) => s.hcTextScope);
    return (
        <Card title={t().textPlateTitle} iconName="textPlate">
            <ChoiceGroup<TextPlateStyle>
                label={t().textPlateGroup}
                columns={2}
                focusPrefix="textPlateStyle"
                current={plateStyle}
                options={TEXT_PLATE_STYLES.map((value) => {
                    const label = t().textPlateStyle[value];
                    const pair = TEXT_PLATE_PAIRS[value];
                    return {
                        value,
                        label,
                        hideLabel: true,
                        ariaLabel: t().textPlateStyleAria(label),
                        preview: () => (
                            <TextPlatePreview
                                bg={pair.bg}
                                fg={pair.fg}
                                name={label}
                            />
                        ),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ textPlateStyle: value });
                    announce(
                        t().textPlateStyleAnnounce(t().textPlateStyle[value]),
                    );
                }}
            />
            <ChoiceGroup<HcTextScope>
                label={t().hcTextScopeGroup}
                columns={3}
                focusPrefix="hcTextScope"
                current={scope}
                options={HC_TEXT_SCOPES.map((value) => ({
                    value,
                    label: t().hcTextScope[value],
                    ariaLabel: t().hcTextScopeAria(t().hcTextScope[value]),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({ hcTextScope: value });
                    announce(t().hcTextScopeAnnounce(t().hcTextScope[value]));
                }}
            />
            {/* The choice cards keep their labels on one line, so what the
                selected reach changes is spelled out below them. */}
            <p className="unilens-a11y-card-desc">
                {t().hcTextScopeHint[scope]}
            </p>
        </Card>
    );
}
