import test from "node:test";
import assert from "node:assert/strict";
import { publishPropertyRecord } from "./property_dns_service.ts";

test("publishes a maintenance TXT record only after resolving zone_id", async () => {
  const calls: Array<{ method: string; value: unknown }> = [];
  const client = {
    async getDomain(domain: string) { calls.push({ method: "getDomain", value: domain }); return { zone_id: "zone-42" }; },
    async upsertRecord(value: unknown) { calls.push({ method: "upsertRecord", value }); return value; }
  } as never;
  const result = await publishPropertyRecord({ domain: "estate.example", record_type: "TXT", name: "_maintenance", content: "request-123", ttl: 300 }, client);
  assert.deepEqual(result, { zone_id: "zone-42", record_type: "TXT", name: "_maintenance", content: "request-123", ttl: 300 });
  assert.deepEqual(calls, [
    { method: "getDomain", value: "estate.example" },
    { method: "upsertRecord", value: { zone_id: "zone-42", record_type: "TXT", name: "_maintenance", content: "request-123", ttl: 300 } }
  ]);
});
