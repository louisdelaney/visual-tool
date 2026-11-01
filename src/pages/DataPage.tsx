// The public dataset: what's in it, the license, and the download. Keep the
// description in line with the export job (backend/src/jobs/export.ts) and the README.
import { API_URL } from "../app/api";
import { back } from "../app/flow";

export function DataPage() {
  return (
    <section className="view view-stack" data-view="data" aria-labelledby="data-h">
      <div className="panel prose">
        <h2 id="data-h">Data</h2>
        <p>Every result and answer people choose to contribute is free to download, use and investigate, by anyone, for any purpose.</p>
        {API_URL
          ? <p><a className="btn" href={`${API_URL}/export`} target="_blank" rel="noreferrer">Download the data</a></p>
          : <p>The download isn't available on this copy of the site.</p>}

        <h3>License</h3>
        <p>
          The data is licensed under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.
          {" "}You can share and adapt it for any purpose, as long as you mention where it came from, with a link back to this site.
        </p>
        <p>Please don't try to work out who anyone is. Contributors are anonymous, and some of what they shared is personal.</p>

        <h3>What's in it</h3>
        <ul>
          <li>Every contributed session, from every version of the test, with every trial, the screen calibration, the test's settings and the answers from the first step.</li>
          <li>Times are rounded to the hour, and the time of each trial is left out.</li>
          <li>It's refreshed once a day, so the latest results may take a day to appear.</li>
        </ul>

        <h3>Format</h3>
        <p>
          The download is one JSON file, <code>sessions.json</code>. It holds every session in order of arrival, in the same format as the file you can save from your own results, plus the date each was received.
          {" "}Each session records its <code>test_version</code>; only compare sessions from the same version, since a new version means the test itself changed.
        </p>
        <p>The results come from people taking a casual online test on their own screens, unsupervised, so screens, viewing distances and attention vary.</p>
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>Back</button></div>
    </section>
  );
}
