import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <section style={{ textAlign: "center" }}>
        <h1>React + TypeScript</h1>
        <p>Your browser IDE starter project is working.</p>

        <button
          onClick={() => setCount((value) => value + 1)}
          style={{
            padding: "10px 18px",
            marginTop: "16px",
            cursor: "pointer",
          }}
        >
          Count: {count}
        </button>
      </section>
    </main>
  );
}
