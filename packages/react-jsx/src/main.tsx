import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ChessBoard from "./ChessBoard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChessBoard
      onMove={(move) => console.log("Move:", move)}
      FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      width={600}
    />
  </StrictMode>
);
