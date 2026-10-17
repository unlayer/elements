import { useMemo, useState, type RefObject } from "react";
import type { TemplateEntry } from "../api";
import { ChevronRightIcon } from "./icons";
import { NoTemplates } from "./NoTemplates";

interface Folder {
  name: string;
  path: string;
  folders: Folder[];
  templates: TemplateEntry[];
}

function buildTree(templates: TemplateEntry[]): Folder {
  const root: Folder = { name: "", path: "", folders: [], templates: [] };
  for (const template of templates) {
    const parts = template.path.split("/");
    let folder = root;
    for (const part of parts.slice(0, -1)) {
      const path = folder.path ? `${folder.path}/${part}` : part;
      let next = folder.folders.find((f) => f.name === part);
      if (!next) {
        next = { name: part, path, folders: [], templates: [] };
        folder.folders.push(next);
      }
      folder = next;
    }
    folder.templates.push(template);
  }
  return root;
}

interface SidebarProps {
  /** Undefined while the list loads. */
  templates?: TemplateEntry[];
  selected?: string;
  dir?: string;
  onSelect(path: string): void;
  filterRef: RefObject<HTMLInputElement>;
}

export function Sidebar({ templates, selected, dir, onSelect, filterRef }: SidebarProps) {
  const [filter, setFilter] = useState("");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? (templates ?? []).filter((t) => t.path.toLowerCase().includes(q)) : (templates ?? []);
  }, [templates, filter]);
  const tree = useMemo(() => buildTree(visible), [visible]);

  const toggle = (path: string) =>
    setClosed((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const renderFolder = (folder: Folder, depth: number) => (
    <ul className="tree" role={depth === 0 ? "tree" : "group"} aria-label={depth === 0 ? "Templates" : undefined}>
      {folder.folders.map((child) => {
        const open = !closed.has(child.path) || filter !== "";
        return (
          <li key={child.path} role="treeitem" aria-expanded={open}>
            <button className="tree-row tree-folder" style={{ paddingLeft: 8 + depth * 12 }} onClick={() => toggle(child.path)}>
              <span className={`disclosure${open ? " open" : ""}`}>
                <ChevronRightIcon />
              </span>
              {child.name}
            </button>
            {open && renderFolder(child, depth + 1)}
          </li>
        );
      })}
      {folder.templates.map((template) => (
        <li key={template.path} role="treeitem" aria-selected={template.path === selected}>
          <button
            className={`tree-row tree-item${template.path === selected ? " selected" : ""}`}
            style={{ paddingLeft: 26 + depth * 12 }}
            onClick={() => onSelect(template.path)}
            title={template.path}
            aria-current={template.path === selected ? "page" : undefined}
          >
            {template.name}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          Elements preview
        </div>
        {dir && (
          <div className="sidebar-dir" title={dir}>
            {dir}
          </div>
        )}
      </div>
      <div className="filter">
        <input
          ref={filterRef}
          className="input"
          type="search"
          placeholder="Filter templates"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFilter("");
              e.currentTarget.blur();
            } else if (e.key === "Enter" && visible.length > 0) {
              onSelect(visible[0].path);
            }
          }}
          aria-label="Filter templates"
          aria-keyshortcuts="/"
        />
        {!filter && <kbd className="filter-kbd">/</kbd>}
      </div>
      <nav className="sidebar-list" aria-label="Templates">
        {templates === undefined ? null : templates.length === 0 ? (
          <NoTemplates dir={dir} compact />
        ) : visible.length === 0 ? (
          <p className="sidebar-empty">No template matches “{filter}”.</p>
        ) : (
          renderFolder(tree, 0)
        )}
      </nav>
    </aside>
  );
}
