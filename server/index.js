require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

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

// Users status store (remains in-memory since status toggling is ephemeral)
const onlineStatus = {
  "me": true,
  "daniel-mercer": true,
  "jessie-winfield": true,
  "joseph-harvell": true,
  "helen-eberle": true,
  "charles-davis": true,
  "sean-higdon": true,
};

// HTTP REST Endpoints
app.get("/api/messages/:partnerId", async (req, res) => {
  const { partnerId } = req.params;
  try {
    const msgs = await Message.find({
      $or: [
        { senderId: "me", partnerId: partnerId },
        { senderId: partnerId, partnerId: "me" }
      ]
    }).sort({ _id: 1 });
    res.json(msgs);
  } catch (err) {
    console.error("Error fetching messages:", err);
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
      console.log("Received WebSocket event:", parsed);

      // Handle custom client actions and broadcast them
      if (parsed.type === "TYPING_STATUS" || parsed.type === "ONLINE_STATUS") {
        broadcast(parsed);
      }
    } catch (err) {
      console.error("Error processing websocket message:", err);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected.");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ripple Server running on http://localhost:${PORT}`);
});
