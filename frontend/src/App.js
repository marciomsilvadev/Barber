import { useCallback, useEffect, useRef, useState } from "react";
import "@/App.css";
import {
  CalendarDays, Camera, ChevronRight, Clock3, CreditCard, Edit2, LogOut, MapPin,
  QrCode, Scissors, ShieldCheck, Star, Trash2, User, X, ShoppingBag, Plus, Play, Check,
  Lock, CheckCircle2, Copy, Calendar, Clock, AlertCircle
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

// ── Auto Capitalize First Letter Helper ────────────────────────────────────────
function autoCap(str) {
  if (typeof str !== 'string' || !str) return str || '';
  return str.replace(/^(\s*)([a-z\u00E0-\u00FD])/i, (_, space, char) => space + char.toUpperCase());
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
        const { error: err } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.name } }
        });
        if (err) throw err;
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
          
          <form onSubmit={submit}>
            {mode === "register" && (
              <input placeholder="Seu nome" value={form.name} onChange={e => setForm({ ...form, name: autoCap(e.target.value) })} required />
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

// ── Image Upload & Compression Helper ─────────────────────────────────────────
function dataURLtoBlob(dataurl) {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.88, cropToSquare = false) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const { width, height } = img;

        if (cropToSquare) {
          // Auto-adjust by center-cropping to square (perfect for round avatars)
          const size = Math.min(width, height);
          const sx = (width - size) / 2;
          const sy = (height - size) / 2;
          const targetSize = Math.min(size, maxWidth);
          canvas.width = targetSize;
          canvas.height = targetSize;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
        } else {
          // Auto-adjust proportionally preserving full image content
          let newW = width;
          let newH = height;
          if (newW > newH) {
            if (newW > maxWidth) {
              newH = Math.round((newH * maxWidth) / newW);
              newW = maxWidth;
            }
          } else {
            if (newH > maxHeight) {
              newW = Math.round((newW * maxHeight) / newH);
              newH = maxHeight;
            }
          }
          canvas.width = newW;
          canvas.height = newH;
          ctx.drawImage(img, 0, 0, newW, newH);
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
    };
    reader.onerror = () => resolve(null);
  });
}

async function uploadImage(file, bucket = 'images', cropToSquare = false) {
  const compressed = await compressImage(file, 800, 800, 0.88, cropToSquare);
  try {
    const ext = 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blob = compressed ? dataURLtoBlob(compressed) : file;
    const { error } = await supabase.storage.from(bucket).upload(path, blob || file, {
      upsert: true,
      contentType: 'image/jpeg'
    });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch (err) {
    console.warn('Storage upload error, using local compressed data URL:', err);
  }
  // Se o bucket não existir ou der erro no Supabase Storage, usa o base64 comprimido auto-ajustado
  return compressed;
}

function ImageUploadField({ label, value, onChange }) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  async function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, 'images', false);
    setUploading(false);
    if (url) {
      setPreview(url);
      onChange(url);
    }
  }

  function handleRemove(e) {
    e.stopPropagation();
    setPreview(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="image-upload-field">
      <span className="upload-label">{label}</span>
      <div
        className={`image-upload-box ${preview ? 'has-preview' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="upload-hint">
            <Camera size={24} color="var(--gold)"/>
            <span>Auto-ajustando e otimizando foto...</span>
          </div>
        ) : preview ? (
          <div className="upload-preview-wrapper">
            <img src={preview} alt="preview" className="upload-preview" />
            <div className="upload-preview-overlay">
              <Camera size={18}/>
              <span>Clique para trocar foto</span>
            </div>
          </div>
        ) : (
          <div className="upload-hint">
            <Camera size={24} color="var(--gold)"/>
            <span>Clique para anexar foto</span>
            <small style={{color:'#666', fontSize:10}}>A foto se auto-ajusta proporcionalmente</small>
          </div>
        )}
      </div>

      {preview && !uploading && (
        <div className="preview-actions-bar">
          <span className="auto-adjusted-tag">
            <Check size={12} color="var(--gold)"/> Foto auto-ajustada
          </span>
          <button type="button" className="remove-photo-btn" onClick={handleRemove}>
            <Trash2 size={12}/> Remover
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handle}
      />
    </div>
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
            <label>Nome completo<input placeholder="Ex: Rafael Moura" value={form.name} onChange={e => setForm({...form, name: autoCap(e.target.value)})}/></label>
            <label>Especialidades <span className="label-hint">(separe por vírgula)</span><input placeholder="Corte, Barba, Coloração" value={form.specialties} onChange={e => setForm({...form, specialties: autoCap(e.target.value)})}/></label>
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
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('barber_custom_service_cats') || '[]');
    } catch { return []; }
  });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', description: '', price: '', duration_minutes: '45', category: 'Barbearia' });
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catModal, setCatModal] = useState(false);
  const [modalCatName, setModalCatName] = useState('');
  const [saving, setSaving] = useState(false);

  const defaultCats = ['Barbearia', 'Cabelo', 'Barba', 'Manicure', 'Estética', 'Combo', 'Sobrancelha', 'Tratamento', 'Infantil'];
  const allCategories = Array.from(new Set([
    ...defaultCats,
    ...customCategories,
    ...services.map(s => s.category).filter(Boolean)
  ]));

  const load = useCallback(async () => {
    let query = supabase.from('services').select('*');
    if (user.tenant_id) query = query.eq('tenant_id', user.tenant_id);
    const { data } = await query;
    if (data) setServices(data);
  }, [user.tenant_id]);

  useEffect(() => { load(); }, [load]);

  function openModal(s = null) {
    if (s) {
      setForm({ id: s.id, name: s.name, description: s.description || '', price: s.price, duration_minutes: s.duration_minutes, category: s.category || allCategories[0] });
    } else {
      setForm({ id: null, name: '', description: '', price: '', duration_minutes: '45', category: allCategories[0] || 'Barbearia' });
    }
    setShowNewCatInput(false);
    setNewCatName('');
    setModal(true);
  }

  function handleAddCategory() {
    const trimmed = autoCap(newCatName.trim());
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('barber_custom_service_cats', JSON.stringify(updated));
    }
    setForm({ ...form, category: trimmed });
    setNewCatName('');
    setShowNewCatInput(false);
  }

  function handleCreateCategoryFromModal() {
    const trimmed = autoCap(modalCatName.trim());
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('barber_custom_service_cats', JSON.stringify(updated));
    }
    setModalCatName('');
  }

  function handleDeleteCustomCategory(catToDelete) {
    const updated = customCategories.filter(c => c !== catToDelete);
    setCustomCategories(updated);
    localStorage.setItem('barber_custom_service_cats', JSON.stringify(updated));
    if (selectedCat === catToDelete) setSelectedCat('Todos');
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      tenant_id: user.tenant_id || '77dab26d-b0de-49e0-995f-6dc1c9c4fbe8',
      name: autoCap(form.name),
      description: autoCap(form.description),
      price: parseFloat(form.price),
      duration_minutes: parseInt(form.duration_minutes),
      category: autoCap(form.category),
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

  const displayedServices = selectedCat === 'Todos'
    ? services
    : services.filter(s => s.category === selectedCat);

  return (
    <section className="admin-view fade-in">
      <div className="section-head">
        <div><h3>Catálogo de Serviços</h3><p className="section-sub">{services.length} serviço{services.length !== 1 ? 's' : ''} cadastrado{services.length !== 1 ? 's' : ''}</p></div>
        <div style={{display:'flex', gap:8}}>
          <button className="outline-button compact" onClick={() => { setModalCatName(''); setCatModal(true); }}>
            <Plus size={15}/> Categorias
          </button>
          <button className="gold-button compact" onClick={() => openModal(null)}><Plus size={15}/> Novo Serviço</button>
        </div>
      </div>

      {/* Category Filter Pills */}
      {services.length > 0 && (
        <div className="category-filter-row">
          <button
            className={`cat-pill ${selectedCat === 'Todos' ? 'active' : ''}`}
            onClick={() => setSelectedCat('Todos')}
          >
            Todos ({services.length})
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${selectedCat === cat ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
          <button
            className="cat-pill add-cat-pill"
            onClick={() => { setModalCatName(''); setCatModal(true); }}
          >
            + Nova Categoria
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <div className="premium-empty">
          <CalendarDays size={32} opacity={0.2}/>
          <p>Nenhum serviço cadastrado ainda.</p>
          <button className="outline-button compact" style={{width:'auto',margin:'16px auto 0'}} onClick={() => openModal(null)}>Criar primeiro serviço</button>
        </div>
      ) : (
        <div className="service-table">
          {displayedServices.map(s => (
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
        <Modal title={form.id ? "Editar Serviço" : "Novo Serviço"} onClose={() => setModal(false)}>
          <div className="modal-form">
            <label>Nome do serviço<input placeholder="Ex: Corte Clássico" value={form.name} onChange={e => setForm({...form, name: autoCap(e.target.value)})}/></label>
            <label>Descrição <span className="label-hint">(opcional)</span><input placeholder="Corte com tesoura e alinhamento de barba" value={form.description} onChange={e => setForm({...form, description: autoCap(e.target.value)})}/></label>
            <div className="form-row">
              <label>Preço (R$)<input type="number" placeholder="80" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></label>
              <label>Duração (min)<input type="number" placeholder="45" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})}/></label>
            </div>
            
            <label>Categoria
              <div style={{display:'flex', gap:8, alignItems:'center', marginTop:4}}>
                <select
                  value={form.category}
                  onChange={e => {
                    if (e.target.value === '__NEW__') {
                      setShowNewCatInput(true);
                    } else {
                      setForm({...form, category: e.target.value});
                      setShowNewCatInput(false);
                    }
                  }}
                  style={{flex:1}}
                >
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__NEW__">+ Criar Nova Categoria...</option>
                </select>
                <button
                  type="button"
                  className="outline-button compact"
                  style={{padding:'8px 12px', fontSize:11, whiteSpace:'nowrap'}}
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                >
                  {showNewCatInput ? 'Cancelar' : '+ Nova Categoria'}
                </button>
              </div>
            </label>

            {showNewCatInput && (
              <div style={{display:'flex', gap:8, alignItems:'center', background:'#181818', padding:10, border:'1px solid var(--gold)', marginTop:6}}>
                <input
                  placeholder="Nome da nova categoria"
                  value={newCatName}
                  onChange={e => setNewCatName(autoCap(e.target.value))}
                  style={{flex:1, background:'#111', border:'1px solid var(--line)', color:'#fff', padding:'8px 12px'}}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                />
                <button
                  type="button"
                  className="gold-button compact"
                  style={{padding:'8px 14px'}}
                  onClick={handleAddCategory}
                >
                  Adicionar
                </button>
              </div>
            )}

            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>{saving ? 'Salvando...' : (form.id ? 'Salvar alterações' : 'Criar serviço')}<ChevronRight size={16}/></button>
          </div>
        </Modal>
      )}

      {catModal && (
        <Modal title="Gerenciar Categorias de Serviços" onClose={() => setCatModal(false)}>
          <div className="modal-form">
            <label>Criar nova categoria
              <div style={{display:'flex', gap:8, marginTop:6}}>
                <input
                  placeholder="Ex: Barboterapia, Noivo, Coloração..."
                  value={modalCatName}
                  onChange={e => setModalCatName(autoCap(e.target.value))}
                  style={{flex:1}}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategoryFromModal(); } }}
                />
                <button
                  type="button"
                  className="gold-button compact"
                  style={{padding:'8px 16px', whiteSpace:'nowrap'}}
                  onClick={handleCreateCategoryFromModal}
                >
                  <Plus size={14}/> Criar
                </button>
              </div>
            </label>

            <div style={{marginTop:24}}>
              <span style={{fontSize:11, color:'#888', textTransform:'uppercase', letterSpacing:1}}>Categorias Existentes</span>
              <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:10, maxHeight:220, overflowY:'auto', padding:'4px 0'}}>
                {allCategories.map(c => {
                  const isCustom = customCategories.includes(c);
                  return (
                    <div
                      key={c}
                      style={{
                        display:'flex', alignItems:'center', gap:8,
                        background:'#1a1a1a', border:'1px solid var(--line)',
                        padding:'6px 12px', borderRadius:20, fontSize:12, color:'#eee'
                      }}
                    >
                      <span>{c}</span>
                      {isCustom ? (
                        <button
                          type="button"
                          style={{background:'none', border:'none', color:'#d98080', cursor:'pointer', padding:0, display:'flex'}}
                          onClick={() => handleDeleteCustomCategory(c)}
                          title="Remover categoria personalizada"
                        >
                          <X size={13}/>
                        </button>
                      ) : (
                        <span style={{fontSize:9, color:'#666', background:'#252525', padding:'1px 5px', borderRadius:4}}>padrão</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Products ───────────────────────────────────────────────────────────────────
function AdminProducts({ user }) {
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('barber_custom_product_cats') || '[]');
    } catch { return []; }
  });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', description: '', price: '', stock_quantity: '0', category: 'Pomadas', image_url: '' });
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catModal, setCatModal] = useState(false);
  const [modalCatName, setModalCatName] = useState('');
  const [saving, setSaving] = useState(false);

  const defaultCats = ['Pomadas', 'Shampoos', 'Cremes', 'Óleos', 'Acessórios', 'Kits', 'Lâminas', 'Perfumaria'];
  const allCategories = Array.from(new Set([
    ...defaultCats,
    ...customCategories,
    ...products.map(p => p.category).filter(Boolean)
  ]));

  const load = useCallback(async () => {
    let query = supabase.from('products').select('*');
    if (user.tenant_id) query = query.eq('tenant_id', user.tenant_id);
    const { data } = await query;
    if (data) setProducts(data);
  }, [user.tenant_id]);

  useEffect(() => { load(); }, [load]);

  function openModal(p = null) {
    if (p) {
      setForm({ id: p.id, name: p.name, description: p.description || '', price: p.price, stock_quantity: p.stock_quantity, category: p.category || allCategories[0], image_url: p.image_url || '' });
    } else {
      setForm({ id: null, name: '', description: '', price: '', stock_quantity: '0', category: allCategories[0] || 'Pomadas', image_url: '' });
    }
    setShowNewCatInput(false);
    setNewCatName('');
    setModal(true);
  }

  function handleAddCategory() {
    const trimmed = autoCap(newCatName.trim());
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('barber_custom_product_cats', JSON.stringify(updated));
    }
    setForm({ ...form, category: trimmed });
    setNewCatName('');
    setShowNewCatInput(false);
  }

  function handleCreateCategoryFromModal() {
    const trimmed = autoCap(modalCatName.trim());
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('barber_custom_product_cats', JSON.stringify(updated));
    }
    setModalCatName('');
  }

  function handleDeleteCustomCategory(catToDelete) {
    const updated = customCategories.filter(c => c !== catToDelete);
    setCustomCategories(updated);
    localStorage.setItem('barber_custom_product_cats', JSON.stringify(updated));
    if (selectedCat === catToDelete) setSelectedCat('Todos');
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      tenant_id: user.tenant_id || '77dab26d-b0de-49e0-995f-6dc1c9c4fbe8',
      name: autoCap(form.name),
      description: autoCap(form.description),
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      category: autoCap(form.category),
      image_url: form.image_url || null,
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

  const displayedProducts = selectedCat === 'Todos'
    ? products
    : products.filter(p => p.category === selectedCat);

  return (
    <section className="admin-view fade-in">
      <div className="section-head">
        <div><h3>Boutique (E-commerce)</h3><p className="section-sub">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p></div>
        <div style={{display:'flex', gap:8}}>
          <button className="outline-button compact" onClick={() => { setModalCatName(''); setCatModal(true); }}>
            <Plus size={15}/> Categorias
          </button>
          <button className="gold-button compact" onClick={() => openModal(null)}><Plus size={15}/> Novo Produto</button>
        </div>
      </div>

      {/* Category Filter Pills */}
      {products.length > 0 && (
        <div className="category-filter-row">
          <button
            className={`cat-pill ${selectedCat === 'Todos' ? 'active' : ''}`}
            onClick={() => setSelectedCat('Todos')}
          >
            Todos ({products.length})
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${selectedCat === cat ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
          <button
            className="cat-pill add-cat-pill"
            onClick={() => { setModalCatName(''); setCatModal(true); }}
          >
            + Nova Categoria
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="premium-empty">
          <ShoppingBag size={32} opacity={0.2}/>
          <p>Nenhum produto na boutique ainda.</p>
          <button className="outline-button compact" style={{width:'auto',margin:'16px auto 0'}} onClick={() => openModal(null)}>Adicionar primeiro produto</button>
        </div>
      ) : (
        <div className="pro-card-grid">
          {displayedProducts.map(p => (
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
        <Modal title={form.id ? "Editar Produto" : "Novo Produto"} onClose={() => setModal(false)}>
          <div className="modal-form">
            <label>Nome do produto<input placeholder="Ex: Pomada Matte Premium" value={form.name} onChange={e => setForm({...form, name: autoCap(e.target.value)})}/></label>
            <label>Descrição <span className="label-hint">(opcional)</span><input placeholder="Fixação forte, acabamento seco" value={form.description} onChange={e => setForm({...form, description: autoCap(e.target.value)})}/></label>
            <div className="form-row">
              <label>Preço (R$)<input type="number" placeholder="89.90" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></label>
              <label>Estoque<input type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})}/></label>
            </div>
            
            <label>Categoria
              <div style={{display:'flex', gap:8, alignItems:'center', marginTop:4}}>
                <select
                  value={form.category}
                  onChange={e => {
                    if (e.target.value === '__NEW__') {
                      setShowNewCatInput(true);
                    } else {
                      setForm({...form, category: e.target.value});
                      setShowNewCatInput(false);
                    }
                  }}
                  style={{flex:1}}
                >
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__NEW__">+ Criar Nova Categoria...</option>
                </select>
                <button
                  type="button"
                  className="outline-button compact"
                  style={{padding:'8px 12px', fontSize:11, whiteSpace:'nowrap'}}
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                >
                  {showNewCatInput ? 'Cancelar' : '+ Nova Categoria'}
                </button>
              </div>
            </label>

            {showNewCatInput && (
              <div style={{display:'flex', gap:8, alignItems:'center', background:'#181818', padding:10, border:'1px solid var(--gold)', marginTop:6}}>
                <input
                  placeholder="Nome da nova categoria"
                  value={newCatName}
                  onChange={e => setNewCatName(autoCap(e.target.value))}
                  style={{flex:1, background:'#111', border:'1px solid var(--line)', color:'#fff', padding:'8px 12px'}}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                />
                <button
                  type="button"
                  className="gold-button compact"
                  style={{padding:'8px 14px'}}
                  onClick={handleAddCategory}
                >
                  Adicionar
                </button>
              </div>
            )}

            <ImageUploadField label="Foto do produto" value={form.image_url} onChange={url => setForm({...form, image_url: url})}/>
            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>{saving ? 'Salvando...' : (form.id ? 'Salvar alterações' : 'Adicionar produto')}<ChevronRight size={16}/></button>
          </div>
        </Modal>
      )}

      {catModal && (
        <Modal title="Gerenciar Categorias de Produtos" onClose={() => setCatModal(false)}>
          <div className="modal-form">
            <label>Criar nova categoria
              <div style={{display:'flex', gap:8, marginTop:6}}>
                <input
                  placeholder="Ex: Ceras, Barba, Acessórios, Óleos..."
                  value={modalCatName}
                  onChange={e => setModalCatName(autoCap(e.target.value))}
                  style={{flex:1}}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategoryFromModal(); } }}
                />
                <button
                  type="button"
                  className="gold-button compact"
                  style={{padding:'8px 16px', whiteSpace:'nowrap'}}
                  onClick={handleCreateCategoryFromModal}
                >
                  <Plus size={14}/> Criar
                </button>
              </div>
            </label>

            <div style={{marginTop:24}}>
              <span style={{fontSize:11, color:'#888', textTransform:'uppercase', letterSpacing:1}}>Categorias Existentes</span>
              <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:10, maxHeight:220, overflowY:'auto', padding:'4px 0'}}>
                {allCategories.map(c => {
                  const isCustom = customCategories.includes(c);
                  return (
                    <div
                      key={c}
                      style={{
                        display:'flex', alignItems:'center', gap:8,
                        background:'#1a1a1a', border:'1px solid var(--line)',
                        padding:'6px 12px', borderRadius:20, fontSize:12, color:'#eee'
                      }}
                    >
                      <span>{c}</span>
                      {isCustom ? (
                        <button
                          type="button"
                          style={{background:'none', border:'none', color:'#d98080', cursor:'pointer', padding:0, display:'flex'}}
                          onClick={() => handleDeleteCustomCategory(c)}
                          title="Remover categoria personalizada"
                        >
                          <X size={13}/>
                        </button>
                      ) : (
                        <span style={{fontSize:9, color:'#666', background:'#252525', padding:'1px 5px', borderRadius:4}}>padrão</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}><CalendarDays size={18}/>Agendamentos</button>
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
        {activeTab === 'services' && (
          <ClientServices user={user} onGoToAppointments={() => setActiveTab('appointments')}/>
        )}
        {activeTab === 'appointments' && (
          <ClientAppointments user={user} onGoToServices={() => setActiveTab('services')}/>
        )}
        {activeTab === 'profile' && (
          <ClientProfile user={user} onUpdate={onUserUpdate}/>
        )}
      </main>
    </div>
  );
}

// ── Client Appointments Tab ───────────────────────────────────────────────────
function ClientAppointments({ user, onGoToServices }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, barbers(name, image)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setAppointments(data);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function cancelAppointment(id) {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return;
    await supabase.from('appointments').update({ status: 'Cancelado' }).eq('id', id);
    loadAppointments();
  }

  return (
    <div className="admin-view fade-in">
      <header className="topbar">
        <div>
          <div className="eyebrow">HISTÓRICO & RESERVAS</div>
          <h2>Meus Agendamentos.</h2>
        </div>
      </header>

      {loading ? (
        <div style={{color:'#888', padding:40, textAlign:'center'}}>Carregando seus agendamentos...</div>
      ) : appointments.length === 0 ? (
        <div className="premium-empty" style={{marginTop:30}}>
          <CalendarDays size={32} opacity={0.2}/>
          <p>Você ainda não possui agendamentos marcados.</p>
          <button className="gold-button" style={{marginTop:16}} onClick={onGoToServices}>
            Agendar um Serviço <ChevronRight size={16}/>
          </button>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map(a => (
            <div key={a.id} className="appointment-card">
              <div className="appt-top">
                <div>
                  <h4>{a.service_type || 'Serviço'}</h4>
                  <div style={{fontSize:11, color:'#888'}}>
                    {a.barbers?.name ? `Com ${a.barbers.name}` : 'Profissional Atelier'}
                  </div>
                </div>
                <div style={{display:'flex', gap:6}}>
                  <span className={`appt-badge ${a.payment_status === 'Pago' ? 'paid' : ''}`}>
                    {a.payment_status || 'Pendente'}
                  </span>
                  <span className={`appt-badge ${a.status === 'Confirmado' ? 'confirmed' : ''}`}>
                    {a.status}
                  </span>
                </div>
              </div>

              <div className="appt-meta">
                <div className="appt-meta-row">
                  <Calendar size={14} color="var(--gold)"/>
                  <span>{a.date ? a.date.split('-').reverse().join('/') : 'Data a definir'}</span>
                </div>
                <div className="appt-meta-row">
                  <Clock size={14} color="var(--gold)"/>
                  <span>{a.time || '10:00'}</span>
                </div>
              </div>

              <div className="appt-footer">
                <span className="appt-price">R$ {parseFloat(a.price || 0).toFixed(2)}</span>
                {a.status !== 'Cancelado' && (
                  <button
                    className="text-button"
                    style={{color:'#d98080', fontSize:11}}
                    onClick={() => cancelAppointment(a.id)}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payment Modal (Window to enter card, save, schedule & pay) ────────────────
function PaymentModal({
  isOpen,
  onClose,
  user,
  selected,
  barber,
  barbers,
  payMode,
  parcelas,
  onSuccessAppointment,
  onGoToAppointments,
}) {
  const [savedCards, setSavedCards] = useState([]);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user.full_name?.toUpperCase() || '');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCardCheck, setSaveCardCheck] = useState(true);

  // Schedule State
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  const [bookingDate, setBookingDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');

  // Flow State
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load saved cards from localStorage
  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = JSON.parse(localStorage.getItem(`barber_saved_cards_${user.id}`) || '[]');
      setSavedCards(stored);
      if (stored.length > 0) {
        setUseSavedCard(true);
        setSelectedCardId(stored[0].id);
      }
    } catch {
      setSavedCards([]);
    }
  }, [user?.id, isOpen]);

  if (!isOpen || !selected) return null;

  const total = parseFloat(selected.price || 0);
  const parcelValue = total / parcelas;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  }

  // Format Expiry (MM/AA)
  function handleExpChange(e) {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExp(raw);
  }

  // Detect Brand
  function detectBrand(num) {
    const clean = (num || '').replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
    if (/^3[47]/.test(clean)) return 'AMEX';
    if (/^6(011|5)/.test(clean)) return 'ELO';
    return 'CARTÃO';
  }

  const currentBrand = useSavedCard
    ? (savedCards.find(c => c.id === selectedCardId)?.brand || 'CARTÃO')
    : detectBrand(cardNumber);

  // Pix Copia e Cola generator
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${user.id || 'atelier-barber'}5204000053039865405${total.toFixed(2)}5802BR5914ATELIER BARBER6009SAO PAULO62070503***6304`;

  function copyPix() {
    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  }

  async function handleConfirmPayment(e) {
    e?.preventDefault();
    setErrorMsg('');

    if (payMode === 'card') {
      if (!useSavedCard) {
        const cleanNum = cardNumber.replace(/\D/g, '');
        if (cleanNum.length < 15) {
          setErrorMsg('Por favor, informe um número de cartão válido.');
          return;
        }
        if (!cardHolder.trim()) {
          setErrorMsg('Informe o nome impresso no cartão.');
          return;
        }
        if (cardExp.length < 5) {
          setErrorMsg('Informe a validade do cartão (MM/AA).');
          return;
        }
        if (cardCvv.length < 3) {
          setErrorMsg('Informe o CVV do cartão (3 ou 4 dígitos).');
          return;
        }
      }
    }

    setProcessing(true);

    try {
      // 1. Simula autorização imediata da operadora
      await new Promise(r => setTimeout(r, 1200));

      // 2. Salva cartão se solicitado
      if (payMode === 'card' && saveCardCheck && !useSavedCard) {
        const cleanNum = cardNumber.replace(/\D/g, '');
        const newCard = {
          id: String(Date.now()),
          last4: cleanNum.slice(-4),
          brand: currentBrand,
          holder: cardHolder.toUpperCase(),
          exp: cardExp,
        };
        const updated = [...savedCards.filter(c => c.last4 !== newCard.last4), newCard];
        localStorage.setItem(`barber_saved_cards_${user.id}`, JSON.stringify(updated));
        setSavedCards(updated);
      }

      // 3. Salva o agendamento no Supabase
      const barberSelected = barber || (barbers && barbers.length > 0 ? barbers[0] : null);
      const apptRecord = {
        tenant_id: selected.tenant_id || user.tenant_id || '77dab26d-b0de-49e0-995f-6dc1c9c4fbe8',
        client_id: user.id,
        barber_id: barberSelected?.id || null,
        service_id: selected.id,
        service_type: selected.name,
        price: total,
        date: bookingDate,
        time: bookingTime,
        status: 'Confirmado',
        payment_status: 'Pago',
      };

      const { data: inserted, error: dbErr } = await supabase
        .from('appointments')
        .insert(apptRecord)
        .select()
        .single();

      if (dbErr) {
        console.warn('DB insert notice:', dbErr.message);
      }

      setConfirmedAppt({
        ...apptRecord,
        id: inserted?.id || String(Date.now()),
        barber_name: barberSelected?.name || 'Profissional Atelier',
      });
      setIsSuccess(true);
      if (onSuccessAppointment) onSuccessAppointment(inserted || apptRecord);
    } catch (err) {
      setErrorMsg('Falha ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  }

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  return (
    <div className="payment-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !processing) onClose(); }}>
      <div className="payment-modal">
        {/* Header */}
        <div className="payment-modal-header">
          <div>
            <div className="eyebrow">PAGAMENTO SEGURO · ATELIER</div>
            <h3>{isSuccess ? 'Reserva Confirmada' : 'Finalizar Pagamento'}</h3>
          </div>
          {!processing && (
            <button className="modal-close-btn" onClick={onClose}><X size={20}/></button>
          )}
        </div>

        <div className="payment-modal-body">
          {/* SUCCESS SCREEN */}
          {isSuccess ? (
            <div className="payment-success-box">
              <div className="success-check-circle">
                <CheckCircle2 size={40} color="var(--gold)"/>
              </div>
              <h3>Pagamento Aprovado!</h3>
              <p>Sua reserva foi confirmada com sucesso no Atelier Barber.</p>

              <div className="success-receipt">
                <div className="receipt-row">
                  <span>Serviço:</span>
                  <strong>{selected.name} ({selected.duration_minutes} min)</strong>
                </div>
                <div className="receipt-row">
                  <span>Profissional:</span>
                  <strong>{confirmedAppt?.barber_name || 'Profissional Atelier'}</strong>
                </div>
                <div className="receipt-row">
                  <span>Data e Hora:</span>
                  <strong>{bookingDate.split('-').reverse().join('/')} às {bookingTime}</strong>
                </div>
                <div className="receipt-row">
                  <span>Forma de Pagamento:</span>
                  <strong>{payMode === 'card' ? `Cartão (${parcelas}x)` : 'PIX Instantâneo'}</strong>
                </div>
                <div className="receipt-row">
                  <span>Status:</span>
                  <strong style={{color:'#51c18a'}}>Pago & Confirmado</strong>
                </div>
                <div className="receipt-row" style={{borderTop:'1px solid var(--gold)', marginTop:6, paddingTop:6}}>
                  <span>Total Cobrado:</span>
                  <strong style={{color:'var(--gold)', fontSize:14}}>R$ {total.toFixed(2)}</strong>
                </div>
              </div>

              <div style={{display:'flex', gap:10, width:'100%'}}>
                <button
                  className="outline-button"
                  style={{flex:1}}
                  onClick={() => { onClose(); }}
                >
                  Concluir
                </button>
                <button
                  className="gold-button"
                  style={{flex:1}}
                  onClick={() => { onClose(); if (onGoToAppointments) onGoToAppointments(); }}
                >
                  Ver Agendamentos <ChevronRight size={16}/>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Order Summary Strip */}
              <div className="checkout-summary-banner">
                <div className="csb-left">
                  <strong>{selected.name}</strong>
                  <span>{barber ? `com ${barber.name}` : 'Profissional a definir'} · {selected.duration_minutes} min</span>
                </div>
                <div className="csb-right">
                  <strong>R$ {total.toFixed(2)}</strong>
                  <small>{payMode === 'card' && parcelas > 1 ? `${parcelas}x de R$ ${parcelValue.toFixed(2)}` : 'À vista'}</small>
                </div>
              </div>

              {/* Date and Time Selector */}
              <div className="booking-schedule-section">
                <div className="schedule-header">
                  <Calendar size={14}/> ESCOLHA A DATA E HORÁRIO DA VISITA
                </div>
                <div className="pfield-row">
                  <div className="pfield-label">
                    <span>Data</span>
                    <input
                      type="date"
                      className="pfield-input"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setBookingDate(e.target.value)}
                    />
                  </div>
                  <div className="pfield-label">
                    <span>Horário selecionado</span>
                    <div style={{padding:'12px 14px', background:'#181818', border:'1px solid var(--line)', color:'var(--gold)', fontWeight:700, fontSize:13}}>
                      {bookingTime}
                    </div>
                  </div>
                </div>

                <div className="time-slots-grid">
                  {timeSlots.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`time-slot-btn ${bookingTime === t ? 'active' : ''}`}
                      onClick={() => setBookingTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD PAYMENT FORM */}
              {payMode === 'card' && (
                <div>
                  {/* Saved cards radio if available */}
                  {savedCards.length > 0 && (
                    <div style={{marginBottom:18}}>
                      <div className="eyebrow" style={{marginBottom:8}}>MEUS CARTÕES SALVOS</div>
                      <div className="saved-cards-block">
                        {savedCards.map(c => (
                          <div
                            key={c.id}
                            className={`saved-card-item ${useSavedCard && selectedCardId === c.id ? 'selected' : ''}`}
                            onClick={() => { setUseSavedCard(true); setSelectedCardId(c.id); }}
                          >
                            <div className="sci-info">
                              <CreditCard size={18} color="var(--gold)"/>
                              <div>
                                <strong>{c.brand} final {c.last4}</strong>
                                <span>{c.holder} · Validade {c.exp}</span>
                              </div>
                            </div>
                            {useSavedCard && selectedCardId === c.id && <Check size={16} color="var(--gold)"/>}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-button"
                          style={{alignSelf:'flex-start', marginTop:4, fontSize:11, color: !useSavedCard ? 'var(--gold)' : '#888'}}
                          onClick={() => setUseSavedCard(false)}
                        >
                          + Pagar com um novo cartão
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Virtual Card Preview (if typing new card or reviewing) */}
                  {!useSavedCard && (
                    <div className="virtual-card-wrap">
                      <div className="virtual-card">
                        <div className="vcard-top">
                          <div className="vcard-chip"/>
                          <span className="vcard-brand">{currentBrand}</span>
                        </div>
                        <div className="vcard-number">
                          {cardNumber ? cardNumber.padEnd(19, '•') : '•••• •••• •••• ••••'}
                        </div>
                        <div className="vcard-bottom">
                          <div>
                            <span className="vcard-label">Titular do Cartão</span>
                            <div className="vcard-holder">{cardHolder || 'SEU NOME AQUI'}</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <span className="vcard-label">Validade</span>
                            <div className="vcard-exp">{cardExp || 'MM/AA'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Card Form Fields */}
                  {!useSavedCard && (
                    <div className="payment-field-group">
                      <div className="pfield-label">
                        <span>Número do Cartão</span>
                        <input
                          type="text"
                          className="pfield-input"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="pfield-label">
                        <span>Nome impresso no Cartão</span>
                        <input
                          type="text"
                          className="pfield-input"
                          placeholder="NOME COMO NO CARTÃO"
                          value={cardHolder}
                          onChange={e => setCardHolder(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="pfield-row">
                        <div className="pfield-label">
                          <span>Validade (MM/AA)</span>
                          <input
                            type="text"
                            className="pfield-input"
                            placeholder="MM/AA"
                            value={cardExp}
                            onChange={handleExpChange}
                            maxLength={5}
                            required
                          />
                        </div>
                        <div className="pfield-label">
                          <span>CVV</span>
                          <input
                            type="password"
                            className="pfield-input"
                            placeholder="123"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      <label className="pfield-checkbox">
                        <input
                          type="checkbox"
                          checked={saveCardCheck}
                          onChange={e => setSaveCardCheck(e.target.checked)}
                        />
                        <span>Salvar este cartão para reservas futuras com 1 clique</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* PIX PAYMENT FORM */}
              {payMode === 'pix' && (
                <div className="pix-container">
                  <div className="pix-qr-frame">
                    <svg width="180" height="180" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="#ffffff" />
                      {/* Corners */}
                      <rect x="10" y="10" width="24" height="24" fill="#000" />
                      <rect x="14" y="14" width="16" height="16" fill="#fff" />
                      <rect x="18" y="18" width="8" height="8" fill="#000" />
                      <rect x="66" y="10" width="24" height="24" fill="#000" />
                      <rect x="70" y="14" width="16" height="16" fill="#fff" />
                      <rect x="74" y="18" width="8" height="8" fill="#000" />
                      <rect x="10" y="66" width="24" height="24" fill="#000" />
                      <rect x="14" y="70" width="16" height="16" fill="#fff" />
                      <rect x="18" y="74" width="8" height="8" fill="#000" />
                      {/* Random PIX pattern blocks */}
                      <rect x="42" y="12" width="6" height="12" fill="#000" />
                      <rect x="52" y="18" width="8" height="6" fill="#000" />
                      <rect x="40" y="30" width="20" height="6" fill="#000" />
                      <rect x="12" y="42" width="14" height="6" fill="#000" />
                      <rect x="30" y="42" width="6" height="14" fill="#000" />
                      <rect x="44" y="44" width="12" height="12" fill="#d4af37" />
                      <rect x="62" y="40" width="8" height="16" fill="#000" />
                      <rect x="76" y="44" width="14" height="6" fill="#000" />
                      <rect x="42" y="64" width="8" height="14" fill="#000" />
                      <rect x="56" y="68" width="14" height="8" fill="#000" />
                      <rect x="76" y="68" width="12" height="12" fill="#000" />
                      <rect x="68" y="84" width="16" height="6" fill="#000" />
                    </svg>
                  </div>

                  <p className="pix-instructions">
                    Abra o app do seu banco, escolha <strong>Pagar via PIX</strong> e escaneie o QR Code ou copie a chave abaixo:
                  </p>

                  <div className="pix-code-row">
                    <input className="pix-code-input" value={pixCode} readOnly />
                    <button type="button" className="pix-copy-btn" onClick={copyPix}>
                      {pixCopied ? <Check size={14}/> : <Copy size={14}/>}
                      {pixCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="error-message" style={{marginBottom:14}}>
                  <AlertCircle size={14}/> {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <button
                className="gold-button"
                style={{width:'100%', marginTop:10}}
                onClick={handleConfirmPayment}
                disabled={processing}
              >
                {processing ? (
                  'Processando transação...'
                ) : (
                  <>
                    <Lock size={15}/>
                    {payMode === 'card'
                      ? `Confirmar e Pagar ${parcelas > 1 ? `${parcelas}x de R$ ${parcelValue.toFixed(2)}` : `R$ ${total.toFixed(2)}`}`
                      : 'Confirmar Pagamento PIX'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Client Services (Service selection + Payment) ─────────────────────────────
function ClientServices({ user, onGoToAppointments }) {
  const [services, setServices] = useState([]);
  const [barbers,  setBarbers]  = useState([]);
  const [selected, setSelected] = useState(null);   // selected service
  const [barber,   setBarber]   = useState(null);    // selected barber
  const [payMode,  setPayMode]  = useState(null);    // 'card' | 'pix'
  const [parcelas, setParcelas] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('Todos');

  useEffect(() => {
    // Load services and barbers for this tenant (or all if no tenant)
    supabase.from('services').select('*').eq('is_active', true)
      .then(({ data }) => data && setServices(data));
    supabase.from('barbers').select('*')
      .then(({ data }) => data && setBarbers(data));
  }, []);

  const total = selected ? parseFloat(selected.price) : 0;
  const parcelValue = total / parcelas;

  const availableCats = Array.from(new Set(services.map(s => s.category).filter(Boolean)));
  const filteredServices = selectedCat === 'Todos'
    ? services
    : services.filter(s => s.category === selectedCat);

  function openCheckout() {
    if (!selected) return;
    setShowPaymentModal(true);
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

        <div className="eyebrow" style={{marginBottom:14}}>NOSSOS SERVIÇOS</div>

        {/* Category Filter Pills */}
        {availableCats.length > 0 && (
          <div className="category-filter-row">
            <button
              className={`cat-pill ${selectedCat === 'Todos' ? 'active' : ''}`}
              onClick={() => setSelectedCat('Todos')}
            >
              Todos ({services.length})
            </button>
            {availableCats.map(cat => (
              <button
                key={cat}
                className={`cat-pill ${selectedCat === cat ? 'active' : ''}`}
                onClick={() => setSelectedCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="client-service-grid">
          {filteredServices.length === 0 && (
            <div className="premium-empty" style={{gridColumn:'1/-1'}}>
              <Scissors size={28} opacity={0.2}/>
              <p>Nenhum serviço nesta categoria no momento.</p>
            </div>
          )}
          {filteredServices.map(s => (
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
                onClick={openCheckout}
              >
                {payMode === 'pix' ? 'Pagar via PIX' : `Pagar ${parcelas}x de R$ ${parcelValue.toFixed(2)}`}
                <ChevronRight size={16}/>
              </button>
            )}
          </>
        )}
      </div>

      {/* PAYMENT WINDOW MODAL */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        user={user}
        selected={selected}
        barber={barber}
        barbers={barbers}
        payMode={payMode}
        parcelas={parcelas}
        onSuccessAppointment={() => {
          setSelected(null);
          setPayMode(null);
        }}
        onGoToAppointments={onGoToAppointments}
      />
    </div>
  );
}

// ── Client Profile ─────────────────────────────────────────────────────────────
function ClientProfile({ user, onUpdate }) {
  const [form, setForm]     = useState({ full_name: user.full_name || '', email: user.email || '', password: '' });
  const [savedCards, setSavedCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    if (!user?.id) return;
    try {
      const cards = JSON.parse(localStorage.getItem(`barber_saved_cards_${user.id}`) || '[]');
      setSavedCards(cards);
    } catch {
      setSavedCards([]);
    }
  }, [user?.id]);

  function removeSavedCard(cardId) {
    const updated = savedCards.filter(c => c.id !== cardId);
    setSavedCards(updated);
    localStorage.setItem(`barber_saved_cards_${user.id}`, JSON.stringify(updated));
  }

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

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true);
    setMsg('');
    try {
      // Auto-ajusta e centraliza a foto perfeitamente no formato quadrado para o avatar
      const url = await uploadImage(file, 'avatars', true);
      if (url) {
        // 1. Salva nos metadados do auth (persiste na sessão do Supabase)
        await supabase.auth.updateUser({ data: { avatar_url: url } });
        // 2. Tenta atualizar na tabela user_profiles (caso a coluna exista)
        try {
          await supabase.from('user_profiles').update({ avatar_url: url }).eq('id', user.id);
        } catch {}
        // 3. Salva no cache local para carregamento instantâneo
        localStorage.setItem(`barber_avatar_${user.id}`, url);
        // 4. Atualiza o estado da aplicação
        if (onUpdate) onUpdate({ ...user, avatar_url: url });
        setMsg('Foto auto-ajustada e atualizada com sucesso!');
      }
    } catch (err) {
      setMsg('Erro ao atualizar foto: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="admin-view fade-in">
      <header className="topbar"><div><div className="eyebrow">CONTA</div><h2>Meu Perfil.</h2></div></header>

      <div className="profile-edit-layout">
        {/* Avatar */}
        <div className="profile-avatar-block">
          <label className="avatar-upload-wrap" style={{cursor: uploadingAvatar ? 'wait' : 'pointer'}}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.full_name} className="avatar-large"/>
              : <div className="avatar-large avatar-placeholder">{user.full_name?.[0] || 'U'}</div>}
            <div className="avatar-overlay">
              <Camera size={20}/>
              <span>{uploadingAvatar ? 'Ajustando...' : 'Alterar foto'}</span>
            </div>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload} disabled={uploadingAvatar}/>
          </label>
          <span style={{fontSize:11, color:'var(--gold)', marginTop:8, display:'flex', alignItems:'center', gap:4}}>
            <Check size={12}/> Foto auto-ajustada ao perfil
          </span>
          <strong style={{marginTop:8,fontSize:16}}>{user.full_name}</strong>
          <small style={{color:'#666'}}>{user.email}</small>
        </div>

        {/* Form */}
        <div className="profile-form">
          <div className="modal-form" style={{marginTop:0}}>
            <label>Nome completo
              <input value={form.full_name} onChange={e => setForm({...form, full_name: autoCap(e.target.value)})}/>
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

          {/* Cartões Salvos */}
          <div style={{marginTop:40, borderTop:'1px solid var(--line)', paddingTop:24}}>
            <div className="eyebrow" style={{marginBottom:12}}>MEUS CARTÕES SALVOS</div>
            {savedCards.length === 0 ? (
              <p style={{fontSize:12, color:'#666'}}>Nenhum cartão salvo no momento.</p>
            ) : (
              <div className="saved-cards-block">
                {savedCards.map(c => (
                  <div key={c.id} className="saved-card-item">
                    <div className="sci-info">
                      <CreditCard size={18} color="var(--gold)"/>
                      <div>
                        <strong>{c.brand} final {c.last4}</strong>
                        <span>{c.holder} · Validade {c.exp}</span>
                      </div>
                    </div>
                    <button
                      className="text-button"
                      style={{color:'#d98080', padding:6}}
                      onClick={() => removeSavedCard(c.id)}
                      title="Excluir cartão"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
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

  // Global listener: capitalizes the first letter of any text input automatically
  useEffect(() => {
    function handleGlobalInput(e) {
      const target = e.target;
      if (!target || !['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      const type = (target.type || '').toLowerCase();
      if (['email', 'password', 'number', 'date', 'time', 'file', 'checkbox', 'radio'].includes(type)) return;

      const val = target.value;
      if (val && val.length > 0) {
        const capitalized = val.replace(/^(\s*)([a-z\u00E0-\u00FD])/i, (_, space, char) => space + char.toUpperCase());
        if (capitalized !== val) {
          const start = target.selectionStart;
          const end = target.selectionEnd;
          
          const setter = target.tagName === 'TEXTAREA'
            ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
            : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          
          if (setter) {
            setter.call(target, capitalized);
          } else {
            target.value = capitalized;
          }
          if (target.setSelectionRange && start !== null) {
            target.setSelectionRange(start, end);
          }
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
    window.addEventListener('input', handleGlobalInput, true);
    return () => window.removeEventListener('input', handleGlobalInput, true);
  }, []);

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
      const cachedAvatar = localStorage.getItem(`barber_avatar_${session.user.id}`);
      setUser({
        ...session.user,
        full_name: profile?.full_name || meta.full_name || meta.name || session.user.email,
        role:      profile?.role      || meta.role      || 'client',
        tenant_id: profile?.tenant_id || null,
        avatar_url: profile?.avatar_url || meta.avatar_url || cachedAvatar || null,
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
