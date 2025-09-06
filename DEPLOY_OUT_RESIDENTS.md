# Deploy OUT Residents Feature

## Files to Deploy

The `out-residents-deployment.zip` contains the following files that need to be deployed to the Hostinger server:

1. **out-residents.php** - New API endpoint for OUT residents
2. **index.php** - Updated router with OUT residents endpoint
3. **config.php** - Database configuration (already exists, included for reference)

## Deployment Steps

1. **Upload Files to Hostinger**
   - Login to Hostinger control panel
   - Navigate to File Manager
   - Go to `/public_html/api/php/`
   - Upload the files from the zip:
     - `out-residents.php` (NEW FILE)
     - `index.php` (REPLACE EXISTING)

2. **Verify Database Table**
   The `out_residents` table will be automatically created when the API is first called. It has the following structure:
   ```sql
   CREATE TABLE IF NOT EXISTS out_residents (
     id INT PRIMARY KEY AUTO_INCREMENT,
     original_id INT NOT NULL,
     badge INT NOT NULL,
     first_name VARCHAR(255) NOT NULL,
     last_name VARCHAR(255) NOT NULL,
     room VARCHAR(50),
     nationality VARCHAR(100),
     ov_number VARCHAR(100),
     register_number VARCHAR(100),
     date_of_birth DATE,
     age INT,
     gender ENUM('M', 'F', 'V') DEFAULT 'M',
     reference_person VARCHAR(255),
     date_in DATE,
     days_of_stay INT DEFAULT 0,
     status VARCHAR(50) DEFAULT 'OUT',
     remarks TEXT,
     room_remarks TEXT,
     date_out TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     original_created_at TIMESTAMP,
     original_updated_at TIMESTAMP
   );
   ```

3. **Test the Deployment**
   After uploading, test the API endpoint:
   ```bash
   curl -X GET "https://mikaty.eastatwest.com/api/php/index.php?endpoint=out-residents" \
        -H "X-Api-Key: 20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a"
   ```

   You should receive:
   ```json
   {
     "success": true,
     "data": [],
     "count": 0
   }
   ```

## How It Works

When a resident's status is changed to "OUT" on the Administrative Documents page:

1. The resident data is moved from the `residents` table to the `out_residents` table
2. The original resident ID is preserved in the `original_id` field
3. The `date_out` timestamp is automatically recorded
4. The resident is removed from all active lists (Bewonerslijst, Keukenlijst, etc.)
5. The resident appears in the OUT section of Administrative Documents

## API Endpoints

- `GET ?endpoint=out-residents` - Get all OUT residents
- `GET ?endpoint=out-residents&id={id}` - Get specific OUT resident
- `POST ?endpoint=out-residents` - Move resident to OUT (body: `{"residentId": 123}`)
- `DELETE ?endpoint=out-residents&id={id}` - Permanently delete OUT resident

## Troubleshooting

If residents are not moving to OUT:
1. Check browser console for errors
2. Verify the API endpoint is accessible
3. Check that the database user has CREATE TABLE permissions
4. Ensure the `out_residents` table was created successfully