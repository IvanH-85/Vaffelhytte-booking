import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import './styles.css';

const monthNames = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];

function isoLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysInclusive(from, to) {
  if (!from) return 0;
  const a = parseIso(from);
  const b = parseIso(to || from);
  return Math.round((b - a) / 86400000) + 1;
}

function App() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [property, setProperty] = useState(null);
  const [busyRanges, setBusyRanges] = useState([]);
  const [member, setMember] = useState(true);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const monthStart = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const monthEnd = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 0), [month]);
  const days = useMemo(() => Array.from({ length: monthEnd.getDate() }, (_, i) => i + 1), [monthEnd]);
  const leading = (monthStart.getDay() + 6) % 7;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('id,slug,name,description,member_rate,non_member_rate,contact_email')
        .eq('slug', 'vaffelhytta')
        .single();

      if (propertyError) {
        if (!cancelled) {
          setError('Kunne ikke hente informasjon om hytta.');
          setLoading(false);
        }
        return;
      }

      const { data: availability, error: availabilityError } = await supabase
        .from('public_availability')
        .select('date_from,date_to')
        .eq('property_id', propertyData.id)
        .lte('date_from', isoLocal(monthEnd))
        .gte('date_to', isoLocal(monthStart))
        .order('date_from');

      if (!cancelled) {
        setProperty(propertyData);
        setBusyRanges(availability || []);
        setError(availabilityError ? 'Kunne ikke hente ledige datoer.' : '');
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [monthStart, monthEnd]);

  const priceMember = property?.member_rate ?? 700;
  const priceGuest = property?.non_member_rate ?? 1000;
  const nightlyRate = member ? priceMember : priceGuest;
  const bookedDays = daysInclusive(selectedFrom, selectedTo);
  const price = bookedDays * nightlyRate;

  function isBusy(iso) {
    return busyRanges.some(r => iso >= r.date_from && iso <= r.date_to);
  }

  function rangeHasBusy(from, to) {
    let d = parseIso(from);
    const end = parseIso(to);
    while (d <= end) {
      if (isBusy(isoLocal(d))) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  }

  function selectDate(day) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const iso = isoLocal(date);
    if (date < today || isBusy(iso)) return;

    setError('');
    if (!selectedFrom || selectedTo) {
      setSelectedFrom(iso);
      setSelectedTo(null);
      return;
    }

    if (iso < selectedFrom) {
      setSelectedFrom(iso);
      setSelectedTo(null);
      return;
    }

    if (rangeHasBusy(selectedFrom, iso)) {
      setError('Det ligger en opptatt dato i perioden. Velg en annen periode.');
      setSelectedFrom(iso);
      setSelectedTo(null);
      return;
    }

    setSelectedTo(iso);
  }

  function isSelected(iso) {
    if (!selectedFrom) return false;
    const end = selectedTo || selectedFrom;
    return iso >= selectedFrom && iso <= end;
  }

  function changeMonth(delta) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const firstAllowed = new Date(today.getFullYear(), today.getMonth(), 1);
    if (next < firstAllowed) return;
    setMonth(next);
    setSelectedFrom(null);
    setSelectedTo(null);
  }

  const selectionText = selectedFrom
    ? selectedTo
      ? `${selectedFrom} – ${selectedTo}`
      : selectedFrom
    : 'Ingen datoer valgt';

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-overlay">
          <div>
            <span className="eyebrow">Foreningshytta</span>
            <h1>{property?.name || 'Vaffelhytta'}</h1>
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
              <p>{property?.description || 'Her legger vi inn tekst om beliggenhet, fasiliteter, sengeplasser, strøm, vann, parkering og praktisk informasjon.'}</p>
              <div className="photo-grid">
                <div className="photo">Utvendig bilde</div>
                <div className="photo">Innvendig bilde</div>
              </div>
            </article>
            <article className="card">
              <h2>Priser og regler</h2>
              <div className="price-row"><span>Medlem</span><strong>{priceMember.toLocaleString('nb-NO')} kr / døgn</strong></div>
              <div className="price-row"><span>Ikke-medlem</span><strong>{priceGuest.toLocaleString('nb-NO')} kr / døgn</strong></div>
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
                <h2>Velg ledig periode</h2>
              </div>
              <div className="legend"><span><i className="dot free"></i>Ledig</span><span><i className="dot busy"></i>Opptatt</span><span><i className="dot chosen"></i>Valgt</span></div>
            </div>

            <div className="calendar">
              <div className="calendar-nav">
                <button onClick={() => changeMonth(-1)} aria-label="Forrige måned">‹</button>
                <div className="calendar-title">{monthNames[month.getMonth()]} {month.getFullYear()}</div>
                <button onClick={() => changeMonth(1)} aria-label="Neste måned">›</button>
              </div>
              <div className="weekdays">{['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map(d => <span key={d}>{d}</span>)}</div>
              <div className="days">
                {Array.from({ length: leading }, (_, i) => <span className="empty" key={`empty-${i}`}></span>)}
                {days.map(day => {
                  const date = new Date(month.getFullYear(), month.getMonth(), day);
                  const iso = isoLocal(date);
                  const busy = isBusy(iso);
                  const past = date < today;
                  const selected = isSelected(iso);
                  const className = busy ? 'busy' : selected ? 'selected' : past ? 'past' : '';
                  return <button key={day} disabled={busy || past || loading} onClick={() => selectDate(day)} className={className}>{day}</button>;
                })}
              </div>
              {loading && <p className="calendar-message">Henter kalender…</p>}
              {error && <p className="calendar-message error">{error}</p>}
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
                <div><span>Valgt periode</span><strong>{selectionText}</strong></div>
                <div><span>Antall døgn</span><strong>{bookedDays}</strong></div>
                <div><span>Pris</span><strong>{price.toLocaleString('nb-NO')} kr</strong></div>
              </div>
              <button className="primary" disabled={!selectedFrom}>Gå videre til SMS-bekreftelse</button>
            </div>
          </section>
        </main>
      ) : (
        <main>
          <section className="card">
            <span className="eyebrow">Administrasjon</span>
            <h2>Bookingoversikt</h2>
            <p>Admininnlogging og ekte bookingoversikt kobles på i neste steg. Kundedata ligger allerede beskyttet i Supabase.</p>
            <div className="stats">
              <div><strong>0</strong><span>Kommende bookinger</span></div>
              <div><strong>0</strong><span>Ikke kontrollert</span></div>
              <div><strong>0</strong><span>Ikke betalt</span></div>
            </div>
          </section>
        </main>
      )}

      <footer>Vaffelhytta • Bookingløsning for foreningen</footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
