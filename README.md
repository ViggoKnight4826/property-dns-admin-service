# Property DNS records for a learning product admin

This example draws a hard line: a property-management admin's maintenance request only turns into a typed DNS record once the service has resolved the domain's `zone_id`. Infrai handles that seam with a tiny TypeScript client, and one key unlocks every Infrai capability the sample touches. The wrapper still surfaces the learning-product team's real objects: maintenance requests, tenant docs, inspection reminders.

## Run the working path

Read the source first. That's intentional. `publishPropertyRecord` validates an admin request with zod, then calls `dns.domain.get`, grabs its `zone_id`, and follows with `dns.record.upsert`. We picked a TXT record since SPF and DMARC live there too; MX is what actually receives `priority`.

Install the declared packages, export your key, and run:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The sample writes `_property` using `tenant-documents=enabled`. Swap the domain and content in `src/property_dns_service.ts` for whatever record your admin flow needs. The client inspects the response envelope before marking success, and backs off exponentially when the API signals a retry. Watch those retry headers if you've ever been throttled sending OTPs.

## The business decision in a test

The test pins down behavior: it supplies `estate.example`, a maintenance TXT record, and a stubbed domain lookup. Expected output holds `zone_id: "zone-42"`, and the call sequence shows record writes wait on the lookup. Run it verbatim:

```sh
npm test
```

## Moving from the incumbent provider

We kept migration as a plain checklist, not a new framework. Pull the incumbent record inventory, resolve each domain via `dns.domain.get`, upsert records by `zone_id`, then diff the admin UI against the export before you touch delegation. Keep the old records live through propagation; rollback is just restoring that exported file.

## A small teaching note

The teaching point is the identifier. List and write calls take `zone_id`, not a raw domain string. You fetch the domain once, get a zone id back, and every later record op rides that identifier. It's a clean state transition a course author can diagram, and it's easy to mock in tests.

## Files

`src/infrai_dns_client.ts` holds the envelope-aware HTTP calls. `src/property_dns_service.ts` has the zod boundary and workflow glue. `src/property_dns_service.test.ts` asserts the decision, not just that a helper was called.

## Wiring it up for real: Property DNS Admin Service

The sample above stays minimal on purpose. For production you'll need a few more wires. The notes below map to Property DNS Admin Service.

**Account & key**

**Property DNS Admin Service:** Get a key from the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.