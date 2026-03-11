const { applyWatermark, applyLogoWatermark } = require('./watermark');
const fs = require('fs');
const path = require('path');

// Test watermark with a sample image
async function testWatermark() {
  try {
    // Create a simple test image (100x100 red square)
    const sharp = require('sharp');

    const testImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer();

    console.log('✓ Created test image');

    // Apply text watermark
    const watermarked = await applyWatermark(testImage, {
      text: 'Royal Motors',
      position: 'bottom-right',
      opacity: 0.6,
    });

    console.log('✓ Applied text watermark');

    // Save watermarked image for visual inspection
    const outputPath = path.join(__dirname, '../../static/test-watermark.png');
    await sharp(watermarked).toFile(outputPath);

    console.log(`✓ Saved watermarked test image to: ${outputPath}`);
    console.log('✅ Watermark test passed!');

    // Test with logo if available
    const logoPath = path.join(__dirname, '../../static/logo-watermark.svg');
    if (fs.existsSync(logoPath)) {
      console.log('Testing logo watermark...');
      const logoWatermarked = await applyLogoWatermark(testImage, logoPath, {
        scale: 0.2,
        opacity: 0.7,
      });

      const logoOutputPath = path.join(__dirname, '../../static/test-logo-watermark.png');
      await sharp(logoWatermarked).toFile(logoOutputPath);

      console.log(`✓ Saved logo watermarked image to: ${logoOutputPath}`);
      console.log('✅ Logo watermark test passed!');
    }
  } catch (error) {
    console.error('❌ Watermark test failed:', error);
    process.exit(1);
  }
}

// Run test if executed directly
if (require.main === module) {
  testWatermark();
}

module.exports = { testWatermark };
