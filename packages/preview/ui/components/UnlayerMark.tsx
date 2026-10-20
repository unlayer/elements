/**
 * Unlayer's logo mark (its nine squares, as in packages/demo's UnlayerLogo),
 * in the text color, so it reads in light and dark mode.
 */
export function UnlayerMark({ height = 18 }: { height?: number }) {
  return (
    <svg className="unlayer-mark" width={Math.round((21.5 / 32) * height)} height={height} viewBox="0 0 21.5 32" fill="currentColor" aria-hidden focusable="false">
      <path d="M6.489 15.672H0.601V21.902H6.489ZM13.688 18.218H7.799V24.447H13.688ZM20.943 15.672H15.054V21.902H20.943ZM6.489 25.77H0.601V32H6.489ZM13.689 25.77H7.8V32H13.689ZM20.943 23.033H15.054V29.263H20.943ZM20.943 5.667H15.054V11.897H20.943ZM13.834 10.763H7.945V16.993H13.834ZM6.489 0H0.601V6.23H6.489Z" />
    </svg>
  );
}
