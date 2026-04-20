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

Abhishek Adiga TR
Nandankumar 
