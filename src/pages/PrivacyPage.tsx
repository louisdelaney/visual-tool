// What's collected, who can see what, and the risks of taking part. Keep this accurate: if the
// app or the backend starts collecting or logging anything new, this page must say so.
import { back, show } from "../app/flow";
import { pageHref } from "../app/address";

export function PrivacyPage() {
  return (
    <section className="view view-stack" data-view="privacy" aria-labelledby="privacy-h">
      <div className="panel prose">
        <h2 id="privacy-h">Privacy and risks</h2>
        <ul className="key-points">
          <li><strong>Just for fun.</strong> This is a casual online test for curiosity only, and it isn't medical advice.</li>
          <li><strong>All contributed data is public.</strong> Anyone can <a href={pageHref("data")} onClick={e => { e.preventDefault(); show("data"); }}>download</a> every result and answer people choose to contribute. The download is refreshed once a day; in it, times are rounded to the hour.</li>
          <li><strong>It's anonymous.</strong> There are no accounts, and no name, email or IP address is stored with your results.</li>
          <li><strong>Nothing that identifies you is logged.</strong> Only what's listed below is sent, and only if you choose to contribute. The backend keeps a short anonymous note of each request for a week, with nothing about you in it (see "What the backend logs").</li>
        </ul>

        <h3>If you contribute</h3>
        <p>When you finish the test, this is sent and added to the public dataset:</p>
        <ul>
          <li>Your answers from the first step: whether you have or suspect a visual perceptual disorder, which one, whether you've been diagnosed, psychedelic use, an estimate of how often and which ones, whether you take medications and which, notes, where you found the test, and your pseudonym if you gave one.</li>
          <li>Your results: thresholds, sensitivities, and every trial (what was shown, your answer, how long you took).</li>
          <li>Technical details needed to make sense of the results: your screen size and the card measurement, viewing distance, refresh rate, window size, browser and version (for example "Chrome 131 on macOS"), language setting, and the date and time of the test.</li>
        </ul>
        <p>If you choose not to contribute, nothing is sent. Your results stay in your browser, and you can save them as a file.</p>

        <h3>Your pseudonym</h3>
        <p>A pseudonym is completely optional. Leave it blank and your results can't be looked up or linked to each other: that's the most private choice.</p>
        <p>If you give one, it's the only key to your results. There's no password, so anyone who enters it sees every result and answer sent with it. Use the "Generate one" button for a random pair of words, and don't use your name, a username you use elsewhere, or anything else that points to you.</p>

        <h3>What the backend logs</h3>
        <p>To fix faults, the backend keeps a short record of each request for 7 days. It says which part of the service was called (for example "sending results"), whether it worked, how long it took, and a random reference number made for that one request. If something goes wrong it also keeps a short error message.</p>
        <p>It doesn't contain your IP address, browser, pseudonym or anything you entered, and the reference number isn't tied to you. If sending your results fails, this page shows that reference number, and you can quote it if you report a problem.</p>

        <h3>What isn't collected</h3>
        <ul>
          <li>No name, email address or account.</li>
          <li>No IP address, browser details or other request details stored or logged by the backend, with your results or anywhere else.</li>
          <li>No cookies, analytics, adverts or tracking of any kind.</li>
          <li>No third-party content: the fonts and everything else are served from this site, and the page is locked so your browser won't contact any other server.</li>
        </ul>

        <h3>Who can still see your IP address</h3>
        <p>Every website has to know your IP address to send you a page. These services see it, and this project can't stop that:</p>
        <ul>
          <li><strong>GitHub</strong>, which hosts this page on GitHub Pages and the data download, sees your IP address when you load the page or download the data, and may keep it in its own server logs, under GitHub's privacy statement.</li>
          <li><strong>Google Cloud</strong>, which runs the backend, receives your IP address when results are sent or looked up. The backend is set up not to store it, and to drop the per-request logs Google would otherwise keep, which include it. Google's network still handles the connection.</li>
          <li><strong>Your internet provider</strong>, and your employer or school if you're on their network, can see that you visited this site, but not what you answered.</li>
        </ul>

        <h3>Risks to you</h3>
        <ul>
          <li><strong>Someone who knows your pseudonym</strong> can see all your contributed results and answers, including any health conditions, medications and psychedelic use.</li>
          <li><strong>Anything you type is public</strong>, in the notes, medications, psychedelics or "other" boxes. Don't include names, places, contact details or anything else that identifies you.</li>
          <li><strong>Details can add up.</strong> Someone who already knows a lot about you, such as when you took the test and on what computer, might recognise your record from its date, screen and browser. Leaving out a pseudonym and keeping notes general makes that much harder.</li>
          <li><strong>You can only take a contribution back straight away.</strong> Right after sending, the Results page offers to remove that session from the database, until you run the test again or close the tab. It uses a secret code the backend gives your browser when the session is sent; the browser keeps it in memory only, and the backend stores only a scrambled form of it, which isn't in the download. After that there's no way to prove a result is yours, so no way to remove it. A removed session leaves the group figures at once and the download at its next daily refresh, but anyone who downloaded it before then keeps their copy. Only contribute what you're happy to have public for good.</li>
          <li><strong>The test shows flickering and moving dots.</strong> Don't take it if you have photosensitive epilepsy, and stop if you feel unwell.</li>
        </ul>

        <h3>On this device</h3>
        <p>Your browser remembers your card measurement, so you don't have to redo it next time. Nothing else is stored on your device, and that measurement never leaves it.</p>
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>Back</button></div>
    </section>
  );
}
