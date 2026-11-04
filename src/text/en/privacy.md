<!--
The Privacy and risks page, as it appears. "#" is the page's title and "##" starts a section; a
list straight under the title is shown as the key points. CONTRIBUTING.md explains the rest.

Keep this accurate: these are the project's promises (see AGENTS.md). If the site or the backend
starts collecting or logging anything new, this page must say so.
-->

# Privacy and risks

- **Just for fun.** This is a casual online test for curiosity only, and it isn't medical advice.
- **All contributed data is public.** Anyone can [download](data) every result and answer people
  choose to contribute. The download is refreshed once a day.
- **It's anonymous.** There are no accounts, and no name, email or IP address is stored with your
  results.
- **Nothing that identifies you is logged.** Only what's listed below is sent, and only if you
  choose to contribute. The backend keeps a short anonymous note of each request for a week, with
  nothing about you in it (see "What the backend logs").

## If you contribute

When you finish the test, this is sent and added to the public dataset:

- Your answers from the first step: your age band (such as "25 to 34", never your exact age),
  whether you have or suspect a visual perceptual disorder, which one, whether you've been
  diagnosed, psychedelic use, an estimate of how often, how long since you last used them (in
  years and months) and which ones, whether you take medications and which, notes, where you found
  the test, and your pseudonym if you gave one.
- Your results: whether you took the full or quick test, thresholds, sensitivities, and every trial
  (what was shown, your answer, how long you took).
- Technical details needed to make sense of the results: the card measurement, viewing distance,
  refresh rate, window size and pixel density, whether you used a computer or a tablet, your
  browser and its main version (for example "Chrome 131"), the hour the test started (never the
  exact time) and how long it took.

Only what's needed to read the results is collected. Nothing else is sent, however harmless it
looks: not your screen's resolution, your language setting, your operating system or the exact
time of anything.

If you choose not to contribute, nothing is sent. Your results stay in your browser, and you can
save them as a file. Saved files, PDFs included, are made in your browser: nothing is sent to make
them.

## Your pseudonym

A pseudonym is completely optional. Leave it blank and your results can't be looked up or linked to
each other: that's the most private choice.

If you give one, it's the only key to your results. There's no password, so anyone who enters it
sees every result and answer sent with it, and can fill the questions in with the answers sent last
time. Use the "Generate one" button for a random pair of words, and don't use your name, a username
you use elsewhere, or anything else that points to you.

## What the backend logs

To fix faults, the backend keeps a short record of each request for 7 days. It says which part of
the service was called (for example "sending results"), whether it worked, how long it took, and a
random reference number made for that one request. If something goes wrong it also keeps a short
error message.

It doesn't contain your IP address, browser, pseudonym or anything you entered, and the reference
number isn't tied to you. If sending your results fails, this page shows that reference number, and
you can quote it if you report a problem.

## What isn't collected

- No name, email address or account.
- No IP address, browser details or other request details stored or logged by the backend, with
  your results or anywhere else.
- No cookies, analytics, adverts or tracking of any kind.
- No third-party content: the fonts and everything else are served from this site, and the page is
  locked so your browser won't contact any other server.

## Who can still see your IP address

Every website has to know your IP address to send you a page. These services see it, and this
project can't stop that:

- **GitHub**, which hosts this page on GitHub Pages and the data download, sees your IP address when
  you load the page or download the data, and may keep it in its own server logs, under GitHub's
  privacy statement.
- **Google Cloud**, which runs the backend, receives your IP address when results are sent or looked
  up. The backend is set up not to store it, and to drop the per-request logs Google would otherwise
  keep, which include it. Google's network still handles the connection.
- **Your internet provider**, and your employer or school if you're on their network, can see that
  you visited this site, but not what you answered.

## Risks to you

- **Someone who knows your pseudonym** can see and download all your contributed results and
  answers, including any health conditions, medications and psychedelic use.
- **Anything you type is public**, in the notes, medications, psychedelics or "other" boxes. Don't
  include names, places, contact details or anything else that identifies you.
- **Details can add up.** Someone who already knows a lot about you, such as when you took the test
  and on what computer, might recognise your record from the hour it was taken, its window size and
  its browser. Leaving out a pseudonym and keeping notes general makes that much harder.
- **You can only take a contribution back straight away.** Right after sending, the Results page
  offers to remove that session from the database, until you run the test again or close the tab.
  It uses a secret code the backend gives your browser when the session is sent; the browser keeps
  it in memory only, and the backend stores only a scrambled form of it, which isn't in the
  download. After that there's no way to prove a result is yours, so no way to remove it. A removed
  session leaves the group figures at once and the download at its next daily refresh, but anyone
  who downloaded it before then keeps their copy. Only contribute what you're happy to have public
  for good.
- **The test shows flickering and moving dots.** Don't take it if you have photosensitive epilepsy,
  and stop if you feel unwell.

## On this device

Your browser remembers your card measurement, so you don't have to redo it next time. Nothing else
is stored on your device, and the measurement is only sent as part of a session you choose to
contribute.
