/**
 * Elements 0.2's components, which @unlayer/react-elements no longer exports from 0.3.0: the converter writes a React
 * Email template in them first, checks it, and writes its design JSON with them, before it's moved to the new ones.
 * This is migrate's own copy, built from the package's internal build (dist/todays.js). Templates and the converter
 * import it as `@unlayer/react-elements/legacy`, which the module hooks and tsconfig paths map here (todays-path.ts).
 */
export * from "@unlayer/react-elements/legacy";
