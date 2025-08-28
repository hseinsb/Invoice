# 🚀 Google Apps Script Setup for Invoice System

## **Step 1: Open Your Google Sheet**
1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1mcXXq3LmhL3MbDNkk_CDPXCXLNw_bRrsOwyNylG-Qik/edit
2. Make sure you're on **Sheet1** (or rename the sheet to "Sheet1")

## **Step 2: Open Apps Script Editor**
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. This will open a new tab with the Apps Script editor
3. You'll see a default `Code.gs` file

## **Step 3: Paste the Code**
1. **Delete all existing code** in the `Code.gs` file
2. **Copy the entire code** from the `google-apps-script-code.js` file I created
3. **Paste it** into the Apps Script editor
4. Click **Save** (Ctrl+S or Cmd+S)

## **Step 4: Set Up Headers (Optional but Recommended)**
1. In the Apps Script editor, click the **play button** next to `setupHeaders` function
2. **Authorize the script** when prompted (you'll need to allow permissions)
3. This will add column headers to your Google Sheet

## **Step 5: Deploy as Web App**
1. Click **Deploy** → **New deployment**
2. **Click the gear icon** next to "Type" and select **Web app**
3. Fill in the details:
   - **Description**: Invoice Payment Integration
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

## **Step 6: Update Your Environment Variable**
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your project and click on it
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `VITE_APPS_SCRIPT_URL`
   - **Value**: The Web App URL you copied from step 5
5. **Redeploy** your application

## **Step 7: Test the Integration**
1. Go to your invoice app
2. Create an invoice and record a payment
3. Check your Google Sheet - you should see a new row!

## **🔧 Troubleshooting**

### **If you get permission errors:**
1. Make sure you authorized the Apps Script when prompted
2. Check that "Who has access" is set to "Anyone" in the deployment

### **If data doesn't appear:**
1. Check the browser console for error messages
2. Verify the Apps Script URL is correct in your Vercel environment variables
3. Make sure your sheet is named "Sheet1"

### **To view Apps Script logs:**
1. In the Apps Script editor, click **Executions** on the left
2. You can see all script runs and any error messages

## **🎯 Column Mapping**
Your Google Sheet will have these columns:
- **A**: Date
- **B**: Customer/Insurance
- **C**: Customer Name  
- **D**: Payment Type
- **E**: Payment Amount
- **F**: Who's Paying
- **G**: Notes

## **✅ You're Done!**
Once you complete these steps, every payment you record in your invoice app will automatically appear in your Google Sheet!
