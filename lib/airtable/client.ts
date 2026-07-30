import { withRateLimit } from "./rate-limit";
import type { AirtableTableName } from "./tables";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export type AirtableRecord<TFields extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  createdTime: string;
  fields: TFields;
};

type ListResponse<TFields extends Record<string, unknown>> = {
  records: AirtableRecord<TFields>[];
  offset?: string;
};

function getConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set");
  }
  return { apiKey, baseId };
}

async function airtableFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { apiKey } = getConfig();
  const response = await fetch(`${AIRTABLE_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

function tablePath(table: AirtableTableName, suffix = ""): string {
  const { baseId } = getConfig();
  return `/${baseId}/${encodeURIComponent(table)}${suffix}`;
}

export async function listRecords<TFields extends Record<string, unknown>>(
  table: AirtableTableName,
  params?: Record<string, string>,
): Promise<ListResponse<TFields>> {
  const search = params ? `?${new URLSearchParams(params).toString()}` : "";
  return withRateLimit(() => airtableFetch<ListResponse<TFields>>(`${tablePath(table)}${search}`));
}

export async function listAllRecords<TFields extends Record<string, unknown>>(
  table: AirtableTableName,
  params?: Record<string, string>,
): Promise<AirtableRecord<TFields>[]> {
  const records: AirtableRecord<TFields>[] = [];
  let offset: string | undefined;

  do {
    const pageParams = { ...(params ?? {}), ...(offset ? { offset } : {}) };
    const page = await listRecords<TFields>(table, pageParams);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

export async function createRecords<TFields extends Record<string, unknown>>(
  table: AirtableTableName,
  fieldsList: TFields[],
): Promise<AirtableRecord<TFields>[]> {
  const created: AirtableRecord<TFields>[] = [];
  for (let i = 0; i < fieldsList.length; i += 10) {
    const batch = fieldsList.slice(i, i + 10);
    const response = await withRateLimit(() =>
      airtableFetch<{ records: AirtableRecord<TFields>[] }>(tablePath(table), {
        method: "POST",
        body: JSON.stringify({ records: batch.map((fields) => ({ fields })) }),
      }),
    );
    created.push(...response.records);
  }
  return created;
}

export async function updateRecords<TFields extends Record<string, unknown>>(
  table: AirtableTableName,
  updates: { id: string; fields: Partial<TFields> }[],
): Promise<AirtableRecord<TFields>[]> {
  const updated: AirtableRecord<TFields>[] = [];
  for (let i = 0; i < updates.length; i += 10) {
    const batch = updates.slice(i, i + 10);
    const response = await withRateLimit(() =>
      airtableFetch<{ records: AirtableRecord<TFields>[] }>(tablePath(table), {
        method: "PATCH",
        body: JSON.stringify({
          records: batch.map(({ id, fields }) => ({ id, fields })),
        }),
      }),
    );
    updated.push(...response.records);
  }
  return updated;
}

export async function findRecordsByFormula<TFields extends Record<string, unknown>>(
  table: AirtableTableName,
  formula: string,
): Promise<AirtableRecord<TFields>[]> {
  return listAllRecords<TFields>(table, { filterByFormula: formula });
}
