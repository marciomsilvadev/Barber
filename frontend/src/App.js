import { useCallback, useEffect, useState } from "react";
import "@/App.css";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LogOut,
  MapPin,
  Scissors,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";

const heroImage = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85";

function resolveImage(src) {
  if (!src) return heroImage;
  if (src.startsWith("http")) return src;
  if (src.includes("/")) {
    const { data } = supabase.storage.from("avatars").getPublicUrl(src);
    return data?.publicUrl || heroImage;
  }
  return src;
}

function Login({ onLogin, callbackError = "" }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(callbackError);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        const { data, error: err } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } }
        });
        if (err) throw err;
        
        // Insere o perfil
        if (data.user) {
           await supabase.from("user_profiles").insert({
             id: data.user.id,
             full_name: form.name,
             role: "client"
           });
        }
        alert("Conta criada! Você já pode entrar.");
        setMode("login");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (err) throw err;
      }
    } catch (err) { setError(err.message); }
  }

  function google() {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  return (
    <main className="login-shell">
      <section className="login-image">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="login-quote">
          <p>“O corte certo muda a forma como você entra no mundo.”</p>
          <span>— EXPERIÊNCIA ATELIER</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-inner">
          <div className="eyebrow">MEMBERS CLUB · SÃO PAULO</div>
          <h1 data-testid="login-heading">Seu próximo visual começa aqui.</h1>
          <p className="subcopy">Agende seu momento. A gente cuida do resto.</p>
          <button className="google-button" data-testid="google-login-button" onClick={google}>
            <span className="google-g">G</span>Continuar com Google
          </button>
          <div className="divider"><span>ou entre com e-mail</span></div>
          <form onSubmit={submit} data-testid="auth-form">
            {mode === "register" && (
              <input data-testid="auth-name-input" placeholder="Seu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            )}
            <input data-testid="auth-email-input" type="email" placeholder="E-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input data-testid="auth-password-input" type="password" placeholder="Senha" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength="6" required />
            <button className="gold-button" data-testid="auth-submit-button">
              {mode === "login" ? "Entrar no Atelier" : "Criar minha conta"}<ChevronRight size={17} />
            </button>
          </form>
          {error && <div className="error-message" data-testid="auth-error-message">{error}</div>}
          <button className="switch-button" data-testid="auth-mode-toggle" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Ainda não sou membro · Criar conta" : "Já tenho conta · Entrar"}
          </button>
        </div>
      </section>
    </main>
  );
}

function BookingCard({ item, onPay, onReschedule, onCancel, showActions = true }) {
  return (
    <article className="booking-card" data-testid={`booking-card-${item.id}`}>
      <div className="booking-date">
        <strong>{item.date.split("-")[2] || item.date}</strong>
        <span>{item.date.includes("-") ? item.date.split("-")[1] : "DATA"}</span>
      </div>
      <div className="booking-details">
        <div className="eyebrow">{item.status}</div>
        <h3>{item.service_type}</h3>
        <p><Clock3 size={14} /> {item.time} · {item.barbers?.name || item.barber_id}</p>
      </div>
      <div className="booking-status">
        <span className={item.payment_status === "Pago" ? "paid" : "pending"}>
          {item.payment_status === "Pago" ? "PAGO" : "AGUARDANDO PAGAMENTO"}
        </span>
        {showActions && item.payment_status !== "Pago" && item.status !== "Cancelado" && (
          <button className="pay-button" data-testid={`pay-booking-${item.id}`} onClick={() => onPay(item.id)}>
            Pagar R$ {item.price}
          </button>
        )}
        {showActions && item.status !== "Cancelado" && (
          <div className="booking-actions">
            <button className="manage-button" data-testid={`reschedule-booking-${item.id}`} onClick={() => onReschedule(item)}>Remarcar</button>
            <button className="manage-button cancel" data-testid={`cancel-booking-${item.id}`} onClick={() => onCancel(item.id)}>Cancelar</button>
          </div>
        )}
      </div>
    </article>
  );
}

function BookingModal({ barber, user, onClose, onBook }) {
  const slots = ["09:00", "10:30", "14:00", "16:30"];
  const [date, setDate] = useState("2026-03-28");
  const [taken, setTaken] = useState([]);
  const available = slots.filter(s => !taken.includes(s));
  const [time, setTime] = useState(slots[0]);
  const [service, setService] = useState("Corte + Barba");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSlots() {
      const { data } = await supabase.from('appointments').select('time').eq('barber_id', barber.id).eq('date', date).neq('status', 'Cancelado');
      if (active && data) setTaken(data.map(d => d.time));
    }
    loadSlots();
    return () => { active = false; };
  }, [barber.id, date]);

  useEffect(() => {
    if (!available.includes(time) && available.length) setTime(available[0]);
  }, [taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setError("");
    try {
      await onBook({ 
        tenant_id: barber.tenant_id,
        barber_id: barber.id, 
        client_id: user.id,
        service_type: service, 
        price: barber.price, 
        date, 
        time 
      });
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="modal-backdrop" data-testid="booking-modal">
      <div className="modal">
        <button className="close-button" data-testid="close-booking-modal" onClick={onClose}><X /></button>
        <div className="eyebrow">RESERVAR COM {barber.name.toUpperCase()}</div>
        <h2>Escolha seu momento.</h2>
        <p className="subcopy">Precisão, cuidado e uma pausa na rotina.</p>
        <label>Serviço
          <select data-testid="service-select" value={service} onChange={e => setService(e.target.value)}>
            <option>Corte + Barba</option>
            <option>Corte clássico</option>
            <option>Barba premium</option>
          </select>
        </label>
        <div className="form-row">
          <label>Data<input data-testid="booking-date-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label>Horário
            <div className="slot-grid" data-testid="slot-grid">
              {slots.map(slot => {
                const busy = taken.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`slot ${busy ? "busy" : ""} ${time === slot && !busy ? "active" : ""}`}
                    data-testid={`slot-${slot}`}
                    disabled={busy}
                    onClick={() => !busy && setTime(slot)}
                  >{slot}{busy && <span className="busy-tag">OCUPADO</span>}</button>
                );
              })}
            </div>
          </label>
        </div>
        <div className="modal-total"><span>Total estimado</span><strong>R$ {barber.price}</strong></div>
        {error && <div className="error-message" data-testid="booking-error">{error}</div>}
        <button
          className="gold-button"
          data-testid="booking-submit-button"
          disabled={!available.length}
          onClick={submit}
        >{available.length ? "Confirmar horário" : "Sem horários disponíveis"} <ChevronRight size={17} /></button>
      </div>
    </div>
  );
}

function AdminPanel({ user, onBack }) {
  const [barbers, setBarbers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", price: 90, rating: 4.9, specialties: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from('barbers').select('*').eq('tenant_id', user.tenant_id);
    if(data) setBarbers(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    setError(""); setNotice("");
    try {
      // Como não temos acesso à Edge Function de criação admin aqui facilmente sem expor chaves, 
      // em um cenário real, você faria uma Edge Function no Supabase para isso. 
      // Para demonstração local no frontend, avisaremos isso.
      alert("A criação de usuários via frontend requer Edge Functions no Supabase (auth.admin.createUser). Configure no seu dashboard depois.");
    } catch (err) { setError(err.message); }
  }

  async function remove(id) {
    if (!window.confirm("Remover este barbeiro?")) return;
    await supabase.from('barbers').delete().eq('id', id);
    load();
  }

  return (
    <section className="admin-view" data-testid="admin-panel">
      <div className="section-head">
        <div><div className="eyebrow">PAINEL ADMIN</div><h3>Equipe do Atelier</h3></div>
      </div>
      <div className="admin-grid">
        <form className="admin-form" onSubmit={create} data-testid="admin-create-barber-form">
          <div className="eyebrow">NOVO BARBEIRO</div>
          <input data-testid="admin-barber-name" placeholder="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input data-testid="admin-barber-email" type="email" placeholder="E-mail de acesso" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <div className="form-row">
            <label>Preço base (R$)<input data-testid="admin-barber-price" type="number" min="0" step="5" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label>
          </div>
          <button className="gold-button" data-testid="admin-create-submit">Criar barbeiro <ChevronRight size={17} /></button>
          {notice && <div className="notice" data-testid="admin-notice">{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
          {error && <div className="error-message" data-testid="admin-error">{error}</div>}
        </form>
        <div className="admin-list" data-testid="admin-barbers-list">
          {barbers.map(b => (
            <article key={b.id} className="admin-row">
              <img src={resolveImage(b.image)} alt={b.name} />
              <div>
                <strong>{b.name}</strong>
                <small>R$ {b.price}</small>
              </div>
              <button className="icon-button danger" data-testid={`admin-delete-${b.id}`} onClick={() => remove(b.id)}><Trash2 size={15} /></button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BarberDashboard({ user, onLogout }) {
  const [barber, setBarber] = useState(null);
  const [bookings, setBookings] = useState([]);
  
  const load = useCallback(async () => {
    const { data: b } = await supabase.from('barbers').select('*').eq('user_id', user.id).single();
    if (b) setBarber(b);
    const { data: bks } = await supabase.from('appointments').select('*, user_profiles(full_name)').eq('barber_id', b?.id);
    if(bks) setBookings(bks);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  if (!barber) return <div className="loading-screen">CARREGANDO<span>PERFIL</span></div>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><ShieldCheck size={14} /> ÁREA DO BARBEIRO</div>
        <nav><button className="active"><Scissors size={18} />Meu perfil</button></nav>
        <div className="sidebar-bottom">
          <div className="member-card">
            <div className="avatar">{user.full_name?.[0]}</div>
            <div><strong data-testid="user-name">{user.full_name}</strong><small>BARBEIRO</small></div>
          </div>
          <button className="logout" data-testid="logout-button" onClick={onLogout}><LogOut size={16} />Sair</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><div className="eyebrow">PERFIL PÚBLICO</div><h2 data-testid="page-title">Gerencie seu Atelier.</h2></div>
        </header>
        <section>
          <div className="section-head">
            <div><div className="eyebrow">AGENDA</div><h3>Próximos atendimentos</h3></div>
          </div>
          <div className="booking-list" data-testid="barber-booking-list">
            {bookings.length ? bookings.map(item => <BookingCard key={item.id} item={item} showActions={false} onPay={() => {}} onReschedule={() => {}} onCancel={() => {}} />) : <div className="empty-state">Nenhum agendamento ainda.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

function ClientApp({ user, onLogout }) {
  const [barbers, setBarbers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState("agenda");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    // Busca todos os barbeiros
    const { data: bData } = await supabase.from('barbers').select('*');
    if (bData) setBarbers(bData);
    
    // Busca agendamentos do cliente
    const { data: aData } = await supabase.from('appointments').select('*, barbers(name)').eq('client_id', user.id);
    if (aData) setBookings(aData);
  }, [user.id]);
  
  useEffect(() => { loadData(); }, [loadData]);

  async function book(booking) {
    try {
      const { data, error } = await supabase.from('appointments').insert([booking]).select().single();
      if (error) throw error;
      setBookings(b => [...b, data]);
      setSelected(null);
      setActive("agenda");
      setNotice("Horário reservado. Finalize o pagamento para garantir sua cadeira.");
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function pay(bookingId) {
    try {
       // Mock payment for now - in production use Stripe checkout
       const { error } = await supabase.from('appointments').update({ payment_status: 'Pago' }).eq('id', bookingId);
       if (error) throw error;
       setBookings(bs => bs.map(item => item.id === bookingId ? { ...item, payment_status: "Pago" } : item));
       setNotice("Pagamento simulado com sucesso! (Integração Stripe será via Edge Functions)");
    } catch (err) { setNotice(`Falha: ${err.message}`); }
  }

  async function cancelBooking(id) {
    await supabase.from('appointments').update({ status: 'Cancelado' }).eq('id', id);
    setBookings(bs => bs.map(item => item.id === id ? { ...item, status: "Cancelado" } : item));
    setNotice("Agendamento cancelado.");
  }

  async function rescheduleBooking(item) {
    const date = window.prompt("Nova data (AAAA-MM-DD):", item.date);
    const time = window.prompt("Novo horário:", item.time);
    if (!date || !time) return;
    await supabase.from('appointments').update({ date, time, status: 'Remarcado' }).eq('id', item.id);
    setBookings(bs => bs.map(b => b.id === item.id ? { ...b, date, time, status: "Remarcado" } : b));
    setNotice("Agendamento remarcado com sucesso.");
  }

  const upcoming = bookings.filter(item => item.status !== "Cancelado");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><MapPin size={14} /> Jardins · São Paulo</div>
        <nav>
          <button className={active === "agenda" ? "active" : ""} onClick={() => setActive("agenda")}><CalendarDays size={18} />Minha agenda</button>
          <button className={active === "barbers" ? "active" : ""} onClick={() => setActive("barbers")}><Scissors size={18} />Escolher barbeiro</button>
          <button className={active === "history" ? "active" : ""} onClick={() => setActive("history")}><Clock3 size={18} />Histórico</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="member-card">
            <div className="avatar">{user.full_name?.[0] || 'U'}</div>
            <div><strong>{user.full_name || 'Membro'}</strong><small>MEMBRO ATELIER</small></div>
          </div>
          <button className="logout" onClick={onLogout}><LogOut size={16} />Sair</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">{active === "agenda" ? "VISÃO GERAL" : active === "barbers" ? "A EQUIPE" : "SUA JORNADA"}</div>
            <h2>{active === "agenda" ? `Olá.` : active === "barbers" ? "Escolha seu especialista." : "Seus momentos Atelier."}</h2>
          </div>
        </header>
        {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}

        {active === "agenda" && (
          <>
            <section className="hero-banner">
              <div>
                <div className="eyebrow">ATELIER EXPERIENCE</div>
                <h1>Seu estilo,<br /><em>bem cuidado.</em></h1>
                <p>Tempo para você. Precisão em cada detalhe.</p>
                <button className="outline-button" onClick={() => setActive("barbers")}>Agendar horário <ChevronRight size={16} /></button>
              </div>
              <img src={heroImage} alt="Interior elegante" />
            </section>
            <section className="section-head">
              <div><div className="eyebrow">AGENDA</div><h3>Seus próximos horários</h3></div>
            </section>
            <div className="booking-list">
              {upcoming.length ? upcoming.map(item => (
                <BookingCard key={item.id} item={item} onPay={pay} onReschedule={rescheduleBooking} onCancel={cancelBooking} />
              )) : <div className="empty-state">Sua agenda está esperando por você. Escolha um barbeiro para começar.</div>}
            </div>
          </>
        )}

        {active === "barbers" && (
          <section className="barber-grid">
            {barbers.map(barber => (
              <article className="barber-card" key={barber.id}>
                <img src={resolveImage(barber.image)} alt={barber.name} />
                <div className="barber-info">
                  <div className="rating"><Star size={13} fill="currentColor" /> {barber.rating || 5.0}</div>
                  <h3>{barber.name}</h3>
                  <div className="barber-bottom">
                    <strong>R$ {barber.price}</strong>
                    <button className="gold-button compact" onClick={() => setSelected(barber)}>Ver horários <ChevronRight size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {active === "history" && (
          <section className="history-list">
            {bookings.length ? bookings.map(item => <BookingCard key={item.id} item={item} onPay={pay} onReschedule={rescheduleBooking} onCancel={cancelBooking} />) : <div className="empty-state">Nenhum atendimento no histórico ainda.</div>}
          </section>
        )}
      </main>

      {selected && <BookingModal user={user} barber={selected} onClose={() => setSelected(null)} onBook={book} />}
    </div>
  );
}

function AdminApp({ user, onLogout }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><ShieldCheck size={14} /> ADMIN</div>
        <nav><button className="active"><Scissors size={18} />Barbeiros</button></nav>
        <div className="sidebar-bottom">
          <div className="member-card">
            <div className="avatar">{user.full_name?.[0] || 'A'}</div>
            <div><strong>{user.full_name}</strong><small>ADMIN</small></div>
          </div>
          <button className="logout" onClick={onLogout}><LogOut size={16} />Sair</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><div className="eyebrow">PAINEL</div><h2>Gerencie sua equipe.</h2></div>
        </header>
        <AdminPanel user={user} onBack={() => {}} />
      </main>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(session) {
    if (session) {
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single();
      setUser({ ...session.user, ...profile });
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) return <div className="loading-screen">ATELIER<span>BARBER</span></div>;
  if (!user) return <Login onLogin={setUser} />;

  if (user.role === "admin") return <AdminApp user={user} onLogout={handleLogout} />;
  if (user.role === "barber") return <BarberDashboard user={user} onLogout={handleLogout} />;
  return <ClientApp user={user} onLogout={handleLogout} />;
}

export default function App() { return <BrowserRouter><AppContent /></BrowserRouter>; }
