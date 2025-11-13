import webpush from 'web-push';

console.log('\n🔐 Generating New VAPID Keys for Emma Health App...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('VAPID Keys Generated Successfully!');
console.log('=======================================\n');

console.log('📋 Copy these values to add to Settings:\n');

console.log('Secret 1: VAPIDPublicKey');
console.log('─────────────────────────────────────');
console.log(vapidKeys.publicKey);
console.log('\n');

console.log('Secret 2: VAPIDPrivateKey');
console.log('─────────────────────────────────────');
console.log(vapidKeys.privateKey);
console.log('\n');

console.log('Secret 3: VAPIDEmail');
console.log('─────────────────────────────────────');
console.log('mailto:techadmin@emmahealthapp.com');
console.log('\n');

console.log('=======================================');
console.log('📝 Next Steps:');
console.log('=======================================');
console.log('1. Open Settings in the sidebar (⚙️ icon)');
console.log('2. Add these 3 secrets (copy values above):');
console.log('   - VAPIDPublicKey');
console.log('   - VAPIDPrivateKey');
console.log('   - VAPIDEmail');
console.log('3. Go to Notifications view');
console.log('4. Toggle "Push Notifications" ON');
console.log('5. Click "Send Test Notification"');
console.log('6. Check your device! 🎉');
console.log('=======================================\n');

console.log('⚠️  SECURITY REMINDER:');
console.log('Keep the Private Key secret and secure!');
console.log('Never commit it to version control.');
console.log('=======================================\n');
