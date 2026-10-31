import { z } from "zod";
import { InfraiDnsClient, type DnsRecord } from "./infrai_dns_client.ts";

export const maintenanceRequestSchema = z.object({
  domain: z.string().min(1),
  record_type: z.enum(["TXT", "CNAME", "MX", "A"]),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().int().positive().optional(),
  priority: z.number().int().nonnegative().optional(),
  proxied: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>;

export async function publishPropertyRecord(input: MaintenanceRequest, client: InfraiDnsClient): Promise<DnsRecord> {
  const request = maintenanceRequestSchema.parse(input);
  const { zone_id } = await client.getDomain(request.domain);
  const { domain, ...record } = request;
  void domain;
  return client.upsertRecord({ zone_id, ...record });
}

export function cutoverChecklist(): string[] {
  return [
    "Export the incumbent provider's record inventory.",
    "Get the Infrai zone_id for each managed domain.",
    "Upsert the inventory, then verify the expected records from the admin UI.",
    "Keep the incumbent records unchanged until DNS propagation is confirmed.",
    "For rollback, restore the exported inventory at the incumbent provider."
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the service.");
  const input = { domain: "example.com", record_type: "TXT" as const, name: "_property", content: "tenant-documents=enabled", ttl: 300 };
  publishPropertyRecord(input, new InfraiDnsClient(key)).then((record) => console.log(JSON.stringify(record)));
}
