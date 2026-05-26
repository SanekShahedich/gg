import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'plans.json');

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeAll(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function userKey(userId) {
  return String(userId);
}

/** @returns {{ malId: number, title: string, addedAt: string }[]} */
export async function getPlans(userId) {
  const all = await readAll();
  return all[userKey(userId)] ?? [];
}

export async function addPlan(userId, { malId, title }) {
  const all = await readAll();
  const key = userKey(userId);
  const list = all[key] ?? [];
  if (list.some((p) => p.malId === malId)) {
    return { added: false, list };
  }
  list.push({ malId, title, addedAt: new Date().toISOString() });
  all[key] = list;
  await writeAll(all);
  return { added: true, list };
}

export async function removePlan(userId, malId) {
  const all = await readAll();
  const key = userKey(userId);
  const list = (all[key] ?? []).filter((p) => p.malId !== malId);
  all[key] = list;
  await writeAll(all);
  return list;
}

export async function clearAllPlans(userId) {
  const all = await readAll();
  const key = userKey(userId);
  all[key] = [];
  await writeAll(all);
  return [];
}
