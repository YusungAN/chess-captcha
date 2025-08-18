import { useState, useEffect, useRef } from "react";
import { ChessBoard } from "chess-captcha-react-jsx";
import "./App.css";

const YOUR_SERVER_URL = "http://localhost:3000";

function App() {
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (isLoading || captcha) return;

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    fetch(`${YOUR_SERVER_URL}/captcha`, {
      credentials: "include",
      signal: abortControllerRef.current.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setCaptcha(data.fen);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch captcha:", error);
        }
        setIsLoading(false);
      });

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isLoading, captcha]);

  const handleMove = async (move: string) => {
    const response = await fetch(`${YOUR_SERVER_URL}/verify`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ solution: move }),
    });
    const data = await response.json();
    setHasVerified(data.correct);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Chess Captcha Example</h1>
        <p>Checkmate the opponent to verify your identity.</p>
      </header>
      <main>
        {(isLoading || !captcha) && (
          <div>Loading chess captcha...</div>
        )}
        {captcha && (
          <div style={{ width: "300px" }}>
            <ChessBoard onMove={handleMove} FEN={captcha} width={480} />
          </div>
        )}
      </main>
      {hasVerified && <div className="verified">Verified!</div>}
      {!hasVerified && <div className="verified">Not verified!</div>}
    </div>
  );
}

export default App;
