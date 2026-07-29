export const dynamic = "force-dynamic";

const SAMPLE_RATE = 8000;
const DURATION_SECONDS = 2.2;

function writeAscii(target: Uint8Array, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    target[offset + index] = value.charCodeAt(index);
  }
}

function createTypingWav() {
  const sampleCount = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
  const pcm = new Int16Array(sampleCount);
  const clickTimes = [0.08, 0.19, 0.31, 0.47, 0.58, 0.73, 0.89, 1.04, 1.18, 1.35, 1.49, 1.66, 1.82, 2.01];

  for (const clickTime of clickTimes) {
    const start = Math.floor(clickTime * SAMPLE_RATE);
    const clickLength = Math.floor(0.025 * SAMPLE_RATE);
    for (let offset = 0; offset < clickLength && start + offset < pcm.length; offset += 1) {
      const envelope = Math.exp(-offset / 34);
      const tone = Math.sin((2 * Math.PI * 1050 * offset) / SAMPLE_RATE);
      const noise = Math.sin((2 * Math.PI * 1733 * offset) / SAMPLE_RATE) * 0.35;
      pcm[start + offset] = Math.round((tone + noise) * envelope * 4200);
    }
  }

  const dataLength = pcm.byteLength;
  const wav = new Uint8Array(44 + dataLength);
  const view = new DataView(wav.buffer);
  writeAscii(wav, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(wav, 8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(wav, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let index = 0; index < pcm.length; index += 1) {
    view.setInt16(44 + index * 2, pcm[index], true);
  }

  return wav;
}

const typingWav = createTypingWav();

export function GET() {
  return new Response(typingWav, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Length": String(typingWav.byteLength),
    },
  });
}