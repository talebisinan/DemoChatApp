const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");

const keys = require("./keys");

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const dbUrl = keys.DB_URL;

const Message = mongoose.model("Message", {
  name: String,
  message: String
});

app.get("/messages", (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  });
});

app.get("/messages/:user", (req, res) => {
  const user = req.params.user;
  Message.find({ name: user }, (err, messages) => {
    res.send(messages);
  });
});

app.post("/messages", async (req, res) => {
  try {
    const message = new Message(req.body);

    const savedMessage = await message.save();

    const censored = await Message.findOne({ message: "badword" });

    if (censored) await Message.remove({ _id: censored.id });
    else io.emit("message", req.body);

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  }
});

io.on("connection", socket => {
  console.log("a user connected");
});

mongoose.connect(dbUrl, { useMongoClient: true }, err => {
  console.log("mongo db connection", err);
});

var server = http.listen(3001, () => {
  console.log("server is listening on port", server.address().port);
});
