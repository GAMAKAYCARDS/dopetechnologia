# 🔧 Environment Variables Setup

## Create .env.local file

Create a file named `.env.local` in your project root (`site paid/dopetech/.env.local`) with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aizgswoelfdkhyosgvzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpemdzd29lbGZka2h5b3Nndnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTUyMjUsImV4cCI6MjA3MDYzMTIyNX0.4a7Smvc_bueFLqZNvGk-AW0kD5dJusNwqaSAczJs0hU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpemdzd29lbGZka2h5b3Nndnp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA1NTIyNSwiZXhwIjoyMDcwNjMxMjI1fQ.gLnsyAhR8VSjbe37LdEHuFBGNDufqC4jZ9X3UOSNuGc

# Google Sheets API Configuration
GOOGLE_SHEET_ID=YOUR_SHEET_ID_HERE
GOOGLE_SERVICE_ACCOUNT_EMAIL=YOUR_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Drive API Configuration
GOOGLE_DRIVE_FOLDER_ID=1U5wfCmULVs1US4JZ4FoAODLOk3zqzyS_
```

## How to get the values:

### 1. Supabase Configuration (Already provided)
- `NEXT_PUBLIC_SUPABASE_URL`: Already set to your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Already set to your public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Already set to your service role key

### 2. GOOGLE_SHEET_ID
- From your Google Sheet URL
- Example: `https://docs.google.com/spreadsheets/d/1ABC123.../edit`
- Copy the part between `/d/` and `/edit`: `1ABC123...`

### 3. GOOGLE_SERVICE_ACCOUNT_EMAIL
- Open the JSON file you downloaded from Google Cloud Console
- Look for `"client_email"` field
- Copy the email address (ends with `@your-project.iam.gserviceaccount.com`)

### 4. GOOGLE_PRIVATE_KEY
- Open the JSON file you downloaded from Google Cloud Console
- Look for `"private_key"` field
- Copy the ENTIRE private key including:
  - `-----BEGIN PRIVATE KEY-----`
  - The long string of characters
  - `-----END PRIVATE KEY-----`
- Make sure to keep the quotes around it

### 5. GOOGLE_DRIVE_FOLDER_ID
- Already set to your folder: `1U5wfCmULVs1US4JZ4FoAODLOk3zqzyS_`

## Example .env.local file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aizgswoelfdkhyosgvzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpemdzd29lbGZka2h5b3Nndnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTUyMjUsImV4cCI6MjA3MDYzMTIyNX0.4a7Smvc_bueFLqZNvGk-AW0kD5dJusNwqaSAczJs0hU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpemdzd29lbGZka2h5b3Nndnp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA1NTIyNSwiZXhwIjoyMDcwNjMxMjI1fQ.gLnsyAhR8VSjbe37LdEHuFBGNDufqC4jZ9X3UOSNuGc

# Google Sheets API Configuration
GOOGLE_SHEET_ID=1ABC123DEF456GHI789JKL
GOOGLE_SERVICE_ACCOUNT_EMAIL=dopetech-checkout-bot@dopetech-checkout.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Google Drive API Configuration
GOOGLE_DRIVE_FOLDER_ID=1U5wfCmULVs1US4JZ4FoAODLOk3zqzyS_
```

## After creating .env.local:

1. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Test the setup**:
   - Go to your website
   - Add items to cart
   - Go to checkout
   - Click "🔍 Debug API Status" button
   - You should see "configured" status

3. **Test upload**:
   - Fill out the checkout form
   - Upload a receipt image
   - Submit the order
   - Check your Google Drive folder for the uploaded file

## For Netlify Deployment:

Add these environment variables in your Netlify dashboard:
1. Go to Site Settings > Environment Variables
2. Add each variable from your `.env.local` file
3. Make sure to include the `NEXT_PUBLIC_` prefix for client-side variables
