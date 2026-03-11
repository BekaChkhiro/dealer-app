const sharp = require('sharp');

/**
 * Apply watermark to image buffer
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Watermark options
 * @returns {Promise<Buffer>} - Watermarked image buffer
 */
async function applyWatermark(imageBuffer, options = {}) {
  try {
    const {
      text = 'Royal Motors',
      position = 'bottom-right',
      opacity = 0.5,
      fontSize = 32,
      margin = 20,
    } = options;

    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Calculate font size relative to image width (responsive)
    const relativeFontSize = Math.max(20, Math.floor(width / 25));
    const actualFontSize = fontSize || relativeFontSize;

    // Create SVG text watermark
    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .watermark {
            font-family: Arial, sans-serif;
            font-size: ${actualFontSize}px;
            font-weight: bold;
            fill: white;
            fill-opacity: ${opacity};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          }
        </style>
        <text
          x="${width - margin}"
          y="${height - margin}"
          text-anchor="end"
          class="watermark"
        >${text}</text>
      </svg>
    `;

    // Composite watermark onto image
    const watermarkedBuffer = await image
      .composite([
        {
          input: Buffer.from(svgText),
          gravity: position === 'bottom-right' ? 'southeast' : position,
        },
      ])
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('Watermark error:', error);
    // Return original buffer if watermark fails
    return imageBuffer;
  }
}

/**
 * Apply watermark with logo image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} logoPath - Path to logo image file
 * @param {Object} options - Watermark options
 * @returns {Promise<Buffer>} - Watermarked image buffer
 */
async function applyLogoWatermark(imageBuffer, logoPath, options = {}) {
  try {
    const {
      position = 'southeast',
      scale = 0.15, // Logo size relative to image (15% of width)
      opacity = 0.7,
      margin = 20,
    } = options;

    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Calculate logo size
    const logoWidth = Math.floor(width * scale);

    // Resize and prepare logo
    const logo = await sharp(logoPath)
      .resize(logoWidth, null, { fit: 'inside' })
      .composite([
        {
          input: Buffer.from(
            `<svg><rect x="0" y="0" width="${logoWidth}" height="100%" fill="rgba(255,255,255,${opacity})"/></svg>`
          ),
          blend: 'dest-in',
        },
      ])
      .toBuffer();

    // Get logo metadata
    const logoMetadata = await sharp(logo).metadata();

    // Calculate position based on gravity
    let left, top;
    if (position === 'southeast') {
      left = width - logoMetadata.width - margin;
      top = height - logoMetadata.height - margin;
    } else if (position === 'southwest') {
      left = margin;
      top = height - logoMetadata.height - margin;
    } else if (position === 'northeast') {
      left = width - logoMetadata.width - margin;
      top = margin;
    } else {
      left = margin;
      top = margin;
    }

    // Composite logo onto image
    const watermarkedBuffer = await image
      .composite([
        {
          input: logo,
          left,
          top,
        },
      ])
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('Logo watermark error:', error);
    // Fallback to text watermark if logo fails
    return applyWatermark(imageBuffer, { text: 'Royal Motors' });
  }
}

module.exports = {
  applyWatermark,
  applyLogoWatermark,
};
