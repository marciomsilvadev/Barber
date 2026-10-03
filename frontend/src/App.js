import { useCallback, useEffect, useState } from "react";
import "@/App.css";
import {
  CalendarDays, Camera, ChevronRight, Clock3, LogOut, MapPin, Scissors,
  ShieldCheck, Star, Trash2, X, ShoppingBag, Plus, Edit2, Play
} from "lucide-react";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./lib/supabase";

const heroImage = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85";

function resolveImage(src, fallback) {
  if (!src) return fallback;
  if (src.startsWith("http")) return src;
  if (src.includes("/")) {
    const { data } = supabase.storage.from("avatars").getPublicUrl(src);
    return data?.publicUrl || fallback;
  }
  return src;
}

// -----------------------------------------------------------------------------
// LOGIN COMPONENT
// -----------------------------------------------------------------------------
function Login({ onLogin, callbackError = "", initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(callbackError);

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      if (mode === "register") {
        const { data, error: err } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.name } }
        });
        if (err) throw err;
        if (data.user) {
           await supabase.from("user_profiles").insert({
             id: data.user.id, full_name: form.name, role: "client"
           });
        }
        alert("Conta criada! Você já pode entrar.");
        setMode("login");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password
        });
        if (err) throw err;
      }
    } catch (err) { setError(err.message); }
  }

  function google() {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  return (
    <main className="login-shell fade-in">
      <section className="login-image">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="login-quote slide-up">
          <p>“Sua essência, nosso ofício.”</p>
          <span>— EXPERIÊNCIA ATELIER</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-inner slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="eyebrow">MEMBERS CLUB</div>
          <h1>{mode === "login" ? "Bem-vindo de volta." : "Sua jornada começa aqui."}</h1>
          <p className="subcopy">Acesso exclusivo para membros do Atelier.</p>
          
          <button className="google-button" onClick={google}>
            <span className="google-g">G</span>Continuar com Google
          </button>
          <div className="divider"><span>ou com e-mail</span></div>
          
          <form onSubmit={submit}>
            {mode === "register" && (
              <input placeholder="Seu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            )}
            <input type="email" placeholder="E-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Senha" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength="6" required />
            <button className="gold-button">
              {mode === "login" ? "Entrar" : "Criar conta"}<ChevronRight size={17} />
            </button>
          </form>
          {error && <div className="error-message">{error}</div>}
          <button className="switch-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Ainda não é membro? Criar conta" : "Já sou membro. Entrar"}
          </button>
        </div>
      </section>
    </main>
  );
}

// -----------------------------------------------------------------------------
// PUBLIC LANDING PAGE (Impeccable Design)
// -----------------------------------------------------------------------------
function LandingPage({ onEnterApp }) {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).limit(4).then(({ data }) => data && setProducts(data));
    supabase.from('services').select('*').eq('is_active', true).limit(3).then(({ data }) => data && setServices(data));
  }, []);

  return (
    <div className="landing-wrapper">
      <nav className="landing-nav fade-in">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#boutique">Boutique</a>
          <button className="outline-button" onClick={() => onEnterApp("login")}>Membros</button>
          <button className="gold-button compact" onClick={() => onEnterApp("register")}>Agendar Horário</button>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content slide-up">
          <div className="eyebrow">SÃO PAULO</div>
          <h1 className="hero-title">A arte do cuidado <br/><em>masculino.</em></h1>
          <p className="hero-subtitle">Descubra uma experiência singular onde tradição e estilo contemporâneo se encontram.</p>
          <div className="hero-actions">
            <button className="gold-button" onClick={() => onEnterApp("register")}>Agendar agora <ChevronRight size={17}/></button>
            <button className="text-button" style={{ color: "var(--white)" }}><Play size={15}/> Conheça o Atelier</button>
          </div>
        </div>
        <div className="hero-image-container fade-in">
          <img src={heroImage} alt="Interior do Atelier" className="hero-bg" />
          <div className="hero-gradient"></div>
        </div>
      </header>

      <section id="servicos" className="services-section fade-in">
        <div className="section-header-center">
          <div className="eyebrow">NOSSOS SERVIÇOS</div>
          <h2>Excelência em cada detalhe.</h2>
        </div>
        <div className="service-cards">
          {services.length ? services.map(s => (
            <div key={s.id} className="service-card">
              <h3>{s.name}</h3>
              <p>{s.description || 'Serviço de alta qualidade com especialistas.'}</p>
              <div className="service-meta">
                <span>{s.duration_minutes} min</span>
                <strong>R$ {s.price}</strong>
              </div>
            </div>
          )) : (
            <>
              <div className="service-card">
                <h3>Corte Clássico</h3><p>Alinhamento perfeito com tesoura e máquina.</p>
                <div className="service-meta"><span>45 min</span><strong>R$ 80</strong></div>
              </div>
              <div className="service-card">
                <h3>Barba Terapia</h3><p>Toalha quente, navalha e hidratação profunda.</p>
                <div className="service-meta"><span>30 min</span><strong>R$ 60</strong></div>
              </div>
              <div className="service-card">
                <h3>Estética Facial</h3><p>Limpeza de pele e cuidados avançados.</p>
                <div className="service-meta"><span>60 min</span><strong>R$ 120</strong></div>
              </div>
            </>
          )}
        </div>
      </section>

      <section id="boutique" className="boutique-section fade-in">
        <div className="section-header-center">
          <div className="eyebrow">BOUTIQUE</div>
          <h2>Leve o Atelier com você.</h2>
          <p className="subcopy" style={{textAlign:"center", margin:"10px auto 40px"}}>Produtos premium selecionados pelos nossos especialistas.</p>
        </div>
        <div className="product-grid">
          {products.length ? products.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-img-box">
                {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="product-placeholder"><ShoppingBag opacity={0.2} size={40}/></div>}
              </div>
              <h4>{p.name}</h4>
              <p>{p.category}</p>
              <strong>R$ {p.price}</strong>
              <button className="outline-button compact">Comprar</button>
            </div>
          )) : (
            <div className="empty-state">Em breve nossa coleção completa de produtos.</div>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <p>© 2026 Atelier Barber. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ADMIN PANEL (Products, Services, Barbers)
// -----------------------------------------------------------------------------
function AdminApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("barbers");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><ShieldCheck size={14} /> ADMIN</div>
        <nav>
          <button className={activeTab === "barbers" ? "active" : ""} onClick={() => setActiveTab("barbers")}><Scissors size={18} />Equipe</button>
          <button className={activeTab === "services" ? "active" : ""} onClick={() => setActiveTab("services")}><CalendarDays size={18} />Serviços</button>
          <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}><ShoppingBag size={18} />Produtos (Loja)</button>
        </nav>
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
          <div><div className="eyebrow">PAINEL</div><h2>Gestão do Atelier.</h2></div>
        </header>
        {activeTab === "barbers" && <AdminBarbers user={user} />}
        {activeTab === "services" && <AdminServices user={user} />}
        {activeTab === "products" && <AdminProducts user={user} />}
      </main>
    </div>
  );
}

function AdminBarbers({ user }) {
  const [barbers, setBarbers] = useState([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('barbers').select('*').eq('tenant_id', user.tenant_id);
    if(data) setBarbers(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);
  
  return (
    <section className="admin-view fade-in">
      <div className="section-head"><div><h3>Equipe</h3></div><button className="gold-button compact"><Plus size={15}/> Adicionar</button></div>
      <div className="admin-list">
        {barbers.length ? barbers.map(b => (
          <article key={b.id} className="admin-row">
            <img src={resolveImage(b.image, heroImage)} alt={b.name} />
            <div><strong>{b.name}</strong><small>R$ {b.price} base</small></div>
            <button className="icon-button danger"><Trash2 size={15} /></button>
          </article>
        )) : <div className="empty-state">Nenhum barbeiro cadastrado.</div>}
      </div>
    </section>
  );
}

function AdminServices({ user }) {
  const [services, setServices] = useState([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('services').select('*').eq('tenant_id', user.tenant_id);
    if(data) setServices(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  async function createService() {
    const name = window.prompt("Nome do Serviço:");
    if (!name) return;
    const price = window.prompt("Preço (R$):", "80");
    await supabase.from('services').insert({ tenant_id: user.tenant_id, name, price, duration_minutes: 45, category: 'Barbearia' });
    load();
  }

  return (
    <section className="admin-view fade-in">
      <div className="section-head"><div><h3>Catálogo de Serviços</h3></div><button className="gold-button compact" onClick={createService}><Plus size={15}/> Adicionar</button></div>
      <div className="admin-list">
        {services.length ? services.map(s => (
          <article key={s.id} className="admin-row">
            <div className="icon-placeholder"><Scissors size={18}/></div>
            <div><strong>{s.name}</strong><small>{s.category} · {s.duration_minutes} min</small></div>
            <div style={{marginRight: 20}}><strong>R$ {s.price}</strong></div>
            <button className="icon-button"><Edit2 size={15} /></button>
          </article>
        )) : <div className="empty-state">Para testar, crie a tabela services no SQL Editor primeiro.</div>}
      </div>
    </section>
  );
}

function AdminProducts({ user }) {
  const [products, setProducts] = useState([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').eq('tenant_id', user.tenant_id);
    if(data) setProducts(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  async function createProduct() {
    const name = window.prompt("Nome do Produto:");
    if (!name) return;
    const price = window.prompt("Preço (R$):", "120");
    await supabase.from('products').insert({ tenant_id: user.tenant_id, name, price, category: 'Cosméticos' });
    load();
  }

  return (
    <section className="admin-view fade-in">
      <div className="section-head"><div><h3>Boutique (E-commerce)</h3></div><button className="gold-button compact" onClick={createProduct}><Plus size={15}/> Adicionar</button></div>
      <div className="admin-list">
        {products.length ? products.map(p => (
          <article key={p.id} className="admin-row">
            <div className="icon-placeholder"><ShoppingBag size={18}/></div>
            <div><strong>{p.name}</strong><small>{p.category} · Estoque: {p.stock_quantity}</small></div>
            <div style={{marginRight: 20}}><strong>R$ {p.price}</strong></div>
            <button className="icon-button"><Edit2 size={15} /></button>
          </article>
        )) : <div className="empty-state">Nenhum produto cadastrado. Crie a tabela products no SQL Editor.</div>}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// APP CONTENT / ROUTER
// -----------------------------------------------------------------------------
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => handleSession(session));
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
    setShowAuth(null);
  }

  if (loading) return <div className="loading-screen">ATELIER<span>BARBER</span></div>;
  
  if (!user) {
    if (showAuth) return <Login onLogin={setUser} initialMode={showAuth} />;
    return <LandingPage onEnterApp={setShowAuth} />;
  }

  if (user.role === "admin") return <AdminApp user={user} onLogout={handleLogout} />;
  
  return (
    <div className="app-shell fade-in">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><MapPin size={14} /> Cliente</div>
        <nav><button className="active"><CalendarDays size={18} />Minha agenda</button></nav>
        <div className="sidebar-bottom">
          <div className="member-card">
            <div className="avatar">{user.full_name?.[0] || 'U'}</div>
            <div><strong>{user.full_name}</strong><small>MEMBRO</small></div>
          </div>
          <button className="logout" onClick={handleLogout}><LogOut size={16} />Sair</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><div className="eyebrow">VISÃO GERAL</div><h2>Olá, {user.full_name?.split(' ')[0]}.</h2></div>
        </header>
        <div className="empty-state">Área do cliente. O agendamento está em manutenção para integração com os novos Serviços Dinâmicos.</div>
      </main>
    </div>
  );
}

export default function App() { return <BrowserRouter><AppContent /></BrowserRouter>; }
