/** What to do when the folder has no templates: how to write one. */
export function NoTemplates({ dir, compact = false }: { dir?: string; compact?: boolean }) {
  return (
    <div className={compact ? "no-templates compact" : "no-templates"}>
      {compact ? <p>No templates yet.</p> : <h2>No templates in {dir ?? "this folder"} yet</h2>}
      <p className="muted">
        Add a <code>.tsx</code> file with an <code>export default</code> component that returns <code>&lt;Email&gt;</code>, <code>&lt;Page&gt;</code> or{" "}
        <code>&lt;Document&gt;</code>. It shows up here as soon as you save it.
      </p>
    </div>
  );
}
