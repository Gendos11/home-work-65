require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const connectDatabase = require("./config/database");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const usersRoutes = require("./routes/users");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true" ? true : "auto",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running.",
    authenticated: Boolean(req.isAuthenticated && req.isAuthenticated())
  });
});

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/users", usersRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

async function startServer() {
  try {
    await connectDatabase();
    // eslint-disable-next-line no-console
    console.log("MongoDB Atlas connected.");

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
