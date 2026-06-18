require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "your_api_key" &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== "your_api_secret";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary configured successfully.");
} else {
  console.log("Cloudinary credentials missing or default placeholder. Falling back to base64/default avatars.");
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ripple";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB database successfully!");
    seedInitialUsers().catch(console.error);

    // Wipes all previously seeded messages once on startup to ensure a clean slate.
    // You can comment/remove this line after the first run to persist your new chat logs.
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Message Schema
const messageSchema = new mongoose.Schema({
  partnerId: { type: String, required: true },
  senderId: { type: String, required: true },
  type: { type: String, required: true, enum: ["text", "voice"] },
  text: String,
  waveformType: Number,
  timestamp: { type: String, required: true },
  showAvatar: Boolean,
});

// Map Mongoose _id to standard id to maintain frontend compatibility
messageSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Message = mongoose.model("Message", messageSchema);

// Define User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  pin: { type: String },
  avatar: { type: String, required: true },
  ringColor: { type: String, required: true },
  lastSeen: { type: String, default: "Active Now" },
  unreadCount: { type: Number, default: 0 },
  lastMessage: { type: String, default: "" },
  date: { type: String, default: "" },
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model("User", userSchema);

// Define ChatRequest Schema
const chatRequestSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  status: { type: String, required: true, enum: ["pending", "accepted", "declined", "cancelled"], default: "pending" },
}, { timestamps: true });

chatRequestSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);

// Message Seeder (Disabled so chat room starts empty)
async function seedInitialMessages() {
  // No initial seeding
}

// User Seeder
async function seedInitialUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log("No users found in database. Seeding initial users...");
    const initialUsers = [
      {
        id: "me",
        name: "David",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        ringColor: "#a133b2",
        lastSeen: "Active Now",
        unreadCount: 0,
        lastMessage: "",
        date: "",
      },
      {
        id: "daniel-mercer",
        name: "Daniel Mercer",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
        ringColor: "#a133b2",
        lastSeen: "Active Now",
        unreadCount: 2,
        lastMessage: "Hi, David. Hope you're doing....",
        date: "05 Jan",
      }
    ];
    await User.insertMany(initialUsers);
    console.log("Database successfully seeded with users.");
  }
}

// Online presence: Map of userId -> Set of connected WebSocket clients
// Using a Set so multiple tabs/devices work correctly
const userSockets = new Map(); // userId -> Set<ws>

function setUserOnline(userId, ws) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(ws);
  // Tag the socket so we can find userId on close
  ws._userId = userId;
}

function setUserOffline(ws) {
  const userId = ws._userId;
  if (!userId) return;
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      userSockets.delete(userId);
      // Broadcast offline to everyone
      broadcast({ type: "ONLINE_STATUS", userId, isOnline: false });
      console.log(`User ${userId} is now offline`);
    }
  }
}

function isUserOnline(userId) {
  const sockets = userSockets.get(userId);
  return sockets && sockets.size > 0;
}

// HTTP REST Endpoints
app.get("/api/messages/:partnerId", async (req, res) => {
  const { partnerId } = req.params;
  const currentUserId = req.query.currentUserId || "me";
  try {
    const msgs = await Message.find({
      $or: [
        { senderId: currentUserId, partnerId: partnerId },
        { senderId: partnerId, partnerId: currentUserId }
      ]
    }).sort({ _id: 1 });
    res.json(msgs);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Profile Update Endpoint
app.post("/api/profile/update", async (req, res) => {
  const { userId, name, username, pin, avatarBase64 } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if new username is already taken by another user
    if (username && username.toLowerCase() !== user.username) {
      const existing = await User.findOne({ username: username.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }
      user.username = username.toLowerCase();
    }

    if (name) user.name = name;
    if (pin) user.pin = pin;

    // Handle avatar upload to Cloudinary if base64 is provided
    if (avatarBase64) {
      if (isCloudinaryConfigured) {
        try {
          // Cloudinary accepts base64 data URIs natively
          const uploadRes = await cloudinary.uploader.upload(avatarBase64, {
            folder: "ripple_profiles",
            resource_type: "image",
          });
          user.avatar = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload error:", uploadErr);
          // Fallback to saving base64 directly on failure
          user.avatar = avatarBase64;
        }
      } else {
        // Fallback: Store the base64 string directly
        user.avatar = avatarBase64;
      }
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Authentication Endpoints
app.post("/api/auth/register", async (req, res) => {
  const { name, username, pin } = req.body;
  if (!name || !username || !pin) {
    return res.status(400).json({ error: "Missing name, username, or pin" });
  }

  try {
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Auto-generate premium avatar and ring color
    const randomNum = Math.floor(Math.random() * 1000);
    const avatar = `https://images.unsplash.com/photo-${randomNum % 2 === 0 ? "1535713875002-d1d0cf377fde" : "1539571696357-5a69c17a67c6"}?auto=format&fit=crop&w=150&q=80`;
    const ringColors = ["#a133b2", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
    const ringColor = ringColors[Math.floor(Math.random() * ringColors.length)];

    const id = new mongoose.Types.ObjectId().toString();

    const newUser = new User({
      id,
      name,
      username: username.toLowerCase(),
      pin,
      avatar,
      ringColor,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) {
    return res.status(400).json({ error: "Missing username or pin" });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase(), pin });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or PIN" });
    }
    res.json(user);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Chat Request and Discovery Endpoints
app.get("/api/users/explore/:currentUserId", async (req, res) => {
  const { currentUserId } = req.params;
  try {
    // Find all chat requests related to current user
    const requests = await ChatRequest.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    });

    // Extract list of user IDs that already have a request/friend relationship
    const relatedUserIds = new Set();
    relatedUserIds.add(currentUserId);
    relatedUserIds.add("me"); // Exclude the default demo user "me"

    // Only exclude users that have a non-cancelled relationship
    requests.filter(r => r.status !== "cancelled").forEach(reqObj => {
      relatedUserIds.add(reqObj.senderId);
      relatedUserIds.add(reqObj.receiverId);
    });

    // Find all users who are not in the relatedUserIds set
    const users = await User.find({
      id: { $not: { $in: Array.from(relatedUserIds) } }
    });

    res.json(users);
  } catch (err) {
    console.error("Error fetching explore users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/requests/send", async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: "Missing senderId or receiverId" });
  }

  try {
    const existing = await ChatRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: "Request already exists" });
    }

    const newRequest = new ChatRequest({
      senderId,
      receiverId,
      status: "pending"
    });

    await newRequest.save();

    broadcast({
      type: "REQUEST_UPDATE",
      receiverId,
      senderId,
      status: "pending",
      requestId: newRequest.id
    });

    res.status(201).json(newRequest);
  } catch (err) {
    console.error("Error sending chat request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/requests/pending/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await ChatRequest.find({ receiverId: userId, status: { $in: ["pending", "accepted"] } }).sort({ updatedAt: -1 });
    const senderIds = requests.map(r => r.senderId);
    const senders = await User.find({ id: { $in: senderIds } });

    const requestData = requests.map(reqObj => {
      const sender = senders.find(s => s.id === reqObj.senderId);
      return {
        id: reqObj.id,
        senderId: reqObj.senderId,
        receiverId: reqObj.receiverId,
        status: reqObj.status,
        senderName: sender ? sender.name : "Unknown User",
        senderAvatar: sender ? sender.avatar : "",
        updatedAt: reqObj.updatedAt,
      };
    });

    res.json(requestData);
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/requests/sent/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await ChatRequest.find({ senderId: userId, status: { $in: ["pending", "accepted", "cancelled"] } }).sort({ updatedAt: -1 });
    const receiverIds = requests.map(r => r.receiverId);
    const receivers = await User.find({ id: { $in: receiverIds } });

    const requestData = requests.map(reqObj => {
      const receiver = receivers.find(r => r.id === reqObj.receiverId);
      return {
        id: reqObj.id,
        senderId: reqObj.senderId,
        receiverId: reqObj.receiverId,
        status: reqObj.status,
        receiverName: receiver ? receiver.name : "Unknown User",
        receiverAvatar: receiver ? receiver.avatar : "",
        updatedAt: reqObj.updatedAt,
      };
    });

    res.json(requestData);
  } catch (err) {
    console.error("Error fetching sent requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/requests/respond", async (req, res) => {
  const { requestId, status } = req.body;
  if (!requestId || !status || !["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    const request = await ChatRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    request.status = status;
    await request.save();

    broadcast({
      type: "REQUEST_UPDATE",
      receiverId: request.receiverId,
      senderId: request.senderId,
      status: status,
      requestId: request.id
    });

    res.json(request);
  } catch (err) {
    console.error("Error responding to chat request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/requests/cancel", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }
  try {
    const request = await ChatRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    request.status = "cancelled";
    await request.save();

    broadcast({
      type: "REQUEST_UPDATE",
      senderId: request.senderId,
      receiverId: request.receiverId,
    });

    res.json({ message: "Request cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/requests/resend", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId" });
  }
  try {
    const request = await ChatRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    if (request.status !== "cancelled") {
      return res.status(400).json({ error: "Only cancelled requests can be re-sent" });
    }
    request.status = "pending";
    await request.save();

    broadcast({
      type: "REQUEST_UPDATE",
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: "pending",
      requestId: request.id
    });

    res.json(request);
  } catch (err) {
    console.error("Error re-sending request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/chats/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const chats = await ChatRequest.find({
      $or: [
        { senderId: userId, status: "accepted" },
        { receiverId: userId, status: "accepted" }
      ]
    });

    const friendIds = chats.map(c => c.senderId === userId ? c.receiverId : c.senderId);
    const users = await User.find({ id: { $in: friendIds } });

    res.json(users);
  } catch (err) {
    console.error("Error fetching chats list:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({ id: { $ne: "me" } });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/me", async (req, res) => {
  try {
    const me = await User.findOne({ id: "me" });
    res.json(me);
  } catch (err) {
    console.error("Error fetching my profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/messages", async (req, res) => {
  const { partnerId, senderId, type, text, waveformType, timestamp } = req.body;
  if (!partnerId || !senderId) {
    return res.status(400).json({ error: "Missing partnerId or senderId" });
  }

  try {
    const newMsg = new Message({
      partnerId,
      senderId,
      type,
      text,
      waveformType,
      timestamp,
    });

    const savedMsg = await newMsg.save();

    // Broadcast new message to all WebSocket clients
    broadcast({
      type: "NEW_MESSAGE",
      partnerId,
      message: savedMsg,
    });

    res.status(201).json(savedMsg);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create HTTP Server
const server = http.createServer(app);

// Integrate WebSocket Server
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const messageStr = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(messageStr);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("WebSocket client connected.");

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === "REGISTER" && parsed.userId) {
        // Client announces which user they are
        setUserOnline(parsed.userId, ws);
        broadcast({ type: "ONLINE_STATUS", userId: parsed.userId, isOnline: true });
        console.log(`User ${parsed.userId} registered as online`);
      } else if (parsed.type === "TYPING_STATUS") {
        broadcast(parsed);
      } else if (parsed.type === "ONLINE_STATUS") {
        // Legacy manual toggle — still support it
        broadcast(parsed);
      }
    } catch (err) {
      console.error("Error processing websocket message:", err);
    }
  });

  ws.on("close", () => {
    setUserOffline(ws);
    console.log("WebSocket client disconnected.");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ripple Server running on http://localhost:${PORT}`);
});
