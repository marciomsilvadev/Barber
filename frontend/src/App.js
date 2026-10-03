import { useCallback, useEffect, useRef, useState } from "react";
import "@/App.css";
import {
  CalendarDays, Camera, ChevronRight, Clock3, CreditCard, Edit2, LogOut, MapPin,
  QrCode, Scissors, ShieldCheck, Star, Trash2, User, X, ShoppingBag, Plus, Play, Check
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
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

async function buyProduct(product) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ product }),
    });
    const { url, error } = await res.json();
    if (error) { alert('Erro ao iniciar pagamento: ' + error); return; }
    if (url) window.location.href = url;
  } catch (e) {
    alert('Erro de conexão. Tente novamente.');
  }
}

function LandingPage({ onEnterApp }) {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).limit(4).then(({ data }) => data && setProducts(data));
    supabase.from('services').select('*').eq('is_active', true).limit(3).then(({ data }) => data && setServices(data));
  }, []);

  async function handleBuy(product) {
    setBuying(product.id);
    await buyProduct(product);
    setBuying(null);
  }

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
              <strong>R$ {parseFloat(p.price).toFixed(2)}</strong>
              <button
                className="gold-button compact buy-btn"
                onClick={() => handleBuy(p)}
                disabled={buying === p.id}
              >
                {buying === p.id ? 'Aguarde...' : 'Comprar agora'}
              </button>
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
  const [form, setForm] = useState({ id: null, name: '', specialties: '', price: '', image: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('barbers').select('*').eq('tenant_id', user.tenant_id);
    if (data) setBarbers(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  function openModal(b = null) {
    if (b) {
      setForm({ id: b.id, name: b.name, specialties: (b.specialties || []).join(', '), price: b.price, image: b.image || '' });
    } else {
      setForm({ id: null, name: '', specialties: '', price: '', image: '' });
    }
    setModal(true);
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      tenant_id: user.tenant_id,
      name: form.name,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()) : [],
      price: parseFloat(form.price),
      image: form.image || null,
    };
    if (form.id) {
      await supabase.from('barbers').update(payload).eq('id', form.id);
    } else {
      await supabase.from('barbers').insert(payload);
    }
    setSaving(false);
    setModal(false);
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
                  <div style={{display:'flex', gap:6}}>
                    <button className="icon-button" onClick={() => openModal(b)}><Edit2 size={14}/></button>
                    <button className="icon-button danger" onClick={() => remove(b.id)}><Trash2 size={14}/></button>
                  </div>
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
  const [form, setForm] = useState({ id: null, name: '', description: '', price: '', duration_minutes: '45', category: 'Barbearia' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('services').select('*').eq('tenant_id', user.tenant_id);
    if (data) setServices(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  function openModal(s = null) {
    if (s) {
      setForm({ id: s.id, name: s.name, description: s.description || '', price: s.price, duration_minutes: s.duration_minutes, category: s.category });
    } else {
      setForm({ id: null, name: '', description: '', price: '', duration_minutes: '45', category: 'Barbearia' });
    }
    setModal(true);
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      tenant_id: user.tenant_id, name: form.name, description: form.description,
      price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes), category: form.category,
    };
    if (form.id) {
      await supabase.from('services').update(payload).eq('id', form.id);
    } else {
      await supabase.from('services').insert(payload);
    }
    setSaving(false); setModal(false);
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
              <div style={{display:'flex', gap:6}}>
                <button className="icon-button" onClick={() => openModal(s)}><Edit2 size={14}/></button>
                <button className="icon-button danger" onClick={() => remove(s.id)}><Trash2 size={14}/></button>
              </div>
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
  const [form, setForm] = useState({ id: null, name: '', description: '', price: '', stock_quantity: '0', category: 'Pomadas', image_url: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').eq('tenant_id', user.tenant_id);
    if (data) setProducts(data);
  }, [user.tenant_id]);
  useEffect(() => { load(); }, [load]);

  function openModal(p = null) {
    if (p) {
      setForm({ id: p.id, name: p.name, description: p.description || '', price: p.price, stock_quantity: p.stock_quantity, category: p.category, image_url: p.image_url || '' });
    } else {
      setForm({ id: null, name: '', description: '', price: '', stock_quantity: '0', category: 'Pomadas', image_url: '' });
    }
    setModal(true);
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      tenant_id: user.tenant_id, name: form.name, description: form.description,
      price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity),
      category: form.category, image_url: form.image_url || null,
    };
    if (form.id) {
      await supabase.from('products').update(payload).eq('id', form.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    setSaving(false); setModal(false);
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
                  <div style={{display:'flex', gap:6}}>
                    <button className="icon-button" onClick={() => openModal(p)}><Edit2 size={14}/></button>
                    <button className="icon-button danger" onClick={() => remove(p.id)}><Trash2 size={14}/></button>
                  </div>
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
// CLIENT APP — Full Experience
// -----------------------------------------------------------------------------
function ClientApp({ user, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('services');
  return (
    <div className="app-shell fade-in">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><MapPin size={14}/> MEMBRO</div>
        <nav>
          <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}><Scissors size={18}/>Serviços</button>
          <button className={activeTab === 'profile'  ? 'active' : ''} onClick={() => setActiveTab('profile')} ><User size={18}/>Meu Perfil</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="member-card">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.full_name} className="avatar avatar-img"/>
              : <div className="avatar">{user.full_name?.[0] || 'U'}</div>}
            <div><strong>{user.full_name}</strong><small>MEMBRO</small></div>
          </div>
          <button className="logout" onClick={onLogout}><LogOut size={16}/>Sair</button>
        </div>
      </aside>
      <main className="main-content">
        {activeTab === 'services' && <ClientServices user={user}/>}
        {activeTab === 'profile'  && <ClientProfile  user={user} onUpdate={onUserUpdate}/>}
      </main>
    </div>
  );
}

// ── Client Services (Service selection + Payment) ─────────────────────────────
function ClientServices({ user }) {
  const [services, setServices] = useState([]);
  const [barbers,  setBarbers]  = useState([]);
  const [selected, setSelected] = useState(null);   // selected service
  const [barber,   setBarber]   = useState(null);    // selected barber
  const [payMode,  setPayMode]  = useState(null);    // 'card' | 'pix'
  const [parcelas, setParcelas] = useState(1);
  const [buying,   setBuying]   = useState(false);

  useEffect(() => {
    // Load services and barbers for this tenant (or all if no tenant)
    supabase.from('services').select('*').eq('is_active', true)
      .then(({ data }) => data && setServices(data));
    supabase.from('barbers').select('*')
      .then(({ data }) => data && setBarbers(data));
  }, []);

  const total = selected ? parseFloat(selected.price) : 0;
  const parcelValue = total / parcelas;

  async function pay() {
    if (!selected) return;
    setBuying(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          product: {
            name: selected.name,
            description: barber ? `com ${barber.name}` : selected.description || '',
            price: selected.price,
            image_url: barber?.image || null,
          },
          payMode,
          installments: payMode === 'card' ? parcelas : 1,
        }),
      });
      const { url, error } = await res.json();
      if (error) { alert('Erro ao iniciar pagamento: ' + error); return; }
      if (url) window.location.href = url;
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="client-layout">
      {/* Left column — service selection */}
      <div className="client-main">
        <header className="topbar">
          <div>
            <div className="eyebrow">BEM-VINDO</div>
            <h2>Olá, {user.full_name?.split(' ')[0]}.</h2>
          </div>
        </header>

        <div className="eyebrow" style={{marginBottom:16}}>NOSSOS SERVIÇOS</div>
        <div className="client-service-grid">
          {services.length === 0 && (
            <div className="premium-empty" style={{gridColumn:'1/-1'}}>
              <Scissors size={28} opacity={0.2}/>
              <p>Nenhum serviço disponível no momento.</p>
            </div>
          )}
          {services.map(s => (
            <button
              key={s.id}
              className={`client-service-card ${selected?.id === s.id ? 'selected' : ''}`}
              onClick={() => { setSelected(selected?.id === s.id ? null : s); setPayMode(null); }}
            >
              <div className="csvc-icon"><Scissors size={20}/></div>
              <div className="csvc-body">
                <strong>{s.name}</strong>
                <span>{s.duration_minutes} min · {s.category}</span>
              </div>
              <div className="csvc-price">
                <strong>R$ {parseFloat(s.price).toFixed(2)}</strong>
                {selected?.id === s.id && <Check size={14} color="var(--gold)"/>}
              </div>
            </button>
          ))}
        </div>

        {selected && barbers.length > 0 && (
          <>
            <div className="eyebrow" style={{margin:'32px 0 14px'}}>ESCOLHA O PROFISSIONAL <span style={{color:'#555',letterSpacing:0}}>(opcional)</span></div>
            <div className="barber-pick-row">
              <button
                className={`barber-pick-card ${barber === null ? 'selected' : ''}`}
                onClick={() => setBarber(null)}
              >
                <div className="bpc-avatar">?</div>
                <span>Qualquer</span>
              </button>
              {barbers.map(b => (
                <button
                  key={b.id}
                  className={`barber-pick-card ${barber?.id === b.id ? 'selected' : ''}`}
                  onClick={() => setBarber(barber?.id === b.id ? null : b)}
                >
                  <div className="bpc-avatar">
                    {b.image ? <img src={b.image} alt={b.name}/> : b.name[0]}
                  </div>
                  <span>{b.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right column — order summary + payment */}
      <div className={`client-order-panel ${selected ? 'visible' : ''}`}>
        <div className="eyebrow" style={{marginBottom:20}}>RESUMO DO PEDIDO</div>

        {!selected ? (
          <div className="order-empty"><Scissors size={28} opacity={0.12}/><p>Selecione um serviço ao lado</p></div>
        ) : (
          <>
            <div className="order-service-item">
              <div className="osi-icon"><Scissors size={16}/></div>
              <div className="osi-body">
                <strong>{selected.name}</strong>
                <span>{selected.duration_minutes} min</span>
              </div>
              <strong className="osi-price">R$ {parseFloat(selected.price).toFixed(2)}</strong>
            </div>

            {barber && (
              <div className="order-service-item" style={{marginTop:8}}>
                <div className="osi-icon">
                  {barber.image ? <img src={barber.image} alt={barber.name} style={{width:24,height:24,objectFit:'cover',borderRadius:'50%'}}/> : <User size={16}/>}
                </div>
                <div className="osi-body"><strong>{barber.name}</strong><span>Profissional</span></div>
              </div>
            )}

            <div className="order-total">
              <span>Total</span>
              <strong>R$ {total.toFixed(2)}</strong>
            </div>

            <div className="eyebrow" style={{margin:'24px 0 12px'}}>FORMA DE PAGAMENTO</div>
            <div className="pay-methods">
              <button
                className={`pay-method-btn ${payMode === 'pix' ? 'active' : ''}`}
                onClick={() => setPayMode('pix')}
              >
                <QrCode size={20}/> PIX
                <small>À vista · aprovação imediata</small>
              </button>
              <button
                className={`pay-method-btn ${payMode === 'card' ? 'active' : ''}`}
                onClick={() => setPayMode('card')}
              >
                <CreditCard size={20}/> Cartão
                <small>Crédito ou débito</small>
              </button>
            </div>

            {payMode === 'card' && (
              <div style={{marginTop:14}}>
                <div className="eyebrow" style={{marginBottom:10}}>PARCELAMENTO</div>
                <div className="parcelas-grid">
                  {[1,2,3,4,6,12].map(n => (
                    <button
                      key={n}
                      className={`parcela-btn ${parcelas === n ? 'active' : ''}`}
                      onClick={() => setParcelas(n)}
                    >
                      <strong>{n}x</strong>
                      <span>R$ {(total/n).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
                {parcelas > 1 && <p className="parcela-note">Sem juros até 3x · sujeito a aprovação a partir de 4x</p>}
              </div>
            )}

            {payMode && (
              <button
                className="gold-button"
                style={{marginTop:28,width:'100%'}}
                onClick={pay}
                disabled={buying}
              >
                {buying ? 'Aguarde...' : `Pagar ${payMode === 'pix' ? 'via PIX' : `${parcelas}x de R$ ${parcelValue.toFixed(2)}`}`}
                <ChevronRight size={16}/>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Client Profile ─────────────────────────────────────────────────────────────
function ClientProfile({ user, onUpdate }) {
  const [form, setForm]     = useState({ full_name: user.full_name || '', email: user.email || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  async function save() {
    setSaving(true); setMsg('');
    // Update profile table
    const { error: pe } = await supabase.from('user_profiles').update({ full_name: form.full_name }).eq('id', user.id);
    // Update email if changed
    if (form.email !== user.email) {
      const { error: ee } = await supabase.auth.updateUser({ email: form.email });
      if (ee) { setMsg('Erro ao atualizar email: ' + ee.message); setSaving(false); return; }
    }
    // Update password if filled
    if (form.password.length >= 6) {
      const { error: we } = await supabase.auth.updateUser({ password: form.password });
      if (we) { setMsg('Erro ao atualizar senha: ' + we.message); setSaving(false); return; }
    }
    if (pe) { setMsg('Erro: ' + pe.message); } else {
      setMsg('Perfil atualizado com sucesso!');
      if (onUpdate) onUpdate({ ...user, full_name: form.full_name });
    }
    setSaving(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      await supabase.from('user_profiles').update({ avatar_url: url }).eq('id', user.id);
      if (onUpdate) onUpdate({ ...user, avatar_url: url });
    }
  }

  return (
    <div className="admin-view fade-in">
      <header className="topbar"><div><div className="eyebrow">CONTA</div><h2>Meu Perfil.</h2></div></header>

      <div className="profile-edit-layout">
        {/* Avatar */}
        <div className="profile-avatar-block">
          <label className="avatar-upload-wrap" style={{cursor:'pointer'}}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.full_name} className="avatar-large"/>
              : <div className="avatar-large avatar-placeholder">{user.full_name?.[0] || 'U'}</div>}
            <div className="avatar-overlay"><Camera size={18}/> Alterar foto</div>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload}/>
          </label>
          <strong style={{marginTop:14,fontSize:16}}>{user.full_name}</strong>
          <small style={{color:'#666'}}>{user.email}</small>
        </div>

        {/* Form */}
        <div className="profile-form">
          <div className="modal-form" style={{marginTop:0}}>
            <label>Nome completo
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}/>
            </label>
            <label>E-mail
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
            </label>
            <label>Nova senha <span className="label-hint">(deixe em branco para manter a atual)</span>
              <input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})}/>
            </label>
            {msg && <p style={{color: msg.includes('Erro') ? '#d98080' : '#51c18a', fontSize:12, marginTop:12}}>{msg}</p>}
            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}<ChevronRight size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// APP CONTENT / ROUTER
// -----------------------------------------------------------------------------
function AppContent() {
  const [user, setUser]       = useState(null);
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
        .from('user_profiles').select('*').eq('id', session.user.id).single();
      if (error) console.warn('Profile fetch error:', error.message);
      const meta = session.user.user_metadata || {};
      setUser({
        ...session.user,
        full_name: profile?.full_name || meta.full_name || meta.name || session.user.email,
        role:      profile?.role      || meta.role      || 'client',
        tenant_id: profile?.tenant_id || null,
        avatar_url: profile?.avatar_url || null,
        ...(profile || {}),
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setShowAuth(null);
  }

  if (loading) return <div className="loading-screen">ATELIER<span>BARBER</span></div>;

  if (!user) {
    if (showAuth) return <Login onLogin={setUser} initialMode={showAuth}/>;
    return <LandingPage onEnterApp={setShowAuth}/>;
  }

  if (user.role === 'admin') return <AdminApp user={user} onLogout={handleLogout}/>;

  return <ClientApp user={user} onLogout={handleLogout} onUserUpdate={u => setUser(u)}/>;
}

export default function App() { return <BrowserRouter><AppContent/></BrowserRouter>; }
