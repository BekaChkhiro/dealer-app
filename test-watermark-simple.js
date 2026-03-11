const fs = require('fs');
const path = require('path');
const { applyLogoWatermark, applyWatermark } = require('./server/helpers/watermark');

async function testWatermark() {
  try {
    console.log('🧪 Testing watermark functionality...\n');

    // Use downloaded test image
    const imagePath = '/tmp/test-car.jpg';
    const logoPath = path.join(__dirname, 'static/logo-watermark.svg');

    if (!fs.existsSync(imagePath)) {
      console.error('❌ Test image not found at:', imagePath);
      return;
    }

    console.log(`📸 Test image: ${imagePath}`);
    console.log(`🎨 Logo path: ${logoPath}`);

    // Read test image
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`✅ Image loaded: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

    // Test 1: Text watermark
    console.log('Test 1: Text Watermark');
    console.log('─'.repeat(50));
    const textWatermarked = await applyWatermark(imageBuffer, {
      text: 'Royal Motors',
      position: 'bottom-right',
      opacity: 0.6,
      margin: 20,
    });
    const textOutputPath = path.join(__dirname, 'static/test-watermark.png');
    fs.writeFileSync(textOutputPath, textWatermarked);
    console.log(`✅ Text watermark applied`);
    console.log(`💾 Saved to: ${textOutputPath}\n`);

    // Test 2: Logo watermark
    console.log('Test 2: Logo Watermark');
    console.log('─'.repeat(50));
    const logoWatermarked = await applyLogoWatermark(imageBuffer, logoPath, {
      position: 'southeast',
      scale: 0.15,
      opacity: 0.7,
      margin: 20,
    });
    const logoOutputPath = path.join(__dirname, 'static/test-logo-watermark.png');
    fs.writeFileSync(logoOutputPath, logoWatermarked);
    console.log(`✅ Logo watermark applied`);
    console.log(`💾 Saved to: ${logoOutputPath}\n`);

    // Compare file sizes
    console.log('📊 Results:');
    console.log('─'.repeat(50));
    console.log(`Original:          ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`Text watermark:    ${(textWatermarked.length / 1024).toFixed(2)} KB`);
    console.log(`Logo watermark:    ${(logoWatermarked.length / 1024).toFixed(2)} KB`);
    console.log('\n🎉 Watermark test completed successfully!');
    console.log('\n📁 Output files created:');
    console.log(`  - static/test-watermark.png`);
    console.log(`  - static/test-logo-watermark.png`);
    console.log('\n✅ You can now test by uploading a car image in the app!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testWatermark();
