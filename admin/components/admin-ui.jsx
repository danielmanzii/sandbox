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

Object.assign(window, { Row, Field, Spinner });
