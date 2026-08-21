"use client";

import { useState } from "react";
import { demoOffers, demoSearches } from "@/lib/demo-data";
import type { Offer, Search } from "@/lib/types";

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function RadarDashboard({ initialSearches = demoSearches, initialOffers = demoOffers, offersPage = 1, offersPageCount = 1, offersTotal = initialOffers.length, demoMode = false }: { initialSearches?: Search[]; initialOffers?: Offer[]; offersPage?: number; offersPageCount?: number; offersTotal?: number; demoMode?: boolean }) {
  const [searches, setSearches] = useState(initialSearches);
  const [showForm, setShowForm] = useState(false);

  function toggleSearch(id: string) {
    setSearches((current) => current.map((search) => search.id === id ? { ...search, active: !search.active } : search));
  }

  return <main className="shell"><header className="topbar"><div className="brand"><span className="brand-mark" aria-hidden="true" />Ofertas Radar</div><div className="topbar-meta">{demoMode ? "Modo demo · configura Postgres" : "Próxima revisión · hoy a las 07:00"}</div></header><div className="content"><section className="intro"><div><p className="eyebrow">Un filtro entre tú y el ruido</p><h1>Encontrar la oferta adecuada también se puede automatizar.</h1></div><p className="intro-copy">Describe lo que necesitáis. El radar buscará novedades, comparará el contexto y os escribirá solo cuando encuentre algo que encaje.</p></section><div className="dashboard-grid"><section><div className="section-heading"><div><h2>Mis búsquedas</h2><p>{searches.filter((search) => search.active).length} activas · historial conservado</p></div><button className="primary-button" onClick={() => setShowForm((value) => !value)}>{showForm ? "Cerrar" : "Nueva búsqueda"}</button></div>{showForm && <SearchForm demoMode={demoMode} onCreated={(search) => { setSearches((current) => [search, ...current]); setShowForm(false); }} />}<div className="panel search-list">{searches.length === 0 ? <div className="empty"><strong>Aún no hay búsquedas.</strong>Describe la primera necesidad para que el worker pueda rastrearla.</div> : searches.map((search) => <article className="search-row" key={search.id}><div><h3>{search.title}</h3><p>{search.prompt}</p><div className="row-meta"><span className={`status ${search.active ? "active" : ""}`}>{search.active ? "Activa" : "Pausada"}</span><span className="tag">{search.category}</span>{search.size && <span className="tag">{search.size}</span>}{search.minimumQuantity && <span className="tag">Desde {search.minimumQuantity} uds.</span>}</div></div><button className="row-action" onClick={() => toggleSearch(search.id)}>{search.active ? "Pausar" : "Activar"}</button></article>)}</div></section><aside><div className="section-heading"><div><h2>Últimas señales</h2><p>{offersTotal} {offersTotal === 1 ? "novedad verificada" : "novedades verificadas"}</p></div></div><div className="panel panel-pad">{initialOffers.length === 0 ? <div className="empty"><strong>Aún no hay señales.</strong>{demoMode ? " Configura la base de datos para cargar ofertas reales." : " El worker mostrará aquí las próximas ofertas válidas."}</div> : <><div className="offer-list">{initialOffers.map((offer) => <article className="offer" key={offer.id}><div className="offer-top"><h3>{offer.title}</h3><span className="offer-price">{offer.priceCents ? euro.format(offer.priceCents / 100) : "Consultar"}</span></div><p>{offer.relevanceReason}</p><a href={offer.url} target="_blank" rel="noreferrer">Ver oferta en {offer.retailer} ↗</a></article>)}</div>{offersPageCount > 1 && <nav className="pagination" aria-label="Paginación de señales"><a className={offersPage === 1 ? "disabled" : ""} href={offersPage > 1 ? `?signalsPage=${offersPage - 1}` : undefined} aria-disabled={offersPage === 1}>‹ Anteriores</a><span>Página {offersPage} de {offersPageCount}</span><a className={offersPage === offersPageCount ? "disabled" : ""} href={offersPage < offersPageCount ? `?signalsPage=${offersPage + 1}` : undefined} aria-disabled={offersPage === offersPageCount}>Siguientes ›</a></nav>}</>}</div></aside></div></div></main>;
}

function SearchForm({ onCreated, demoMode }: { onCreated: (search: Search) => void; demoMode: boolean }) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("Talla 4");
  const [stores, setStores] = useState("Amazon, Carrefour");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const input = { title, prompt, category: "pañales", size: size || null, brand: null, minimumQuantity: null, maxPriceCents: null, preferredStores: stores.split(",").map((store) => store.trim()).filter(Boolean) };
    if (!demoMode) {
      setSaving(true);
      const response = await fetch("/api/searches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) { setError("No se pudo guardar la búsqueda. Revisa la conexión con la base de datos."); setSaving(false); return; }
      const payload = await response.json();
      onCreated({ ...payload.search, updatedAt: new Date(payload.search.updatedAt).toLocaleString("es-ES") });
      setSaving(false);
    } else {
      setError("El modo demo no guarda cambios. Configura DATABASE_URL para activar la persistencia.");
      return;
    }
    setTitle(""); setPrompt("");
  }

  return <form className="panel panel-pad form" onSubmit={submit} style={{ marginBottom: 18 }}><label htmlFor="search-title">Nombre de la búsqueda<input id="search-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Pañales talla 4 sin pagar de más" required /></label><label htmlFor="search-prompt">Qué debe encontrar<textarea id="search-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Busca… prioriza… descarta…" required /></label><p className="helper">El prompt puede ser natural. Después añadiremos precio máximo y unidades como filtros explícitos.</p><label htmlFor="search-size">Talla<input id="search-size" value={size} onChange={(event) => setSize(event.target.value)} /></label><label htmlFor="search-stores">Tiendas preferidas<input id="search-stores" value={stores} onChange={(event) => setStores(event.target.value)} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar búsqueda"}</button></form>;
}
