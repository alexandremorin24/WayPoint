const { execSync } = require('child_process');

try {
  console.log('\n🧹 Resetting test database...');
  execSync('npm run db:reset:test', { stdio: 'inherit' });

  console.log('\n🚀 Running tests...');
  execSync('NODE_ENV=test jest', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Error during test run:', err.message);
  process.exit(1);
}
