# chess-captcha-core

A chess-based CAPTCHA library that generates mate-in-1 puzzles using Stockfish engine. Built with TypeScript, React, and chess.js.
For the React chessboard component for this CAPTCHA, see [chess-captcha-react-jsx](https://www.npmjs.com/package/chess-captcha-react-jsx)

![Image](https://github.com/YusungAN/chess-captcha/blob/main/example/example.gif?raw=true)

The source code for this GIF is available in the Github repository.

## Installation

```bash
npm i chess-captcha-core
```

## Quick Start

### Core CAPTCHA Engine

```typescript
import { ChessCaptcha } from "chess-captcha-core";

// Create a captcha instance
const captcha = new ChessCaptcha({
  queueCapacity: 3, // Number of pre-generated puzzles
  expirationTime: 180, // Expiration time in seconds
});

// Initialize the puzzle queue
await captcha.init();

// Get a puzzle for the user
const puzzle = await captcha.getMateIn1Captcha();
console.log("Puzzle FEN:", puzzle.fen);
console.log("Expires at:", new Date(puzzle.expireAt));

// Verify user's answer (e.g., "e2e4")
const isCorrect = await captcha.verifyCaptcha(puzzle, "e2e4");
console.log("Answer correct:", isCorrect);
```

### Using Pre-generated Puzzles

```typescript
// Load puzzles from CSV file
const captcha = new ChessCaptcha({
  filename: "path/to/puzzles.csv", // CSV file with FEN strings
  expirationTime: 300,
});

await captcha.init(); // Loads puzzles from CSV
```

## API Reference


### ChessCaptcha Class

#### Constructor

```typescript
new ChessCaptcha(config?: Partial<CaptchaConfig>)
```

**Configuration Options:**

- `queueCapacity`: Number of pre-generated puzzles (default: 3)
- `expirationTime`: Puzzle expiration time in seconds (default: 180)
- `filename`: Path to CSV file with pre-generated FEN strings (optional)

#### Methods

##### `init(): Promise<void>`

Initialize the puzzle queue. If `filename` is provided, loads puzzles from CSV file. Otherwise, generates puzzles using Stockfish engine.

##### `getMateIn1Captcha(): Promise<CaptchaResult>`

Get a mate-in-1 puzzle. Returns a promise that resolves to:

```typescript
{
  fen: string; // Chess position in FEN notation
  expireAt: number; // Expiration timestamp
}
```

**Note**: A generated puzzle may have more than one valid solution.

##### `verifyCaptcha(secret: CaptchaSecret, answer: string): Promise<boolean>`

Verify a user's answer. Returns `true` if the answer is correct and not expired.

**Parameters:**

- `secret`: The puzzle secret returned by `getMateIn1Captcha()`
- `answer`: The move in format "e2e4" (from square + to square)

## CSV File Format

When using pre-generated puzzles, provide a CSV file with the following format:

```csv
fen,description
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,Starting position
r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1,After 1.e4 Nc6
```

Only the first column (FEN) is required. Additional columns are ignored.

## License

MIT
