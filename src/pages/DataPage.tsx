// The public dataset: what's in it, the license, and the download. The words are in
// src/text/en/data.md; keep them in line with the export job (backend/src/jobs/export.ts) and the README.
import { API_URL } from "../app/api";
import { back } from "../app/flow";
import { text } from "../text";
import { Doc } from "../text/Doc";

const t = text.infoPages.data;

export function DataPage() {
  const download = API_URL
    ? <p><a className="btn" href={`${API_URL}/export`} target="_blank" rel="noreferrer">{t.download}</a></p>
    : <p>{t.noDownload}</p>;
  return (
    <section className="view view-stack" data-view="data" aria-labelledby="data-h">
      <div className="panel prose">
        <Doc blocks={t.page} titleId="data-h" parts={{ download }} />
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>{text.common.back}</button></div>
    </section>
  );
}
