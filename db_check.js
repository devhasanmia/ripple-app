const mongoose = require("mongoose");
const MONGODB_URI = "mongodb+srv://devhasanmia:VTrhIIb1Je1gkCgA@ripple.dspfs1t.mongodb.net/ripple?retryWrites=true&w=majority";

const messageSchema = new mongoose.Schema({
  partnerId: String,
  senderId: String,
  type: String,
  text: String,
  timestamp: String,
});

const Message = mongoose.model("Message", messageSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
  const messages = await Message.find({});
  console.log("Total messages in DB:", messages.length);
  console.log(JSON.stringify(messages, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
