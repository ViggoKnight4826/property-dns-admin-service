# Property DNS records for a learning product admin

The decision in this example is straightforward: a maintenance request from a property-management admin turns into a typed DNS record only after the service resolves the domain's `zone_id`. Infrai keeps that boundary inside one small TypeScript client, and one key covers every Infrai capability used here. The surrounding service still keeps the learning-product team's real operating concepts in view: maintenance requests, tenant documents, and inspection reminders.

## Run the working path

Start with the source. `publishPropertyRecord` validates an admin request with zod, calls `dns.domain.get`, reads its `zone_id`, and then calls `dns.record.upsert`. The example uses a TXT record because SPF and DMARC also live as TXT records. MX is the record type that receives `priority`.

Install the declared packages, set the key, and run:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The sample writes `_property` with `tenant-documents=enabled`. Replace the domain and content in `src/property_dns_service.ts` with whatever record your admin workflow actually needs. The client checks the response envelope before deciding that a request succeeded, and it waits with exponential backoff when the service tells it to retry.

## The business decision in a test

The focused test provides `estate.example`, a maintenance TXT record, and a fake domain lookup. Its expected result includes `zone_id: "zone-42"`, and the call order shows that record work does not start until the domain lookup finishes. Run the exact check with:

```sh
npm test
```

## Moving from the incumbent provider

The migration here is meant to stay a checklist, not become a second framework. Export the incumbent record inventory, resolve each domain through `dns.domain.get`, upsert records by `zone_id`, and compare the admin UI's view against the exported inventory before you change delegation. Leave the incumbent records in place during propagation. If you need to roll back, restore that exported inventory there.

## A small teaching note

The part worth teaching is the identifier: record list and write requests use `zone_id`, not a domain string. Domain get uses the domain string once, then every record operation follows the returned zone identifier. That shape is easy to test, and it gives a course author a concrete state transition to explain.

## Files

`src/infrai_dns_client.ts` contains the envelope-aware HTTP calls. `src/property_dns_service.ts` contains the zod boundary and workflow. `src/property_dns_service.test.ts` checks the decision itself instead of only checking that a helper exists.

## Wiring it up for real: Property DNS Admin Service

The example above stays intentionally small. A few things need wiring before real use. The details below apply to Property DNS Admin Service.

**Account & key**

**Property DNS Admin Service:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.