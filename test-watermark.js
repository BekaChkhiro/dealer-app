const fs = require('fs');
const path = require('path');
const { applyLogoWatermark, applyWatermark } = require('./server/helpers/watermark');

async function testWatermark() {
  try {
    console.log('🧪 Testing watermark functionality...\n');

    // Check if test image exists
    const testImagePath = path.join(__dirname, 'static/cars');
    const files = fs.readdirSync(testImagePath);
    const imageFile = files.find(f => f.match(/\.(jpg|jpeg|png)$/i));

    if (!imageFile) {
      console.error('❌ No test image found in static/cars/');
      console.log('Please upload a car image first to test watermarking.');
      return;
    }

    const imagePath = path.join(testImagePath, imageFile);
    const logoPath = path.join(__dirname, 'static/logo-watermark.svg');

    console.log(`📸 Test image: ${imageFile}`);
    console.log(`🎨 Logo path: ${logoPath}`);

    // Read test image
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`✅ Image loaded: ${imageBuffer.length} bytes\n`);

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
    console.log('\nYou can now check the output files:');
    console.log(`  - ${textOutputPath}`);
    console.log(`  - ${logoOutputPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testWatermark();
