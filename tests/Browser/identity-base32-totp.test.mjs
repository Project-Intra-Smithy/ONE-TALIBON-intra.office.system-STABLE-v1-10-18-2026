import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function decodeBase32(secret) {
    let bits = '';
    for (const char of secret.toUpperCase().replace(/=+$/u, '')) {
        const index = alphabet.indexOf(char);
        assert.notEqual(index, -1);
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
    }
    return Buffer.from(bytes);
}
test('Base32 decoder uses RFC 4648 alphabet and known RFC 6238 TOTP vector', () => {
    assert.equal(alphabet.length, 32);
    const secret = decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    assert.equal(secret.toString('ascii'), '12345678901234567890');
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(1n); // 59 seconds / 30 = 1
    const digest = createHmac('sha1', secret).update(counter).digest();
    const offset = digest[digest.length - 1] & 15;
    const sixDigits = String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
    assert.equal(sixDigits, '287082');
    assert.throws(() => decodeBase32('INVALID-!'), /not equal/i);
});
