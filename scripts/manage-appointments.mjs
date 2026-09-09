import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const envFiles = ['.env.local', '.env.development.local', '.env'];
  const env = {};
  for (const file of envFiles) {
    const fullPath = path.resolve(projectRoot, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(match[1].trim() in env)) {
          env[match[1].trim()] = val;
        }
      }
    }
  }
  return env;
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(header + '.' + claims);
  const signature = signer.sign(sa.private_key.replace(/\\n/g, '\n'), 'base64url');
  const jwt = header + '.' + claims + '.' + signature;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

function fromFirestoreValue(value) {
  if (!value) return '';
  if ('stringValue' in value) return value.stringValue || '';
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('integerValue' in value) return Number(value.integerValue || 0);
  if ('doubleValue' in value) return Number(value.doubleValue || 0);
  if ('timestampValue' in value) return value.timestampValue || '';
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map((v) => fromFirestoreValue(v));
  if ('mapValue' in value) {
    const res = {};
    for (const [k, v] of Object.entries(value.mapValue?.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return '';
}

async function listAppointments(token, projectId, limit = 20) {
  const listUrl = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/appointments?pageSize=' + Math.min(limit * 2, 100);
  const res = await fetch(listUrl, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Failed to list appointments: ' + res.status);
  const data = await res.json();
  const records = (data.documents || [])
    .filter((doc) => doc.fields)
    .map((doc) => {
      const fields = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        fields[k] = fromFirestoreValue(v);
      }
      const docId = doc.name.split('/').pop();
      const name = fields.name || [fields.firstName, fields.lastName].filter(Boolean).join(' ');
      const bookingId = fields.bookingId || fields.requestId || docId;
      const date = fields.appointmentDate || fields.date || fields.preferredDate || '';
      const time = fields.appointmentTime || fields.preferredTimeWindow || '';
      const phone = fields.phone || fields.customerPhone || '';
      const service = fields.serviceType || '';
      const address = fields.serviceAddress || fields.addressLine1 || '';
      const city = fields.city || fields.serviceCity || fields.addressCity || '';
      const submittedAt = fields.submittedAt || fields.createdAt || fields.timestamp || '';
      const status = fields.status || '';
      return { docId, bookingId, name, phone, date, time, service, address, city, submittedAt, status };
    })
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
    .slice(0, limit);
  return records;
}

async function main() {
  const env = loadEnv();
  let sa;
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else if (env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    const saPath = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_FILE)
      ? env.FIREBASE_SERVICE_ACCOUNT_FILE
      : path.resolve(projectRoot, env.FIREBASE_SERVICE_ACCOUNT_FILE);
    sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  }

  if (!sa) {
    console.error('Firebase service account credentials not found in environment.');
    process.exit(1);
  }

  const token = await getAccessToken(sa);
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hvac-pro-28a7e';

  const [command, ...args] = process.argv.slice(2);

  if (!command || command === 'list') {
    const limit = Number(args[0]) || 20;
    const records = await listAppointments(token, projectId, limit);
    console.log('\nFound ' + records.length + ' appointments (limit ' + limit + '):\n');
    console.table(records.map((r) => ({
      'Booking ID': r.bookingId,
      'Name': r.name,
      'Phone': r.phone,
      'Date': r.date,
      'Time': r.time,
      'Service': r.service,
      'City': r.city,
      'Status': r.status,
      'Submitted': r.submittedAt ? r.submittedAt.slice(0, 19).replace('T', ' ') : '',
    })));
    return;
  }

  if (command === 'find') {
    const query = args.join(' ').trim().toLowerCase();
    if (!query) {
      console.error('Please provide a search term (name, phone, or booking ID).');
      return;
    }
    const cleanDigits = query.replace(/\D/g, '');
    const records = await listAppointments(token, projectId, 100);
    const matched = records.filter((r) => {
      const matchName = r.name.toLowerCase().includes(query);
      const matchId = r.bookingId.toLowerCase().includes(query) || r.docId.toLowerCase().includes(query);
      const matchPhone = cleanDigits.length >= 4 && r.phone.replace(/\D/g, '').includes(cleanDigits);
      return matchName || matchId || matchPhone;
    });

    console.log('\nMatched ' + matched.length + ' appointments for "' + query + '":\n');
    if (matched.length > 0) {
      console.table(matched.map((r) => ({
        'Doc ID': r.docId,
        'Booking ID': r.bookingId,
        'Name': r.name,
        'Phone': r.phone,
        'Date': r.date,
        'Time': r.time,
        'Service': r.service,
        'Address': r.address,
        'City': r.city,
      })));
    }
    return;
  }

  if (command === 'delete') {
    const target = args[0]?.trim();
    if (!target) {
      console.error('Please provide a booking ID, document ID, or phone number to delete.');
      return;
    }
    const cleanDigits = target.replace(/\D/g, '');
    const records = await listAppointments(token, projectId, 100);
    const matched = records.filter((r) => {
      const matchId = r.bookingId.toUpperCase() === target.toUpperCase() || r.docId.toUpperCase() === target.toUpperCase();
      const matchPhone = cleanDigits.length >= 7 && r.phone.replace(/\D/g, '').includes(cleanDigits);
      const matchName = r.name.toLowerCase() === target.toLowerCase();
      return matchId || matchPhone || matchName;
    });

    if (matched.length === 0) {
      console.log('No appointments found matching "' + target + '".');
      return;
    }

    const collections = ['appointments', 'websiteBookingHistory', 'websiteBookings'];
    for (const rec of matched) {
      console.log('\nDeleting appointment for ' + rec.name + ' (' + rec.bookingId + ')...');
      const docIds = Array.from(new Set([rec.docId, rec.bookingId].filter(Boolean)));
      for (const id of docIds) {
        for (const col of collections) {
          const delUrl = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + col + '/' + id;
          const res = await fetch(delUrl, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token },
          });
          if (res.ok) {
            console.log('  ✓ Removed ' + col + '/' + id);
          }
        }
      }
    }
    console.log('\nDeletion complete.');
    return;
  }

  console.log('Usage: node scripts/manage-appointments.mjs [list|find|delete] [args]');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
