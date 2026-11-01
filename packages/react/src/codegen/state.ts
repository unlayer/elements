/** What a conversion collects as it goes: the components it uses, its warnings, and the types the module imports. */
export class ModuleState {
  readonly warnings: string[] = [];
  /** Block components used, in order. */
  readonly components = new Set<string>();
  /** The web fonts whose `<Font>` gives their URL back to their family's fonts, by family (see fonts.ts). */
  restoredFonts = new Map<string, string>();
  /** The props types the module imports, for `values` written as their type (see props.ts). */
  readonly types = new Set<string>();

  constructor(
    /** The design's exported HTML, for blocks Elements has no component for. */
    readonly html?: string
  ) {}

  use(component: string): void {
    this.components.add(component);
  }

  /** (Each said once: looked up in a set, not the list, which a design of many blocks that each warn made long.) */
  private readonly said = new Set<string>();

  warn(message: string): void {
    if (this.said.has(message)) return;
    this.said.add(message);
    this.warnings.push(message);
  }
}
