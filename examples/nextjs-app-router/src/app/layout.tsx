import type { ReactNode } from "react";

export const metadata = {
  title: "Elements + Next.js App Router",
  description: "Rendering Unlayer Elements to email HTML from a Server Component",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#fafafa",
          color: "#18181b",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
