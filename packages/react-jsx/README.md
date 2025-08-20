# chess-captcha-react-jsx

A React chessboard component for chess-based CAPTCHA systems. Features interactive drag-and-drop functionality, customizable board size, and real-time move validation. Built with TypeScript, React, and chess.js.

This component is designed to work with the [chess-captcha-core](https://www.npmjs.com/package/chess-captcha-core) library, which provides the CAPTCHA puzzle generation and verification logic.


![Image](https://github.com/YusungAN/chess-captcha/blob/main/example/example.gif?raw=true)

The source code for this GIF is available in the Github repository.


## Installation

### React Component

```bash
npm i chess-captcha-react-jsx
```

## Quick Start

```tsx
import { ChessBoard } from "chess-captcha-react-jsx";

function App() {
  const [FEN, setFEN] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ); // Fetch generated FEN from your server

  const handleMove = (move: string) => {
    console.log("Player moved:", move);
    // Send user's move to your server to verify the answer
  };

  return (
    <ChessBoard
      onMove={handleMove}
      FEN={FEN}
      width={600} // Customizable board size
    />
  );
}
```

## API Reference

### ChessBoard Component

#### Props

```typescript
interface ChessBoardProps {
  onMove: (move: string) => void; // Callback when a move is made
  FEN: string; // Chess position in FEN notation
  width?: number; // Board width in pixels (default: 480)
}
```

## License

MIT
