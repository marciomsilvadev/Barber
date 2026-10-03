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

// ── Image Upload Helper ───────────────────────────────────────────────────────
async function uploadImage(file, bucket = 'images') {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function ImageUploadField({ label, value, onChange }) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);
  const ref = useState(null);
  async function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) { setPreview(url); onChange(url); }
  }
  return (
    <label className="image-upload-field">
      <span>{label}</span>
      <div className="image-upload-box" onClick={() => document.getElementById('img-upload-input').click()}>
        {uploading ? (
          <span className="upload-hint">Enviando...</span>
        ) : preview ? (
          <img src={preview} alt="preview" className="upload-preview"/>
        ) : (
          <span className="upload-hint"><Camera size={20}/><br/>Clique para anexar foto</span>
        )}
      </div>
      <input id="img-upload-input" type="file" accept="image/*" style={{display:'none'}} onChange={handle}/>
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal admin-modal fade-in">
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        <div className="eyebrow">ATELIER BARBER</div>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Barbers ────────────────────────────────────────────────────────────────────
function AdminBarbers({ user }) {
  const [barbers, setBarbers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', specialties: '', price: '', image: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('barbers').select('*').eq('tenant_id', user.tenant_id);
    if (data) setBarbers(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    await supabase.from('barbers').insert({
      tenant_id: user.tenant_id,
      name: form.name,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()) : [],
      price: parseFloat(form.price),
      image: form.image || null,
    });
    setSaving(false);
    setModal(false);
    setForm({ name: '', specialties: '', price: '', image: '' });
    load();
  }

  async function remove(id) {
    await supabase.from('barbers').delete().eq('id', id);
    load();
  }

  return (
    <section className="admin-view fade-in">
      <div className="section-head">
        <div><h3>Equipe</h3><p className="section-sub">Gerencie seus profissionais</p></div>
        <button className="gold-button compact" onClick={() => setModal(true)}><Plus size={15}/> Adicionar</button>
      </div>
      {barbers.length === 0 ? (
        <div className="premium-empty">
          <Scissors size={32} opacity={0.2}/>
          <p>Nenhum barbeiro cadastrado ainda.</p>
          <button className="outline-button compact" style={{width:'auto',margin:'16px auto 0'}} onClick={() => setModal(true)}>Adicionar primeiro barbeiro</button>
        </div>
      ) : (
        <div className="pro-card-grid">
          {barbers.map(b => (
            <div key={b.id} className="pro-card">
              <div className="pro-card-img">
                {b.image ? <img src={b.image} alt={b.name}/> : <div className="pro-card-placeholder"><Scissors opacity={0.15} size={36}/></div>}
              </div>
              <div className="pro-card-body">
                <strong className="pro-name">{b.name}</strong>
                <div className="pro-meta"><Star size={11} fill="var(--gold)" color="var(--gold)"/> {b.rating?.toFixed(1) || '5.0'}</div>
                {b.specialties?.length > 0 && <div className="pro-tags">{b.specialties.map(s => <span key={s}>{s}</span>)}</div>}
                <div className="pro-footer">
                  <strong className="pro-price">R$ {b.price}</strong>
                  <button className="icon-button danger" onClick={() => remove(b.id)}><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title="Novo Profissional" onClose={() => setModal(false)}>
          <div className="modal-form">
            <label>Nome completo<input placeholder="Ex: Rafael Moura" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></label>
            <label>Especialidades <span className="label-hint">(separe por vírgula)</span><input placeholder="Corte, Barba, Coloração" value={form.specialties} onChange={e => setForm({...form, specialties: e.target.value})}/></label>
            <label>Valor base (R$)<input type="number" placeholder="80" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></label>
            <ImageUploadField label="Foto do profissional" value={form.image} onChange={url => setForm({...form, image: url})}/>
            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar profissional'}<ChevronRight size={16}/></button>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Services ───────────────────────────────────────────────────────────────────
function AdminServices({ user }) {
  const [services, setServices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: '45', category: 'Barbearia' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('services').select('*').eq('tenant_id', user.tenant_id);
    if (data) setServices(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    await supabase.from('services').insert({
      tenant_id: user.tenant_id, name: form.name, description: form.description,
      price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes), category: form.category,
    });
    setSaving(false); setModal(false);
    setForm({ name: '', description: '', price: '', duration_minutes: '45', category: 'Barbearia' });
    load();
  }

  async function remove(id) {
    await supabase.from('services').delete().eq('id', id); load();
  }

  return (
    <section className="admin-view fade-in">
      <div className="section-head">
        <div><h3>Catálogo de Serviços</h3><p className="section-sub">{services.length} serviço{services.length !== 1 ? 's' : ''} cadastrado{services.length !== 1 ? 's' : ''}</p></div>
        <button className="gold-button compact" onClick={() => setModal(true)}><Plus size={15}/> Novo Serviço</button>
      </div>
      {services.length === 0 ? (
        <div className="premium-empty">
          <CalendarDays size={32} opacity={0.2}/>
          <p>Nenhum serviço cadastrado ainda.</p>
          <button className="outline-button compact" style={{width:'auto',margin:'16px auto 0'}} onClick={() => setModal(true)}>Criar primeiro serviço</button>
        </div>
      ) : (
        <div className="service-table">
          {services.map(s => (
            <div key={s.id} className="service-row">
              <div className="service-icon-box"><Scissors size={16}/></div>
              <div className="service-info"><strong>{s.name}</strong><span>{s.category} · {s.duration_minutes} min</span></div>
              <div className="service-price">R$ {parseFloat(s.price).toFixed(2)}</div>
              <button className="icon-button danger" onClick={() => remove(s.id)}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title="Novo Serviço" onClose={() => setModal(false)}>
          <div className="modal-form">
            <label>Nome do serviço<input placeholder="Ex: Corte Clássico" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></label>
            <label>Descrição <span className="label-hint">(opcional)</span><input placeholder="Corte com tesoura e alinhamento de barba" value={form.description} onChange={e => setForm({...form, description: e.target.value})}/></label>
            <div className="form-row">
              <label>Preço (R$)<input type="number" placeholder="80" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></label>
              <label>Duração (min)<input type="number" placeholder="45" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})}/></label>
            </div>
            <label>Categoria
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {['Barbearia','Cabelo','Barba','Manicure','Estética','Combo'].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Criar serviço'}<ChevronRight size={16}/></button>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Products ───────────────────────────────────────────────────────────────────
function AdminProducts({ user }) {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock_quantity: '0', category: 'Pomadas', image_url: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').eq('tenant_id', user.tenant_id);
    if (data) setProducts(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    await supabase.from('products').insert({
      tenant_id: user.tenant_id, name: form.name, description: form.description,
      price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity),
      category: form.category, image_url: form.image_url || null,
    });
    setSaving(false); setModal(false);
    setForm({ name: '', description: '', price: '', stock_quantity: '0', category: 'Pomadas', image_url: '' });
    load();
  }

  async function remove(id) {
    await supabase.from('products').delete().eq('id', id); load();
  }

  return (
    <section className="admin-view fade-in">
      <div className="section-head">
        <div><h3>Boutique (E-commerce)</h3><p className="section-sub">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p></div>
        <button className="gold-button compact" onClick={() => setModal(true)}><Plus size={15}/> Novo Produto</button>
      </div>
      {products.length === 0 ? (
        <div className="premium-empty">
          <ShoppingBag size={32} opacity={0.2}/>
          <p>Nenhum produto na boutique ainda.</p>
          <button className="outline-button compact" style={{width:'auto',margin:'16px auto 0'}} onClick={() => setModal(true)}>Adicionar primeiro produto</button>
        </div>
      ) : (
        <div className="pro-card-grid">
          {products.map(p => (
            <div key={p.id} className="pro-card">
              <div className="pro-card-img">
                {p.image_url ? <img src={p.image_url} alt={p.name}/> : <div className="pro-card-placeholder"><ShoppingBag opacity={0.15} size={36}/></div>}
              </div>
              <div className="pro-card-body">
                <strong className="pro-name">{p.name}</strong>
                <div className="pro-meta"><span className="tag-category">{p.category}</span></div>
                <div className="pro-meta" style={{marginTop:4,color:'#666',fontSize:11}}>Estoque: {p.stock_quantity} un.</div>
                <div className="pro-footer">
                  <strong className="pro-price">R$ {parseFloat(p.price).toFixed(2)}</strong>
                  <button className="icon-button danger" onClick={() => remove(p.id)}><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title="Novo Produto" onClose={() => setModal(false)}>
          <div className="modal-form">
            <label>Nome do produto<input placeholder="Ex: Pomada Matte Premium" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></label>
            <label>Descrição <span className="label-hint">(opcional)</span><input placeholder="Fixação forte, acabamento seco" value={form.description} onChange={e => setForm({...form, description: e.target.value})}/></label>
            <div className="form-row">
              <label>Preço (R$)<input type="number" placeholder="89.90" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></label>
              <label>Estoque<input type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})}/></label>
            </div>
            <label>Categoria
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {['Pomadas','Shampoos','Cremes','Óleos','Acessórios','Kits'].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <ImageUploadField label="Foto do produto" value={form.image_url} onChange={url => setForm({...form, image_url: url})}/>
            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar produto'}<ChevronRight size={16}/></button>
          </div>
        </Modal>
      )}
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
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) console.warn('Profile fetch error:', error.message);
      // Merge: profile overrides session.user, but fallback to auth metadata
      const meta = session.user.user_metadata || {};
      setUser({
        ...session.user,
        full_name: profile?.full_name || meta.full_name || meta.name || session.user.email,
        role: profile?.role || meta.role || 'client',
        tenant_id: profile?.tenant_id || null,
        ...(profile || {}),
      });
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
