---
Author: Faith Luo
Date: 2027-08-27
---
One of many planned efforts for code cleanup.

# Styled Components

Refactor manual CSS styles to use `styled-components` instead. `styled-components` handle native CSS overrides better, and don't require deep object flattening in order to render out nested styles.

## Example

**Current pattern** (`SettingsPanel.tsx`):

```tsx
function SettingsLauncher() {
  const [hover, setHover] = useState(false)

  return (
    <button
      style={{
        position: 'fixed',
        bottom: 14,
        left: 14,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        fontSize: 16,
        cursor: 'pointer',
        zIndex: 2147483647,
        opacity: hover ? 1 : 0.6,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      ⚙
    </button>
  )
}
```

**With `styled-components`**:

```tsx
const GearButton = styled.button`
  position: fixed;
  bottom: 14px;
  left: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  z-index: 2147483647;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }
`

function SettingsLauncher() {
  return <GearButton title="UniLens settings">⚙</GearButton>
}
```

The hover state collapses from a JS `useState` + two handlers into a CSS pseudo-class. The same pattern eliminates the `Object.assign(el.style, {...})` calls in imperative modules like `minimap.ts`.

