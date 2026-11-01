/** The template both layout tests render: nested Rows and Columns, a Section, images, boxes with a maximum width, hiding. */
import { parseDocument } from "@unlayer-internal/elements-core";

/** Every node given an author's id (`column_2`: its type and count), so Chromium can find each box. */
function withIds(
  node: Record<string, unknown>,
  counts = new Map<string, number>(),
): Record<string, unknown> {
  const type = String(node.type).toLowerCase();
  const n = (counts.get(type) ?? 0) + 1;
  counts.set(type, n);
  const children = (node.children as unknown[] | undefined)?.map((child) =>
    typeof child === "string"
      ? child
      : withIds(child as Record<string, unknown>, counts),
  );
  return { id: `${type}_${n}`, ...node, ...(children ? { children } : {}) };
}

export const template = (root: "Page" | "Email") =>
  parseDocument({
    version: 1,
    root: withIds({
      type: root,
      props: { width: 640 },
      style: { gap: 16 },
      children: [
        {
          type: "Section",
          style: { backgroundColor: "#111", padding: [24, 20] },
          children: [
            {
              type: "Image",
              props: {
                src: {
                  src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
                  width: 120,
                },
              },
            },
          ],
        },
        {
          type: "Row",
          style: { gap: 24, padding: [0, 10] },
          children: [
            {
              type: "Column",
              style: { width: "40%", padding: 12, border: "2px solid #ccc" },
              children: [
                { type: "Text", children: ["a"] },
                { type: "Divider", style: { width: "50%" } },
              ],
            },
            {
              type: "Column",
              style: { flex: 2 },
              children: [
                {
                  type: "Row",
                  style: { gap: 8 },
                  children: [
                    { type: "Column", style: { width: 50 } },
                    { type: "Column" },
                    { type: "Column" },
                  ],
                },
                {
                  type: "Image",
                  props: {
                    src: {
                      src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
                      width: 2000,
                    },
                  },
                },
              ],
            },
            {
              type: "Column",
              id: "desktop-only",
              hidden: { mobile: true },
              children: [{ type: "Text", children: ["desktop"] }],
            },
          ],
        },
        {
          type: "Image",
          props: { src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
          style: { width: "50%" },
        },
        {
          type: "Paragraph",
          style: { padding: 8, maxWidth: 300 },
          children: ["b"],
        },
      ],
    }),
  });
