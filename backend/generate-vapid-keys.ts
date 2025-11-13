import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=======================================\n');
console.log('VAPID Keys Generated Successfully!\n');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('\n=======================================\n');
console.log('Next Steps:');
console.log('1. Open Settings in the sidebar');
console.log('2. Add these 3 secrets:');
console.log('   - VAPIDPublicKey: (copy public key above)');
console.log('   - VAPIDPrivateKey: (copy private key above)');
console.log('   - VAPIDEmail: mailto:your-email@example.com');
console.log('\n=======================================\n');
