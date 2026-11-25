# Placement tracking — November 25, 2026

## Release status

Implemented and tested on `codex/placement-attribution`; Kyle authorized website
publication on November 25, 2026. Existing posts and directory submissions have not been
edited. The new website links require this version to be deployed first.
The direct Stripe links already use a supported Payment Link parameter.

## What is measured

Each public placement has a fixed label in `src/_data/placements.json`. It
identifies a link, not a visitor. A tagged landing URL carries `via` plus UTMs.
Internal website navigation carries only `via`, preserving the placement
without presenting every page as a new UTM campaign landing. Tinylytics keeps
its existing page-view and click collection; key click values gain
`|via:<placement>`. Direct checkout receives `client_reference_id=<placement>`.

There are no new cookies, storage entries, visitor identifiers, or identity
joins. The label lasts while the visitor follows tagged links. A later untagged
visit, purchase from inside the Mac app, cross-device visit, disabled JavaScript,
or opt-out may be unattributed. Copied links retain their original label, so
attribution identifies the link used, not proof of who influenced the buyer.

Only registered labels and exact registered UTM combinations are accepted.
Known `ref=macbase.app`, `ref=macapp.supply`, and `ref=macpip`/`macpip.com` map to
generic directory labels. They do not establish a particular Black Friday
listing or post. Arbitrary `ref`, UTMs, email addresses, and duplicate parameters
are not copied into Stripe. Missing attribution remains Unknown.

The browser's existing Tinylytics opt-out also stops website link decoration.
The script preserves other checkout options and existing reference IDs. It
leaves DMG URLs, Apple destinations, license/billing portals, other Stripe links,
and external links intact. Analytics blocking does not block checkout.

## Choose and reuse a link

Run from this project:

```sh
npm run tracking:links
npm run tracking:links -- bf2026_x_personal_reminder
```

Each output has a `website` URL and a `stripe` URL. Use the website URL when a
post should lead to the article/site; use the Stripe URL only for a direct
checkout link. Use one placement per post/listing; add a new registry entry
before publishing another distinct post. Do not reuse a reminder label across
multiple posts if you want to distinguish them. Never put personal information
in the labels.

Ready-to-copy links are in [PLACEMENT-LINKS.md](PLACEMENT-LINKS.md). Regenerate
that document after changing the registry:

```sh
node scripts/placement-links.mjs --markdown > PLACEMENT-LINKS.md
```

| Placement | Intended use |
| --- | --- |
| `bf2026_x_personal_reminder` | One future reminder on Kyle's X account |
| `bf2026_x_trayage_reminder` | One future reminder on Trayage's X account |
| `bf2026_macbase_deal` | The specific MacBase deal link, if the listing is updated |
| `bf2026_macapp_supply_deal` | The specific Mac App Supply deal link, if updated |
| `bf2026_indieappsales_deal` | The Indie App Sales deal link, if updated |
| `macbase_listing` | Generic known MacBase referral; exact post unknown |
| `macapp_supply_listing` | Generic known Mac App Supply referral; exact post unknown |
| `macpip_listing` | Generic known MacPip referral; exact post unknown |

These prepared labels do not establish that any particular post or listing
already uses them. The catalog does not enable discounts or prefill promo
codes. Keep INDIEAPP26's separately approved activation schedule intact.

## Tinylytics

Site: 3768 (`https://trayage.app`), public script ID
`pyyHixpxxAjwk8mz1YBC`. The live legacy `?events&beacon` script was retrieved on
November 25 and saved as `tests/fixtures/tinylytics-2026-11-25.js` for isolated
contract tests. Its event listener and beacon/fetch behavior are active.
The API's newer `widgets.events`/`beacon` flags are false, while
`legacy_embed_options.events`/`beacon` are true. No settings migration is needed
for the currently deployed script, and no dashboard toggle was changed.

Use Overview's source/campaign fields for landing traffic. On Events, inspect
the following event values for the placement label:

| Event | Example | Meaning |
| --- | --- | --- |
| `download.intent` | `download-page:hero\|via:bf2026_x_personal_reminder` | Click toward download page |
| `file.download` | release filename + `:direct-card\|via:…` | DMG link click |
| `store.view` | `mac-app-store:app-store-card\|via:…` | Click to Apple |
| `purchase.checkout` | `direct:direct-card\|via:…` | Click to Stripe |
| `beta.view` | `testflight:beta-card\|via:…` | Click to TestFlight |

The historical unsuffixed values remain valid for untagged traffic. Do not
label any of these events as a completed purchase, installation, or download.
Internal page views retain the label in the URL but do not gain repeated UTMs.
No paid-purchase event is sent from a return page. Stripe is the source for
confirmed direct sales; Apple sales require separate Apple reporting.

## Stripe verification and reporting

Account: RelayByte (`acct_1TjnHtGoPShpJlJE`). Existing Payment Link:
`plink_1UQbQZGoPShpJlJEKwzWGTci`.

The link is active, permits promotion codes, and retains hosted confirmation.
Its Keylight metadata remains `product_id=trayage`, `key_type_id=default`.
The enabled Keylight endpoint subscribes to `checkout.session.completed`.
`client_reference_id` is already a supported parameter; there is no separate
Stripe switch, product, price, redirect, or new webhook needed for storing it.

Verified against the live account using one empty, unpaid session on November
25, with no email/card entry, PaymentIntent, charge, or license creation:

- `client_reference_id=qa_attribution_20261125`
- `status=open`, `payment_status=unpaid`, `payment_intent=null`
- Keylight metadata preserved; browser tab closed after inspection.
- Exact session receipt retained locally in ignored
  `artifacts/attribution/stripe-verification.json`.

This establishes reference storage on a real Payment Link session, not a
completed-payment or fulfillment test. The QA session must be excluded from
sales reporting; it will expire normally. No Stripe configuration was changed.

To report future paid sales, use the Stripe connector to retrieve completed
sessions for this Payment Link and the requested date range. Paginate to
completion; retain only `payment_status=paid`. Group registered
`client_reference_id` values by placement, keep missing/unrecognized values in
Unknown, and exclude `qa_` labels. Report currency separately. Include the
actual redeemed promotion code and discount; the campaign label does not prove
which offer was used. If reporting net revenue, reconcile refunds separately
instead of summing session totals as net income.

The November 23 first sale still has a null reference. This change cannot
recover its missing source. It remains attributable to the redeemed TRAYAGEBF
offer only.

## Validation and publication

- `REQUIRE_PUBLICATION_APPROVAL=1 SITE_BASE_PATH='' npm run check`: 88 passed.
- Eleven new placement tests cover multi-page navigation with the actual
  provider script, one click event per click, distinct references, legacy
  referrals, unknown/ambiguous labels, opt-out, unavailable storage, blocked
  analytics, no JavaScript, preserved payment parameters/destinations,
  back/forward-cache restoration, and root/project-path isolation.
- All production-origin test requests are intercepted. No fake Tinylytics
  traffic, conversions, or completed payments were sent.
- The website privacy disclosure describes the new placement handling and
  carries the November 25 effective date for publication.
- Updated disclosure visually reviewed at `http://127.0.0.1:4191/privacy/#website`.

After publication approval, push the reviewed change through the normal
GitHub Pages workflow, verify deployment, then verify served script/markup
and real tagged navigation. Publish or substitute promotional links only with
separate authorization for the posts/listings. Confirm the first real paid
session's reference after a genuine sale.

Sources: [Stripe Payment Link parameters](https://docs.stripe.com/payment-links/url-parameters),
[Tinylytics event tracking](https://tinylytics.app/docs/analytics/events),
[Tinylytics collector behavior](https://tinylytics.app/docs/developer/custom-script).
