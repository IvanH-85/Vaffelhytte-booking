import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const occupied = new Set(['2026-09-12','2026-09-13','2026-09-19','2026-09-20']);
const priceMember = 700;
const priceGuest = 1000;

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function App() {
  const [member, setMember] = useState(true);
  const [selected, setSelected] = useState([]);
  const [admin, setAdmin] = useState(false);

  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);
  const nightlyRate = member ? priceMember : priceGuest;
  const price = selected.length * nightlyRate;

  function toggleDate(day) {
    const d = isoDate(2026, 9, day);
    if (occupied.has(d)) return;
    setSelected((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-overlay">
          <div>
            <span className="eyebrow">Foreningshytta</span>
            <h1>Vaffelhytta</h1>
            <p>En enkel og koselig hytte for medlemmer, familier og gjester.</p>
          </div>
          <button className="ghost" onClick={() => setAdmin(!admin)}>{admin ? 'Til offentlig side' : 'Admin'}</button>
        </div>
      </header>

      {!admin ? (
        <main>
          <section className="grid two">
            <article className="card">
              <h2>Om hytta</h2>
              <p>Her legger vi inn tekst om beliggenhet, fasiliteter, sengeplasser, strøm, vann, parkering og praktisk informasjon.</p>
              <div className="photo-grid">
                <div className="photo">Utvendig bilde</div>
                <div className="photo">Innvendig bilde</div>
              </div>
            </article>
            <article className="card">
              <h2>Priser og regler</h2>
              <div className="price-row"><span>Medlem</span><strong>{priceMember} kr / døgn</strong></div>
              <div className="price-row"><span>Ikke-medlem</span><strong>{priceGuest} kr / døgn</strong></div>
              <ul>
                <li>Hytta skal ryddes og vaskes før avreise.</li>
                <li>Ingen røyking inne.</li>
                <li>Leietaker er ansvarlig for skader.</li>
                <li>Avbestilling og øvrige regler fylles inn senere.</li>
              </ul>
            </article>
          </section>

          <section className="card booking-card">
            <div className="section-head">
              <div>
                <span className="eyebrow">Bestilling</span>
                <h2>Velg ledige datoer</h2>
              </div>
              <div className="legend"><span><i className="dot free"></i>Ledig</span><span><i className="dot busy"></i>Opptatt</span><span><i className="dot chosen"></i>Valgt</span></div>
            </div>
            <div className="calendar">
              <div className="calendar-title">September 2026</div>
              <div className="weekdays">{['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map(d => <span key={d}>{d}</span>)}</div>
              <div className="days">
                <span className="empty"></span><span className="empty"></span>
                {days.map(day => {
                  const d = isoDate(2026,9,day);
                  const isBusy = occupied.has(d);
                  const isSelected = selected.includes(d);
                  return <button key={day} disabled={isBusy} onClick={() => toggleDate(day)} className={isBusy ? 'busy' : isSelected ? 'selected' : ''}>{day}</button>
                })}
              </div>
            </div>

            <div className="booking-form">
              <div className="toggle-row">
                <button className={member ? 'active' : ''} onClick={() => setMember(true)}>Jeg er medlem</button>
                <button className={!member ? 'active' : ''} onClick={() => setMember(false)}>Ikke-medlem</button>
              </div>
              <div className="form-grid">
                <input placeholder="Navn" />
                <input placeholder="Mobilnummer" />
                <input placeholder="E-post" />
                <input placeholder="Kommentar (valgfritt)" />
              </div>
              <div className="summary">
                <div><span>Valgte datoer</span><strong>{selected.length ? selected.join(', ') : 'Ingen datoer valgt'}</strong></div>
                <div><span>Pris</span><strong>{price.toLocaleString('nb-NO')} kr</strong></div>
              </div>
              <button className="primary" disabled={!selected.length}>Gå videre til SMS-bekreftelse</button>
            </div>
          </section>
        </main>
      ) : (
        <main>
          <section className="card">
            <span className="eyebrow">Administrasjon</span>
            <h2>Bookingoversikt</h2>
            <div className="stats">
              <div><strong>4</strong><span>Kommende bookinger</span></div>
              <div><strong>2</strong><span>Ikke kontrollert</span></div>
              <div><strong>1</strong><span>Ikke betalt</span></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Dato</th><th>Leietaker</th><th>Pris</th><th>Kontrollert</th><th>Betalt</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>12.–13. sep</td><td>Kari Nordmann</td><td>1 400 kr</td><td>✓ Yvonne</td><td>✓ Ivan</td><td><span className="badge done">Ferdig</span></td></tr>
                  <tr><td>19.–20. sep</td><td>Ola Hansen</td><td>2 000 kr</td><td><button className="mini">Marker kontrollert</button></td><td>–</td><td><span className="badge new">Ny</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      <footer>Vaffelhytta • Bookingløsning for foreningen</footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
