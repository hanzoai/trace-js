import "./App.css";
import Hanzo from "hanzo";
import { useEffect, useState } from "react";

const hanzo = new Hanzo({
  publicKey: "pk-lf-1234567890",
  secretKey: "sk-lf-1234567890",
  baseUrl: "http://localhost:3000",
  flushAt: 1,
});

function App() {
  const [traceId, setTraceId] = useState("");

  useEffect(() => {
    const id = crypto.randomUUID();
    setTraceId(id);
    hanzo.trace({
      id,
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>This is an example app for testing the hanzo lib</p>
        <button
          className="Button"
          onClick={() =>
            hanzo.score({
              name: "test",
              value: 1,
              traceId,
            })
          }
        >
          Create score
        </button>
      </header>
    </div>
  );
}

export default App;
