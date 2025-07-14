# 🪣 HasteBucket

**HasteBucket** is a fast and secure way to share **multiple files** and **text snippets** between devices — no sign-in required. Perfect for quick, temporary, and anonymous sharing.

## ✨ What's New

- **📂 Multi-File Upload**: You can now upload multiple files in a single bucket.
- **📊 Smarter Upload Progress**: Upload progress reflects the combined progress of all files in real time.
- **🧭 Bucket Management**: Each bucket now shows a list of uploaded files with options to:
  - View individual download links
  - Download all files at once
  - Download as a `.zip` archive
- **📤 Easy Sharing**:
  - Share via native share API
  - Copy bucket URL to clipboard
  - Generate and scan a QR code

## 🗝️ Key Features

- **Multi-File Upload**: Drag and drop multiple files for a single bucket.
- **Text Sharing**: Share notes or snippets easily.
- **Unique Buckets**: Each upload creates a unique, shareable URL.
- **Bucket Expiry**: Buckets auto-delete after 24 hours to keep data temporary.
- **Manual Deletion**: Bucket creators can manually delete their uploads.
- **No Sign-in Required**: 100% anonymous file sharing.
- **Cross-Device Sharing**: Works on phones, tablets, laptops — anywhere with a browser.

## 🔗 Use Cases

- **Quick File Transfer** between devices
- **Instant Text Sharing** with friends or coworkers
- **One-Time Access Links** for temporary downloads
- **Scan & Share** using QR codes

## ❓ How It Works

1. **Upload Files or Text**  
   Choose "File" or "Text", and drag files or paste your content.
2. **Generate Bucket**  
   A unique bucket is created, accessible via its URL.
3. **Share**  
   Use the share button, copy the link, or show a QR code.
4. **Access & Download**  
   Files can be downloaded individually or all at once as a zip.
5. **Auto-Delete in 24h**  
   All buckets expire and are deleted after 24 hours.

## 📖 Getting Started

Visit **[hastebucket.vercel.app](https://hastebucket.vercel.app)** and:

1. Select **File** or **Text** mode
2. Upload your content
3. Copy or share the bucket link
4. Done! The recipient can instantly access the files/text

## 🔒 Privacy & Security

- **No Accounts**: No sign-up, no tracking
- **Short-Lived Buckets**: All data expires after 24 hours
- **Owner Tokens**: Only the creator of a bucket (via localStorage) can delete it

## 🛠 Tech Stack

- **Next.js** with TypeScript
- **Firebase Firestore + Storage**
- **JSZip** & **FileSaver** for zip downloads
- **qrcode.react** for generating QR codes
- **Material UI + Sass** for UI/UX

## 🙋 FAQs

### Can I upload multiple files at once?
Yes! You can drag and drop several files and HasteBucket will upload them together in one bucket.

### Can I download all files at once?
Yes, you can download them individually or as a zip archive with one click.

### How do I know I’m the bucket owner?
A unique token is stored in your browser. Only you (as the original uploader) can delete the bucket.

### What if I lose the link?
We do not track or store access data. If you lose the link, it cannot be recovered.

## 🚀 Roadmap

- [ ] Optional bucket password protection
- [ ] Bucket expiration time selector
- [ ] File previews (text, image)
- [ ] Drag to reorder files pre-upload

---

HasteBucket is the most effortless way to share files and snippets across devices — no fuss, no logins, no strings attached.

👉 Try it now at [hastebucket.vercel.app](https://hastebucket.vercel.app)
