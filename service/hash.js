// Passwort-Hash erzeugen:  node hash.js 'meinPasswort'
import crypto from 'node:crypto';
const pw = process.argv[2];
if (!pw) {
  console.error("Aufruf: node hash.js '<passwort>'");
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString('hex');
console.log(`scrypt$${salt}$${crypto.scryptSync(pw, salt, 32).toString('hex')}`);
