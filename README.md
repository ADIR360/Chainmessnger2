# 📡 ChainMessenger — Decentralized Chat App using XMTP

ChainMessenger is a secure, blockchain-powered messaging app built with [XMTP](https://xmtp.org/), enabling wallet-to-wallet communication without centralized servers. Think of it as the WhatsApp of Web3 — where your Ethereum wallet is your chat identity.

![ChainMessenger](https://miro.medium.com/v2/resize:fit:1200/1*GGhLSOXBzyCAAcxfs2c02w.png)

---

## 🌐 Features

- 🔐 **End-to-End Encryption** via XMTP protocol
- 🦊 **MetaMask Login** with wallet-based authentication
- ☁️ **Decentralized Message Storage** on XMTP Light Push Nodes
- 💬 **Private Wallet-to-Wallet Messaging**
- 📡 **Web3-native chat** across any dApp

---

## 🛠 Tech Stack

| Layer       | Tech                  |
|------------|------------------------|
| Frontend   | React.js               |
| Wallet     | MetaMask               |
| Messaging  | XMTP Protocol          |
| Encryption | XMTP E2E encryption    |
| Backend    | XMTP Nodes (decentralized) |
| Optional   | Firebase (analytics, backup) |

---

## 📦 How It Works

```
User (Wallet) ──> Signs in via MetaMask
               └─> Connects to XMTP client
Send Message ──> Encrypted with recipient's public key
               └─> Stored in XMTP Light Push Node
Receiver      ──> Fetches and decrypts using private key
```

🔐 **Authentication**
* No username/password.
* On login, users sign a one-time message via MetaMask.
* XMTP verifies ownership of the wallet address.

```javascript
const wallet = await getSigner();
const xmtp = await Client.create(wallet); // Initializes secure identity
```

📤 **Message Flow & Storage**
1. User types a message.
2. XMTP encrypts it locally using the receiver's public key.
3. It is sent to a **Light Push Node** — decentralized storage nodes.
4. Message is stored in encrypted form in a LevelDB-like KV store.
5. Only the receiver with the private key can decrypt and read it.
   Even XMTP node operators can't access the content!

📥 **Message Retrieval**
* When the user opens the app, XMTP fetches encrypted messages.
* Messages are decrypted on-device using the wallet's private key.
* Works across devices if the same wallet is connected.

---

## 🚀 Future Enhancements

* 🧑‍🤝‍🧑 Group chats with shared encryption keys
* 📁 File sharing with encryption
* 🧬 Lens Protocol/ENS integration for human-readable usernames
* 🔄 Cross-device session sync
* 🌍 IPFS backups for persistent decentralized storage

---

## 🧪 Demo

*Login with your MetaMask wallet and start chatting anonymously and securely.*

---

## 📂 Folder Structure

```
📁 ChainMessenger/
├── 📁 public/
├── 📁 src/
│   ├── App.jsx
│   ├── components/
│   └── xmtp/
├── .env
├── package.json
└── README.md
```

---

## 📄 License

MIT License © 2025 ChainMessenger Team

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first to discuss.
