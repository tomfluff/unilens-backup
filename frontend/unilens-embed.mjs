/**
 * End-of-body scripts for study mock sites (and docs). Matches dev-demo / mirror pages.
 */
export const UNILENS_A11Y_BODY_SCRIPTS = `<script src="/accessibility.js"></script>
<script src="/unilens.js"></script>
<script>
  Accessibility.init()
  UniLens.init({ backend: 'http://127.0.0.1:5000', mouseWindow: 5 })
</script>`;
