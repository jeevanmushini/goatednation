import fs from 'fs';
import path from 'path';

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

function readLedger(): Record<string, ShipmentRecord> {
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf-8'));
    }
  } catch {
    // fallback
  }
  return {};
}

function writeLedger(data: Record<string, ShipmentRecord>) {
  try {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ShipmentLedger] Failed to persist ledger:', err);
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

  ledger[key] = existing;
  if (existing.awbCode) ledger[existing.awbCode] = existing;
  if (existing.orderId) ledger[existing.orderId] = existing;

  writeLedger(ledger);
  return existing;
}

export function getShipmentRecord(key: string): ShipmentRecord | null {
  const ledger = readLedger();
  return ledger[key] || null;
}
