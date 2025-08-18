import express from "express";
import session from "express-session";
import cors from "cors";
import { ChessCaptcha } from "chess-captcha-core";

const captcha = new ChessCaptcha();

const app = express();
const port = 3000;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: "chess-captcha-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      sameSite: "lax",
      httpOnly: true,
    },
  })
);

// Parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/captcha", async (req, res) => {
  const captchaData = await captcha.getMateIn1Captcha();

  // Store captcha information in session
  req.session.captcha = captchaData;

  // Return captcha data without the solution to the client
  const clientCaptcha = {
    fen: captchaData.fen,
    // Don't include solution in response
  };

  res.json(clientCaptcha);
});

// Endpoint to verify captcha solution
app.post("/verify", async (req, res) => {
  const { solution } = req.body;
  const sessionCaptcha = req.session.captcha;

  if (!sessionCaptcha) {
    return res.status(400).json({ error: "No captcha found in session" });
  }

  const isCorrect = await captcha.verifyCaptcha(sessionCaptcha, solution);

  // Clear captcha from session after verification
  delete req.session.captcha;

  res.json({
    correct: isCorrect,
    message: isCorrect ? "Correct solution!" : "Incorrect solution. Try again.",
  });
});

app.listen(port, async () => {
  await captcha.init();
  console.log(`Example app listening on port ${port}`);
});
