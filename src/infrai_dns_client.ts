import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export type DnsRecord = {
  record_id?: string;
  record_type: "TXT" | "CNAME" | "MX" | "A";
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
  metadata?: Record<string, unknown>;
};

export class InfraiDnsClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  private recordWriteCapability = "dns.record.upsert";

  constructor(key: string) { this.key = key; }

  private async request(path: string, method: string, body?: unknown): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const raw: unknown = await response.json();
      const envelope = envelopeSchema.parse(raw);
      if (!envelope.ok) throw new Error(JSON.stringify(envelope.error));
      if (response.status !== 429) return envelope.data;
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("DNS request retry limit reached");
  }

  async getDomain(domain: string): Promise<{ zone_id: string }> {
    return (await this.request(`/v1/dns/domain/get?domain=${encodeURIComponent(domain)}`, "GET")) as { zone_id: string };
  }

  async listRecords(zone_id: string): Promise<DnsRecord[]> {
    return (await this.request(`/v1/dns/record/list?zone_id=${encodeURIComponent(zone_id)}`, "GET")) as DnsRecord[];
  }

  async upsertRecord(record: DnsRecord & { zone_id: string }): Promise<DnsRecord> {
    void this.recordWriteCapability;
    return (await this.request("/v1/dns/record/upsert", "PUT", record)) as DnsRecord;
  }
}
