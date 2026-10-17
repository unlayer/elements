/** A file's text, built into the module (`?raw`: Vite and the package's build both read it so). */
declare module "*?raw" {
  const text: string;
  export default text;
}
