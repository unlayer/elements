import type { Finding } from "../../../shared/findings";
import type { RenderResponse } from "../../api";
import { Section } from "./Section";
import { renderingItems, renderingSummary } from "./summary";

const BADGE: Record<Finding["level"], { tone: string; label: string }> = {
  error: { tone: "none", label: "error" },
  warning: { tone: "partial", label: "warning" },
  info: { tone: "info", label: "info" },
};

/** "Rendering": what Elements and React reported (a column too many, a block left out), render errors, and no design JSON or plain text. */
export function RenderingChecks({ result, warnings }: { result?: RenderResponse; warnings: string[] }) {
  const items = renderingItems(result, warnings);
  return (
    <Section
      title="Rendering"
      about="What Elements and React report while rendering: a column too many, a block left out, an error"
      summary={renderingSummary(result, warnings)}
    >
      {items.length > 0 && (
        <ul className="findings">
          {items.map((item, i) => (
            <li key={i} className="finding">
              <span className={`badge ${BADGE[item.level].tone}`}>{item.kind === "log" ? "log" : BADGE[item.level].label}</span>
              <pre className="finding-log">{item.message}</pre>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
