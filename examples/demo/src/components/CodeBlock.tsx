import { Highlight, themes } from "prism-react-renderer";
import CopyButton from "./CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
  maxHeight?: string;
  className?: string;
}

export default function CodeBlock({
  code,
  language = "tsx",
  showCopy = true,
  maxHeight = "600px",
  className = "",
}: CodeBlockProps) {
  return (
    <div className={`relative group rounded-lg overflow-hidden bg-[#0d1117] ${className}`}>
      {showCopy && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} />
        </div>
      )}
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre
            className="code-block overflow-auto p-4 text-[13px] leading-[1.7]"
            style={{ maxHeight, fontFamily: "var(--font-mono)" }}
          >
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 text-right mr-4 text-[#484f58] select-none text-xs">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
