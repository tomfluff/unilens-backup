---
Author: Yotam Sechayk
Date: 2026-09-26
---

# Associate response text: underline what each source supports

## Context

The builder asked to see which words of an answer each source supports: the fewest words, underlined, and joined to the source's number chip. It is a setting, off by default.

## Decision

- **The model marks the words.** With the setting on, the chat request carries `mark_phrases`, and the backend asks the model to wrap the fewest words stating each fact in `{{` and `}}`, right before its `[[id]]` marker.
- **The chat underlines them** in the style's line color, and a short connector joins the underline to the chip. The underline sits under the text's baseline in every chat style.
- **The chosen source's words get the highlight color** as a background.
- **When the model marks nothing**, the chat underlines the last few words before the chip, up to the clause's start.
- **Words are cut where a reader would cut them.** `Intl.Segmenter` finds word ends, so Japanese works, and the last word stays joined to its chip.
- **The braces never show or get read aloud**, even while an answer streams.

### From the second round of testing (2026-09-27)

- **Numbers sit after the words they support.** `gpt-5.6-terra` put most of its numbers after the sentence's full stop, all at the end of a paragraph (2 of 10 inline, 2 phrases marked). The rules now say where a marker goes, with a wrong and a right example, and that every marker gets its words. On the same two questions, twice each: 11 of 11 inline and 9 phrases marked; Gemini stays inline (16 of 16).
- **No underline for numbers gathered after a sentence.** The fallback underlined the last four words, as if every gathered source supported them.
- **The underline and the number are separate.** The line stops at the last word and the number follows a little apart (the builder's choice): a line run into a round number met it at a step that shifted with the font.

## Not in this change

- Underlines for answers made before the setting was turned on.
