import fs from 'fs';
import path from 'path';
import { saveShippingOrderToNeon, getShippingOrderFromNeon } from './db/neon';

export interface ShipmentRecord {
  orderId: string;
  awbCode: string;
  shipmentId: string;
  status: string;
  eventType: string;
  updatedAt: string;
  history: Array<{ event: string; status: string; timestamp: string; details?: unknown }>;
}

const LEDGER_FILE = path.join(process.cwd(), '.shipment_ledger.json');

const globalForLedger = globalThis as unknown as {
  __SHIPMENT_LEDGER__?: Record<string, ShipmentRecord>;
};

if (!globalForLedger.__SHIPMENT_LEDGER__) {
  globalForLedger.__SHIPMENT_LEDGER__ = {};
}

function readLedger(): Record<string, ShipmentRecord> {
  if (globalForLedger.__SHIPMENT_LEDGER__ && Object.keys(globalForLedger.__SHIPMENT_LEDGER__).length > 0) {
    return globalForLedger.__SHIPMENT_LEDGER__;
  }
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf-8'));
      globalForLedger.__SHIPMENT_LEDGER__ = parsed;
      return parsed;
    }
  } catch {
    // fallback
  }
  return globalForLedger.__SHIPMENT_LEDGER__ || {};
}

function writeLedger(data: Record<string, ShipmentRecord>) {
  globalForLedger.__SHIPMENT_LEDGER__ = data;
  if (process.env.NODE_ENV === 'production') {
    // Serverless read-only filesystem: Neon Postgres is primary
    return;
  }
  try {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ShipmentLedger] Failed to persist local ledger backup:', err);
  }
}

export function recordShipmentEvent(eventData: {
  orderId: string;
  awbCode: string;
  shipmentId: string;
  status: string;
  eventType: string;
  details?: unknown;
}) {
  const ledger = readLedger();
  const key = eventData.orderId || eventData.awbCode || eventData.shipmentId;
  if (!key) return;

  const now = new Date().toISOString();
  const existing = ledger[key] || {
    orderId: eventData.orderId,
    awbCode: eventData.awbCode,
    shipmentId: eventData.shipmentId,
    status: eventData.status,
    eventType: eventData.eventType,
    updatedAt: now,
    history: [],
  };

  existing.status = eventData.status || eventData.eventType;
  existing.eventType = eventData.eventType;
  existing.updatedAt = now;
  if (eventData.awbCode) existing.awbCode = eventData.awbCode;
  if (eventData.orderId) existing.orderId = eventData.orderId;
  if (eventData.shipmentId) existing.shipmentId = eventData.shipmentId;

  existing.history.push({
    event: eventData.eventType,
    status: existing.status,
    timestamp: now,
    details: eventData.details,
  });

  const canonicalKey = existing.orderId || existing.awbCode || existing.shipmentId || key;
  ledger[canonicalKey] = existing;

  writeLedger(ledger);

  // Asynchronously persist to Neon Postgres for durability across instances (BUG-08)
  if (existing.orderId) {
    saveShippingOrderToNeon(existing.orderId, existing).catch((err) => {
      console.warn('[ShipmentLedger] Failed to sync shipping record to Neon:', err);
    });
  }

  return existing;
}

export function getShipmentRecord(key: string): ShipmentRecord | null {
  const ledger = readLedger();
  if (ledger[key]) return ledger[key];
  const found = Object.values(ledger).find(
    (r) => r.orderId === key || r.awbCode === key || r.shipmentId === key
  );
  return found || null;
}

export async function getShipmentRecordAsync(key: string): Promise<ShipmentRecord | null> {
  const local = getShipmentRecord(key);
  if (local) return local;

  try {
    const neonRecord = await getShippingOrderFromNeon<ShipmentRecord>(key);
    if (neonRecord) {
      const ledger = readLedger();
      const canonicalKey = neonRecord.orderId || key;
      ledger[canonicalKey] = neonRecord;
      return neonRecord;
    }
  } catch (err) {
    console.warn('[ShipmentLedger] Failed to retrieve shipping record from Neon:', err);
  }
  return null;
}
