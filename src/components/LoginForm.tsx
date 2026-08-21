"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key }) });
    if (response.ok) window.location.reload();
    else { setError("La clave no es válida."); setLoading(false); }
  }

  return <main className="login-wrap"><section className="panel login-card"><p className="eyebrow">Ofertas Radar</p><h1>Una puerta para dos.</h1><p>El radar guarda aquí las búsquedas y las ofertas que merece la pena revisar.</p><form className="form" onSubmit={submit}><label htmlFor="access-key">Clave de acceso<input id="access-key" type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} required /></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={loading}>{loading ? "Comprobando…" : "Entrar"}</button></form></section></main>;
}
