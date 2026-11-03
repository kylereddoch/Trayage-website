# Website measurement and attribution

Implementation reviewed and publication authorized November 3, 2026. Verify the deployment and live behavior separately from the local checks below. Tinylytics site 3768; this document describes measurement, not an observed conversion funnel.

## Audit evidence

The live homepage and `/download/` HTML were retrieved successfully on November 3. Both load `pyyHixpxxAjwk8mz1YBC.js?events&beacon`. The actual served script has a delegated click listener for `data-tinylytics-event`, reads the ignore flag, and uses `sendBeacon` for views and events with a fetch fallback. This verifies generated behavior despite API `widgets.events/beacon` flags reported as false and legacy options reported as true. No dashboard settings were changed. The captured public script is in `tests/fixtures/tinylytics-2026-11-03.js`; all browser contract-test requests are intercepted, never delivered.

Live tags already cover download-page intent, direct DMG clicks, App Store clicks and checkout clicks. TestFlight is currently a generic outbound event. CTA positions share indistinguishable values. Live video has no engagement events. Live privacy copy says “downloads, purchases” when these are clicks. The current embed has no localhost guard; prior tests only stubbed it in selected cases. The new loader restricts all website analytics to `site.origin`, so localhost, project-path previews, other origins and file previews cannot contaminate production.

## Event dictionary

Names retain historical continuity. Placement is appended to selected values with a colon. Filter historical unsuffixed values alongside new values when comparing dates. Page path comes from Tinylytics; it is not embedded in the label.

| Event | Value | Meaning |
| --- | --- | --- |
| `download.intent` | `download-page:header`, `:hero`, `:pricing`, `:closing`, `:footer`; unannotated content links retain `download-page` | Click toward the site's download page, not the DMG |
| `file.download` | release filename + `:direct-card` | DMG link click, not completed transfer or installation; other files retain generic filename values |
| `store.view` | `mac-app-store:app-store-card` | Click to Apple, not a verified store page view, download, or purchase |
| `purchase.checkout` | `direct:direct-card` | Click to Stripe, not checkout completion or payment |
| `beta.view` | `testflight:beta-card` | Click to TestFlight, not joining or installing |
| `demo.screenshot` | `overview` or fixed screenshot dialog ID | Screenshot enlargement/link intent |
| `demo.view` | `walkthrough` | Jump to the video section, not playback |
| `video.start` | `walkthrough-2026-10` | First `playing` event per page load |
| `video.half` | same | At least half the duration covered by actual played ranges; seeking alone does not qualify |
| `video.end` | same | Playback reaches the end after starting; seeking can reach the end, so this does not prove every second was watched |

Video events are deduplicated in memory per page load. Replays/reloads are not unique people. The provider owns annotated clicks and page views; our adapter only sends video events via the documented collector after the provider script loads. Blocked script, local origin, or opt-out prevents the adapter from sending. An accepted beacon is not proof a server counted it. Provider filtering, connectivity, blockers and rapid-click debounce can lose observations.

## Acquisition links

Use lowercase, stable labels; never names, emails, license keys or user IDs. Use one campaign name across placements and vary `utm_content`. Maintain these on incoming links only, not internal navigation (which can misattribute acquisition) or Stripe, GitHub downloads, or Apple destinations.

Proposed examples, not published campaign links:

- TestDrive brief: `https://trayage.app/?utm_source=testdrive&utm_medium=community&utm_campaign=trayage_review_2026_11&utm_content=brief`
- TestDrive X post: `https://trayage.app/?utm_source=testdrive&utm_medium=social&utm_campaign=trayage_review_2026_11&utm_content=x_post`
- Product X bio: `https://trayage.app/?utm_source=x&utm_medium=social&utm_campaign=profile&utm_content=product_bio`
- Newsletter: `https://trayage.app/?utm_source=relaybyte&utm_medium=email&utm_campaign=trayage_2026_11&utm_content=newsletter`

Tinylytics reads campaign/ref parameters from the full landing URL. Confirm which UTM fields its current reports expose before promising content-level reporting. The site does not persist campaign state between pages; an outbound click on `/download/` may have no original UTM parameters. Same-day provider journeys/segments may help explore movement, but do not assume reliable end-to-end campaign-to-sale matching. Referrer suppression, copied links, apps and untagged campaigns all contribute to direct/unknown traffic; unknown is not evidence of brand familiarity.

## What to review weekly

Use the same completed-day range and timezone for acquisition pages, event counts, Apple reports and direct sales. Examine source/campaign landing pages, download-page views, CTA placements, direct-vs-Apple click counts, and walkthrough start/half/end counts. Compare weekly trends with sample sizes and release/campaign dates. A count ratio can describe aggregate activity; do not label it a person-level step conversion, drop-off or cohort retention rate. Page views and clicks can repeat. Website data cannot show whether the app launched, reached a first review, cleaned files or was abandoned. Completed sales belong to Stripe/Apple reports; installs/activation/retention need separately defined app evidence.

Existing baseline is being handled in the Trayage app chat; no analytics API query was duplicated here.

## Privacy and release steps

The revised website disclosure explicitly distinguishes clicks from completed outcomes, explains placement/video labels and incoming campaign labels, and adds a browser opt-out link. No new cookies, visitor IDs, session storage, cross-device join or app-file information is introduced. The opt-out uses the existing `tinylytics_ignore` local-storage flag. These implementation facts do not by themselves settle consent requirements for every audience/jurisdiction; any future persistent attribution or app telemetry needs a separate disclosure/consent review.

Before release, review the local privacy copy and effective date. After explicit publication approval: deploy through the normal repository flow; verify build/deployment and live origin guard/markup/CSP separately. Keep `tinylytics.app` allowed in script-src and connect-src. Use intercepted collection for browser verification; do not send fake campaign conversions into production. Check subsequent real traffic for the new values. Keep legacy `?events&beacon` while this tested embed is in use; do not toggle live settings from the misleading flags alone. Configure any dashboard goals separately, with names such as “Direct download click” or “Checkout click,” never “Installed” or “Purchased.”

Sources: [Tinylytics events](https://tinylytics.app/docs/analytics/events), [custom collector and ignore behavior](https://tinylytics.app/docs/developer/custom-script), [Overview and journey limitations](https://tinylytics.app/docs/analytics/overview).

## Validation completed locally

- `npm run check`: 71 tests passed, including all existing root/project-path, accessibility, responsive, privacy, publishing and link checks.
- Six new analytics tests cover placement values, the captured provider's actual nested-element click payload and page view, beacon/fetch fallback, video deduplication and played-range threshold, provider blocking, existing/URL opt-out, and zero Tinylytics requests on local root/project-path previews.
- `git diff --check`: clean.
- Preview running at `http://127.0.0.1:4189/`; revised disclosure at `/privacy/#website` visually inspected in Chrome. Screenshot: `artifacts/analytics/privacy-preview.png`.
- Live homepage response has CSP allowing `https://tinylytics.app` in both script-src and connect-src; current policy accommodates the local loader and collector without relaxation.
- Retrieved live HTML and test output are saved under `artifacts/analytics/` (ignored evidence, not deployable assets). No collector requests were sent by the tests. No production analytics settings, purchases, downloads, deployment, or remote Git state were changed.
- Existing untracked `src/blog/posts/use-finder-tags-review-later-trayage.md` was preserved untouched.
