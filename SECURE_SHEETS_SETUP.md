# Secure Google Sheets Integration Setup (Service Account Method)

This approach uses your existing service account credentials securely on a serverless backend.

## ✅ Benefits of This Approach:
- **🔐 Secure**: Service account credentials stay server-side
- **🎯 Private**: Sheet only shared with your service account (not public)
- **📋 Auditable**: Clear record of who/what accesses your sheet
- **💰 Free**: Uses Vercel's free tier
- **🚀 Professional**: Proper business-grade setup

## Step 1: Deploy to Vercel (Free)

1. **Install Vercel CLI** (if you don't have it):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your project**:
   ```bash
   vercel --prod
   ```

4. **Copy your deployment URL** (e.g., `https://your-app-name.vercel.app`)

## Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
GOOGLE_PROJECT_ID = invoice-c762f
GOOGLE_PRIVATE_KEY_ID = 2d1d35f27d012e848d32ddfc330613a6e6c83351
GOOGLE_CLIENT_EMAIL = sheets-integration@invoice-c762f.iam.gserviceaccount.com
GOOGLE_CLIENT_ID = 106425926145085542191
GOOGLE_CLIENT_X509_CERT_URL = https://www.googleapis.com/robot/v1/metadata/x509/sheets-integration%40invoice-c762f.iam.gserviceaccount.com
```

For `GOOGLE_PRIVATE_KEY`, add this (including the quotes and newlines):
```
"-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHs7S39sQNjes7
efBWRhPu4WIVO+IyxyZABMaSLAHULlGwS776HLEdmQfztOruOMxtgOLYKuuvPhbG
yXDVd5dy04on7Chff6fg2M4q5XhEOD+yoBpfqciIXqTmGHhBZ3U8zuwSoOQIyZae
LWE0LteFawXnFzgRLlahuDsvqn/2zFvfSUagSODylKaSrWXyNgUfro7xhyScQdwI
PP7H79F6V0FB1+WViiB0XC+RLNmt2dn5fyMNfzb5zidkk2lX4//zcMsmXHGAD/mb
Ep/Kek64PXkZACeiCMpG12pQFftTZBYcTSqebRFxJuk0VWbDpm0V/CDSRarcw0fG
PuxfQsHbAgMBAAECggEANfz1xuQuBXIQHaCuIkzIt8RzxUTOtqaTRyxjWIIQLoIl
MHGR3EEketlzxmVrO+LcFWCKMyGLXPF+q9gqqnMt3Oumhnt4QLUcuBM0zXEC7gJ8
6fgRmTonzgI0N0Z3QEtNbRaNyM15SIzjLLkc9cQSHO4dhueGj1KFNiw9x/mipaAI
ieSlcjbLFCddhWhgw8Ac77ejvpfD2Jv3hawKjmSiiYRRIlksEuxieh5Iwp6UDUNZ
apnQ8Yk+J5dYOi4e8fHLmLKxmXlVem8TUIQmAkNkVUCOxOGkoUFa/KLq3bo18ClW
NzMYOt9s8XTRt0xP9tMp56NisvWnXTNko5gkYf6QJQKBgQDo0RhP9lKe9d7IxLXz
tTuAI1EDctzz2GaB2JxzMWQ1QcC8NP0W6RwoMUmawmrgcKSn4AdcXP3ixXnXoxwy
ZBoKii1oI5QrKzLUFL6NpZDuQaXFkCbyUurEeDYWwt0D5Xs6bOohgfZ5zKLhf2I3
xsDUNZMv5zEIDu6szqTs1Jh8TwKBgQDblnT/ubcRbpzUvbhcBWFxtMFO+qMTQxU5
z6JkNVKS6A8B93GxKPzZnZsvDVEjkdgc2lvJrOIOEG5LH9z2b8WwOOfOBIY+WDVA
wKUi9s5ruzvtoKs9FYYYY3/gfgOL1F0JewxSLEhbtb4MK30yTyVZm3oQxB775gsU
kfENwBHCtQKBgQCaqMyN0gRwtMSaepKkovAz30IiGFvPYSI3f73uiBEZj+SJImo+
nfymdpd+x0hYcHvxSVGaeevuiWC3bxN8JiNmfQRM+dWkF75cRKuRTTtKCzIkW+6D
a7GpcnH8DNblj7ycw12FhOBHaTmKsyR8CPxv/Gcam2pnAARtp5jH+zKQ4QKBgHyM
VkhF2iQ1DRdNlKf9FUwdLhfR6XUfc4aa0ozsAa35mamP5BiMGv6DemWxs/fs3Rtg
bvdw67b2ctiBdh8BPqu5WyFrR4lNFsdnfULbojFQvakGnJnE/44NwZZfYzuIdEzQ
Uii5nUEHUIgukpBae+DbYtznoHtX+6jrLkKSUoCRAoGAQeF/eq+Lo9zcIW64wNd3
0EwzyAMK8DdMn0aOjNV8NDsQbSsQ+RpAN2sUdD4lo9qOiIeTCMehLfNng7Po4uYW
koGab3EJZpGuNfiysXzEDC10zTfo0X01f/q3exV92ag8nshCftPTTdcg0YIHbjR1
+/OzwQH7knGIuz9355WnK7U=
-----END PRIVATE KEY-----"
```

5. Click **"Save"** for each variable

## Step 3: Share Google Sheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mcXXq3LmhL3MbDNkk_CDPXCXLNw_bRrsOwyNylG-Qik/edit
2. Click **"Share"**
3. Add this email as **Editor**: `sheets-integration@invoice-c762f.iam.gserviceaccount.com`
4. Click **"Send"**

## Step 4: Update Your Frontend

1. Edit `src/services/googleSheets.ts`
2. Replace `'https://your-vercel-app.vercel.app/api/add-payment'` with your actual Vercel URL

## Step 5: Test the Integration

1. **Redeploy** to apply changes: `vercel --prod`
2. **Test the endpoint** directly:
   ```bash
   curl -X POST https://your-app.vercel.app/api/add-payment \
     -H "Content-Type: application/json" \
     -d '{"date":"2024-01-15","customerInsuranceType":"Customer","customerName":"Test","paymentType":"Cash","paymentAmount":100,"whosPaying":"Customer Walk In","notes":"Test"}'
   ```
3. **Test in your app**: Settings → "Test Google Sheets"
4. **Record a real payment** and watch it appear in your sheet!

## 🔐 Security Benefits

✅ **Service account credentials never leave the server**  
✅ **Google Sheet is private (only your service account has access)**  
✅ **No API keys in browser source code**  
✅ **Proper audit trail of who accessed your data**  
✅ **Can revoke access anytime by removing service account from sheet**  

## 💰 Cost: Completely Free

- ✅ Vercel free tier: 100GB bandwidth, 100GB-hours compute/month
- ✅ Google Sheets API: Free up to 100 requests/100 seconds
- ✅ For your invoice volume: Easily within free limits

---

**This is the professional, secure way to integrate with Google Sheets for business use!**
