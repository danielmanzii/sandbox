/* global React */
// Shared form layout primitives used across admin modules.

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>{children}</div>;
}

function Field({ label, full, children }) {
  return (
    <div style={{ flex: full ? '1 1 100%' : '1 1 0', minWidth: 140 }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spin"/></div>;
}

// Full-colour Sandbox mascot as a rounded forest tile (the PNG already has a
// forest background, so it reads as an intentional brand chip on any surface).
function Mascot({ size = 96, style }) {
  return <img src="assets/mascot-full-crisp.png" alt="" style={{ height: size, width: 'auto', borderRadius: 18, display: 'block', ...style }}/>;
}

Object.assign(window, { Row, Field, Spinner, Mascot });
