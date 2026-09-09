import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const checks = [
  {
    name: 'Service-area coverage includes Herriman for conversion quality',
    file: 'src/lib/booking.ts',
    expected: ['Herriman'],
  },
  {
    name: 'Booking funnel analytics capture submission attempts',
    file: 'src/components/booking/BookingExperience.tsx',
    expected: ['booking_submit_attempt', 'booking_form_view'],
  },
  {
    name: 'AI assistant tracks revenue-oriented outcomes',
    file: 'src/lib/analytics.ts',
    expected: ['assistant_revenue', 'assistant_booking_redirect'],
  },
  {
    name: 'AI assistant routes users to conversion actions after answers',
    file: 'src/components/WebsiteAIAssistant.tsx',
    expected: ['Book now', 'Technician text', 'Call me back'],
  },
];

let failed = 0;
for (const check of checks) {
  const content = read(check.file);
  const missing = check.expected.filter((item) => !content.includes(item));
  if (missing.length > 0) {
    console.error(`FAIL: ${check.name} (missing: ${missing.join(', ')})`);
    failed += 1;
  } else {
    console.log(`PASS: ${check.name}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('Productivity validation passed.');
