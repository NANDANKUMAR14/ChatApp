# 🔐 Secure Chat App (End-to-End Encrypted)

A modern real-time chat application built with **TypeScript** that ensures **end-to-end encryption (E2EE)** for secure communication between users.

---

## 🚀 Features

* 🔒 End-to-End Encryption (E2EE)
* 💬 Real-time messaging
* 👤 User authentication
* 📡 WebSocket-based communication
* 🔑 Secure key exchange
* 🧾 Message privacy (server cannot read messages)
* ⚡ Fast and lightweight

---

## 🧠 What is End-to-End Encryption?

End-to-End Encryption ensures that:

> Only the sender and receiver can read the messages.

* Messages are encrypted on the sender's device
* Decrypted only on the receiver's device
* Server only relays encrypted data

---

## 🛠️ Tech Stack

* **Frontend:** TypeScript, HTML, CSS
* **Backend:** Node.js, Express
* **Real-time:** WebSocket / Socket.io
* **Encryption:** Web Crypto API / crypto module

---

## 🔐 Encryption Flow

1. User generates a **public-private key pair**
2. Public keys are exchanged between users
3. Messages are encrypted using recipient's public key
4. Only recipient can decrypt using private key

---

## 📁 Project Structure


## ⚙️ Installation

```bash
# Clone repo
git clone https://github.com/NANDANKUMAR14/chat-app.git

# Go to project
cd chat-app

# Install dependencies
npm install
```

---

## ▶️ Run the App

```bash
# Start server
npm run server

# Start client
npm run client
```

---

## 🌐 Production Deployment (Vercel + Render + MongoDB Atlas)

This project is configured to run with:

* Frontend on **Vercel**
* Backend + Socket.IO on **Render**
* Database on **MongoDB Atlas**

### 1. Deploy Backend on Render

1. Push the repository to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Set **Root Directory** to `backend`.
4. Set commands:
  * **Build Command:** `npm install && npm run build`
  * **Start Command:** `npm run start`
5. Add backend environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=https://your-frontend.vercel.app
```

Notes:

* `CLIENT_URL` must be your exact Vercel frontend URL.
* You can provide multiple frontend origins with commas if needed.

### 2. Deploy Frontend on Vercel

1. Create a new Vercel project from the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Build settings:
  * **Build Command:** `npm run build`
  * **Output Directory:** `dist`
4. Add frontend environment variables:

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

Replace the domain above if your Render URL changes.

### 3. MongoDB Atlas Setup

1. Create a cluster in MongoDB Atlas.
2. Add a database user and password.
3. In **Network Access**, allow Render outbound IPs or use `0.0.0.0/0` for quick setup.
4. Copy the connection string and set it as `MONGO_URI` in Render.

### 4. Verify After Deployment

1. Open the Vercel app and register/login.
2. Confirm API requests go to Render (`/api/...`).
3. Open the app in two browsers and verify real-time messaging works.
4. Confirm no CORS errors in browser console.

---

## 🔑 Example Encryption Code (TypeScript)

```ts
async function encryptMessage(message: string, publicKey: CryptoKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  return await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    data
  );
}
```

---

## 📦 Example Decryption

```ts
async function decryptMessage(cipher: ArrayBuffer, privateKey: CryptoKey) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    cipher
  );

  return new TextDecoder().decode(decrypted);
}
```

---

## ⚠️ Security Notes

* Never expose private keys
* Use HTTPS in production
* Implement secure key storage
* Consider forward secrecy (Diffie-Hellman)

---

## 🧪 Future Improvements

* 🟢 Group chat encryption
* 🟢 File sharing with encryption
* 🟢 Offline message sync
* 🟢 Mobile support
  
---

## 👨‍💻 Contributers

* Abhishek Adiga TR
* Nandankumar 
