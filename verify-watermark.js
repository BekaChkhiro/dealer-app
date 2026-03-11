#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Watermark Implementation...\n');

let errors = 0;
let warnings = 0;

// Check 1: Watermark helper exists
console.log('1. Checking watermark helper...');
const helperPath = path.join(__dirname, 'server/helpers/watermark.js');
if (fs.existsSync(helperPath)) {
  const helper = require(helperPath);
  if (typeof helper.applyWatermark === 'function' && typeof helper.applyLogoWatermark === 'function') {
    console.log('   ✅ Watermark helper exists with both functions\n');
  } else {
    console.log('   ❌ Watermark helper missing required functions\n');
    errors++;
  }
} else {
  console.log('   ❌ Watermark helper not found\n');
  errors++;
}

// Check 2: Controller integration
console.log('2. Checking vehicle controller integration...');
const controllerPath = path.join(__dirname, 'server/controllers/vehiclesController.js');
if (fs.existsSync(controllerPath)) {
  const controllerCode = fs.readFileSync(controllerPath, 'utf8');

  const checks = [
    { pattern: /applyLogoWatermark/g, name: 'applyLogoWatermark import/usage' },
    { pattern: /applyWatermark/g, name: 'applyWatermark import/usage' },
    { pattern: /ENABLE_WATERMARK/g, name: 'ENABLE_WATERMARK check' },
    { pattern: /USE_LOGO_WATERMARK/g, name: 'USE_LOGO_WATERMARK check' },
  ];

  let allFound = true;
  checks.forEach(check => {
    if (controllerCode.match(check.pattern)) {
      console.log(`   ✅ ${check.name} found`);
    } else {
      console.log(`   ❌ ${check.name} NOT found`);
      errors++;
      allFound = false;
    }
  });

  if (allFound) {
    console.log('   ✅ Controller properly integrated\n');
  } else {
    console.log('   ❌ Controller integration incomplete\n');
  }
} else {
  console.log('   ❌ Vehicle controller not found\n');
  errors++;
}

// Check 3: Logo file exists
console.log('3. Checking logo file...');
const logoPath = path.join(__dirname, 'static/logo-watermark.svg');
if (fs.existsSync(logoPath)) {
  const logoContent = fs.readFileSync(logoPath, 'utf8');
  if (logoContent.includes('ROYAL') && logoContent.includes('MOTORS')) {
    console.log('   ✅ Logo SVG exists and contains branding\n');
  } else {
    console.log('   ⚠️  Logo exists but content may be incorrect\n');
    warnings++;
  }
} else {
  console.log('   ❌ Logo file not found\n');
  errors++;
}

// Check 4: Environment variables
console.log('4. Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  const envChecks = [
    { pattern: /ENABLE_WATERMARK.*=.*["']true["']/i, name: 'ENABLE_WATERMARK=true', required: true },
    { pattern: /USE_LOGO_WATERMARK.*=.*["']true["']/i, name: 'USE_LOGO_WATERMARK=true', required: true },
    { pattern: /WATERMARK_LOGO_PATH/i, name: 'WATERMARK_LOGO_PATH', required: false },
    { pattern: /WATERMARK_OPACITY/i, name: 'WATERMARK_OPACITY', required: false },
    { pattern: /WATERMARK_SCALE/i, name: 'WATERMARK_SCALE', required: false },
    { pattern: /WATERMARK_MARGIN/i, name: 'WATERMARK_MARGIN', required: false },
  ];

  envChecks.forEach(check => {
    if (envContent.match(check.pattern)) {
      console.log(`   ✅ ${check.name} configured`);
    } else if (check.required) {
      console.log(`   ❌ ${check.name} NOT configured`);
      errors++;
    } else {
      console.log(`   ⚠️  ${check.name} not configured (will use default)`);
      warnings++;
    }
  });
  console.log();
} else {
  console.log('   ⚠️  .env file not found (may use environment variables)\n');
  warnings++;
}

// Check 5: Sharp dependency
console.log('5. Checking dependencies...');
const sharpPath = path.join(__dirname, 'server/node_modules/sharp');
if (fs.existsSync(sharpPath)) {
  try {
    // Try to require from server/node_modules
    const sharp = require(path.join(__dirname, 'server/node_modules/sharp'));
    console.log('   ✅ sharp library installed\n');
  } catch (e) {
    console.log('   ⚠️  sharp found but may not load correctly\n');
    warnings++;
  }
} else {
  console.log('   ❌ sharp library NOT installed in server/node_modules\n');
  errors++;
}

// Summary
console.log('═'.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('═'.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('\n🎉 Watermark implementation is COMPLETE and ready to use!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart the server if it\'s running');
  console.log('   2. Upload a car image through the app');
  console.log('   3. Verify the Royal Motors logo appears in bottom-right\n');
  process.exit(0);
} else {
  console.log(`❌ ${errors} ERROR(S) found`);
  console.log(`⚠️  ${warnings} WARNING(S) found`);
  console.log('\n⚠️  Implementation has issues that need to be resolved.\n');
  process.exit(1);
}
