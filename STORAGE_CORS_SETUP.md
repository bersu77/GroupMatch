# Fix Firebase Storage CORS Errors

If you see **CORS errors** in the Network tab when uploading images, your Storage bucket needs CORS configuration.

## 1. Install Google Cloud SDK (includes `gsutil`)

### Windows (PowerShell)
```powershell
# Using npm
npm install -g gcloud

# Or download installer: https://cloud.google.com/sdk/docs/install
```

### macOS
```bash
brew install google-cloud-sdk
```

### Or use the official installer
- https://cloud.google.com/sdk/docs/install

---

## 2. Log in to Google Cloud

```bash
gcloud auth login
```

Sign in with the **same Google account** you use for Firebase.

---

## 3. Set your Firebase project

```bash
gcloud config set project group-match-a5548
```

---

## 4. Get your Storage bucket name

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. **Storage** → click the **three dots** or **Settings**
3. Note the **bucket** name. It’s usually one of:
   - `group-match-a5548.appspot.com`
   - `group-match-a5548.firebasestorage.app`

---

## 5. Apply CORS config

From your **project root** (where `storage.cors.json` is):

```bash
gsutil cors set storage.cors.json gs://group-match-a5548.appspot.com
```

If your bucket is `group-match-a5548.firebasestorage.app`, use:

```bash
gsutil cors set storage.cors.json gs://group-match-a5548.firebasestorage.app
```

---

## 6. Check that CORS is set

```bash
gsutil cors get gs://group-match-a5548.appspot.com
```

You should see the same origins, methods, and headers as in `storage.cors.json`.

---

## 7. Retry uploads

1. Restart your dev server: `npm run dev`
2. Create a group and upload an image again.
3. If CORS errors remain, check the **exact bucket** in Firebase Console and use that in the `gsutil` commands.

---

## Quick checklist

- [ ] Google Cloud SDK installed, `gcloud` and `gsutil` in PATH
- [ ] Logged in: `gcloud auth login`
- [ ] Project set: `gcloud config set project group-match-a5548`
- [ ] Correct bucket name from Firebase Console
- [ ] Ran: `gsutil cors set storage.cors.json gs://YOUR_BUCKET`
- [ ] Restarted dev server and tested upload again

