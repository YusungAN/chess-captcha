import { Chess, PieceSymbol, Color, Square, validateFen } from "chess.js";
import { getRandomInt } from "./util";
import path from "path";

const loadEngine = require("./loadEngine.cjs");
const foundStockfishPath = require.resolve("stockfish/package.json");
const stockfishRootDir = path.dirname(foundStockfishPath);

const stockfish_path = path.join(
  stockfishRootDir,
  "src",
  "stockfish-nnue-16.js"
);

const engine = loadEngine(stockfish_path);

async function stopEngine() {
  return new Promise((resolve, _) => {
    engine.send("stop", function onDone(data: string) {
      resolve(data);
    });
  });
}

async function getMateIn25lowerFen(fen: string): Promise<string> {
  return new Promise((resolve, _) => {
    let resolved = false;
    let checkmateMoves: string[] = [];
    let checkMateGame: Chess = new Chess();

    engine.send("ucinewgame");
    engine.send("isready", function onDone() {
      engine.send("position fen " + fen);
      engine.send(
        "go mate 25",
        function onDone() {
          checkMateGame = new Chess(fen);
          checkmateMoves.forEach((move) => {
            checkMateGame.move({
              from: move.slice(0, 2),
              to: move.slice(2, 4),
            });
          });
          if (checkMateGame.isCheckmate()) {
            checkMateGame.undo();
          }
          resolve(checkMateGame.fen());
        },
        function onStream(data: string) {
          if (resolved) return;
          if (data.includes("mate")) {
            const parts = data.split(" ");
            const cpIndex = parts.indexOf("mate");
            let mateValue = 1000;
            if (cpIndex !== -1) {
              mateValue = parseInt(parts[cpIndex + 1], 10);
            }
            if (Math.abs(mateValue) <= 25) {
              checkmateMoves = data.split(" pv")[1].trim().split(" ");
              checkMateGame = new Chess(fen);
              checkmateMoves.forEach((move) => {
                checkMateGame.move({
                  from: move.slice(0, 2),
                  to: move.slice(2, 4),
                });
              });
              if (checkMateGame.isCheckmate()) {
                checkMateGame.undo();
              }
              resolve(checkMateGame.fen());
              resolved = true;
              return;
            }
          }
          if (data.includes(" pv")) {
            checkmateMoves = data.split(" pv")[1].trim().split(" ");
          }
        }
      );
    });
  });
}

async function findBestMove(fen: string): Promise<string> {
  return new Promise((resolve, _) => {
    engine.send("ucinewgame");
    engine.send("isready", function onDone(data: string) {
      engine.send("position fen " + fen);
      engine.send("go depth 15", function onDone(data: string) {
        if (data.includes("bestmove")) {
          const move = data.split("bestmove")[1].trim();
          resolve(move);
        }
      });
    });
  });
}

export interface PieceConfig {
  type: PieceSymbol;
  color: Color;
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Generate a random simple position with the given pieces and turn
 * @param piecesToPlace - The pieces to place on the board.
 * @param options - Additional options for generation
 * @returns The FEN string of a valid position or null if generation fails
 */
function genRandomSimplePosition(
  piecesToPlace: PieceConfig[],
  options: { turn: "w" | "b" }
): string | null {
  const { turn = "w" } = options;

  // Since chess rules require both kings, they are automatically added
  const fullPieceList: PieceConfig[] = [
    ...piecesToPlace,
    { type: "k", color: "w" },
    { type: "k", color: "b" },
  ];

  if (fullPieceList.length > 64) {
    throw new Error(
      "Failed to generate random simple position. There are too many pieces in piecesToPlace."
    );
  }

  // Generate a list of all 64 squares
  const allSquares: Square[] = [];
  for (let i = 0; i < 8; i++) {
    for (const f of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      allSquares.push(`${f}${i + 1}` as Square);
    }
  }

  const chess = new Chess();

  for (let attempt = 0; attempt < 1000; attempt++) {
    chess.clear(); // Initialize the board

    const shuffledSquares = shuffle(allSquares);

    // Place all pieces randomly on the board
    for (let i = 0; i < fullPieceList.length; i++) {
      chess.put(fullPieceList[i], shuffledSquares[i]);
    }

    // Generate FEN and validate
    const positionFen = chess.fen().split(" ")[0];
    const finalFen = `${positionFen} ${turn} - - 0 1`;
    const finalFen2 = `${positionFen} ${turn === "w" ? "b" : "w"} - - 0 1`;
    const tempGame = new Chess(finalFen2);

    const validation = validateFen(finalFen);
    if (
      validation.ok &&
      !chess.isCheckmate() &&
      !chess.isStalemate() &&
      !chess.inCheck() &&
      !tempGame.inCheck()
    ) {
      return finalFen; // Return FEN if successful
    }
  }

  throw new Error(
    "Failed to generate random simple position. Please try again."
  );
}

function genRandomPiecesToPlace(colorToWin: "w" | "b"): PieceConfig[] {
  const minorPiecesList: PieceSymbol[] = ["n", "b"];
  const majorPiecesList: PieceSymbol[] = ["r", "q"];
  const piecesToPlace: PieceConfig[] = [];
  const countForWin = getRandomInt(2, 4);
  const countForWinMajor = getRandomInt(1, 2);

  for (let i = 0; i < countForWin; i++) {
    if (i < countForWinMajor) {
      piecesToPlace.push({
        type: majorPiecesList[getRandomInt(0, 1)],
        color: colorToWin,
      });
    } else {
      piecesToPlace.push({
        type: minorPiecesList[getRandomInt(0, 1)],
        color: colorToWin,
      });
    }
  }
  return piecesToPlace;
}

export async function getRandomMateIn1Fen(
  pieces?: PieceConfig[],
  colorToWin?: "w" | "b"
): Promise<{ fen: string; answer: string }> {
  try {
    colorToWin = colorToWin || getRandomInt(0, 1) == 0 ? "w" : "b";
    const randomFen = genRandomSimplePosition(
      pieces || genRandomPiecesToPlace(colorToWin),
      { turn: colorToWin }
    );

    if (randomFen) {
      const game = new Chess(randomFen);

      for (const move of game.moves({ verbose: true })) {
        try {
          const afterMoveGame = new Chess(move.after);

          if (afterMoveGame.isCheckmate()) {
            return { fen: randomFen, answer: `${move.from}${move.to}` };
          }
        } catch (e) {}
      }

      let checkMateGame: Chess = new Chess();
      const mateIn25lowerFen = await getMateIn25lowerFen(randomFen);

      checkMateGame = new Chess(mateIn25lowerFen);

      const turnCheckArray = mateIn25lowerFen.split(" ");
      if (
        ((turnCheckArray[0].includes("r") || turnCheckArray[0].includes("q")) &&
          turnCheckArray[1] === "w") ||
        ((turnCheckArray[0].includes("R") || turnCheckArray[0].includes("Q")) &&
          turnCheckArray[1] === "b")
      ) {
        const moves = checkMateGame.moves({ verbose: true });
        checkMateGame.move({
          from: moves[0].from,
          to: moves[0].to,
        });
      }

      // check this state is mate in 1
      for (const move of checkMateGame.moves({ verbose: true })) {
        try {
          const afterMoveGame = new Chess(move.after);
          if (afterMoveGame.isCheckmate()) {
            return { fen: mateIn25lowerFen, answer: `${move.from}${move.to}` };
          }
        } catch (e) {}
      }
      const moveStack: string[] = [];
      while (!checkMateGame.isCheckmate()) {
        const bestMove = await findBestMove(checkMateGame.fen());
        checkMateGame.move({
          from: bestMove.slice(0, 2),
          to: bestMove.slice(2, 4),
        });
        moveStack.push(bestMove);
      }
      checkMateGame.undo();
      const answer = moveStack[moveStack.length - 1];

      // CAUTION: uniqueness of the answer is not guaranteed
      return { fen: checkMateGame.fen(), answer: answer };
    }
  } catch (e) {
    await stopEngine();
    return { fen: "", answer: "" };
  }

  return { fen: "", answer: "" };
}
