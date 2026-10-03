import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'

// ====== EDIT THESE ======
const WHATSAPP = '923256449291' // your number, digits only, country code first (no + or spaces)
const INSTAGRAM =https://www.instagram.com/nexoraofficial1122 
// ========================

const SIZES = ['S', 'M', 'L', 'XL']
const rs = n => 'Rs ' + Number(n).toLocaleString('en-PK')
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch { return false } }

const toBase64 = file => new Promise((res, rej) => {
  const r = new FileReader()
  r.onerror = rej
  r.onload = () => {
    const img = new Image()
    img.onerror = rej
    img.onload = () => {
      const s = Math.min(1, 800 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = img.width * s; c.height = img.height * s
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.82))
    }
    img.src = r.result
  }
  r.readAsDataURL(file)
})

function Admin() {
  const [session, setSession] = useState(undefined)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name: '', price: '', sizes: ['M'], image: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false })
    setProducts(data || [])
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => { if (session) refresh() }, [session])

  const login = async e => {
    e.preventDefault(); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setErr('Wrong email or password.')
  }
  const pick = async e => {
    const f = e.target.files[0]
    if (!f) return
    try { setForm(s => ({ ...s, image: '' })); const b = await toBase64(f); setForm(s => ({ ...s, image: b })) }
    catch { setMsg('Could not read that image. Try a JPG or PNG.') }
  }
  const toggle = z => setForm(s => ({ ...s, sizes: s.sizes.includes(z) ? s.sizes.filter(x => x !== z) : [...s.sizes, z] }))
  const add = async e => {
    e.preventDefault()
    if (!form.image) return setMsg('Upload a product image first.')
    if (!form.sizes.length) return setMsg('Select at least one size.')
    setBusy(true)
    const { error } = await supabase.from('products').insert({
      name: form.name.trim(), price: Number(form.price),
      sizes: SIZES.filter(z => form.sizes.includes(z)), image: form.image
    })
    setBusy(false)
    if (error) return setMsg('Could not save: ' + error.message)
    setForm({ name: '', price: '', sizes: ['M'], image: '' })
    e.target.reset()
    setMsg('Product added. Everyone can see it on the homepage now.')
    refresh()
  }
  const del = async id => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return setMsg('Could not delete: ' + error.message)
    refresh()
  }

  if (session === undefined) return null
  if (!session) return (
    <main className="gate">
      <form onSubmit={login} className="gatebox">
        <h1 className="logo">NEXORA</h1>
        <p>Admin login</p>
        <input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" required />
        {err && <p className="err">{err}</p>}
        <button className="btn red">Log in</button>
      </form>
    </main>
  )

  return (
    <main className="admin">
      <header className="adminbar">
        <a href="/" className="logo">NEXORA</a>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Log out</button>
      </header>
      <section className="panel">
        <h2>Add product</h2>
        <form onSubmit={add} className="aform">
          <label>Product image
            <input type="file" accept="image/*" onChange={pick} required />
          </label>
          {form.image && <img className="preview" src={form.image} alt="Preview" />}
          <label>Product name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Real Madrid Home 24/25" required />
          </label>
          <label>Price (Rs)
            <input type="number" min="1" inputMode="numeric" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="4500" required />
          </label>
          <fieldset>
            <legend>Sizes available</legend>
            <div className="sizes">
              {SIZES.map(z => (
                <button type="button" key={z} className={'size' + (form.sizes.includes(z) ? ' on' : '')} onClick={() => toggle(z)}>{z}</button>
              ))}
            </div>
          </fieldset>
          <button className="btn red" disabled={busy}>{busy ? 'Saving…' : 'Add Product'}</button>
          {msg && <p className="note">{msg}</p>}
        </form>
      </section>
      <section className="panel">
        <h2>Your products ({products.length})</h2>
        {!products.length && <p className="muted">No products yet. Add your first jersey above.</p>}
        <ul className="plist">
          {products.map(p => (
            <li key={p.id}>
              <img src={p.image} alt={p.name} />
              <div><strong>{p.name}</strong><span>{rs(p.price)} · {p.sizes.join(', ')}</span></div>
              <button className="btn ghost" onClick={() => del(p.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function Card({ p, onAdd }) {
  const [size, setSize] = useState(p.sizes[0])
  return (
    <article className="card">
      <div className="imgwrap"><img src={p.image} alt={p.name} loading="lazy" /></div>
      <h3>{p.name}</h3>
      <p className="price">{rs(p.price)}</p>
      <div className="sizes">
        {p.sizes.map(z => <button key={z} className={'size' + (size === z ? ' on' : '')} onClick={() => setSize(z)}>{z}</button>)}
      </div>
      <button className="btn red full" onClick={() => onAdd(p, size)}>Add to cart</button>
    </article>
  )
}

function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { supabase.from('products').select('*').order('id', { ascending: false }).then(({ data }) => { setProducts(data || []); setLoading(false) }) }, [])
  const [cart, setCart] = useState(() => load('nexora_cart', []))
  const [open, setOpen] = useState(false)
  useEffect(() => { save('nexora_cart', cart) }, [cart])

  const count = cart.reduce((a, i) => a + i.qty, 0)
  const total = cart.reduce((a, i) => a + i.qty * i.price, 0)
  const add = (p, size) => {
    setCart(c => {
      const hit = c.find(i => i.id === p.id && i.size === size)
      return hit ? c.map(i => i === hit ? { ...i, qty: i.qty + 1 } : i) : [...c, { id: p.id, name: p.name, price: p.price, image: p.image, size, qty: 1 }]
    })
    setOpen(true)
  }
  const change = (i, d) => setCart(c => c.map(x => x === i ? { ...x, qty: x.qty + d } : x).filter(x => x.qty > 0))
  const checkout = () => {
    const lines = cart.map(i => `• ${i.name} (Size ${i.size}) x${i.qty} = ${rs(i.price * i.qty)}`).join('\n')
    const text = `Hello NEXORA OFFICIAL, I want to order:\n\n${lines}\n\nTotal: ${rs(total)}\n\nName:\nAddress:\nCity:`
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      <header className="nav">
        <a href="/" className="logo">NEXORA<span> OFFICIAL</span></a>
        <button className="cartbtn" onClick={() => setOpen(true)} aria-label="Open cart">Cart <b>{count}</b></button>
      </header>

      <section className="hero">
        <div className="bignum" aria-hidden="true">10</div>
        <div className="herotext">
          <p className="tag">Premium football jerseys</p>
          <h1>Wear the<br />match day.</h1>
          <a href="#new" className="btn red">Shop new arrivals</a>
        </div>
      </section>

      <section id="new" className="section">
        <h2>New arrivals</h2>
        {loading ? <p className="muted">Loading…</p> : products.length ? (
          <div className="grid">{products.map(p => <Card key={p.id} p={p} onAdd={add} />)}</div>
        ) : (
          <p className="muted">New jerseys are on the way. Check back soon.</p>
        )}
      </section>

      <footer className="footer">
        <div className="logo">NEXORA<span> OFFICIAL</span></div>
        <a className="btn ghost" href={INSTAGRAM} target="_blank" rel="noreferrer">Follow us on Instagram</a>
        <small>© {new Date().getFullYear()} NEXORA OFFICIAL. All rights reserved.</small>
      </footer>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={'drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="drawerhead"><h2>Your cart</h2><button className="btn ghost" onClick={() => setOpen(false)}>Close</button></div>
        <div className="items">
          {!cart.length && <p className="muted">Your cart is empty.</p>}
          {cart.map(i => (
            <div className="item" key={i.id + i.size}>
              <img src={i.image} alt="" />
              <div><strong>{i.name}</strong><span>Size {i.size} · {rs(i.price)}</span>
                <div className="qty"><button onClick={() => change(i, -1)}>−</button><b>{i.qty}</b><button onClick={() => change(i, 1)}>+</button></div>
              </div>
            </div>
          ))}
        </div>
        {!!cart.length && (
          <div className="drawerfoot">
            <div className="total"><span>Total</span><strong>{rs(total)}</strong></div>
            <button className="btn red full" onClick={checkout}>Order on WhatsApp</button>
          </div>
        )}
      </aside>
    </>
  )
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path === '/admin' ? <Admin /> : <Store />
}
