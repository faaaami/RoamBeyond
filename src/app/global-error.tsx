"use client";

/**
 * Replaces the root layout when the layout itself crashes. It renders its own
 * document without the site's stylesheet or fonts, so styles are inline.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#fcf9f1",
          color: "#12291e",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <title>Something went wrong</title>
        <main role="alert" style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 64, fontWeight: 800, margin: 0, color: "#1f5a3d" }}>Oops</p>
          <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>Something went wrong</h1>
          <p style={{ fontSize: 18, color: "#4b5d52", margin: 0 }}>
            The website could not load. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 28,
              minHeight: 48,
              padding: "0 28px",
              border: 0,
              borderRadius: 8,
              background: "#1f5a3d",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {digest && <p style={{ marginTop: 28, fontSize: 14, color: "#4b5d52" }}>Reference: {digest}</p>}
        </main>
      </body>
    </html>
  );
}
