// The "just for fun" banner, in the header above the steps on the home page and the Results page.
// On the Results page the line carries on with what happens to the person's data, and anything
// about sending it follows below.
import type { ReactNode } from "react";

interface FunNoticeProps {
  /** More sentences, carrying on the same paragraph. */
  more?: ReactNode;
  /** Anything below the paragraph. */
  children?: ReactNode;
}

export function FunNotice({ more, children }: FunNoticeProps) {
  const line = <><strong>Just for fun.</strong> This is a casual online test for curiosity only. It isn't medical advice.{more && <> {more}</>}</>;
  if (!children) return <p className="fun-notice" role="note">{line}</p>;
  return (
    <div className="fun-notice">
      <p role="note">{line}</p>
      {children}
    </div>
  );
}
