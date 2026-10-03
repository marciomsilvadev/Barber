import { useCallback, useEffect, useRef, useState } from "react";
import "@/App.css";
import {
  CalendarDays, Camera, ChevronRight, Clock3, CreditCard, Edit2, LogOut, MapPin,
  QrCode, Scissors, ShieldCheck, Star, Trash2, User, X, ShoppingBag, Plus, Play, Check,
  Lock, CheckCircle2, Copy, Calendar, Clock, AlertCircle, DollarSign, CalendarCheck,
  Bell, Printer, Search, MessageCircle, Phone, Settings, Send, Package, Truck,
  ShoppingCart, Minus, ArrowRight, RefreshCw
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

// ── WhatsApp Notification Helpers ─────────────────────────────────────────────
function cleanWhatsAppNumber(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/\D/g, '');
  if (!clean) return '';
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return clean;
}

function formatWhatsAppBarberMessage(appt) {
  const clientName = appt.client_name || 'Cliente Atelier';
  const clientEmail = appt.client_email ? ` (${appt.client_email})` : '';
  const serviceName = appt.service_type || appt.service_name || 'Serviço Atelier';
  const barberName = appt.barber_name || 'Profissional';
  const dateFormatted = appt.date ? appt.date.split('-').reverse().join('/') : 'Data a definir';
  const timeFormatted = appt.time || '10:00';
  const priceFormatted = parseFloat(appt.price || 0).toFixed(2);
  const paymentMethod = appt.payment_method || 'Pago';
  const code = (appt.id ? String(appt.id).slice(0, 8) : String(Date.now()).slice(-6)).toUpperCase();

  return encodeURIComponent(
    `💈 *ATELIER BARBER · NOVO AGENDAMENTO*\n\n` +
    `Olá, *${barberName}*! Você recebeu um novo agendamento:\n\n` +
    `🔖 *Código da Reserva:* #${code}\n` +
    `👤 *Cliente:* ${clientName}${clientEmail}\n` +
    `✂️ *Serviço:* ${serviceName}\n` +
    `📅 *Data e Horário:* ${dateFormatted} às ${timeFormatted}\n` +
    `💰 *Valor do Serviço:* R$ ${priceFormatted} (${paymentMethod})\n` +
    `✅ *Status:* Pagamento Confirmado & Vaga Garantida\n\n` +
    `_Atelier Barber System_`
  );
}

function formatWhatsAppEstablishmentMessage(appt, establishmentName = 'Atelier Barber') {
  const clientName = appt.client_name || 'Cliente Atelier';
  const clientEmail = appt.client_email ? ` (${appt.client_email})` : '';
  const serviceName = appt.service_type || appt.service_name || 'Serviço Atelier';
  const barberName = appt.barber_name || 'Profissional Atelier';
  const dateFormatted = appt.date ? appt.date.split('-').reverse().join('/') : 'Data a definir';
  const timeFormatted = appt.time || '10:00';
  const priceFormatted = parseFloat(appt.price || 0).toFixed(2);
  const paymentMethod = appt.payment_method || 'Pago';
  const code = (appt.id ? String(appt.id).slice(0, 8) : String(Date.now()).slice(-6)).toUpperCase();

  return encodeURIComponent(
    `💈 *${establishmentName.toUpperCase()} · NOVO AGENDAMENTO RECEBIDO*\n\n` +
    `Novo atendimento registrado com sucesso no sistema:\n\n` +
    `🔖 *Reserva:* #${code}\n` +
    `💈 *Profissional:* ${barberName}\n` +
    `👤 *Cliente:* ${clientName}${clientEmail}\n` +
    `✂️ *Serviço:* ${serviceName}\n` +
    `📅 *Data e Horário:* ${dateFormatted} às ${timeFormatted}\n` +
    `💰 *Receita Confirmada:* R$ ${priceFormatted} (${paymentMethod})\n` +
    `✅ *Status Financeiro:* Pago\n\n` +
    `_Gestão Atelier Barber_`
  );
}

function formatWhatsAppClientMessage(appt) {
  const clientName = appt.client_name || 'Cliente';
  const serviceName = appt.service_type || appt.service_name || 'Serviço Atelier';
  const barberName = appt.barber_name || 'Profissional Atelier';
  const dateFormatted = appt.date ? appt.date.split('-').reverse().join('/') : 'Data a definir';
  const timeFormatted = appt.time || '10:00';
  const priceFormatted = parseFloat(appt.price || 0).toFixed(2);
  const code = (appt.id ? String(appt.id).slice(0, 8) : String(Date.now()).slice(-6)).toUpperCase();

  return encodeURIComponent(
    `💈 *ATELIER BARBER · COMPROVANTE DE AGENDAMENTO*\n\n` +
    `Olá, *${clientName}*! Seu horário foi agendado com sucesso:\n\n` +
    `🔖 *Código:* #${code}\n` +
    `✂️ *Serviço:* ${serviceName}\n` +
    `💈 *Profissional:* ${barberName}\n` +
    `📅 *Data e Hora:* ${dateFormatted} às ${timeFormatted}\n` +
    `💰 *Total Pago:* R$ ${priceFormatted}\n\n` +
    `Aguardamos você no Atelier Barber! Qualquer dúvida, estamos à disposição.`
  );
}

function getWhatsAppUrlForBarber(appt, rawPhone) {
  const clean = cleanWhatsAppNumber(rawPhone);
  if (!clean) return '';
  return `https://wa.me/${clean}?text=${formatWhatsAppBarberMessage(appt)}`;
}

function getWhatsAppUrlForEstablishment(appt, rawPhone, estName) {
  const clean = cleanWhatsAppNumber(rawPhone);
  if (!clean) return '';
  return `https://wa.me/${clean}?text=${formatWhatsAppEstablishmentMessage(appt, estName)}`;
}

function getWhatsAppUrlForClient(appt, rawPhone) {
  const clean = cleanWhatsAppNumber(rawPhone);
  const base = clean ? `https://wa.me/${clean}` : `https://api.whatsapp.com/send`;
  return `${base}?text=${formatWhatsAppClientMessage(appt)}`;
}

// Backward compatibility aliases
function formatWhatsAppMessage(appt) {
  return formatWhatsAppBarberMessage(appt);
}
function getWhatsAppUrl(appt, rawPhone) {
  return getWhatsAppUrlForBarber(appt, rawPhone);
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
// ── Boutique (E-Commerce) Initial Catalog & Helpers ──────────────────────────
const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Pomada Matte Forte Atelier',
    description: 'Fixação forte e acabamento seco. Modela com alta durabilidade sem deixar aspecto oleoso.',
    price: 89.90,
    stock_quantity: 25,
    category: 'Pomadas',
    image_url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    is_active: true
  },
  {
    id: 'prod-2',
    name: 'Óleo Hidratante Barba Real',
    description: 'Blend nobre de óleos essenciais de argan e cedro. Alinha os fios, amacia e previne coceiras.',
    price: 75.00,
    stock_quantity: 18,
    category: 'Óleos',
    image_url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80',
    is_active: true
  },
  {
    id: 'prod-3',
    name: 'Shampoo Antiqueda & Fortificante',
    description: 'Fórmula enriquecida com biotina, cafeína e pantenol. Limpeza profunda e estímulo folicular.',
    price: 94.50,
    stock_quantity: 14,
    category: 'Shampoos',
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
    is_active: true
  },
  {
    id: 'prod-4',
    name: 'Balm Alinhador e Modelador',
    description: 'Tratamento diário para barba com manteiga de karité. Deixa a barba encorpada e perfumada.',
    price: 68.00,
    stock_quantity: 30,
    category: 'Cremes',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    is_active: true
  },
  {
    id: 'prod-5',
    name: 'Navalhete Clássico Aço Cirúrgico',
    description: 'Instrumento profissional em aço inoxidável com detalhes em ouro. Equilíbrio de peso perfeito.',
    price: 135.00,
    stock_quantity: 8,
    category: 'Acessórios',
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    is_active: true
  },
  {
    id: 'prod-6',
    name: 'Loção Pós-Barba Refrescante Atelier',
    description: 'Efeito ice imediato. Contém pró-vitamina B5 e extrato de camomila para acalmar a pele.',
    price: 59.90,
    stock_quantity: 20,
    category: 'Cremes',
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
    is_active: true
  }
];

// Shopping Cart Helpers
function getStoredCart() {
  try {
    return JSON.parse(localStorage.getItem('barber_cart_items') || '[]');
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem('barber_cart_items', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('barber_cart_updated', { detail: items }));
  } catch {}
}

function addToCart(product, quantity = 1) {
  const cart = getStoredCart();
  const existingIndex = cart.findIndex(item => item.id === product.id);
  let updated;
  if (existingIndex > -1) {
    updated = cart.map((item, idx) =>
      idx === existingIndex
        ? { ...item, quantity: (item.quantity || 1) + quantity }
        : item
    );
  } else {
    updated = [...cart, { ...product, quantity }];
  }
  saveCart(updated);
  return updated;
}

function updateCartItemQty(productId, quantity) {
  const cart = getStoredCart();
  let updated;
  if (quantity <= 0) {
    updated = cart.filter(item => item.id !== productId);
  } else {
    updated = cart.map(item => item.id === productId ? { ...item, quantity } : item);
  }
  saveCart(updated);
  return updated;
}

function removeCartItem(productId) {
  const cart = getStoredCart();
  const updated = cart.filter(item => item.id !== productId);
  saveCart(updated);
  return updated;
}

function clearCart() {
  saveCart([]);
}

// Format WhatsApp Message for Store Orders
function formatWhatsAppOrderMessage(order, establishmentName = 'Atelier Barber') {
  const code = order.id ? String(order.id).slice(0, 10).toUpperCase() : String(Date.now()).slice(-6);
  const clientName = order.client_name || 'Cliente Atelier';
  const clientPhone = order.client_phone || 'Não informado';
  const delivery = order.delivery_type === 'delivery'
    ? `🛵 *Entrega Expressa*\n📍 *Endereço:* ${order.delivery_address || 'Endereço a confirmar'}`
    : `🏪 *Retirada no Atelier Barber*`;
  const itemsText = (order.items || []).map(i => `• ${i.quantity}x ${i.name} (R$ ${(parseFloat(i.price || 0) * (i.quantity || 1)).toFixed(2)})`).join('\n');
  const total = parseFloat(order.total_price || 0).toFixed(2);
  const pay = order.payment_method || 'Pago';

  return encodeURIComponent(
    `🛍️ *${establishmentName.toUpperCase()} · NOVO PEDIDO DA BOUTIQUE*\n\n` +
    `🔖 *Pedido:* #${code}\n` +
    `👤 *Cliente:* ${clientName}\n` +
    `📱 *Contato:* ${clientPhone}\n` +
    `📦 *Modo de Envio:* ${delivery}\n\n` +
    `🛒 *Itens do Pedido:*\n${itemsText}\n\n` +
    `💰 *Total Pago:* R$ ${total} (${pay})\n` +
    `✅ *Status:* Pagamento Aprovado e Registrado\n\n` +
    `_Boutique Atelier Barber_`
  );
}

function getWhatsAppUrlForOrder(order, rawPhone, estName) {
  const clean = cleanWhatsAppNumber(rawPhone);
  const base = clean ? `https://wa.me/${clean}` : `https://api.whatsapp.com/send`;
  return `${base}?text=${formatWhatsAppOrderMessage(order, estName)}`;
}

function getCustomerWhatsAppOrderUrl(order, estName = 'Atelier Barber') {
  const clean = cleanWhatsAppNumber(order?.client_phone);
  const base = clean ? `https://wa.me/${clean}` : `https://api.whatsapp.com/send`;
  const code = order?.id ? String(order.id).slice(0, 10).toUpperCase() : '';
  const clientName = order?.client_name || 'Cliente';
  const delivery = order?.delivery_type === 'delivery'
    ? `🛵 *Entrega:* ${order.delivery_address || 'Endereço informado'}`
    : `🏪 *Retirada:* Pacote preparado para retirada na recepção do Atelier Barber.`;
  const itemsText = (order?.items || []).map(i => `• ${i.quantity || 1}x ${i.name}`).join('\n');
  const total = parseFloat(order?.total_price || 0).toFixed(2);

  return `${base}?text=${encodeURIComponent(
    `Olá *${clientName}*! 👋\n\n` +
    `Aqui é do *${estName}*. Estamos atualizando o status do seu pedido *#${code}*:\n\n` +
    `📦 *Status:* ${order?.status || 'Confirmado'}\n` +
    `🛍️ *Itens:*\n${itemsText}\n\n` +
    `📍 ${delivery}\n` +
    `💰 *Valor Total:* R$ ${total} (${order?.payment_method || 'Pago'})\n\n` +
    `Qualquer dúvida estamos à sua total disposição! 💈`
  )}`;
}

// ── Product Checkout Modal (E-Commerce Luxury Checkout) ────────────────────────
function ProductCheckoutModal({
  isOpen,
  onClose,
  items = [],
  user = null,
  onSuccessOrder
}) {
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [clientName, setClientName] = useState(user?.full_name || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [payMode, setPayMode] = useState('pix');
  const [parcelas, setParcelas] = useState(1);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.full_name?.toUpperCase() || '');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Flow State
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setConfirmedOrder(null);
      setErrorMsg('');
      setPixCopied(false);
      if (user?.full_name) {
        setClientName(user.full_name);
        setCardHolder(user.full_name.toUpperCase());
      }
      if (user?.phone) {
        setClientPhone(user.phone);
      }
    }
  }, [isOpen, user]);

  if (!isOpen || !items || items.length === 0) return null;

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
  const shippingFee = deliveryType === 'delivery' ? 15.00 : 0.00;
  const total = subtotal + shippingFee;
  const parcelValue = total / parcelas;

  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  }

  function handleExpChange(e) {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExp(raw);
  }

  function detectBrand(num) {
    const clean = (num || '').replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
    if (/^3[47]/.test(clean)) return 'AMEX';
    if (/^6(011|5)/.test(clean)) return 'ELO';
    return 'CARTÃO';
  }

  const currentBrand = detectBrand(cardNumber);

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136boutique-atelier5204000053039865405${total.toFixed(2)}5802BR5914ATELIER BARBER6009SAO PAULO62070503***6304`;

  function copyPix() {
    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  }

  async function handleConfirmOrder(e) {
    e?.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!clientPhone.trim()) {
      setErrorMsg('Por favor, informe seu telefone / WhatsApp.');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Por favor, informe o endereço completo de entrega.');
      return;
    }

    if (payMode === 'card') {
      const cleanNum = cardNumber.replace(/\D/g, '');
      if (cleanNum.length < 15) {
        setErrorMsg('Informe um número de cartão válido.');
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
        setErrorMsg('Informe o CVV do cartão.');
        return;
      }
    }

    setProcessing(true);

    try {
      await new Promise(r => setTimeout(r, 1200));

      const orderCode = 'PED-' + Math.floor(100000 + Math.random() * 900000);
      const newOrder = {
        id: orderCode,
        client_id: user?.id || null,
        client_name: clientName,
        client_phone: clientPhone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : 'Retirada no Atelier Barber (Unidade Jardins)',
        items: items,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total_price: total,
        payment_method: payMode === 'card' ? `Cartão (${parcelas}x)` : 'PIX Instantâneo',
        payment_status: 'Pago',
        status: 'Confirmado',
        created_at: new Date().toISOString()
      };

      try {
        const storedOrders = JSON.parse(localStorage.getItem('barber_all_orders') || '[]');
        localStorage.setItem('barber_all_orders', JSON.stringify([newOrder, ...storedOrders]));
      } catch {}

      try {
        const storedProds = JSON.parse(localStorage.getItem('barber_all_products') || '[]');
        const updatedProds = storedProds.map(p => {
          const bought = items.find(it => it.id === p.id);
          if (bought) {
            const currentStock = parseInt(p.stock_quantity || 0, 10);
            const newStock = Math.max(0, currentStock - (bought.quantity || 1));
            supabase.from('products').update({ stock_quantity: newStock }).eq('id', p.id).then();
            return { ...p, stock_quantity: newStock };
          }
          return p;
        });
        localStorage.setItem('barber_all_products', JSON.stringify(updatedProds));
      } catch {}

      try {
        await supabase.from('orders').insert({
          tenant_id: user?.tenant_id || '77dab26d-b0de-49e0-995f-6dc1c9c4fbe8',
          client_id: user?.id || null,
          total_price: total,
          status: 'Confirmado',
          payment_status: 'Pago',
          delivery_type: deliveryType,
          delivery_address: newOrder.delivery_address,
          notes: JSON.stringify(items)
        });
      } catch (err) {
        console.warn('DB order insert notice:', err);
      }

      window.dispatchEvent(new CustomEvent('barber_new_order', { detail: newOrder }));
      clearCart();

      setConfirmedOrder(newOrder);
      setIsSuccess(true);
      if (onSuccessOrder) onSuccessOrder(newOrder);
    } catch (err) {
      setErrorMsg('Falha ao processar o pedido. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  }

  let estWA = { phone: '', name: 'Atelier Barber' };
  try {
    estWA = JSON.parse(localStorage.getItem('barber_establishment_whatsapp') || '{"phone":"","name":"Atelier Barber"}');
  } catch {}

  return (
    <div className="payment-modal-backdrop" onClick={e => { if (e.target === e.currentTarget && !processing) onClose(); }}>
      <div className="payment-modal product-checkout-modal slide-up">
        {/* Header */}
        <div className="payment-modal-header">
          <div>
            <div className="eyebrow">BOUTIQUE ATELIER · CHECKOUT SEGURO</div>
            <h3>{isSuccess ? 'Pedido Confirmado!' : 'Finalizar Pedido'}</h3>
          </div>
          {!processing && (
            <button className="modal-close-btn" onClick={onClose}><X size={20}/></button>
          )}
        </div>

        <div className="payment-modal-body">
          {/* SUCCESS SCREEN */}
          {isSuccess && confirmedOrder ? (
            <div className="payment-success-box">
              <div className="success-check-circle">
                <CheckCircle2 size={44} color="var(--gold)"/>
              </div>
              <h3>Pedido Aprovado com Sucesso!</h3>
              <p>Seu pagamento foi confirmado e seu pedido já está sendo preparado no Atelier Barber.</p>

              <div className="success-receipt">
                <div className="receipt-row">
                  <span>Código do Pedido:</span>
                  <strong style={{color:'var(--gold)'}}>#{confirmedOrder.id}</strong>
                </div>
                <div className="receipt-row">
                  <span>Cliente:</span>
                  <strong>{confirmedOrder.client_name} ({confirmedOrder.client_phone})</strong>
                </div>
                <div className="receipt-row">
                  <span>Envio / Retirada:</span>
                  <strong>{confirmedOrder.delivery_address}</strong>
                </div>
                <div className="receipt-row">
                  <span>Forma de Pagamento:</span>
                  <strong>{confirmedOrder.payment_method}</strong>
                </div>

                <div style={{marginTop:8, paddingTop:8, borderTop:'1px dashed var(--line)'}}>
                  <span style={{fontSize:11, color:'#888', textTransform:'uppercase', letterSpacing:1}}>Itens Comprados:</span>
                  {confirmedOrder.items.map(it => (
                    <div key={it.id} className="receipt-row" style={{fontSize:12, marginTop:4}}>
                      <span>{it.quantity || 1}x {it.name}</span>
                      <strong>R$ {(parseFloat(it.price || 0) * (it.quantity || 1)).toFixed(2)}</strong>
                    </div>
                  ))}
                  {confirmedOrder.shipping_fee > 0 && (
                    <div className="receipt-row" style={{fontSize:12, marginTop:4}}>
                      <span>Entrega Expressa:</span>
                      <strong>R$ {confirmedOrder.shipping_fee.toFixed(2)}</strong>
                    </div>
                  )}
                </div>

                <div className="receipt-row" style={{borderTop:'1px solid var(--gold)', marginTop:8, paddingTop:8}}>
                  <span>Total Pago:</span>
                  <strong style={{color:'var(--gold)', fontSize:16, fontFamily:"'Playfair Display', serif"}}>R$ {confirmedOrder.total_price.toFixed(2)}</strong>
                </div>
              </div>

              {/* WhatsApp Notification Box */}
              <div className="payment-wa-box">
                <div className="payment-wa-title">
                  <MessageCircle size={16} color="#25D366"/>
                  <strong>NOTIFICAR NO WHATSAPP</strong>
                </div>
                <p className="payment-wa-subtitle">
                  Envie os detalhes do seu pedido com 1 clique para a barbearia ou guarde na sua conversa:
                </p>
                <div className="payment-wa-actions">
                  {estWA.phone && (
                    <a
                      href={getWhatsAppUrlForOrder(confirmedOrder, estWA.phone, estWA.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="payment-wa-btn establishment"
                      title="Enviar pedido para o WhatsApp da Barbearia"
                    >
                      <Send size={15}/>
                      <span>Avisar Barbearia no WhatsApp ({estWA.name})</span>
                    </a>
                  )}
                  <a
                    href={getWhatsAppUrlForOrder(confirmedOrder, confirmedOrder.client_phone, estWA.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="payment-wa-btn barber"
                    title="Salvar comprovante do pedido no WhatsApp"
                  >
                    <MessageCircle size={15}/>
                    <span>Salvar Comprovante no meu WhatsApp</span>
                  </a>
                </div>
              </div>

              <div style={{display:'flex', gap:10, width:'100%'}}>
                <button className="gold-button" style={{flex:1}} onClick={onClose}>
                  Concluir e Voltar <ChevronRight size={16}/>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Order Summary Strip */}
              <div className="checkout-summary-banner">
                <div className="csb-left">
                  <strong>{items.length} {items.length === 1 ? 'item' : 'itens'} na compra</strong>
                  <span style={{fontSize:11, color:'#aaa'}}>
                    {items.map(i => `${i.quantity || 1}x ${i.name}`).join(', ')}
                  </span>
                </div>
                <div className="csb-right">
                  <strong>R$ {total.toFixed(2)}</strong>
                  <small>{payMode === 'card' && parcelas > 1 ? `${parcelas}x de R$ ${parcelValue.toFixed(2)}` : 'À vista'}</small>
                </div>
              </div>

              {/* Delivery Choice */}
              <div className="delivery-choice-section">
                <div className="schedule-header">
                  <Truck size={14}/> MODO DE RECEBIMENTO
                </div>
                <div className="delivery-options-grid">
                  <div
                    className={`delivery-opt-card ${deliveryType === 'pickup' ? 'selected' : ''}`}
                    onClick={() => setDeliveryType('pickup')}
                  >
                    <div className="doc-radio">{deliveryType === 'pickup' && <div className="doc-dot"/>}</div>
                    <div className="doc-content">
                      <strong>Retirar no Atelier</strong>
                      <span>Grátis · Retirada imediata na recepção</span>
                    </div>
                    <span className="doc-price free">GRÁTIS</span>
                  </div>

                  <div
                    className={`delivery-opt-card ${deliveryType === 'delivery' ? 'selected' : ''}`}
                    onClick={() => setDeliveryType('delivery')}
                  >
                    <div className="doc-radio">{deliveryType === 'delivery' && <div className="doc-dot"/>}</div>
                    <div className="doc-content">
                      <strong>Entrega Expressa</strong>
                      <span>Receba hoje na Grande SP</span>
                    </div>
                    <span className="doc-price">+ R$ 15,00</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="checkout-customer-fields">
                <div className="schedule-header">
                  <User size={14}/> DADOS DO COMPRADOR
                </div>
                <div className="pfield-row">
                  <div className="pfield-label">
                    <span>Nome Completo *</span>
                    <input
                      placeholder="Ex: João da Silva"
                      value={clientName}
                      onChange={e => setClientName(autoCap(e.target.value))}
                      className="pfield-input"
                    />
                  </div>
                  <div className="pfield-label">
                    <span>WhatsApp / Celular com DDD *</span>
                    <input
                      placeholder="Ex: (11) 99999-8888"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="pfield-input"
                    />
                  </div>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="pfield-label" style={{marginTop:10}}>
                    <span>Endereço Completo de Entrega (Rua, Número, Bairro, CEP e Cidade) *</span>
                    <input
                      placeholder="Ex: Rua Oscar Freire, 1200 - Jardins, São Paulo - SP"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(autoCap(e.target.value))}
                      className="pfield-input"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method Switcher */}
              <div className="pay-mode-tabs" style={{marginTop:16}}>
                <button
                  type="button"
                  className={`pm-tab ${payMode === 'pix' ? 'active' : ''}`}
                  onClick={() => setPayMode('pix')}
                >
                  <QrCode size={16}/> PIX Instantâneo
                </button>
                <button
                  type="button"
                  className={`pm-tab ${payMode === 'card' ? 'active' : ''}`}
                  onClick={() => setPayMode('card')}
                >
                  <CreditCard size={16}/> Cartão de Crédito
                </button>
              </div>

              {errorMsg && (
                <div className="pay-error-banner slide-up">
                  <AlertCircle size={15}/>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* PIX TAB */}
              {payMode === 'pix' && (
                <div className="pix-checkout-box slide-up">
                  <div className="pix-instruction">
                    <p>Escaneie o QR Code no seu aplicativo bancário ou copie o código Pix abaixo:</p>
                  </div>

                  <div className="pix-qr-visual">
                    <div className="qr-fake-box">
                      <QrCode size={110} color="#000"/>
                      <span className="qr-brand-tag">PIX ATELIER</span>
                    </div>
                    <div className="pix-amount-pill">
                      Total a pagar: <strong>R$ {total.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="pix-copy-row">
                    <input
                      readOnly
                      value={pixCode}
                      className="pix-code-input"
                    />
                    <button
                      type="button"
                      className={`gold-button compact ${pixCopied ? 'copied' : ''}`}
                      onClick={copyPix}
                    >
                      {pixCopied ? <><Check size={14}/> Copiado!</> : <><Copy size={14}/> Copiar PIX</>}
                    </button>
                  </div>

                  <div className="pix-secure-badge">
                    <ShieldCheck size={14} color="var(--gold)"/>
                    <span>Aprovação imediata e separação prioritária na Boutique</span>
                  </div>

                  <button
                    className="gold-button"
                    style={{width:'100%', marginTop:16}}
                    onClick={handleConfirmOrder}
                    disabled={processing}
                  >
                    {processing ? 'Confirmando Pagamento...' : `Confirmar Pagamento PIX · R$ ${total.toFixed(2)}`}
                    <ChevronRight size={16}/>
                  </button>
                </div>
              )}

              {/* CARD TAB */}
              {payMode === 'card' && (
                <div className="card-checkout-form slide-up">
                  <div className="virtual-card">
                    <div className="vcard-top">
                      <span className="vcard-chip"></span>
                      <strong className="vcard-brand">{currentBrand}</strong>
                    </div>
                    <div className="vcard-number">{cardNumber || '•••• •••• •••• ••••'}</div>
                    <div className="vcard-bottom">
                      <div>
                        <span className="vcard-label">TITULAR</span>
                        <div className="vcard-holder">{cardHolder || 'SEU NOME'}</div>
                      </div>
                      <div>
                        <span className="vcard-label">VALIDADE</span>
                        <div className="vcard-exp">{cardExp || 'MM/AA'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pfield-row">
                    <div className="pfield-label">
                      <span>Número do Cartão</span>
                      <input
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="pfield-input"
                        maxLength={19}
                      />
                    </div>
                    <div className="pfield-label">
                      <span>Nome impresso no Cartão</span>
                      <input
                        placeholder="Nome como no cartão"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value.toUpperCase())}
                        className="pfield-input"
                      />
                    </div>
                  </div>

                  <div className="pfield-row">
                    <div className="pfield-label">
                      <span>Validade</span>
                      <input
                        placeholder="MM/AA"
                        value={cardExp}
                        onChange={handleExpChange}
                        className="pfield-input"
                        maxLength={5}
                      />
                    </div>
                    <div className="pfield-label">
                      <span>CVV</span>
                      <input
                        placeholder="123"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="pfield-input"
                        type="password"
                        maxLength={4}
                      />
                    </div>
                    <div className="pfield-label">
                      <span>Parcelas</span>
                      <select
                        value={parcelas}
                        onChange={e => setParcelas(parseInt(e.target.value, 10))}
                        className="pfield-input"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>
                            {num}x de R$ {(total / num).toFixed(2)} {num === 1 ? '(à vista)' : 'sem juros'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    className="gold-button"
                    style={{width:'100%', marginTop:18}}
                    onClick={handleConfirmOrder}
                    disabled={processing}
                  >
                    {processing ? 'Processando Cartão...' : `Pagar R$ ${total.toFixed(2)} (${parcelas}x)`}
                    <Lock size={15}/>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shopping Cart Drawer ───────────────────────────────────────────────────────
function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCheckout
}) {
  if (!isOpen) return null;

  const total = items.reduce((acc, it) => acc + (parseFloat(it.price || 0) * (it.quantity || 1)), 0);
  const totalItemsCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div className="cart-drawer-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cart-drawer slide-left">
        <div className="cart-drawer-header">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <ShoppingBag size={20} color="var(--gold)"/>
            <h3>Sua Sacola</h3>
            <span className="cart-count-pill">{totalItemsCount}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20}/></button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingBag size={48} opacity={0.2}/>
            <p>Sua sacola está vazia.</p>
            <small>Adicione produtos exclusivos da nossa boutique para finalizar seu pedido.</small>
            <button className="gold-button compact" style={{marginTop:16}} onClick={onClose}>
              Explorar Boutique
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-scroll">
              {items.map(it => (
                <div key={it.id} className="cart-item-card">
                  <div className="cart-item-thumb">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name}/>
                    ) : (
                      <div className="cart-thumb-ph"><ShoppingBag size={20} opacity={0.3}/></div>
                    )}
                  </div>
                  <div className="cart-item-info">
                    <span className="cart-item-cat">{it.category}</span>
                    <strong className="cart-item-name">{it.name}</strong>
                    <span className="cart-item-price">R$ {parseFloat(it.price || 0).toFixed(2)}</span>
                    <div className="cart-qty-row">
                      <div className="cart-stepper">
                        <button onClick={() => onUpdateQty(it.id, (it.quantity || 1) - 1)}><Minus size={12}/></button>
                        <span>{it.quantity || 1}</span>
                        <button onClick={() => onUpdateQty(it.id, (it.quantity || 1) + 1)}><Plus size={12}/></button>
                      </div>
                      <button className="cart-del-btn" onClick={() => onRemoveItem(it.id)} title="Remover item">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-subtotal-row">
                <span>Subtotal:</span>
                <strong>R$ {total.toFixed(2)}</strong>
              </div>
              <div className="cart-shipping-note">
                <Truck size={13} color="var(--gold)"/>
                <span>Retirada grátis no Atelier ou Entrega Expressa</span>
              </div>
              <button
                className="gold-button"
                style={{width:'100%', marginTop:14}}
                onClick={() => { onClose(); onCheckout(items); }}
              >
                Finalizar Compra · R$ {total.toFixed(2)} <ChevronRight size={16}/>
              </button>
              <button className="cart-clear-text-btn" onClick={onClearCart}>
                Limpar sacola
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// PUBLIC LANDING PAGE (Impeccable Design with Working E-Commerce)
// -----------------------------------------------------------------------------
function LandingPage({ onEnterApp }) {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [cartItems, setCartItems] = useState(getStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, items: [] });
  const [addedNotice, setAddedNotice] = useState(null);

  useEffect(() => {
    // 1. Load Services
    supabase.from('services').select('*').eq('is_active', true).limit(6)
      .then(({ data }) => data && data.length && setServices(data));

    // 2. Load Products: DB + Local + Initial fallback
    async function fetchProducts() {
      let dbProducts = [];
      try {
        const { data } = await supabase.from('products').select('*').eq('is_active', true);
        if (data && data.length) dbProducts = data;
      } catch {}

      let localProducts = [];
      try {
        localProducts = JSON.parse(localStorage.getItem('barber_all_products') || '[]');
      } catch {}

      const map = new Map();
      INITIAL_PRODUCTS.forEach(p => map.set(p.id, p));
      localProducts.forEach(p => map.set(p.id, p));
      dbProducts.forEach(p => map.set(p.id, p));

      setProducts(Array.from(map.values()));
    }
    fetchProducts();

    function handleCartUpdate(e) {
      setCartItems(e.detail || []);
    }
    window.addEventListener('barber_cart_updated', handleCartUpdate);
    return () => window.removeEventListener('barber_cart_updated', handleCartUpdate);
  }, []);

  const totalCartCount = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

  const categories = ['Todos', 'Pomadas', 'Óleos', 'Shampoos', 'Cremes', 'Acessórios'];
  const filteredProducts = selectedCat === 'Todos'
    ? products
    : products.filter(p => p.category === selectedCat);

  function handleBuyNow(product) {
    setCheckoutModal({
      isOpen: true,
      items: [{ ...product, quantity: 1 }]
    });
  }

  function handleAddToCart(product) {
    addToCart(product, 1);
    setAddedNotice(product.name);
    setTimeout(() => setAddedNotice(null), 3000);
  }

  return (
    <div className="landing-wrapper">
      {/* Toast Notice when item added to cart */}
      {addedNotice && (
        <div className="cart-toast-notice slide-down">
          <CheckCircle2 size={16} color="var(--gold)"/>
          <span><strong>{addedNotice}</strong> adicionado à sacola!</span>
          <button onClick={() => { setAddedNotice(null); setIsCartOpen(true); }} className="ctn-view-btn">
            Ver Sacola
          </button>
        </div>
      )}

      <nav className="landing-nav fade-in">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#boutique">Boutique</a>
          
          {/* Cart Button in Navbar */}
          <button className="nav-cart-btn" onClick={() => setIsCartOpen(true)} title="Ver Sacola de Compras">
            <ShoppingBag size={17}/>
            <span>Sacola</span>
            {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
          </button>

          <button className="outline-button" onClick={() => onEnterApp("login")}>Membros</button>
          <button className="gold-button compact" onClick={() => onEnterApp("register")}>Agendar Horário</button>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content slide-up">
          <div className="eyebrow">SÃO PAULO · JARDINS</div>
          <h1 className="hero-title">A arte do cuidado <br/><em>masculino.</em></h1>
          <p className="hero-subtitle">Descubra uma experiência singular onde tradição, requinte e estilo contemporâneo se encontram.</p>
          <div className="hero-actions">
            <button className="gold-button" onClick={() => onEnterApp("register")}>Agendar agora <ChevronRight size={17}/></button>
            <a href="#boutique" className="outline-button" style={{color:'#eee', textDecoration:'none'}}><ShoppingBag size={15}/> Conhecer Boutique</a>
          </div>
        </div>
        <div className="hero-image-container fade-in">
          <img src={heroImage} alt="Interior do Atelier" className="hero-bg" />
          <div className="hero-gradient"></div>
        </div>
      </header>

      {/* Services Section */}
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
                <strong>R$ {parseFloat(s.price).toFixed(2)}</strong>
              </div>
            </div>
          )) : (
            <>
              <div className="service-card">
                <h3>Corte Clássico</h3><p>Alinhamento perfeito com tesoura e máquina.</p>
                <div className="service-meta"><span>45 min</span><strong>R$ 80,00</strong></div>
              </div>
              <div className="service-card">
                <h3>Barba Terapia</h3><p>Toalha quente, navalha e hidratação profunda.</p>
                <div className="service-meta"><span>30 min</span><strong>R$ 60,00</strong></div>
              </div>
              <div className="service-card">
                <h3>Estética Facial</h3><p>Limpeza de pele e cuidados avançados.</p>
                <div className="service-meta"><span>60 min</span><strong>R$ 120,00</strong></div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Boutique (E-Commerce) Section */}
      <section id="boutique" className="boutique-section fade-in">
        <div className="section-header-center">
          <div className="eyebrow">BOUTIQUE ATELIER</div>
          <h2>Leve a experiência para casa.</h2>
          <p className="subcopy" style={{textAlign:"center", margin:"10px auto 30px", maxWidth:600}}>
            Produtos de formulação nobre desenvolvidos para homens que valorizam o alto padrão de cuidados diários.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="boutique-cat-bar">
          {categories.map(c => (
            <button
              key={c}
              className={`cat-pill ${selectedCat === c ? 'active' : ''}`}
              onClick={() => setSelectedCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="product-grid" style={{marginTop:24}}>
          {filteredProducts.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-img-box">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} />
                ) : (
                  <div className="product-placeholder"><ShoppingBag opacity={0.2} size={40}/></div>
                )}
                <span className="product-card-badge">{p.category || 'Boutique'}</span>
              </div>
              
              <div className="product-card-body">
                <div className="product-stock-tag">
                  <Check size={11} color="#51c18a"/>
                  <span>{p.stock_quantity > 0 ? `${p.stock_quantity} em estoque` : 'Disponível'}</span>
                </div>
                <h4>{p.name}</h4>
                <p className="product-desc">{p.description || 'Produto exclusivo Atelier Barber.'}</p>
                <strong className="product-price">R$ {parseFloat(p.price).toFixed(2)}</strong>

                <div className="product-actions-group">
                  <button
                    className="gold-button compact buy-now-btn"
                    onClick={() => handleBuyNow(p)}
                    title="Comprar imediatamente com PIX ou Cartão"
                  >
                    Comprar agora
                  </button>
                  <button
                    className="outline-button compact add-cart-btn"
                    onClick={() => handleAddToCart(p)}
                    title="Adicionar à sacola de compras"
                  >
                    <ShoppingBag size={14}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateCartItemQty}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
        onCheckout={items => setCheckoutModal({ isOpen: true, items })}
      />

      {/* Checkout Modal */}
      <ProductCheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal({ isOpen: false, items: [] })}
        items={checkoutModal.items}
        user={null}
        onSuccessOrder={() => {
          setCartItems([]);
        }}
      />

      <footer className="landing-footer">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <p>© 2026 Atelier Barber · Boutique & Barbearia. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ADMIN PANEL (Products, Services, Barbers)
// -----------------------------------------------------------------------------
function AdminApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("appointments");
  const [liveCount, setLiveCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    function calculateCount() {
      try {
        const stored = JSON.parse(localStorage.getItem('barber_all_appointments') || '[]');
        const active = stored.filter(a => a.status === 'Confirmado' || a.payment_status === 'Pago');
        setLiveCount(active.length);
      } catch {}
      try {
        const storedOrders = JSON.parse(localStorage.getItem('barber_all_orders') || '[]');
        const activeOrders = storedOrders.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado');
        setOrdersCount(activeOrders.length);
      } catch {}
    }
    calculateCount();

    function onNew() {
      calculateCount();
    }
    window.addEventListener('barber_new_appointment', onNew);
    window.addEventListener('barber_new_order', onNew);
    window.addEventListener('storage', onNew);
    return () => {
      window.removeEventListener('barber_new_appointment', onNew);
      window.removeEventListener('barber_new_order', onNew);
      window.removeEventListener('storage', onNew);
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><ShieldCheck size={14} /> ADMIN</div>
        <nav>
          <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>
            <CalendarCheck size={18} />Agendamentos & Caixa
            {liveCount > 0 && <span className="nav-badge-gold">{liveCount}</span>}
          </button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            <Package size={18} />Pedidos da Boutique
            {ordersCount > 0 && <span className="nav-badge-gold">{ordersCount}</span>}
          </button>
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
          <div><div className="eyebrow">PAINEL EXECUTIVO</div><h2>Gestão do Atelier.</h2></div>
        </header>
        {activeTab === "appointments" && <AdminAppointments user={user} onGoToOrders={() => setActiveTab("orders")} />}
        {activeTab === "orders" && <AdminOrders user={user} />}
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
  const [form, setForm] = useState({ id: null, name: '', phone: '', specialties: '', price: '', image: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    let dbData = [];
    try {
      const { data, error } = await supabase.from('barbers').select('*').eq('tenant_id', user.tenant_id);
      if (!error && data) dbData = data;
    } catch {}

    let storedPhones = {};
    try {
      storedPhones = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
    } catch {}

    const enriched = dbData.map(b => ({
      ...b,
      phone: b.phone || storedPhones[b.id] || storedPhones[b.name] || ''
    }));
    setBarbers(enriched);
  }, [user.tenant_id]);

  useEffect(() => { load(); }, [load]);

  function openModal(b = null) {
    let storedPhones = {};
    try {
      storedPhones = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
    } catch {}

    if (b) {
      const phone = b.phone || storedPhones[b.id] || storedPhones[b.name] || '';
      setForm({
        id: b.id,
        name: b.name,
        phone: phone,
        specialties: (b.specialties || []).join(', '),
        price: b.price,
        image: b.image || ''
      });
    } else {
      setForm({ id: null, name: '', phone: '', specialties: '', price: '', image: '' });
    }
    setModal(true);
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);

    // Save phone to localStorage map so it is permanently available
    try {
      const storedPhones = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
      if (form.id) storedPhones[form.id] = form.phone;
      storedPhones[form.name] = form.phone;
      localStorage.setItem('barber_barber_phones', JSON.stringify(storedPhones));
    } catch {}

    const payloadWithPhone = {
      tenant_id: user.tenant_id,
      name: form.name,
      phone: form.phone || null,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()) : [],
      price: parseFloat(form.price),
      image: form.image || null,
    };

    const payloadWithoutPhone = {
      tenant_id: user.tenant_id,
      name: form.name,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()) : [],
      price: parseFloat(form.price),
      image: form.image || null,
    };

    try {
      if (form.id) {
        const { error } = await supabase.from('barbers').update(payloadWithPhone).eq('id', form.id);
        if (error) {
          // If 'phone' column does not exist in Supabase table, update without it
          await supabase.from('barbers').update(payloadWithoutPhone).eq('id', form.id);
        }
      } else {
        const { data: inserted, error } = await supabase.from('barbers').insert(payloadWithPhone).select().single();
        if (error) {
          const { data: fallbackIns } = await supabase.from('barbers').insert(payloadWithoutPhone).select().single();
          if (fallbackIns) {
            try {
              const storedPhones = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
              storedPhones[fallbackIns.id] = form.phone;
              localStorage.setItem('barber_barber_phones', JSON.stringify(storedPhones));
            } catch {}
          }
        } else if (inserted) {
          try {
            const storedPhones = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
            storedPhones[inserted.id] = form.phone;
            localStorage.setItem('barber_barber_phones', JSON.stringify(storedPhones));
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Barber save notice:', e);
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
        <div><h3>Equipe</h3><p className="section-sub">Gerencie seus profissionais e configure o WhatsApp de cada um</p></div>
        <div className="section-head-actions">
          <button className="gold-button compact" onClick={() => openModal()}><Plus size={15}/> Adicionar</button>
        </div>
      </div>
      {barbers.length === 0 ? (
        <div className="premium-empty">
          <Scissors size={32} opacity={0.2}/>
          <p>Nenhum barbeiro cadastrado ainda.</p>
          <button className="outline-button compact" style={{width:'auto',margin:'16px auto 0'}} onClick={() => openModal()}>Adicionar primeiro barbeiro</button>
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
                
                {/* WhatsApp Badge */}
                <div className="pro-whatsapp-tag">
                  <MessageCircle size={13} color={b.phone ? "#25D366" : "#666"}/>
                  <span className={b.phone ? "has-phone" : "no-phone"}>
                    {b.phone ? b.phone : "WhatsApp não configurado"}
                  </span>
                  {b.phone && (
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(b.phone)}?text=${encodeURIComponent(`💈 Olá ${b.name}! Teste de recebimento de agendamentos Atelier Barber.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pro-wa-link"
                      title="Testar notificação no WhatsApp deste profissional"
                    >
                      Testar
                    </a>
                  )}
                </div>

                {b.specialties?.length > 0 && <div className="pro-tags">{b.specialties.map(s => <span key={s}>{s}</span>)}</div>}
                <div className="pro-footer">
                  <strong className="pro-price">R$ {b.price}</strong>
                  <div style={{display:'flex', gap:6}}>
                    <button className="icon-button" onClick={() => openModal(b)} title="Editar dados e WhatsApp"><Edit2 size={14}/></button>
                    <button className="icon-button danger" onClick={() => remove(b.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={form.id ? "Editar Profissional" : "Novo Profissional"} onClose={() => setModal(false)}>
          <div className="modal-form">
            <label>Nome completo<input placeholder="Ex: Rafael Moura" value={form.name} onChange={e => setForm({...form, name: autoCap(e.target.value)})}/></label>
            <label>
              WhatsApp / Celular do Profissional
              <span className="label-hint">(ex: 11 99999-8888 — para receber notificações de agendamentos)</span>
              <input
                placeholder="Ex: 11 99999-8888"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
              />
            </label>
            <label>Especialidades <span className="label-hint">(separe por vírgula)</span><input placeholder="Corte, Barba, Coloração" value={form.specialties} onChange={e => setForm({...form, specialties: autoCap(e.target.value)})}/></label>
            <label>Valor base (R$)<input type="number" placeholder="80" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></label>
            <ImageUploadField label="Foto do profissional" value={form.image} onChange={url => setForm({...form, image: url})}/>
            <button className="gold-button" style={{marginTop:24}} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar profissional'}<ChevronRight size={16}/></button>
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
        <div className="section-head-actions">
          <button className="outline-button compact" onClick={() => { setModalCatName(''); setCatModal(true); }}>
            <Plus size={15}/> Categorias
          </button>
          <button className="gold-button compact" onClick={() => openModal(null)}>
            <Plus size={15}/> Novo Serviço
          </button>
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
        <div className="section-head-actions">
          <button className="outline-button compact" onClick={() => { setModalCatName(''); setCatModal(true); }}>
            <Plus size={15}/> Categorias
          </button>
          <button className="gold-button compact" onClick={() => openModal(null)}>
            <Plus size={15}/> Novo Produto
          </button>
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

// ── Admin Boutique Orders Manager ──────────────────────────────────────────
function AdminOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  let estWA = { phone: '', name: 'Atelier Barber' };
  try {
    estWA = JSON.parse(localStorage.getItem('barber_establishment_whatsapp') || '{"phone":"","name":"Atelier Barber"}');
  } catch {}

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let dbOrders = [];
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (user.tenant_id) query = query.eq('tenant_id', user.tenant_id);
      const { data, error } = await query;
      if (!error && data) {
        dbOrders = data.map(o => {
          let parsedItems = [];
          try { parsedItems = JSON.parse(o.notes || '[]'); } catch {}
          return {
            id: o.id,
            client_id: o.client_id,
            client_name: o.client_name || 'Cliente Atelier',
            client_phone: o.client_phone || '',
            delivery_type: o.delivery_type || 'pickup',
            delivery_address: o.delivery_address || (o.delivery_type === 'delivery' ? 'Entrega a combinar' : 'Retirada no Atelier'),
            items: parsedItems,
            total_price: o.total_price,
            payment_method: o.payment_method || 'Pago',
            payment_status: o.payment_status || 'Pago',
            status: o.status || 'Confirmado',
            created_at: o.created_at
          };
        });
      }
    } catch {}

    let localOrders = [];
    try {
      localOrders = JSON.parse(localStorage.getItem('barber_all_orders') || '[]');
    } catch {}

    const map = new Map();
    localOrders.forEach(o => map.set(o.id, o));
    dbOrders.forEach(o => {
      const local = map.get(o.id);
      map.set(o.id, { ...local, ...o });
    });

    const list = Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    setOrders(list);
    setLoading(false);
  }, [user.tenant_id]);

  useEffect(() => {
    loadOrders();
    function handleNew() { loadOrders(); }
    window.addEventListener('barber_new_order', handleNew);
    window.addEventListener('storage', handleNew);

    const channel = supabase
      .channel('admin_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      window.removeEventListener('barber_new_order', handleNew);
      window.removeEventListener('storage', handleNew);
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    } catch {}
    try {
      const local = JSON.parse(localStorage.getItem('barber_all_orders') || '[]');
      const updated = local.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      localStorage.setItem('barber_all_orders', JSON.stringify(updated));
    } catch {}
    loadOrders();
  }

  // Metrics
  const totalSales = orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
  const pickupOrders = orders.filter(o => o.delivery_type === 'pickup');
  const deliveryOrders = orders.filter(o => o.delivery_type === 'delivery');
  const pendingOrders = orders.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado');

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'Pendentes' && (o.status === 'Entregue' || o.status === 'Cancelado')) return false;
    if (filterStatus === 'Pronto' && o.status !== 'Pronto p/ Retirada') return false;
    if (filterStatus === 'Entrega' && o.delivery_type !== 'delivery') return false;
    if (filterStatus === 'Entregue' && o.status !== 'Entregue') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id || '').toLowerCase().includes(q);
      const matchClient = (o.client_name || '').toLowerCase().includes(q);
      const matchPhone = (o.client_phone || '').toLowerCase().includes(q);
      const matchItem = (o.items || []).some(it => (it.name || '').toLowerCase().includes(q));
      if (!matchId && !matchClient && !matchPhone && !matchItem) return false;
    }
    return true;
  });

  return (
    <section className="admin-view fade-in">
      <div className="section-head">
        <div>
          <h3>Pedidos da Boutique (E-commerce)</h3>
          <p className="section-sub">{orders.length} pedido{orders.length !== 1 ? 's' : ''} registrado{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card gold-border">
          <div className="kpi-icon-wrap"><DollarSign size={22} color="var(--gold)"/></div>
          <div>
            <span className="kpi-label">TOTAL EM VENDAS</span>
            <strong className="kpi-value">R$ {totalSales.toFixed(2)}</strong>
            <span className="kpi-sub">{orders.length} compras concluídas</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap"><Package size={22} color="var(--gold)"/></div>
          <div>
            <span className="kpi-label">A SEPARAR / ENTREGAR</span>
            <strong className="kpi-value">{pendingOrders.length}</strong>
            <span className="kpi-sub">{pickupOrders.length} retiradas · {deliveryOrders.length} entregas</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap"><Truck size={22} color="var(--gold)"/></div>
          <div>
            <span className="kpi-label">ENTREGAS EXPRESSAS</span>
            <strong className="kpi-value">{deliveryOrders.length}</strong>
            <span className="kpi-sub">Envios via motoboy</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="admin-toolbar" style={{marginTop:24}}>
        <div className="category-filter-row" style={{marginBottom:0}}>
          {['Todos', 'Pendentes', 'Pronto', 'Entrega', 'Entregue'].map(st => (
            <button
              key={st}
              className={`cat-pill ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st} {st === 'Todos' ? `(${orders.length})` : st === 'Pendentes' ? `(${pendingOrders.length})` : ''}
            </button>
          ))}
        </div>

        <div className="admin-search-box">
          <Search size={15} color="#888"/>
          <input
            placeholder="Buscar por código, cliente ou produto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="search-clear"><X size={13}/></button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div style={{marginTop:20}}>
        {loading ? (
          <div style={{color:'#888', padding:40, textAlign:'center'}}>Sincronizando pedidos da boutique...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="premium-empty" style={{marginTop:20}}>
            <Package size={36} opacity={0.2}/>
            <p>Nenhum pedido encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="admin-appt-list-wrap">
            <div className="admin-appt-list">
              <div className="admin-appt-header">
                <span>Pedido</span>
                <span>Cliente</span>
                <span>Itens & Entrega</span>
                <span style={{textAlign:'right'}}>Pagamento</span>
                <span>WhatsApp</span>
                <span style={{textAlign:'center'}}>Status</span>
                <span style={{textAlign:'right'}}>Ações</span>
              </div>

              {filteredOrders.map(o => {
                const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : '';
                const timeStr = o.created_at ? new Date(o.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '';
                const isDelivery = o.delivery_type === 'delivery';
                const payMethodLabel = o.payment_method === 'Pagamento Aprovado' ? 'Aprovado' : (o.payment_method || 'Cartão');

                return (
                  <div key={o.id} className="admin-appt-card order-card">
                    {/* Order ID & Date */}
                    <div className="aac-date-col">
                      <span className="today-badge" style={{background:'#222', color:'var(--gold)', border:'1px solid var(--gold-soft)'}}>
                        {isDelivery ? 'ENTREGA' : 'RETIRADA'}
                      </span>
                      <strong className="aac-time" style={{fontSize:13}}>#{String(o.id).slice(0, 10)}</strong>
                      <span className="aac-date">{dateStr} {timeStr}</span>
                    </div>

                    {/* Customer Info */}
                    <div className="aac-client-col">
                      <div className="aac-avatar">{o.client_name?.[0] || 'C'}</div>
                      <div>
                        <strong className="aac-client-name">{o.client_name || 'Cliente Boutique'}</strong>
                        {o.client_phone ? (
                          <a
                            href={`https://wa.me/${cleanWhatsAppNumber(o.client_phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="client-wa-link"
                            title="Conversar com cliente no WhatsApp"
                          >
                            <Phone size={10}/> {o.client_phone}
                          </a>
                        ) : (
                          <span className="aac-client-email">Sem telefone</span>
                        )}
                      </div>
                    </div>

                    {/* Items and Delivery */}
                    <div className="aac-service-col">
                      <strong>
                        {(o.items || []).map(i => `${i.quantity || 1}x ${i.name}`).join(', ')}
                      </strong>
                      <span>
                        {isDelivery ? `🛵 ${o.delivery_address}` : `🏪 Retirada no Atelier`}
                      </span>
                    </div>

                    {/* Total & Payment */}
                    <div className="aac-payment-col">
                      <strong className="aac-price">R$ {parseFloat(o.total_price || 0).toFixed(2)}</strong>
                      <div className="aac-payment-meta">
                        <span className="appt-badge paid">✓ PAGO</span>
                        <span className="payment-method-tag" title={o.payment_method}>{payMethodLabel}</span>
                      </div>
                    </div>

                    {/* WhatsApp Quick Actions */}
                    <div className="aac-wa-col">
                      <div className="aac-wa-buttons">
                        {o.client_phone && (
                          <a
                            href={getCustomerWhatsAppOrderUrl(o, estWA.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa-btn-chip barber"
                            title="Avisar cliente sobre o status do pedido no WhatsApp"
                          >
                            <MessageCircle size={12} color="#25D366"/>
                            <span>Avisar Cliente</span>
                          </a>
                        )}
                        {estWA.phone && (
                          <a
                            href={getWhatsAppUrlForOrder(o, estWA.phone, estWA.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa-btn-chip establishment"
                            title="Notificar responsável pela barbearia no WhatsApp"
                          >
                            <Send size={12} color="var(--gold)"/>
                            <span>Avisar Loja</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="aac-status-col">
                      <span className={`appt-badge ${o.status === 'Entregue' ? 'completed' : o.status === 'Cancelado' ? 'cancelled' : 'confirmed'}`}>
                        {o.status || 'Confirmado'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="aac-actions-col">
                      {o.status === 'Confirmado' && (
                        <button
                          className="gold-button compact"
                          onClick={() => updateOrderStatus(o.id, isDelivery ? 'Em Trânsito' : 'Pronto p/ Retirada')}
                          title={isDelivery ? 'Marcar que saiu para entrega' : 'Marcar pronto para retirar'}
                        >
                          <Check size={13}/> {isDelivery ? 'Despachar' : 'Pronto'}
                        </button>
                      )}
                      {(o.status === 'Pronto p/ Retirada' || o.status === 'Em Trânsito') && (
                        <button
                          className="gold-button compact"
                          onClick={() => updateOrderStatus(o.id, 'Entregue')}
                          title="Confirmar entrega finalizada"
                        >
                          <Check size={13}/> Entregue
                        </button>
                      )}
                      <button
                        className="outline-button compact"
                        onClick={() => setSelectedReceipt(o)}
                        title="Ver Comprovante"
                      >
                        Recibo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order Receipt Modal */}
      {selectedReceipt && (
        <Modal title="Comprovante de Compra na Boutique" onClose={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content">
            <div className="receipt-brand">ATELIER<span>BOUTIQUE</span></div>
            <div className="receipt-status-banner">
              <CheckCircle2 size={24} color="var(--gold)"/>
              <div>
                <strong>PEDIDO CONFIRMADO & PAGO</strong>
                <small>Transação registrada com sucesso no Atelier Barber</small>
              </div>
            </div>

            <div className="receipt-details-list">
              <div className="rd-item"><span>Código do Pedido:</span><strong>#{selectedReceipt.id}</strong></div>
              <div className="rd-item"><span>Cliente:</span><strong>{selectedReceipt.client_name} ({selectedReceipt.client_phone})</strong></div>
              <div className="rd-item"><span>Modo de Recebimento:</span><strong>{selectedReceipt.delivery_address}</strong></div>
              <div className="rd-item"><span>Forma de Pagamento:</span><strong>{selectedReceipt.payment_method}</strong></div>
              <div className="rd-item">
                <span>Itens:</span>
                <strong>{(selectedReceipt.items || []).map(i => `${i.quantity || 1}x ${i.name}`).join(' | ')}</strong>
              </div>
              <div className="rd-item total-row">
                <span>Total Pago:</span>
                <strong className="total-gold">R$ {parseFloat(selectedReceipt.total_price || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className="receipt-wa-box" style={{marginTop:16}}>
              <div className="receipt-wa-header">
                <MessageCircle size={15} color="#25D366"/>
                <strong>NOTIFICAR NO WHATSAPP</strong>
              </div>
              <div className="receipt-wa-grid">
                {selectedReceipt.client_phone && (
                  <a
                    href={getCustomerWhatsAppOrderUrl(selectedReceipt, estWA.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn-full"
                    title="Notificar cliente no WhatsApp"
                  >
                    <MessageCircle size={15}/>
                    <span>Avisar Cliente ({selectedReceipt.client_name})</span>
                  </a>
                )}
                {estWA.phone && (
                  <a
                    href={getWhatsAppUrlForOrder(selectedReceipt, estWA.phone, estWA.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn-full outline"
                    title="Enviar dados do pedido para a Barbearia"
                  >
                    <Send size={15}/>
                    <span>Avisar Barbearia ({estWA.name})</span>
                  </a>
                )}
              </div>
            </div>

            <div style={{display:'flex', gap:10, marginTop:24}}>
              <button className="gold-button" style={{flex:1}} onClick={() => window.print()}>
                <Printer size={15}/> Imprimir Comprovante
              </button>
              <button className="outline-button" onClick={() => setSelectedReceipt(null)}>
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── Admin Appointments & Cash Flow Manager ──────────────────────────────────
function AdminAppointments({ user, onGoToOrders }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);

  // WhatsApp Configuration State
  const [establishmentWA, setEstablishmentWA] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('barber_establishment_whatsapp') || '{"phone":"","name":"Atelier Barber","autoNotify":true}');
    } catch {
      return { phone: '', name: 'Atelier Barber', autoNotify: true };
    }
  });
  const [waConfigModal, setWaConfigModal] = useState(false);
  const [waForm, setWaForm] = useState(establishmentWA);
  const [barberPhones, setBarberPhones] = useState({});

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    let dbAppts = [];
    try {
      let query = supabase
        .from('appointments')
        .select('*, barbers(name, image, phone), user_profiles(full_name)')
        .order('created_at', { ascending: false });
      if (user.tenant_id) query = query.eq('tenant_id', user.tenant_id);
      const { data, error } = await query;
      if (!error && data) dbAppts = data;
    } catch (err) {
      console.warn('DB load notice:', err);
    }

    let localAppts = [];
    try {
      localAppts = JSON.parse(localStorage.getItem('barber_all_appointments') || '[]');
    } catch {}

    let storedPhones = {};
    try {
      storedPhones = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
      setBarberPhones(storedPhones);
    } catch {}

    // Merge DB and local storage records seamlessly
    const map = new Map();
    localAppts.forEach(a => map.set(a.id, a));
    dbAppts.forEach(a => {
      const local = map.get(a.id);
      const bPhone = a.barbers?.phone || storedPhones[a.barber_id] || storedPhones[a.barbers?.name] || local?.barber_phone || '';
      map.set(a.id, {
        ...local,
        ...a,
        client_name: a.user_profiles?.full_name || local?.client_name || 'Cliente Atelier',
        barber_name: a.barbers?.name || local?.barber_name || 'Profissional Atelier',
        barber_phone: bPhone,
        payment_method: local?.payment_method || (a.payment_status === 'Pago' ? 'Pagamento Aprovado' : 'Pendente'),
      });
    });

    const list = Array.from(map.values()).map(a => ({
      ...a,
      barber_phone: a.barber_phone || storedPhones[a.barber_id] || storedPhones[a.barber_name] || ''
    })).sort((a, b) => {
      const timeA = new Date(a.created_at || a.date).getTime();
      const timeB = new Date(b.created_at || b.date).getTime();
      return timeB - timeA;
    });

    setAppointments(list);
    setLoading(false);
  }, [user.tenant_id]);

  useEffect(() => {
    loadAppointments();

    function handleNewAppt(e) {
      const appt = e.detail;
      if (appt) {
        setToastNotification({
          title: 'Novo Pagamento & Agendamento Recebido!',
          isStoreOrder: false,
          rawAppt: appt,
          client: appt.client_name || 'Cliente',
          service: appt.service_type || appt.service_name || 'Serviço',
          barber: appt.barber_name || 'Profissional Atelier',
          barberPhone: appt.barber_phone || barberPhones[appt.barber_id] || barberPhones[appt.barber_name] || '',
          date: appt.date ? appt.date.split('-').reverse().join('/') : 'Data agendada',
          time: appt.time || '10:00',
          price: parseFloat(appt.price || 0).toFixed(2),
          method: appt.payment_method || 'Pago',
        });
        loadAppointments();
      }
    }
    window.addEventListener('barber_new_appointment', handleNewAppt);

    function handleNewOrder(e) {
      const o = e.detail;
      if (o) {
        setToastNotification({
          title: 'Novo Pedido na Boutique Recebido!',
          isStoreOrder: true,
          rawOrder: o,
          client: o.client_name || 'Cliente Boutique',
          service: (o.items || []).map(i => `${i.quantity || 1}x ${i.name}`).join(', '),
          barber: o.delivery_type === 'delivery' ? 'Entrega Expressa' : 'Retirada no Atelier',
          date: new Date().toLocaleDateString('pt-BR'),
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat(o.total_price || 0).toFixed(2),
          method: o.payment_method || 'Pago',
        });
      }
    }
    window.addEventListener('barber_new_order', handleNewOrder);

    function handleStorage(e) {
      if (e.key === 'barber_all_appointments' || e.key === 'barber_barber_phones' || e.key === 'barber_establishment_whatsapp') {
        loadAppointments();
      }
    }
    window.addEventListener('storage', handleStorage);

    const channel = supabase
      .channel('admin_appointments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
        loadAppointments();
        if (payload.eventType === 'INSERT') {
          setToastNotification({
            title: 'Novo Pagamento Confirmado no Supabase!',
            isStoreOrder: false,
            rawAppt: payload.new,
            client: 'Cliente Atelier',
            service: payload.new.service_type,
            barber: 'Profissional Atelier',
            barberPhone: '',
            date: payload.new.date ? payload.new.date.split('-').reverse().join('/') : '',
            time: payload.new.time,
            price: parseFloat(payload.new.price || 0).toFixed(2),
            method: payload.new.payment_status === 'Pago' ? 'Pago' : 'Pendente',
          });
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('barber_new_appointment', handleNewAppt);
      window.removeEventListener('barber_new_order', handleNewOrder);
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(channel);
    };
  }, [loadAppointments, barberPhones]);

  function saveEstablishmentWA() {
    setEstablishmentWA(waForm);
    try {
      localStorage.setItem('barber_establishment_whatsapp', JSON.stringify(waForm));
    } catch {}
    setWaConfigModal(false);
  }

  function getBarberPhoneForAppt(a) {
    return a.barber_phone || a.barbers?.phone || barberPhones[a.barber_id] || barberPhones[a.barber_name] || '';
  }

  async function updateAppointmentStatus(id, newStatus) {
    try {
      await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    } catch {}
    try {
      const local = JSON.parse(localStorage.getItem('barber_all_appointments') || '[]');
      const updated = local.map(a => a.id === id ? { ...a, status: newStatus } : a);
      localStorage.setItem('barber_all_appointments', JSON.stringify(updated));
    } catch {}
    loadAppointments();
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const paidAppts = appointments.filter(a => a.payment_status === 'Pago');
  const totalRevenue = paidAppts.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const todayRevenue = todayAppts.filter(a => a.payment_status === 'Pago').reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
  const confirmedCount = appointments.filter(a => a.status === 'Confirmado').length;
  const completedCount = appointments.filter(a => a.status === 'Concluído').length;

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'Hoje' && a.date !== todayStr) return false;
    if (filterStatus === 'Pago' && a.payment_status !== 'Pago') return false;
    if (filterStatus === 'Concluído' && a.status !== 'Concluído') return false;
    if (filterStatus === 'Cancelado' && a.status !== 'Cancelado') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClient = (a.client_name || '').toLowerCase().includes(q);
      const matchBarber = (a.barber_name || '').toLowerCase().includes(q);
      const matchService = (a.service_type || '').toLowerCase().includes(q);
      if (!matchClient && !matchBarber && !matchService) return false;
    }
    return true;
  });

  return (
    <section className="admin-view fade-in">
      {/* Live Toast Notification Banner */}
      {toastNotification && (
        <div className="admin-live-banner slide-up">
          <div className="alb-left">
            <div className="alb-icon-pulse"><Bell size={18} color="var(--black)"/></div>
            <div>
              <strong>{toastNotification.title}</strong>
              <p>
                <strong>{toastNotification.client}</strong> {toastNotification.isStoreOrder ? 'comprou produtos no valor de' : 'pagou'} <strong>R$ {toastNotification.price}</strong> via {toastNotification.method} ({toastNotification.service}) {toastNotification.isStoreOrder ? `· ${toastNotification.barber}` : `com ${toastNotification.barber} em ${toastNotification.date} às ${toastNotification.time}`}.
              </p>
              {/* Instant WhatsApp buttons in Toast */}
              <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
                {toastNotification.isStoreOrder ? (
                  <>
                    {toastNotification.rawOrder?.client_phone && (
                      <a
                        href={getCustomerWhatsAppOrderUrl(toastNotification.rawOrder, establishmentWA.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alb-wa-btn"
                        title="Notificar cliente sobre o pedido no WhatsApp"
                      >
                        <MessageCircle size={13}/> Notificar Cliente
                      </a>
                    )}
                    {establishmentWA.phone && (
                      <a
                        href={getWhatsAppUrlForOrder(toastNotification.rawOrder, establishmentWA.phone, establishmentWA.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alb-wa-btn secondary"
                        title="Notificar barbearia via WhatsApp"
                      >
                        <Send size={13}/> Notificar Barbearia
                      </a>
                    )}
                    {onGoToOrders && (
                      <button
                        onClick={onGoToOrders}
                        className="alb-wa-btn secondary"
                        style={{cursor:'pointer'}}
                      >
                        <Package size={13}/> Ver na Aba Pedidos
                      </button>
                    )}
                  </>
                ) : (
                  toastNotification.rawAppt && (() => {
                    const bPhone = getBarberPhoneForAppt(toastNotification.rawAppt) || toastNotification.barberPhone;
                    const estPhone = establishmentWA.phone;
                    return (
                      <>
                        {bPhone && (
                          <a
                            href={getWhatsAppUrlForBarber(toastNotification.rawAppt, bPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="alb-wa-btn"
                            title="Notificar barbeiro imediatamente via WhatsApp"
                          >
                            <MessageCircle size={13}/> Notificar Barbeiro
                          </a>
                        )}
                        {estPhone && (
                          <a
                            href={getWhatsAppUrlForEstablishment(toastNotification.rawAppt, estPhone, establishmentWA.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="alb-wa-btn secondary"
                            title="Notificar barbearia via WhatsApp"
                          >
                            <Send size={13}/> Notificar Barbearia
                          </a>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
          <button className="alb-close-btn" onClick={() => setToastNotification(null)}><X size={16}/></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card gold-border">
          <div className="kpi-icon-wrap"><DollarSign size={22} color="var(--gold)"/></div>
          <div>
            <span className="kpi-label">FATURAMENTO CONFIRMADO</span>
            <strong className="kpi-value">R$ {totalRevenue.toFixed(2)}</strong>
            <span className="kpi-sub">{paidAppts.length} pagamentos aprovados</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap"><CalendarCheck size={22} color="var(--gold)"/></div>
          <div>
            <span className="kpi-label">AGENDAMENTOS HOJE</span>
            <strong className="kpi-value">{todayAppts.length}</strong>
            <span className="kpi-sub">R$ {todayRevenue.toFixed(2)} previsto hoje</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap"><CheckCircle2 size={22} color="var(--gold)"/></div>
          <div>
            <span className="kpi-label">RESERVAS ATIVAS</span>
            <strong className="kpi-value">{confirmedCount}</strong>
            <span className="kpi-sub">{completedCount} atendimentos concluídos</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with WhatsApp config */}
      <div className="admin-toolbar" style={{marginTop:24}}>
        <div className="category-filter-row" style={{marginBottom:0}}>
          {['Todos', 'Hoje', 'Pago', 'Concluído', 'Cancelado'].map(st => (
            <button
              key={st}
              className={`cat-pill ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st} {st === 'Todos' ? `(${appointments.length})` : st === 'Hoje' ? `(${todayAppts.length})` : ''}
            </button>
          ))}
        </div>

        <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
          {onGoToOrders && (
            <button
              className="gold-button compact"
              onClick={onGoToOrders}
              title="Acessar pedidos da boutique"
            >
              <Package size={14}/> Pedidos da Boutique
            </button>
          )}

          <button
            className="outline-button compact wa-toolbar-btn"
            onClick={() => { setWaForm(establishmentWA); setWaConfigModal(true); }}
            title="Configurar WhatsApp do Responsável pela Barbearia"
          >
            <MessageCircle size={14} color="#25D366"/>
            <span>WhatsApp Barbearia: <strong>{establishmentWA.phone || 'Configurar'}</strong></span>
            <Settings size={12} color="#888"/>
          </button>

          <div className="admin-search-box">
            <Search size={15} color="#888"/>
            <input
              placeholder="Buscar por cliente, barbeiro ou serviço..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear"><X size={13}/></button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div style={{marginTop:20}}>
        {loading ? (
          <div style={{color:'#888', padding:40, textAlign:'center'}}>Sincronizando agendamentos e pagamentos...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="premium-empty" style={{marginTop:20}}>
            <CalendarCheck size={36} opacity={0.2}/>
            <p>Nenhum agendamento encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="admin-appt-list-wrap">
            <div className="admin-appt-list">
              <div className="admin-appt-header">
                <span>Horário</span>
                <span>Cliente</span>
                <span>Serviço</span>
                <span style={{textAlign:'right'}}>Pagamento</span>
                <span>WhatsApp</span>
                <span style={{textAlign:'center'}}>Status</span>
                <span style={{textAlign:'right'}}>Ações</span>
              </div>

            {filteredAppointments.map(a => {
              const isToday = a.date === todayStr;
              const bPhone = getBarberPhoneForAppt(a);
              const estPhone = establishmentWA.phone;
              const payMethodLabel = a.payment_method === 'Pagamento Aprovado' ? 'Aprovado' : (a.payment_method || 'Cartão');

              return (
                <div key={a.id} className={`admin-appt-card ${isToday ? 'is-today' : ''}`}>
                  {/* Date & Time Column */}
                  <div className="aac-date-col">
                    {isToday && <span className="today-badge">HOJE</span>}
                    <strong className="aac-time">{a.time || '10:00'}</strong>
                    <span className="aac-date">
                      {a.date ? a.date.split('-').reverse().join('/') : 'Data a definir'}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="aac-client-col">
                    <div className="aac-avatar">{a.client_name?.[0] || 'C'}</div>
                    <div>
                      <strong className="aac-client-name">{a.client_name || 'Cliente Atelier'}</strong>
                      <span className="aac-client-email">{a.client_email || 'Cliente Membro'}</span>
                    </div>
                  </div>

                  {/* Service & Barber */}
                  <div className="aac-service-col">
                    <strong>{a.service_type || a.service_name || 'Serviço'}</strong>
                    <span>Com {a.barber_name || 'Profissional Atelier'}</span>
                    {bPhone && <span className="aac-barber-wa-info"><MessageCircle size={10} color="#25D366"/> {bPhone}</span>}
                  </div>

                  {/* Payment Details */}
                  <div className="aac-payment-col">
                    <strong className="aac-price">R$ {parseFloat(a.price || 0).toFixed(2)}</strong>
                    <div className="aac-payment-meta">
                      <span className={`appt-badge ${a.payment_status === 'Pago' ? 'paid' : ''}`}>
                        {a.payment_status === 'Pago' ? '✓ PAGO' : 'Pendente'}
                      </span>
                      <span className="payment-method-tag" title={a.payment_method}>{payMethodLabel}</span>
                    </div>
                  </div>

                  {/* WhatsApp Quick Actions Column */}
                  <div className="aac-wa-col">
                    <div className="aac-wa-buttons">
                      {bPhone ? (
                        <a
                          href={getWhatsAppUrlForBarber(a, bPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wa-btn-chip barber"
                          title={`Notificar Barbeiro (${a.barber_name}) no WhatsApp (${bPhone})`}
                        >
                          <MessageCircle size={12} color="#25D366"/>
                          <span>Avisar Barbeiro</span>
                        </a>
                      ) : (
                        <span
                          className="wa-btn-chip disabled"
                          title="Barbeiro sem WhatsApp cadastrado. Edite em 'Profissionais'."
                        >
                          <MessageCircle size={12} color="#666"/>
                          <span>Sem WhatsApp</span>
                        </span>
                      )}

                      {estPhone ? (
                        <a
                          href={getWhatsAppUrlForEstablishment(a, estPhone, establishmentWA.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wa-btn-chip establishment"
                          title={`Notificar Responsável pela Barbearia (${estPhone})`}
                        >
                          <Send size={12} color="var(--gold)"/>
                          <span>Avisar Barbearia</span>
                        </a>
                      ) : (
                        <button
                          className="wa-btn-chip setup"
                          onClick={() => { setWaForm(establishmentWA); setWaConfigModal(true); }}
                          title="Configurar número da barbearia para receber notificações"
                        >
                          <Settings size={12}/>
                          <span>Config. Whats</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="aac-status-col">
                    <span className={`appt-badge ${a.status === 'Confirmado' ? 'confirmed' : a.status === 'Concluído' ? 'completed' : 'cancelled'}`}>
                      {a.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="aac-actions-col">
                    {a.status === 'Confirmado' && (
                      <button
                        className="gold-button compact"
                        onClick={() => updateAppointmentStatus(a.id, 'Concluído')}
                        title="Marcar como atendido"
                      >
                        <Check size={13}/> Concluir
                      </button>
                    )}
                    {a.status !== 'Cancelado' && a.status !== 'Concluído' && (
                      <button
                        className="outline-button compact danger-outline"
                        onClick={() => {
                          if (window.confirm('Deseja realmente cancelar este agendamento?')) {
                            updateAppointmentStatus(a.id, 'Cancelado');
                          }
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      className="outline-button compact"
                      onClick={() => setSelectedReceipt(a)}
                      title="Ver Comprovante de Pagamento"
                    >
                      Recibo
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal title="Comprovante de Pagamento & Reserva" onClose={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content">
            <div className="receipt-brand">ATELIER<span>BARBER</span></div>
            <div className="receipt-status-banner">
              <CheckCircle2 size={24} color="var(--gold)"/>
              <div>
                <strong>PAGAMENTO CONFIRMADO</strong>
                <small>Transação autorizada e registrada no Atelier</small>
              </div>
            </div>

            <div className="receipt-details-list">
              <div className="rd-item"><span>Código da Reserva:</span><strong>#{String(selectedReceipt.id).slice(0, 8).toUpperCase()}</strong></div>
              <div className="rd-item"><span>Cliente:</span><strong>{selectedReceipt.client_name || 'Cliente'} {selectedReceipt.client_email ? `(${selectedReceipt.client_email})` : ''}</strong></div>
              <div className="rd-item"><span>Serviço:</span><strong>{selectedReceipt.service_type || selectedReceipt.service_name}</strong></div>
              <div className="rd-item"><span>Profissional:</span><strong>{selectedReceipt.barber_name}</strong></div>
              <div className="rd-item"><span>Data e Horário:</span><strong>{selectedReceipt.date ? selectedReceipt.date.split('-').reverse().join('/') : ''} às {selectedReceipt.time}</strong></div>
              <div className="rd-item"><span>Forma de Pagamento:</span><strong>{selectedReceipt.payment_method || 'Cartão'}</strong></div>
              <div className="rd-item total-row"><span>Total Pago:</span><strong className="total-gold">R$ {parseFloat(selectedReceipt.price || 0).toFixed(2)}</strong></div>
            </div>

            {/* WhatsApp Dispatch Section inside Receipt Modal */}
            <div className="receipt-wa-box">
              <div className="receipt-wa-header">
                <MessageCircle size={15} color="#25D366"/>
                <strong>NOTIFICAR VIA WHATSAPP</strong>
              </div>
              <div className="receipt-wa-grid">
                {(() => {
                  const bPhone = getBarberPhoneForAppt(selectedReceipt);
                  const estPhone = establishmentWA.phone;
                  return (
                    <>
                      {bPhone && (
                        <a
                          href={getWhatsAppUrlForBarber(selectedReceipt, bPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whatsapp-btn-full"
                          title="Abrir WhatsApp com mensagem pronta para o barbeiro"
                        >
                          <MessageCircle size={15}/>
                          <span>Enviar ao Barbeiro ({selectedReceipt.barber_name})</span>
                        </a>
                      )}
                      {estPhone && (
                        <a
                          href={getWhatsAppUrlForEstablishment(selectedReceipt, estPhone, establishmentWA.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whatsapp-btn-full outline"
                          title="Abrir WhatsApp com mensagem pronta para a barbearia"
                        >
                          <Send size={15}/>
                          <span>Enviar à Barbearia ({establishmentWA.name})</span>
                        </a>
                      )}
                      {!bPhone && !estPhone && (
                        <div style={{fontSize:11, color:'#888', gridColumn:'1 / -1', textAlign:'center', padding:8}}>
                          Cadastre o WhatsApp do profissional em 'Profissionais' ou da barbearia no topo para disparar o comprovante com 1 clique.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div style={{display:'flex', gap:10, marginTop:20}}>
              <button className="gold-button" style={{flex:1}} onClick={() => window.print()}>
                <Printer size={15}/> Imprimir Comprovante
              </button>
              <button className="outline-button" onClick={() => setSelectedReceipt(null)}>
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* WhatsApp Configuration Modal */}
      {waConfigModal && (
        <Modal title="Configurar WhatsApp da Barbearia" onClose={() => setWaConfigModal(false)}>
          <div className="modal-form">
            <div className="wa-config-banner">
              <div className="wa-config-icon"><MessageCircle size={28} color="#25D366"/></div>
              <div>
                <strong>Avisos Automáticos no WhatsApp</strong>
                <p>Receba alertas instantâneos de novos agendamentos e pagamentos aprovados no WhatsApp da barbearia.</p>
              </div>
            </div>

            <label>
              WhatsApp do Responsável / Recepção
              <span className="label-hint">(ex: 11 99999-8888 ou 5511999998888)</span>
              <input
                placeholder="Ex: 11 99999-8888"
                value={waForm.phone}
                onChange={e => setWaForm({...waForm, phone: e.target.value})}
              />
            </label>

            <label>
              Nome do Estabelecimento / Barbearia
              <input
                placeholder="Atelier Barber"
                value={waForm.name}
                onChange={e => setWaForm({...waForm, name: autoCap(e.target.value)})}
              />
            </label>

            <div className="wa-info-card">
              <ShieldCheck size={18} color="var(--gold)"/>
              <div>
                <strong>Avisos individuais por Barbeiro:</strong>
                <p>
                  O WhatsApp de cada profissional pode ser configurado na aba <strong>Profissionais</strong>. O sistema permite disparar alertas diretamente para o celular do barbeiro que irá realizar o corte!
                </p>
              </div>
            </div>

            <div style={{display:'flex', gap:10, marginTop:24}}>
              <button className="gold-button" style={{flex:1}} onClick={saveEstablishmentWA}>
                <Check size={16}/> Salvar Configurações
              </button>
              <button className="outline-button" onClick={() => setWaConfigModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// ── Client Shop (Member Boutique Experience) ───────────────────────────────────
function ClientShop({ user, onOpenCart, onBuyNow, onGoToOrders }) {
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedNotice, setAddedNotice] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      let dbProducts = [];
      try {
        const { data } = await supabase.from('products').select('*').eq('is_active', true);
        if (data && data.length) dbProducts = data;
      } catch {}

      let localProducts = [];
      try {
        localProducts = JSON.parse(localStorage.getItem('barber_all_products') || '[]');
      } catch {}

      const map = new Map();
      INITIAL_PRODUCTS.forEach(p => map.set(p.id, p));
      localProducts.forEach(p => map.set(p.id, p));
      dbProducts.forEach(p => map.set(p.id, p));

      setProducts(Array.from(map.values()));
    }
    loadProducts();
  }, []);

  const categories = ['Todos', 'Pomadas', 'Óleos', 'Shampoos', 'Cremes', 'Acessórios'];

  const filtered = products.filter(p => {
    if (selectedCat !== 'Todos' && p.category !== selectedCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  function handleAddToCart(p) {
    addToCart(p, 1);
    setAddedNotice(p.name);
    setTimeout(() => setAddedNotice(null), 3000);
  }

  return (
    <div className="admin-view fade-in">
      {addedNotice && (
        <div className="cart-toast-notice slide-down">
          <CheckCircle2 size={16} color="var(--gold)"/>
          <span><strong>{addedNotice}</strong> adicionado à sacola!</span>
          <button onClick={() => { setAddedNotice(null); onOpenCart(); }} className="ctn-view-btn">
            Ver Sacola
          </button>
        </div>
      )}

      <header className="topbar">
        <div>
          <div className="eyebrow">BOUTIQUE EXCLUSIVA · MEMBROS</div>
          <h2>Produtos & Cuidados Atelier.</h2>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <button className="outline-button compact" onClick={onGoToOrders}>
            <Package size={14}/> Meus Pedidos
          </button>
          <button className="gold-button compact" onClick={onOpenCart}>
            <ShoppingBag size={15}/> Abrir Sacola
          </button>
        </div>
      </header>

      {/* Toolbar & Filters */}
      <div className="admin-toolbar" style={{marginTop:16}}>
        <div className="category-filter-row" style={{marginBottom:0}}>
          {categories.map(c => (
            <button
              key={c}
              className={`cat-pill ${selectedCat === c ? 'active' : ''}`}
              onClick={() => setSelectedCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="admin-search-box">
          <Search size={15} color="#888"/>
          <input
            placeholder="Buscar produto por nome ou categoria..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="search-clear"><X size={13}/></button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="product-grid" style={{marginTop:24}}>
        {filtered.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-img-box">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} />
              ) : (
                <div className="product-placeholder"><ShoppingBag opacity={0.2} size={40}/></div>
              )}
              <span className="product-card-badge">{p.category || 'Boutique'}</span>
            </div>
            
            <div className="product-card-body">
              <div className="product-stock-tag">
                <Check size={11} color="#51c18a"/>
                <span>{p.stock_quantity > 0 ? `${p.stock_quantity} em estoque` : 'Disponível'}</span>
              </div>
              <h4>{p.name}</h4>
              <p className="product-desc">{p.description || 'Produto exclusivo Atelier Barber.'}</p>
              <strong className="product-price">R$ {parseFloat(p.price).toFixed(2)}</strong>

              <div className="product-actions-group">
                <button
                  className="gold-button compact buy-now-btn"
                  onClick={() => onBuyNow(p)}
                  title="Comprar imediatamente com PIX ou Cartão"
                >
                  Comprar agora
                </button>
                <button
                  className="outline-button compact add-cart-btn"
                  onClick={() => handleAddToCart(p)}
                  title="Adicionar à sacola de compras"
                >
                  <ShoppingBag size={14}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Client Orders Tab (Order History) ───────────────────────────────────────────
function ClientOrders({ user, onGoToShop }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    let all = [];
    try {
      all = JSON.parse(localStorage.getItem('barber_all_orders') || '[]');
    } catch {}

    const userOrders = all.filter(o => !o.client_id || !user?.id || o.client_id === user.id);
    setOrders(userOrders);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
    function handleNewOrder() {
      loadOrders();
    }
    window.addEventListener('barber_new_order', handleNewOrder);
    return () => window.removeEventListener('barber_new_order', handleNewOrder);
  }, [loadOrders]);

  let estWA = { phone: '', name: 'Atelier Barber' };
  try {
    estWA = JSON.parse(localStorage.getItem('barber_establishment_whatsapp') || '{"phone":"","name":"Atelier Barber"}');
  } catch {}

  return (
    <div className="admin-view fade-in">
      <header className="topbar">
        <div>
          <div className="eyebrow">HISTÓRICO DE COMPRAS</div>
          <h2>Meus Pedidos na Boutique.</h2>
        </div>
        <button className="gold-button compact" onClick={onGoToShop}>
          <ShoppingBag size={15}/> Ver Boutique
        </button>
      </header>

      {loading ? (
        <div style={{color:'#888', padding:40, textAlign:'center'}}>Carregando histórico de pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="premium-empty" style={{marginTop:30}}>
          <Package size={36} opacity={0.2}/>
          <p>Você ainda não realizou compras na boutique.</p>
          <button className="gold-button" style={{marginTop:16}} onClick={onGoToShop}>
            Explorar Produtos <ChevronRight size={16}/>
          </button>
        </div>
      ) : (
        <div className="admin-appt-list-wrap" style={{marginTop:20}}>
          <div className="admin-appt-list">
            <div className="client-order-header">
              <span>Pedido</span>
              <span>Itens & Detalhes</span>
              <span style={{textAlign:'right'}}>Total</span>
              <span style={{textAlign:'center'}}>Status</span>
              <span style={{textAlign:'right'}}>Ações</span>
            </div>
            {orders.map(o => {
              const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : 'Data recente';
              const payMethodLabel = o.payment_method === 'Pagamento Aprovado' ? 'Aprovado' : (o.payment_method || 'Cartão');
              return (
                <div key={o.id} className="client-order-card">
                  <div className="aac-date-col">
                    <span className="today-badge" style={{background:'#222', color:'var(--gold)', border:'1px solid var(--gold-soft)'}}>PEDIDO</span>
                    <strong className="aac-time" style={{fontSize:13}}>#{o.id}</strong>
                    <span className="aac-date">{dateStr}</span>
                  </div>

                  <div className="aac-service-col">
                    <strong style={{color:'var(--gold)'}}>
                      {(o.items || []).map(i => `${i.quantity || 1}x ${i.name}`).join(', ')}
                    </strong>
                    <span style={{fontSize:11, color:'#aaa', marginTop:3}}>
                      {o.delivery_type === 'delivery' ? `🛵 Entrega: ${o.delivery_address}` : `🏪 Retirada no Atelier Barber`}
                    </span>
                  </div>

                  <div className="aac-payment-col">
                    <strong className="aac-price">R$ {parseFloat(o.total_price || 0).toFixed(2)}</strong>
                    <div className="aac-payment-meta">
                      <span className="appt-badge paid">✓ PAGO</span>
                      <span className="payment-method-tag" title={o.payment_method}>{payMethodLabel}</span>
                    </div>
                  </div>

                  <div className="aac-status-col">
                    <span className="appt-badge confirmed">{o.status || 'Confirmado'}</span>
                  </div>

                  <div className="aac-actions-col">
                    {estWA.phone && (
                      <a
                        href={getWhatsAppUrlForOrder(o, estWA.phone, estWA.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wa-btn-chip establishment"
                        title="Enviar pedido para o WhatsApp da Barbearia"
                      >
                        <MessageCircle size={12}/> Avisar Loja
                      </a>
                    )}
                    <button
                      className="outline-button compact"
                      onClick={() => setSelectedReceipt(o)}
                    >
                      Ver Recibo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Receipt Modal */}
      {selectedReceipt && (
        <Modal title="Comprovante de Compra na Boutique" onClose={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content">
            <div className="receipt-brand">ATELIER<span>BOUTIQUE</span></div>
            <div className="receipt-status-banner">
              <CheckCircle2 size={24} color="var(--gold)"/>
              <div>
                <strong>PEDIDO CONFIRMADO & PAGO</strong>
                <small>Transação registrada com sucesso no Atelier Barber</small>
              </div>
            </div>

            <div className="receipt-details-list">
              <div className="rd-item"><span>Código do Pedido:</span><strong>#{selectedReceipt.id}</strong></div>
              <div className="rd-item"><span>Cliente:</span><strong>{selectedReceipt.client_name} ({selectedReceipt.client_phone})</strong></div>
              <div className="rd-item"><span>Modo de Recebimento:</span><strong>{selectedReceipt.delivery_address}</strong></div>
              <div className="rd-item"><span>Forma de Pagamento:</span><strong>{selectedReceipt.payment_method}</strong></div>
              <div className="rd-item">
                <span>Itens:</span>
                <strong>{(selectedReceipt.items || []).map(i => `${i.quantity || 1}x ${i.name}`).join(' | ')}</strong>
              </div>
              <div className="rd-item total-row">
                <span>Total Pago:</span>
                <strong className="total-gold">R$ {parseFloat(selectedReceipt.total_price || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div style={{display:'flex', gap:10, marginTop:24}}>
              <button className="gold-button" style={{flex:1}} onClick={() => window.print()}>
                <Printer size={15}/> Imprimir
              </button>
              <button className="outline-button" onClick={() => setSelectedReceipt(null)}>
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CLIENT APP — Full Experience with E-Commerce
// -----------------------------------------------------------------------------
function ClientApp({ user, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('services');
  const [cartItems, setCartItems] = useState(getStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, items: [] });

  useEffect(() => {
    function handleCartUpdate(e) {
      setCartItems(e.detail || []);
    }
    window.addEventListener('barber_cart_updated', handleCartUpdate);
    return () => window.removeEventListener('barber_cart_updated', handleCartUpdate);
  }, []);

  const totalCartCount = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div className="app-shell fade-in">
      <aside className="sidebar">
        <div className="brand-mark">ATELIER<span>BARBER</span></div>
        <div className="location"><MapPin size={14}/> MEMBRO</div>
        <nav>
          <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>
            <Scissors size={18}/>Serviços
          </button>
          <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>
            <CalendarDays size={18}/>Agendamentos
          </button>
          <button className={activeTab === 'shop' ? 'active' : ''} onClick={() => setActiveTab('shop')}>
            <ShoppingBag size={18}/>Boutique (Loja)
            {totalCartCount > 0 && <span className="nav-badge-gold">{totalCartCount}</span>}
          </button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <Package size={18}/>Meus Pedidos
          </button>
          <button className={activeTab === 'profile'  ? 'active' : ''} onClick={() => setActiveTab('profile')}>
            <User size={18}/>Meu Perfil
          </button>
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
        {activeTab === 'shop' && (
          <ClientShop
            user={user}
            onOpenCart={() => setIsCartOpen(true)}
            onBuyNow={p => setCheckoutModal({ isOpen: true, items: [{ ...p, quantity: 1 }] })}
            onGoToOrders={() => setActiveTab('orders')}
          />
        )}
        {activeTab === 'orders' && (
          <ClientOrders
            user={user}
            onGoToShop={() => setActiveTab('shop')}
          />
        )}
        {activeTab === 'profile' && (
          <ClientProfile user={user} onUpdate={onUserUpdate}/>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateCartItemQty}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
        onCheckout={items => setCheckoutModal({ isOpen: true, items })}
      />

      {/* Checkout Modal */}
      <ProductCheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal({ isOpen: false, items: [] })}
        items={checkoutModal.items}
        user={user}
        onSuccessOrder={() => {
          setCartItems([]);
          setActiveTab('orders');
        }}
      />
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
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <a
                    href={getWhatsAppUrlForClient(a, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="client-wa-link"
                    title="Ver comprovante e detalhes no WhatsApp"
                  >
                    <MessageCircle size={13} color="#25D366"/>
                    <span>WhatsApp</span>
                  </a>
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

      const enrichedAppt = {
        ...apptRecord,
        id: inserted?.id || String(Date.now()),
        client_name: user.full_name || user.email?.split('@')[0] || 'Cliente Atelier',
        client_email: user.email || '',
        barber_name: barberSelected?.name || 'Profissional Atelier',
        service_name: selected.name,
        payment_method: payMode === 'card' ? `Cartão (${parcelas}x)` : 'PIX Instantâneo',
        created_at: new Date().toISOString(),
      };

      try {
        const stored = JSON.parse(localStorage.getItem('barber_all_appointments') || '[]');
        const updated = [enrichedAppt, ...stored.filter(a => a.id !== enrichedAppt.id)];
        localStorage.setItem('barber_all_appointments', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('barber_new_appointment', { detail: enrichedAppt }));
      } catch (e) {
        console.warn('Local appointment sync notice:', e);
      }

      setConfirmedAppt(enrichedAppt);
      setIsSuccess(true);
      if (onSuccessAppointment) onSuccessAppointment(inserted || enrichedAppt);
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

              {/* WhatsApp Notification Box */}
              <div className="payment-wa-box">
                <div className="payment-wa-title">
                  <MessageCircle size={15} color="#25D366"/>
                  <strong>NOTIFICAÇÃO NO WHATSAPP</strong>
                </div>
                <p className="payment-wa-subtitle">
                  Avise o profissional ou a gerência da barbearia com 1 clique:
                </p>
                <div className="payment-wa-actions">
                  {(() => {
                    let bPhone = barber?.phone;
                    if (!bPhone) {
                      try {
                        const stored = JSON.parse(localStorage.getItem('barber_barber_phones') || '{}');
                        bPhone = stored[barber?.id] || stored[barber?.name] || stored[confirmedAppt?.barber_id] || stored[confirmedAppt?.barber_name];
                      } catch {}
                    }
                    let est = { phone: '', name: 'Atelier Barber' };
                    try {
                      est = JSON.parse(localStorage.getItem('barber_establishment_whatsapp') || '{"phone":"","name":"Atelier Barber"}');
                    } catch {}

                    return (
                      <>
                        {bPhone && (
                          <a
                            href={getWhatsAppUrlForBarber(confirmedAppt, bPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="payment-wa-btn barber"
                            title={`Enviar comprovante para o WhatsApp de ${confirmedAppt?.barber_name}`}
                          >
                            <MessageCircle size={15}/>
                            <span>Avisar {confirmedAppt?.barber_name || 'Barbeiro'}</span>
                          </a>
                        )}
                        {est.phone && (
                          <a
                            href={getWhatsAppUrlForEstablishment(confirmedAppt, est.phone, est.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="payment-wa-btn establishment"
                            title="Enviar comprovante para a Barbearia"
                          >
                            <Send size={15}/>
                            <span>Avisar Recepção</span>
                          </a>
                        )}
                        <a
                          href={getWhatsAppUrlForClient(confirmedAppt, '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="payment-wa-btn client"
                          title="Salvar comprovante no seu WhatsApp"
                        >
                          <Copy size={15}/>
                          <span>Salvar no meu WhatsApp</span>
                        </a>
                      </>
                    );
                  })()}
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
