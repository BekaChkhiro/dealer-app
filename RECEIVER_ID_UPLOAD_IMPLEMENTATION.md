# Receiver ID Document Upload Implementation (T10.7)

## Overview
This feature allows dealers to either manually enter receiver information OR upload the receiver's ID document when adding/editing a vehicle. This provides flexibility and streamlines the data entry process.

## Implementation Summary

### Database Changes

**Migration:** `server/migrations/015_add_receiver_id_document.sql`
- Added `receiver_id_document_url VARCHAR(500)` - Stores the URL of uploaded receiver ID document
- Added `receiver_id_uploaded_at TIMESTAMP` - Tracks when the document was uploaded

To apply migration:
```bash
cd server && node scripts/migrate.js
```

### Backend Changes

#### 1. Upload Middleware
- **File:** `server/middleware/uploadDocument.js` (already exists)
- Supports images (JPG, PNG, GIF, WebP) and PDFs
- Max file size: 10MB

#### 2. Routes (`server/routes/vehicles.js`)
- Added new route: `POST /api/vehicles/:id/upload-receiver-id`
- Requires authentication (both admin and vehicle owner can upload)

#### 3. Controller (`server/controllers/vehiclesController.js`)
- Added `uploadReceiverIdDocument()` function
- Handles file upload to R2 storage
- Stores document URL in database
- Deletes old document if one exists
- Logs action in audit log
- Returns uploaded document URL

### Frontend Changes

#### 1. Translation Keys

**English (`client/src/i18n/en.json`):**
```json
"receiverDataEntry": "Receiver Information",
"manualEntry": "Manual Entry",
"uploadIdDocument": "Upload ID Document",
"receiverIdDocumentLabel": "Receiver ID Document",
"chooseFile": "Choose File",
"uploadDocument": "Upload Document",
"viewDocument": "View Document",
"idDocumentUploaded": "ID document uploaded",
"uploadReceiverIdSuccess": "Receiver ID document uploaded successfully",
"uploadReceiverIdError": "Failed to upload receiver ID document",
"enterReceiverDataAfterUpload": "Enter receiver information after reviewing the document:",
"saveVehicleFirst": "Save vehicle first before uploading document",
"selectIdDocument": "Select an image or PDF file (max 10MB)"
```

**Georgian (`client/src/i18n/ka.json`):**
- All corresponding Georgian translations added

#### 2. Component Updates (`client/src/pages/Cars.jsx`)

**New State Variables:**
```javascript
const [receiverEntryMode, setReceiverEntryMode] = useState('manual');
const [receiverIdFile, setReceiverIdFile] = useState(null);
const [receiverIdUploading, setReceiverIdUploading] = useState(false);
const [receiverIdError, setReceiverIdError] = useState(null);
const [receiverIdSuccess, setReceiverIdSuccess] = useState(null);
```

**New Functions:**
- `handleReceiverIdFileChange()` - Handles file selection
- `handleReceiverIdUpload()` - Uploads the document to backend

**UI Changes:**
- Added toggle buttons: "Manual Entry" | "Upload ID Document"
- Manual mode: Shows traditional input fields (fullname, ID number, phone)
- Upload mode: Shows file upload interface with the following features:
  - File input (accepts images and PDFs)
  - Upload button
  - View document link (if already uploaded)
  - Manual entry fields below (to enter data after reviewing document)
  - Validation (requires vehicle to be saved first)

## Usage Flow

### For New Vehicles:
1. Click "Add New Vehicle"
2. Fill in vehicle information
3. Select "Upload ID Document" mode
4. **Save vehicle first** (document upload requires vehicle ID)
5. Click "Edit" on the saved vehicle
6. Upload receiver's ID document
7. View the uploaded document
8. Enter receiver information manually after reviewing the document
9. Save the vehicle again

### For Existing Vehicles:
1. Click "Edit" on a vehicle
2. Switch to "Upload ID Document" mode
3. Upload receiver's ID document
4. View the uploaded document
5. Enter/update receiver information
6. Save

### Manual Entry (Traditional):
1. Stay in "Manual Entry" mode (default)
2. Enter receiver fullname, ID number, and phone directly
3. Save

## Security & Permissions

- **Authentication Required:** Both admin and vehicle owner (dealer) can upload
- **File Validation:** Only images and PDFs accepted (max 10MB)
- **Storage:** Files stored in R2 bucket under `receiver-documents/` folder
- **Old Document Cleanup:** Previous document is automatically deleted when new one is uploaded
- **Audit Log:** All uploads are logged with user ID, timestamp, and IP address

## Benefits

1. **Flexibility:** Dealers can choose the most convenient method
2. **Documentation:** ID documents are stored for verification and compliance
3. **Data Accuracy:** Dealers can reference the actual ID document when entering data
4. **Audit Trail:** All document uploads are tracked
5. **User-Friendly:** Simple toggle between two modes
6. **Reuses Infrastructure:** Leverages existing ID upload system from users module (T8.5)

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] New vehicle: Manual entry mode works
- [ ] New vehicle: Save → Edit → Upload mode works
- [ ] Existing vehicle: Upload mode works
- [ ] File upload accepts images (JPG, PNG, etc.)
- [ ] File upload accepts PDFs
- [ ] File size validation (max 10MB)
- [ ] View uploaded document opens in new tab
- [ ] Old document is deleted when uploading new one
- [ ] Document URL is saved in database
- [ ] Manual fields still work in upload mode
- [ ] Toggle between modes preserves entered data
- [ ] Dealer can upload to their own vehicles
- [ ] Admin can upload to any vehicle
- [ ] Non-owner dealer cannot upload to other's vehicles
- [ ] Audit log captures upload events
- [ ] Both English and Georgian translations work

## Future Enhancements

- OCR to auto-extract receiver information from uploaded ID
- Document verification workflow (approve/reject)
- Multiple document upload (front and back of ID)
- Document expiry tracking
- Document preview modal (without opening new tab)

## Related Tasks

- T8.5: ID document upload for users (infrastructure reused)
- T2.9: Car add/edit form (extended with this feature)
- T7.7: Audit log system (logs document uploads)
