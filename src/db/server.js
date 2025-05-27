const express = require("express");
const app = express();
const cors = require("cors");
const dbConnect = require("./dbConnect.js");
const AdminRouter = require("./routes/AdminRouter.js");
const UserRouter = require("./routes/UserRouter.js");
const PhotoRouter = require("./routes/PhotoRouter.js");
const CommentsRouter = require("./routes/CommentsRouter.js");
const path = require("path");

dbConnect();

const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

app.use("/api/admin", AdminRouter);
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);
app.use("/api/photo/commentsOfPhoto", CommentsRouter);

// Serve static files cho uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;