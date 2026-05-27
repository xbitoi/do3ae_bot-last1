const { execSync } = require('child_process');
try {
  execSync('python3 -c "import arabic_reshaper; print(\\"SUCCESS\\")"', { stdio: 'inherit' });
} catch (e) {
  console.log('FAIL');
}
