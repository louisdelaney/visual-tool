// design-sync entry: the scoped component surface uploaded to claude.ai/design.
// Hand-written on purpose. The converter's own synth entry would `export * from` every
// .tsx under src/, including main.tsx — which mounts the app and throws "#app is missing"
// at module load, breaking every preview. Keep this barrel limited to the design-scope
// components (see .design-sync/NOTES.md).
export { ChipInput, NO_CHIPS, MAX_CHIPS, MAX_CHIP_LENGTH, chipValues, type Chips } from "../src/components/ChipInput";
export { Footer } from "../src/components/Footer";
export { FunNotice } from "../src/components/FunNotice";
export { Masthead } from "../src/components/Masthead";
export { Stepper } from "../src/components/Stepper";
