import React, { useState, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import "./ChessBoard.css";

// Import chess piece images
import whitePawn from "./assets/white-pawn.png";
import blackPawn from "./assets/black-pawn.png";
import whiteKnight from "./assets/white-knight.png";
import blackKnight from "./assets/black-knight.png";
import whiteBishop from "./assets/white-bishop.png";
import blackBishop from "./assets/black-bishop.png";
import whiteRook from "./assets/white-rook.png";
import blackRook from "./assets/black-rook.png";
import whiteQueen from "./assets/white-queen.png";
import blackQueen from "./assets/black-queen.png";
import whiteKing from "./assets/white-king.png";
import blackKing from "./assets/black-king.png";

export interface ChessBoardProps {
  onMove: (move: string) => void;
  FEN: string; // Add optional initialFEN prop
  width?: number; // 체스판의 너비 (픽셀 단위)
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  onMove,
  FEN,
  width = 480,
}) => {
  const hasMoved = useRef(false);
  const [chess] = useState(() => {
    const game = new Chess();
    if (FEN) {
      try {
        game.load(FEN);
      } catch (error) {
        console.error("Invalid FEN string provided.", error);
      }
    }
    return game;
  });
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [board, setBoard] = useState(chess.board());
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // 체스판 크기 계산
  const squareSize = width / 8; // 각 칸의 크기
  const boardSize = width; // 전체 체스판 크기

  const getSquareColor = (row: number, col: number): string => {
    return (row + col) % 2 === 0 ? "white" : "black";
  };

  const getPieceImage = (piece: any): string => {
    if (!piece) return "";

    const color = piece.color === "w" ? "white" : "black";
    const type = piece.type;

    const imageMap: { [key: string]: string } = {
      p: color === "white" ? whitePawn : blackPawn,
      n: color === "white" ? whiteKnight : blackKnight,
      b: color === "white" ? whiteBishop : blackBishop,
      r: color === "white" ? whiteRook : blackRook,
      q: color === "white" ? whiteQueen : blackQueen,
      k: color === "white" ? whiteKing : blackKing,
    };

    return imageMap[type] || "";
  };

  const getSquareFromPosition = (row: number, col: number): string => {
    return (String.fromCharCode(97 + col) + (8 - row)) as any;
  };

  // const getPositionFromSquare = (
  //   square: string
  // ): { row: number; col: number } => {
  //   const col = square.charCodeAt(0) - 97;
  //   const row = 8 - parseInt(square[1]);
  //   return { row, col };
  // };

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (hasMoved.current) return;
      const square = getSquareFromPosition(row, col);

      if (selectedSquare) {
        // Try to make a move
        try {
          const move = chess.move({
            from: selectedSquare as any,
            to: square,
            promotion: "q", // Always promote to queen for simplicity
          });

          if (move) {
            console.log(`Move: ${selectedSquare} → ${square} (${move.san})`);
            setBoard(chess.board());
            onMove?.(move.san);
          }
        } catch (error) {
          // Invalid move, ignore
        }
        setSelectedSquare(null);
      } else {
        // Select a piece
        const piece = chess.get(square as any);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
        }
      }
    },
    [selectedSquare, chess, onMove]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      if (hasMoved.current) return;
      console.log("handleDragStart", row, col, getSquareFromPosition(row, col));
      const square = getSquareFromPosition(row, col);
      const piece = chess.get(square as any);

      if (piece && piece.color === chess.turn()) {
        setDraggedPiece(square);
        setSelectedSquare(square);

        // Set drag image
        if (dragRef.current) {
          e.dataTransfer.setDragImage(dragRef.current, 25, 25);
        }

        // Set drag data
        e.dataTransfer.setData("text/plain", square);
        e.dataTransfer.effectAllowed = "move";
      } else {
        e.preventDefault();
      }
    },
    [chess]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      if (hasMoved.current) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      console.log("handleDragOver", row, col, getSquareFromPosition(row, col));
      const square = getSquareFromPosition(row, col);
      setDragOverSquare(square);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (hasMoved.current) return;
    e.preventDefault();
    setDragOverSquare(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      e.preventDefault();
      if (hasMoved.current) return;

      console.log("handleDrop", row, col, getSquareFromPosition(row, col));
      const toSquare = getSquareFromPosition(row, col);
      const fromSquare = draggedPiece;

      if (fromSquare && fromSquare !== toSquare) {
        try {
          const move = chess.move({
            from: fromSquare as any,
            to: toSquare,
            promotion: "q", // Always promote to queen for simplicity
          });

          if (move) {
            console.log(`Move: ${fromSquare} → ${toSquare} (${move.san})`);
            hasMoved.current = true;
            setBoard(chess.board());
            onMove(`${fromSquare}${toSquare}`);
          }
        } catch (error) {
          // Invalid move, ignore
        }
      }

      setDraggedPiece(null);
      setSelectedSquare(null);
      setDragOverSquare(null);
    },
    [draggedPiece, chess, onMove]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedPiece(null);
    setSelectedSquare(null);
    setDragOverSquare(null);
  }, []);

  const isSquareSelected = (row: number, col: number): boolean => {
    const square = getSquareFromPosition(row, col);
    return selectedSquare === square;
  };

  const getValidMoves = (): string[] => {
    if (!selectedSquare) return [];
    return chess
      .moves({ square: selectedSquare as any, verbose: true })
      .map((move: any) => move.to);
  };

  const isValidMove = (row: number, col: number): boolean => {
    const square = getSquareFromPosition(row, col);
    return getValidMoves().includes(square);
  };

  const isDragOver = (row: number, col: number): boolean => {
    const square = getSquareFromPosition(row, col);
    return dragOverSquare === square;
  };

  return (
    <div className="chess-board">
      <div
        className="board-container"
        style={{
          width: boardSize,
          height: boardSize,
        }}
      >
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((piece, colIndex) => {
              const squareColor = getSquareColor(rowIndex, colIndex);
              const isSelected = isSquareSelected(rowIndex, colIndex);
              const isValidMoveSquare = isValidMove(rowIndex, colIndex);
              const isDragOverSquare = isDragOver(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`square ${squareColor} ${
                    isSelected ? "selected" : ""
                  } ${isValidMoveSquare ? "valid-move" : ""} ${
                    isDragOverSquare ? "drag-over" : ""
                  }`}
                  style={{
                    width: squareSize,
                    height: squareSize,
                  }}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  onDragStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                  onDragOver={(e) => handleDragOver(e, rowIndex, colIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                  onDragEnd={handleDragEnd}
                  draggable={!!(piece && piece.color === chess.turn())}
                >
                  {piece && (
                    <div
                      className={`piece ${
                        piece.color === "w" ? "white" : "black"
                      }`}
                    >
                      <img
                        src={getPieceImage(piece)}
                        alt={`${piece.color === "w" ? "white" : "black"} ${
                          piece.type
                        }`}
                        className="piece-image"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {/* Hidden drag image element */}
        <div
          ref={dragRef}
          className="drag-image"
          style={{ position: "absolute", left: "-1000px", top: "-1000px" }}
        >
          <img
            src={
              draggedPiece ? getPieceImage(chess.get(draggedPiece as any)) : ""
            }
            alt="drag"
            className="piece-image"
            style={{
              width: squareSize * 0.9,
              height: squareSize * 0.9,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
