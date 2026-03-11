# Image Watermark Guide

## Overview

The Royal Motors application automatically applies a watermark to all uploaded vehicle images to protect brand identity and prevent unauthorized use of images on public-facing pages.

## Features

- **Automatic Watermarking**: All vehicle images uploaded through the admin panel are automatically watermarked
- **Configurable**: Watermark text, opacity, and position can be configured via environment variables
- **Text-based or Logo-based**: Supports both text watermarks and logo image watermarks
- **Performance Optimized**: Uses Sharp library for fast image processing
- **Responsive**: Watermark size automatically scales based on image dimensions

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Enable/disable watermarking (default: true)
ENABLE_WATERMARK="true"

# Watermark text (default: "Royal Motors")
WATERMARK_TEXT="Royal Motors"

# Watermark opacity 0.0-1.0 (default: 0.6)
WATERMARK_OPACITY="0.6"
```

### Watermark Settings

The watermark is configured with the following defaults:
- **Position**: Bottom-right corner
- **Opacity**: 60% (configurable via `WATERMARK_OPACITY`)
- **Margin**: 20 pixels from edges
- **Font Size**: Responsive, scales with image width (minimum 20px)
- **Text Shadow**: Applied for better visibility on various backgrounds

## Usage

### Automatic Application

Watermarks are automatically applied when:
1. Creating a new vehicle and uploading an image
2. Updating an existing vehicle with a new image

No code changes needed - just upload an image through the admin panel!

### Manual Testing

You can test the watermark functionality:

```bash
cd server
node helpers/watermark.test.js
```

This will create test images in the `static/` directory:
- `test-watermark.png` - Text watermark example
- `test-logo-watermark.png` - Logo watermark example

## How It Works

### Architecture

```
User uploads image
      ↓
Multer receives file → Buffer stored in memory
      ↓
Sharp applies watermark → Creates watermarked buffer
      ↓
Upload to R2 storage → URL returned
      ↓
URL saved to database
```

### Code Flow

1. **Upload Handler** (`middleware/upload.js`): Receives image file using Multer with memory storage
2. **Watermark Application** (`helpers/watermark.js`): Applies SVG-based text watermark using Sharp
3. **Storage** (`controllers/vehiclesController.js`): Uploads watermarked buffer to Cloudflare R2
4. **Database** (`models/schema.sql`): Stores image URL in `vehicles.profile_image_url`

### Implementation Details

**Text Watermark (Default)**
- Uses SVG text element for crisp rendering at any scale
- White text with semi-transparent fill
- Text shadow for visibility on light backgrounds
- Positioned using Sharp's `composite` API

**Logo Watermark (Alternative)**
- Supports PNG, JPG, or SVG logo files
- Logo resized to 15% of image width (configurable)
- Positioned in bottom-right corner with margin
- Fallsback to text watermark if logo fails

## File Locations

- **Watermark Utility**: `server/helpers/watermark.js`
- **Test Script**: `server/helpers/watermark.test.js`
- **Logo File**: `static/logo-watermark.svg`
- **Vehicle Controller**: `server/controllers/vehiclesController.js`

## API Endpoints Affected

The following endpoints now automatically apply watermarks:

- `POST /api/vehicles` - Create vehicle with image
- `PUT /api/vehicles/:id` - Update vehicle image

## Customization

### Change Watermark Text

Update `.env`:
```env
WATERMARK_TEXT="Your Company Name"
```

### Adjust Opacity

Make watermark more/less visible (0.0 = invisible, 1.0 = fully opaque):
```env
WATERMARK_OPACITY="0.8"
```

### Disable Watermark

```env
ENABLE_WATERMARK="false"
```

### Use Logo Instead of Text

Edit `server/controllers/vehiclesController.js` and replace `applyWatermark` with `applyLogoWatermark`:

```javascript
const { applyLogoWatermark } = require('../helpers/watermark');

// In createVehicle and updateVehicle:
const logoPath = path.join(__dirname, '../static/logo-watermark.svg');
imageBuffer = await applyLogoWatermark(imageBuffer, logoPath, {
  scale: 0.15,
  opacity: 0.7,
  position: 'southeast',
});
```

## Troubleshooting

### Watermark Not Appearing

1. Check `.env` file: `ENABLE_WATERMARK="true"`
2. Restart server after changing `.env`
3. Clear browser cache and re-upload image
4. Check server logs for errors

### Watermark Too Dark/Light

Adjust opacity in `.env`:
```env
WATERMARK_OPACITY="0.5"  # Lighter
WATERMARK_OPACITY="0.8"  # Darker
```

### Image Upload Slow

Watermarking adds ~100-300ms processing time per image. This is normal. For very large images (>5MB), consider:
1. Implementing image compression before watermark
2. Using a queue system for background processing
3. Adjusting upload file size limits

### Sharp Installation Issues

If Sharp fails to install:

```bash
cd server
npm rebuild sharp
# or
npm install --platform=darwin --arch=arm64 sharp  # For Mac M1/M2
npm install --platform=linux --arch=x64 sharp     # For Linux
```

## Performance

- **Processing Time**: ~100-300ms per image (depending on size)
- **Memory Usage**: Minimal (uses streaming)
- **Image Quality**: No quality loss (lossless composite)

## Public Tracking Page

Watermarked images are especially important for the public vehicle tracking page (`/public/car/:id`), where vehicle information is displayed without authentication. The watermark protects your images from being used by competitors or unauthorized third parties.

## Future Enhancements

Potential improvements:
- [ ] Support multiple watermark positions (corners, center)
- [ ] Batch watermark existing images
- [ ] Admin UI for watermark configuration
- [ ] Different watermarks for public vs. authenticated views
- [ ] QR code watermarks with tracking URLs

## Support

For issues or questions:
1. Check server logs: `docker logs dealer-app-server` or console output
2. Run test script: `node server/helpers/watermark.test.js`
3. Verify Sharp installation: `npm list sharp`

---

**Last Updated**: March 11, 2026
**Feature Version**: 1.0.0
