/**
 * Lab card: five background/foreground pairs used when high-contrast
 * paints a solid plate under host glyphs.
 */
import { t } from "./accessibilityI18n";
import { announce, Card, ChoiceGroup } from "./accessibilityPanelUI";
import {
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
    const styleName = t().textPlateStyle[plateStyle];
    return (
        <Card title={t().textPlateTitle} iconName="textPlate" badge={styleName}>
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
        </Card>
    );
}
