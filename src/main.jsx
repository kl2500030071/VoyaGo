import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Plane,
  Train,
  Hotel,
  Car,
  LayoutDashboard,
  Users,
  Package,
  Ticket,
  ChartNoAxesCombined,
  LogOut,
  Search,
  Sun,
  Moon,
  UserRound,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowLeftRight,
  Bell
} from 'lucide-react';

import './style.css';

const S = window.VoyaStore;
const K = window.VoyaKeys;
const INR = window.VoyaFormatINR;

const read = (k, d = []) => S.read(K[k] || k, d);
const write = (k, v) => S.write(K[k] || k, v);

const PARTNER_DEFAULTS = {
  flight: [
    ['mmt', 'MakeMyTrip', 'https://www.makemytrip.com/'],
    ['goibibo', 'Goibibo', 'https://www.goibibo.com/'],
    ['cleartrip', 'Cleartrip', 'https://www.cleartrip.com/'],
    ['easemytrip', 'EaseMyTrip', 'https://www.easemytrip.com/'],
    ['ixigo', 'Ixigo', 'https://www.ixigo.com/'],
    ['yatra', 'Yatra', 'https://www.yatra.com/'],
    ['airline', 'Airline site', 'https://www.goindigo.in/']
  ],

  train: [
    ['irctc', 'IRCTC', 'https://www.irctc.co.in/'],
    ['confirmtkt', 'ConfirmTkt', 'https://www.confirmtkt.com/'],
    ['ixigo-trains', 'Ixigo Trains', 'https://www.ixigo.com/trains'],
    ['mmt-trains', 'MakeMyTrip Trains', 'https://www.makemytrip.com/railways/']
  ],

  hotel: [
    ['booking', 'Booking.com', 'https://www.booking.com/'],
    ['mmt-hotels', 'MakeMyTrip', 'https://www.makemytrip.com/hotels/'],
    ['goibibo-hotels', 'Goibibo', 'https://www.goibibo.com/hotels/'],
    ['agoda', 'Agoda', 'https://www.agoda.com/'],
    ['cleartrip-hotels', 'Cleartrip', 'https://www.cleartrip.com/hotels'],
    ['oyo', 'OYO', 'https://www.oyorooms.com/']
  ],

  cab: [
    ['uber', 'Uber', 'https://www.uber.com/in/en/'],
    ['ola', 'Ola', 'https://www.olacabs.com/'],
    ['rapido', 'Rapido', 'https://www.rapido.bike/']
  ]
};

function ensurePartners() {
  const saved = read('partners', {});
  const merged = {};

  for (const [mode, items] of Object.entries(PARTNER_DEFAULTS)) {
    const old = Array.isArray(saved?.[mode]) ? saved[mode] : [];

    merged[mode] = items
      .map(([id, name, url]) => ({
        id,
        name,
        url,
        active: true,
        ...(old.find(p => p.id === id) || {})
      }))
      .concat(old.filter(p => !items.some(x => x[0] === p.id)));
  }

  write('partners', merged);
  return merged;
}

const getPartners = mode => ensurePartners()[mode] || [];

ensurePartners();

async function hash(s) {
  const b = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(s)
  );

  return [...new Uint8Array(b)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function App() {

  const [path, setPath] = useState(location.pathname);

  const [user, setUser] = useState(
    () => read('session', null) || null
  );

  const [theme, setTheme] = useState(
    () => read('settings', { theme: 'light' }).theme || 'light'
  );

  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const [users, setUsers] = useState(() => read('users', []));
  const [bookings, setBookings] = useState(() => read('bookings', []));
  const [inventory, setInventory] = useState(() => read('inventory', {}));
  const [partnersMap, setPartnersMap] = useState(() => ensurePartners());
  const [redirects, setRedirects] = useState(() => read('redirects', []));
  const [priceAlerts, setPriceAlerts] = useState(() => read('priceAlerts', []));
  const [invTab, setInvTab] = useState('flights');
  const [invFilter, setInvFilter] = useState('');

  const [search, setSearch] = useState({
    type: 'flight',
    from: 'Delhi',
    to: 'Mumbai',
    city: 'Mumbai',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  });

  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [trainClass, setTrainClass] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const EMPTY_ITEM = {
    type: 'flight',
    name: '',
    from: '',
    to: '',
    city: '',
    price: '',
    airline: '',
    flightNo: '',
    trainNo: '',
    depart: '',
    arrive: '',
    duration: '',
    kind: '',
    rating: ''
  };

  const [newItem, setNewItem] = useState(EMPTY_ITEM);

  const go = (p, { resetResults = true } = {}) => {
    history.pushState({}, '', p);
    setPath(p);
    if (resetResults) {
      setResults([]);
      setFilter('');
    }
  };

  useEffect(() => {
    const fn = () => setPath(location.pathname);

    addEventListener('popstate', fn);

    return () => {
      removeEventListener('popstate', fn);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    write('settings', {
      ...read('settings', {}),
      theme
    });
  }, [theme]);

  const notify = message => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  const persistSession = session => {
    if (session) {
      write('session', session);
      sessionStorage.setItem('voyago_session', JSON.stringify(session));
    } else {
      S.remove(K.session);
      sessionStorage.removeItem('voyago_session');
    }
    setUser(session);
  };

  const isAdmin = user?.role === 'admin';
  const isAuth = !!user;

  const route = path.replace(/\/$/, '') || '/';

  const title = route.includes('/admin')
    ? 'Admin'
    : route.includes('/user')
      ? 'User'
      : 'VoyaGo';

  useEffect(() => {
    const page = route === '/'
      ? 'Travel Comparison'
      : route.split('/').pop().replace(/-/g, ' ').replace(/^./, x => x.toUpperCase());
    document.title = `VoyaGo — ${page}`;
  }, [route]);

  const cities = Array.from(
    new Set(
      Object.values(inventory)
        .flatMap(arr => (Array.isArray(arr) ? arr : []))
        .flatMap(x => [x?.from, x?.to, x?.city])
        .filter(Boolean)
    )
  ).sort();

  const addInventoryItem = e => {
    e.preventDefault();

    const type = newItem.type;

    const key = {
      flight: 'flights',
      train: 'trains',
      hotel: 'hotels',
      cab: 'cabs'
    }[type];

    if (!key) {
      notify('Invalid travel category.');
      return;
    }

    const price = Number(newItem.price);
    if (!Number.isFinite(price) || price <= 0) {
      notify('Please enter a valid positive price.');
      return;
    }

    const currentInventory = read('inventory', {});

    const item = {
      id: 'ADMIN-' + Date.now(),
      type,
      name: newItem.name.trim(),
      price,
      rating: Number(newItem.rating) || 0,
      ...(type === 'flight' || type === 'train'
        ? { from: newItem.from.trim(), to: newItem.to.trim() }
        : { city: newItem.city.trim() }),
      ...(type === 'flight'
        ? { airline: newItem.airline.trim(), flightNo: newItem.flightNo.trim() }
        : {}),
      ...(type === 'train' ? { trainNo: newItem.trainNo.trim() } : {}),
      ...(type === 'cab' ? { kind: newItem.kind.trim() } : {}),
      depart: newItem.depart,
      arrive: newItem.arrive,
      duration: newItem.duration.trim()
    };

    const updatedInventory = {
      ...currentInventory,
      [key]: [
        ...(Array.isArray(currentInventory[key])
          ? currentInventory[key]
          : []),
        item
      ]
    };

    write('inventory', updatedInventory);
    setInventory(updatedInventory);

    setNewItem({ ...EMPTY_ITEM, type });

    notify(`${type.toUpperCase()} added successfully!`);
  };

  const login = async (e, role = 'user') => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();
    const allUsers = read('users', []);

    const u = allUsers.find(
      x =>
        x.email?.toLowerCase() === email &&
        x.role === role
    );

    if (
      !u ||
      u.blocked ||
      u.passwordHash !== await hash(form.password)
    ) {
      notify(u?.blocked ? 'This account has been blocked.' : 'Invalid credentials. Please try again.');
      return;
    }

    const session = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    };

    persistSession(session);
    setForm({ name: '', email: '', password: '' });

    go(role === 'admin'
      ? '/admin/dashboard'
      : '/user/dashboard'
    );

    notify('Welcome back!');
  };

  const signup = async e => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      return notify('Please enter your full name.');
    }

    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      return notify(
        'Use 8+ characters with uppercase, lowercase and a number.'
      );
    }

    const allUsers = read('users', []);

    if (
      allUsers.some(
        u => u.email?.toLowerCase() === email.toLowerCase()
      )
    ) {
      return notify('An account with this email already exists.');
    }

    const u = {
      id: window.VoyaUid('U'),
      name,
      email,
      passwordHash: await hash(form.password),
      role: 'user',
      blocked: false,
      createdAt: new Date().toISOString()
    };

    const nextUsers = [...allUsers, u];
    write('users', nextUsers);
    setUsers(nextUsers);

    const session = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: 'user'
    };

    persistSession(session);
    setForm({ name: '', email: '', password: '' });

    go('/user/dashboard');

    notify('Account created successfully');
  };

  const logout = () => {
    persistSession(null);

    go('/');

    notify('Logged out');
  };

  const getModeCities = type => {
    const key = { flight: 'flights', train: 'trains', hotel: 'hotels', cab: 'cabs' }[type];
    const list = Array.isArray(inventory[key]) ? inventory[key] : [];
    const set = new Set();
    list.forEach(x => {
      if (type === 'hotel' || type === 'cab') {
        if (x?.city) set.add(x.city);
      } else {
        if (x?.from) set.add(x.from);
        if (x?.to) set.add(x.to);
      }
    });
    return Array.from(set).sort();
  };

  const selectMode = (t, autoSearch = false) => {
    const opts = getModeCities(t);
    const next = { ...search, type: t };
    if (t === 'hotel' || t === 'cab') {
      if (!opts.includes(next.city)) next.city = opts[0] || '';
    } else {
      if (!opts.includes(next.from)) next.from = opts[0] || '';
      if (!opts.includes(next.to) || next.to === next.from) {
        next.to = opts.find(c => c !== next.from) || opts[0] || '';
      }
    }
    setSearch(next);
    if (autoSearch) {
      doSearch(next);
    } else {
      setResults([]);
    }
  };

  // Travel search

  const doSearch = (override = null) => {
    const q = override || search;

    const key = {
      flight: 'flights',
      train: 'trains',
      hotel: 'hotels',
      cab: 'cabs'
    }[q.type];

    let arr = Array.isArray(inventory[key])
      ? inventory[key]
      : [];

    const normalize = value =>
      String(value || '').trim().toLowerCase();

    arr = arr.filter(x => {

      if (q.type === 'hotel' || q.type === 'cab') {
        return (
          !q.city ||
          normalize(x.city).includes(normalize(q.city))
        );
      }

      return (
        (!q.from ||
          normalize(x.from).includes(normalize(q.from))) &&
        (!q.to ||
          normalize(x.to).includes(normalize(q.to)))
      );
    });

    arr = arr
      .map(x => ({
        ...x,
        type: x.type || q.type
      }))
      .sort((a, b) =>
        (Number(a.price) || 0) - (Number(b.price) || 0)
      );

    setResults(arr.slice(0, 60));
    setExpandedId(null);

    notify(`${arr.length} matching options found`);
  };

  const saveTrip = item => {
    const b = read('bookings', []);

    if (b.some(x => x.userId === user.id && x.item?.id === item.id)) {
      notify('Already saved to My Trips');
      return;
    }

    const rec = {
      id: window.VoyaUid('B'),
      userId: user.id,
      type: item.type || search.type,
      item,
      price: Number(item.price) || 0,
      status: 'Saved',
      createdAt: new Date().toISOString(),
      from: item.from,
      to: item.to,
      city: item.city
    };

    const next = [rec, ...b];
    write('bookings', next);
    setBookings(next);

    notify('Saved to My Trips');
  };

  const togglePriceAlert = item => {
    const existing = priceAlerts.find(
      a => a.userId === user.id && a.itemId === item.id
    );
    const next = existing
      ? priceAlerts.filter(a => a.id !== existing.id)
      : [
          {
            id: window.VoyaUid('PA'),
            userId: user.id,
            itemId: item.id,
            type: item.type || search.type,
            label: item.name || item.airline || `${item.from} → ${item.to}` || item.city,
            targetPrice: Number(item.price) || 0,
            createdAt: new Date().toISOString()
          },
          ...priceAlerts
        ];
    write('priceAlerts', next);
    setPriceAlerts(next);
    notify(existing ? 'Price alert removed' : 'Price alert set');
  };

  const deleteInventoryItem = (kind, id) => {
    const updated = {
      ...inventory,
      [kind]: (inventory[kind] || []).filter(x => x.id !== id)
    };
    write('inventory', updated);
    setInventory(updated);
    notify('Inventory item removed');
  };

  const removeTrip = id => {
    const next = read('bookings', []).filter(x => x.id !== id);
    write('bookings', next);
    setBookings(next);
    notify('Saved option removed');
  };

  const recordRedirect = (partner, item, mode) => {
    const entry = {
      id: window.VoyaUid('R'),
      userId: user?.id || null,
      partnerId: partner.id,
      partnerName: partner.name,
      mode,
      itemId: item.id,
      createdAt: new Date().toISOString()
    };
    const next = [entry, ...read('redirects', [])];
    write('redirects', next);
    setRedirects(next);
  };

  const userBookings = bookings.filter(b => b.userId === user?.id);

  const navItems = isAdmin
    ? [
        ['/admin/dashboard', 'Dashboard', LayoutDashboard],
        ['/admin/inventory', 'Inventory', Package],
        ['/admin/users', 'Users', Users],
        ['/admin/bookings', 'Bookings', Ticket],
        ['/admin/partners', 'Partners', ShieldCheck],
        ['/admin/reports', 'Reports', ChartNoAxesCombined]
      ]
    : [
        ['/user/dashboard', 'Dashboard', LayoutDashboard],
        ['/user/search', 'Compare travel', Search],
        ['/user/trips', 'My Trips', Ticket],
        ['/user/profile', 'Profile', UserRound]
      ];

  const shell = children => (
    <div className="app-shell">

      <aside className="sidebar">

        <a
          className="brand"
          href="#"
          onClick={e => {
            e.preventDefault();
            go('/');
          }}
        >
          Voya<span>Go</span>
        </a>

        <div className="side-label">
          {isAdmin ? 'ADMIN MODULE' : 'USER MODULE'}
        </div>

        {navItems.map(([p, n, I]) => (
          <button
            key={p}
            className={'side-link ' + (route === p ? 'selected' : '')}
            onClick={() => go(p)}
          >
            <I size={18} />
            {n}
          </button>
        ))}

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {user?.name?.[0] || 'V'}
            </div>

            <div>
              <b>{user?.name}</b>
              <small>{user?.role}</small>
            </div>

          </div>

          <button className="side-link" onClick={logout}>
            <LogOut size={18} />
            Log out
          </button>

        </div>

      </aside>

      <main className="workspace">

        <header className="topbar">

          <div>
            <span className="muted">{title} module</span>

            <h2>
              {route.split('/').pop()
                .replace(/-/g, ' ')
                .replace(/^./, x => x.toUpperCase())}
            </h2>
          </div>

          <div className="row">

            <button
              className="btn ghost"
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>

            <span className="badge">
              {user?.role === 'admin'
                ? 'Administrator'
                : 'Traveller'}
            </span>

          </div>

        </header>

        {children}

      </main>

    </div>
  );

  const field = (label, key, type = 'text') => (
    <label>
      {label}

      <input
        className="input"
        type={type}
        value={form[key]}
        onChange={e =>
          setForm({
            ...form,
            [key]: e.target.value
          })
        }
        required
      />
    </label>
  );

  const renderPage = () => {

  // Route protection

  if (
    (!isAuth && (route.startsWith('/user/') || route.startsWith('/admin/'))) ||
    (isAuth && route.startsWith('/admin/') && !isAdmin) ||
    (isAuth && route.startsWith('/user/') && isAdmin)
  ) {
    return (
      <main className="page">
        <div className="container">
          <div className="card auth-card">

            <a
              className="brand"
              href="/"
              onClick={e => {
                e.preventDefault();
                go('/');
              }}
            >
              Voya<span>Go</span>
            </a>

            <h2>Access restricted</h2>

            <p>
              Please sign in with the correct account
              to access this module.
            </p>

            <button
              className="btn primary"
              onClick={() => {
                if (isAuth) persistSession(null);
                setForm({ name: '', email: '', password: '' });
                go(route.startsWith('/admin') ? '/admin-login' : '/login');
              }}
            >
              Continue to login
            </button>

          </div>
        </div>
      </main>
    );
  }

  // Authentication pages

  if (
    route === '/login' ||
    route === '/admin-login' ||
    route === '/signup'
  ) {

    const admin = route === '/admin-login';

    return (
      <main className="page aurora">

        <div className="container auth-card">

          <a className="brand" onClick={() => go('/')}>
            Voya<span>Go</span>
          </a>

          <section className="card">

            <span className="eyebrow">
              {route === '/signup'
                ? 'GET STARTED'
                : admin
                  ? 'ADMINISTRATION'
                  : 'WELCOME BACK'}
            </span>

            <h1>
              {route === '/signup'
                ? 'Create account'
                : admin
                  ? 'Admin login'
                  : 'Log in'}
            </h1>

            <p>
              {route === '/signup'
                ? 'Create your VoyaGo traveller account.'
                : 'Continue to your VoyaGo workspace.'}
            </p>

            <form
              onSubmit={
                route === '/signup'
                  ? signup
                  : e => login(e, admin ? 'admin' : 'user')
              }
              className="form-stack"
            >

              {route === '/signup' &&
                field('Full name', 'name')}

              {field('Email', 'email', 'email')}

              {field('Password', 'password', 'password')}

              <button className="btn primary full">
                {route === '/signup'
                  ? 'Create account'
                  : 'Log in'}
              </button>

            </form>

            <p>
              {route === '/signup'
                ? 'Already registered?'
                : 'New to VoyaGo?'}

              {' '}

              <a
                onClick={() => {
                  setForm({
                    name: '',
                    email: '',
                    password: ''
                  });

                  go(
                    route === '/signup'
                      ? '/login'
                      : '/signup'
                  );
                }}
              >
                {route === '/signup'
                  ? 'Log in'
                  : 'Create an account'}
              </a>
            </p>

            {!admin && (
              <a
                onClick={() => {
                  setForm({ name: '', email: '', password: '' });
                  go('/admin-login');
                }}
              >
                Admin login →
              </a>
            )}

          </section>

        </div>

      </main>
    );
  }

  // Landing page

  if (route === '/') {

    return (
      <>
        <header className="nav">

          <div className="container nav-inner">

            <a className="brand" onClick={() => go('/')}>
              Voya<span>Go</span>
            </a>

            <nav className="nav-links">

              <a href="#features">Features</a>

              <a onClick={() => go('/login')}>
                Log in
              </a>

              <a
                className="btn primary"
                onClick={() => go('/signup')}
              >
                Get started
              </a>

              <button
                className="btn ghost"
                onClick={() =>
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                }
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </button>

            </nav>

          </div>

        </header>

        <main>

          <section className="hero aurora hero-landing">

            <div className="container hero-grid">

              <div>

                <div className="eyebrow">
                  COMPARE ONCE. BOOK DIRECT.
                </div>

                <h1>
                  The cheapest{' '}
                  <span style={{ color: 'var(--primary)' }}>
                    true total
                  </span>
                  , without the tab overload.
                </h1>

                <p className="hero-sub">
                  Compare flights, trains, hotels and cabs
                  in one place, then continue to the partner
                  to book.
                </p>

                <div className="card search-box">

                  <div className="tabs">

                    {['flight', 'train', 'hotel', 'cab'].map(t => (
                      <button
                        key={t}
                        className={
                          'tab ' + (search.type === t ? 'active' : '')
                        }
                        onClick={() => selectMode(t)}
                      >
                        {t[0].toUpperCase() + t.slice(1)}s
                      </button>
                    ))}

                  </div>

                  <div
                    className={
                      'hero-search-fields' +
                      (['hotel', 'cab'].includes(search.type) ? ' is-city' : '')
                    }
                  >

                    <label>
                      {['hotel', 'cab'].includes(search.type)
                        ? 'City'
                        : 'From'}

                      <select
                        className="input"
                        value={
                          ['hotel', 'cab'].includes(search.type)
                            ? search.city
                            : search.from
                        }
                        onChange={e =>
                          setSearch({
                            ...search,
                            [ ['hotel', 'cab'].includes(search.type)
                              ? 'city'
                              : 'from'
                            ]: e.target.value
                          })
                        }
                      >
                        {getModeCities(search.type).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>

                    {!['hotel', 'cab'].includes(search.type) && (
                      <label>
                        To

                        <select
                          className="input"
                          value={search.to}
                          onChange={e =>
                            setSearch({
                              ...search,
                              to: e.target.value
                            })
                          }
                        >
                          {getModeCities(search.type).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Date

                      <input
                        className="input"
                        type="date"
                        value={search.date}
                        onChange={e =>
                          setSearch({
                            ...search,
                            date: e.target.value
                          })
                        }
                      />
                    </label>

                    <button
                      className="btn primary hero-search-btn"
                      onClick={() => {
                        if (!isAuth) {
                          setForm({ name: '', email: '', password: '' });
                          go('/login');
                        } else if (isAdmin) {
                          notify('Please use a traveller account to search and compare.');
                          go('/admin/dashboard');
                        } else {
                          go('/user/search', { resetResults: false });
                          doSearch();
                        }
                      }}
                    >
                      <Search size={16} /> Compare prices
                    </button>

                  </div>

                </div>

                <div className="hero-actions">
                  <button
                    className="btn primary"
                    onClick={() => go('/signup')}
                  >
                    Create free account
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => go('/login')}
                  >
                    Already have an account? Log in
                  </button>
                </div>

              </div>

              <div className="card gradient-border timeline-panel">

                <span className="badge success">
                  SELF-HEALING ITINERARY
                </span>

                <h3>Compare → save → adapt</h3>

                <p>
                  Keep flights, cabs and hotels on one
                  travel timeline.
                </p>

                <div className="timeline">

                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="card">
                      <b>Flight arrival</b>
                      <p>Delhi → Mumbai</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="card">
                      <b>Cab pickup</b>
                      <p>Arrival + 30 minutes</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="card">
                      <b>Hotel check-in</b>
                      <p>Connected itinerary update</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </section>

          <section className="section features-section" id="features">

            <div className="container">

              <span className="eyebrow">
                BUILT FOR COMPARISON
              </span>

              <h2 className="features-head">Less searching. Better decisions.</h2>

              <div className="grid grid-4">

                {[
                  ['Flights', Plane, 'Compare routes and fares.'],
                  ['Trains', Train, 'Explore rail options.'],
                  ['Hotels', Hotel, 'Compare stays by city.'],
                  ['Cabs', Car, 'Find local ride options.']
                ].map(([name, Icon, description]) => (
                  <div className="card feature-card" key={name}>
                    <div className="feature-icon"><Icon size={20} /></div>
                    <h3>{name}</h3>
                    <p>{description}</p>
                  </div>
                ))}

              </div>

            </div>

          </section>

        </main>
      </>
    );
  }

  if (!isAuth) {
    return (
      <main className="page">
        <div className="container auth-card">
          <div className="card">
            <h2>Page not found</h2>
            <button
              className="btn primary"
              onClick={() => go('/')}
            >
              Back home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // User dashboard

  if (route === '/user/dashboard') {

    return shell(
      <>
        <div className="stats-grid">

          <Stat
            label="Saved options"
            value={userBookings.length}
          />

          <Stat
            label="Travel categories"
            value="4"
          />

          <Stat
            label="Price alerts"
            value={priceAlerts.filter(x => x.userId === user.id).length}
          />

        </div>

        <div className="card section-card">

          <div className="row between">

            <div>
              <span className="eyebrow">
                TRAVEL WORKSPACE
              </span>

              <h2>Plan your next journey</h2>

              <p>
                Search across travel categories and keep
                your shortlist organised.
              </p>
            </div>

            <button
              className="btn primary"
              onClick={() => go('/user/search')}
            >
              Start comparing
            </button>

          </div>

        </div>

        <div className="grid grid-4">

          {[
            ['Flights', Plane],
            ['Trains', Train],
            ['Hotels', Hotel],
            ['Cabs', Car]
          ].map(([name, Icon]) => (
            <button
              className="card module-card"
              key={name}
              onClick={() => {
                const type = {
                  Flights: 'flight',
                  Trains: 'train',
                  Hotels: 'hotel',
                  Cabs: 'cab'
                }[name];

                selectMode(type, true);
                go('/user/search', { resetResults: false });
              }}
            >
              <Icon />
              <h3>{name}</h3>
              <span className="muted">
                Explore options →
              </span>
            </button>
          ))}

        </div>
      </>
    );
  }

  // User search and comparison

  if (route === '/user/search') {

    const modeCities = getModeCities(search.type);

    const popularChips =
      search.type === 'flight'
        ? [
            ['Delhi', 'Mumbai'],
            ['Delhi', 'Bengaluru'],
            ['Mumbai', 'Goa'],
            ['Hyderabad', 'Delhi'],
            ['Delhi', 'Dubai']
          ]
        : search.type === 'train'
          ? [
              ['Delhi', 'Mumbai'],
              ['Chennai', 'Bengaluru'],
              ['Delhi', 'Kolkata'],
              ['Hyderabad', 'Vijayawada']
            ]
          : ['Mumbai', 'Delhi', 'Goa', 'Bengaluru', 'Jaipur', 'Dubai'];

    const displayedResults = results
      .filter(x =>
        JSON.stringify(x)
          .toLowerCase()
          .includes(filter.toLowerCase())
      )
      .slice()
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        }
        if (sortBy === 'duration') {
          const da = Number(a.durationMinutes) || Number(a.eta) || 9999;
          const db = Number(b.durationMinutes) || Number(b.eta) || 9999;
          return da - db;
        }
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      });

    return shell(
      <>

        <div className="card section-card">

          <div className="tabs">

            {['flight', 'train', 'hotel', 'cab'].map(t => (
              <button
                key={t}
                className={
                  'tab ' + (search.type === t ? 'active' : '')
                }
                onClick={() => selectMode(t, true)}
              >
                {t.toUpperCase()}S
              </button>
            ))}

          </div>

          <div className="search-fields">

            <label>
              {['hotel', 'cab'].includes(search.type)
                ? 'City'
                : 'From'}

              <select
                className="input"
                value={
                  ['hotel', 'cab'].includes(search.type)
                    ? search.city
                    : search.from
                }
                onChange={e =>
                  setSearch({
                    ...search,
                    [
                      ['hotel', 'cab'].includes(search.type)
                        ? 'city'
                        : 'from'
                    ]: e.target.value
                  })
                }
              >
                {modeCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {!['hotel', 'cab'].includes(search.type) && (
              <>
                <button
                  type="button"
                  className="btn ghost"
                  title="Swap origin and destination"
                  onClick={() => {
                    const next = { ...search, from: search.to, to: search.from };
                    setSearch(next);
                    doSearch(next);
                  }}
                >
                  <ArrowLeftRight size={16} />
                </button>

                <label>
                  To

                  <select
                    className="input"
                    value={search.to}
                    onChange={e =>
                      setSearch({
                        ...search,
                        to: e.target.value
                      })
                    }
                  >
                    {modeCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label>
              Travel date

              <input
                type="date"
                className="input"
                value={search.date}
                onChange={e =>
                  setSearch({
                    ...search,
                    date: e.target.value
                  })
                }
              />
            </label>

            <button
              className="btn primary"
              onClick={() => doSearch()}
            >
              <Search size={16} />
              Search
            </button>

          </div>

          <div className="row wrap" style={{ marginTop: 14 }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Popular:
            </span>
            {popularChips.map(chip => {
              const label = Array.isArray(chip) ? `${chip[0]} → ${chip[1]}` : chip;
              return (
                <button
                  type="button"
                  key={label}
                  className="btn partner-btn"
                  onClick={() => {
                    const next = Array.isArray(chip)
                      ? { ...search, from: chip[0], to: chip[1] }
                      : { ...search, city: chip };
                    setSearch(next);
                    doSearch(next);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

        </div>

        <div className="row between wrap section-card">

          <h2>Available options ({displayedResults.length})</h2>

          <div className="row wrap">
            <select
              className="input compact"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="price">Sort: Lowest price</option>
              <option value="rating">Sort: Highest rating</option>
              <option value="duration">Sort: Fastest / Shortest</option>
            </select>

            <input
              className="input compact"
              placeholder="Filter results"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>

        </div>

        {displayedResults
          .map((x, i) => {

            const mode = x.type || search.type;
            const activeCoach = trainClass[x.id] || 'SL';
            const effectivePrice =
              mode === 'train' && x.fares
                ? (x.fares[activeCoach] ?? x.price ?? 0)
                : (x.price || 0);
            const itemWithPrice = { ...x, price: effectivePrice, selectedClass: mode === 'train' ? activeCoach : undefined };
            const isExpanded = expandedId === x.id;

            const partners = (partnersMap[mode] || [])
              .filter(p => p.active);

            const label =
              mode === 'flight'
                ? `${x.from} → ${x.to}`
                : mode === 'train'
                  ? `${x.from} → ${x.to}`
                  : mode === 'hotel'
                    ? x.name
                    : `${x.brand || x.name || x.kind || 'Cab'} · ${x.city}`;

            const detail =
              mode === 'flight'
                ? [x.airline, x.flightNo, x.depart && x.arrive ? `${x.depart} → ${x.arrive}` : x.depart, x.duration].filter(Boolean).join(' · ')
                : mode === 'train'
                  ? [x.name || 'Train', x.trainNo, x.depart && x.arrive ? `${x.depart} → ${x.arrive}` : x.depart, x.duration].filter(Boolean).join(' · ')
                  : mode === 'hotel'
                    ? [x.city, ...(x.amenities || [])].filter(Boolean).join(' · ')
                    : [x.city, x.kind || 'Cab', x.eta ? `ETA ${x.eta} min` : ''].filter(Boolean).join(' · ');

            return (
              <div
                className="card result-card travel-result"
                key={x.id}
              >

                <div className="travel-main">

                  <div className="row wrap">

                    <span className="badge">
                      {mode}
                    </span>

                    {x.rating > 0 && (
                      <span className="badge">
                        ★ {x.rating}
                      </span>
                    )}

                    {i === 0 && sortBy === 'price' && (
                      <span className="badge success">
                        Lowest listed price
                      </span>
                    )}

                  </div>

                  <h3>{label}</h3>

                  <p>{detail}</p>

                  {mode === 'train' && x.fares && (
                    <div className="row wrap" style={{ margin: '10px 0' }}>
                      {['SL', '3A', '2A', '1A'].map(cls => (
                        <button
                          type="button"
                          key={cls}
                          className={'btn partner-btn' + (activeCoach === cls ? ' primary' : '')}
                          onClick={() => setTrainClass({ ...trainClass, [x.id]: cls })}
                        >
                          {cls} · {INR(x.fares[cls])}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="row wrap" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn ghost"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                      onClick={() => setExpandedId(isExpanded ? null : x.id)}
                    >
                      {isExpanded ? 'Hide fare details' : 'Fare & trip details'}
                    </button>
                    <small className="muted">
                      Illustrative demo inventory. Verify live price with the provider.
                    </small>
                  </div>

                  {isExpanded && (
                    <div className="breakdown-grid" style={{ marginTop: 10, padding: 12, borderRadius: 10, background: 'var(--surface-2)' }}>
                      <span>Base fare</span>
                      <strong>{INR(Math.round(effectivePrice * 0.88))}</strong>
                      <span>Estimated taxes &amp; fees</span>
                      <strong>{INR(effectivePrice - Math.round(effectivePrice * 0.88))}</strong>
                      {x.seats && (
                        <>
                          <span>Seats available</span>
                          <strong>{x.seats}</strong>
                        </>
                      )}
                      {x.rooms && (
                        <>
                          <span>Rooms left</span>
                          <strong>{x.rooms}</strong>
                        </>
                      )}
                      <span className="total-label">Estimated total</span>
                      <strong className="total-label">{INR(effectivePrice)}</strong>
                    </div>
                  )}

                  <div className="partner-links">

                    <b>Compare booking partners</b>

                    <div className="partner-buttons">

                      {partners.map(p => (
                        <a
                          className="btn partner-btn"
                          key={p.id}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordRedirect(p, itemWithPrice, mode)}
                        >
                          Continue to {p.name} ↗
                        </a>
                      ))}

                    </div>

                  </div>

                </div>

                <div className="result-actions price-actions">

                  <strong>
                    {INR(effectivePrice)}
                  </strong>

                  <button
                    className="btn primary"
                    onClick={() => saveTrip(itemWithPrice)}
                  >
                    {userBookings.some(b => b.item?.id === x.id)
                      ? 'Saved ✓'
                      : 'Save to My Trips'}
                  </button>

                  <button
                    className="btn ghost"
                    onClick={() => togglePriceAlert(itemWithPrice)}
                  >
                    <Bell size={15} />
                    {priceAlerts.some(a => a.userId === user.id && a.itemId === x.id)
                      ? 'Alert active'
                      : 'Set price alert'}
                  </button>

                </div>

              </div>
            );
          })}

        {results.length === 0 && (
          <div className="card empty-state">
            <Search />

            <h3>No options displayed yet</h3>

            <p>
              Choose your travel details and select Search
              to view matching demo options and partner booking links.
            </p>
          </div>
        )}

      </>
    );
  }

  // My Trips

  if (route === '/user/trips') {

    return shell(
      <>
        <div className="row between">

          <div>
            <h2>My Trips</h2>
            <p className="muted">
              Your saved travel options.
            </p>
          </div>

        </div>

        {userBookings.map(b => (
          <div className="card result-card" key={b.id}>

            <div>

              <span className="badge">
                {b.type}
              </span>

              <h3>
                {b.item?.airline ||
                  b.item?.name ||
                  b.item?.kind ||
                  'Saved travel option'}
              </h3>

              <p>
                {b.from || b.city || ''}
                {b.to ? ' → ' + b.to : ''}
                {' · Saved '}
                {new Date(b.createdAt).toLocaleDateString()}
              </p>

            </div>

            <div className="result-actions">

              <strong>{INR(b.price)}</strong>

              <button
                className="btn ghost"
                onClick={() => removeTrip(b.id)}
              >
                <Trash2 size={16} />
                Remove
              </button>

            </div>

          </div>
        ))}

        {!userBookings.length && (
          <div className="card empty-state">

            <Ticket />

            <h3>No saved trips yet</h3>

            <button
              className="btn primary"
              onClick={() => go('/user/search')}
            >
              Explore travel options
            </button>

          </div>
        )}

        {priceAlerts.filter(a => a.userId === user.id).length > 0 && (
          <section className="section-card">
            <h3>Price Alerts</h3>
            {priceAlerts
              .filter(a => a.userId === user.id)
              .map(a => (
                <div className="card result-card" key={a.id}>
                  <div>
                    <span className="badge">{a.type}</span>
                    <h3>{a.label}</h3>
                    <p className="muted">Target: {INR(a.targetPrice)}</p>
                  </div>
                  <button
                    className="btn ghost"
                    onClick={() => togglePriceAlert({ id: a.itemId })}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              ))}
          </section>
        )}

      </>
    );
  }

  // User profile

  if (route === '/user/profile') {

    return shell(
      <div className="card section-card">

        <div className="avatar large">
          {user.name?.[0]}
        </div>

        <h2>{user.name}</h2>

        <p>{user.email}</p>

        <span className="badge success">
          Verified local account
        </span>

        <div className="row">

          <button
            className="btn ghost"
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
          >
            Toggle appearance
          </button>

          <button
            className="btn primary"
            onClick={logout}
          >
            Log out
          </button>

        </div>

      </div>
    );
  }

  // Admin dashboard

  if (route === '/admin/dashboard') {

    return shell(
      <>

        <div className="stats-grid">

          <Stat
            label="Registered users"
            value={users.filter(x => x.role === 'user').length}
          />

          <Stat
            label="Inventory items"
            value={Object.values(inventory).reduce(
              (a, x) => a + (Array.isArray(x) ? x.length : 0),
              0
            )}
          />

          <Stat
            label="Saved records"
            value={bookings.length}
          />

          <Stat
            label="Partner redirects"
            value={redirects.length}
          />

        </div>

        <div className="card section-card">

          <h2>Administration overview</h2>

          <p>
            Manage traveller accounts, inventory and project activity
            from the Admin module.
          </p>

          <div className="grid grid-3">

            {navItems.slice(1).map(([p, n, I]) => (
              <button
                className="card module-card"
                key={p}
                onClick={() => go(p)}
              >
                <I />
                <h3>{n}</h3>
                <span className="muted">
                  Open module →
                </span>
              </button>
            ))}

          </div>

        </div>

      </>
    );
  }

  // ADMIN INVENTORY MANAGEMENT - UPDATED

  if (route === '/admin/inventory') {

    const inventoryData = inventory;

    return shell(
      <>

        <h2>Inventory Management</h2>

        <p className="muted">
          Add and manage flights, trains, hotels and cabs.
        </p>

        <div className="card section-card">

          <h3>
            <Plus size={18} />
            Add New Travel Option
          </h3>

          <form
            onSubmit={addInventoryItem}
            className="form-stack"
          >

            <label>
              Travel Category

              <select
                className="input"
                value={newItem.type}
                onChange={e =>
                  setNewItem({
                    ...newItem,
                    type: e.target.value
                  })
                }
              >
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="hotel">Hotel</option>
                <option value="cab">Cab</option>
              </select>

            </label>

            <label>
              Name / Service

              <input
                className="input"
                required
                placeholder="Enter service name"
                value={newItem.name}
                onChange={e =>
                  setNewItem({
                    ...newItem,
                    name: e.target.value
                  })
                }
              />
            </label>

            {(newItem.type === 'flight' ||
              newItem.type === 'train') && (
              <>

                <label>
                  From

                  <input
                    className="input"
                    required
                    placeholder="Departure city"
                    value={newItem.from}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        from: e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  To

                  <input
                    className="input"
                    required
                    placeholder="Destination city"
                    value={newItem.to}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        to: e.target.value
                      })
                    }
                  />
                </label>

              </>
            )}

            {(newItem.type === 'hotel' ||
              newItem.type === 'cab') && (
              <label>
                City

                <input
                  className="input"
                  required
                  placeholder="Enter city"
                  value={newItem.city}
                  onChange={e =>
                    setNewItem({
                      ...newItem,
                      city: e.target.value
                    })
                  }
                />
              </label>
            )}

            {newItem.type === 'flight' && (
              <>

                <label>
                  Airline

                  <input
                    className="input"
                    placeholder="Example: IndiGo"
                    value={newItem.airline}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        airline: e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Flight Number

                  <input
                    className="input"
                    placeholder="Example: 6E 123"
                    value={newItem.flightNo}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        flightNo: e.target.value
                      })
                    }
                  />
                </label>

              </>
            )}

            {newItem.type === 'train' && (
              <label>
                Train Number

                <input
                  className="input"
                  placeholder="Example: 12727"
                  value={newItem.trainNo}
                  onChange={e =>
                    setNewItem({
                      ...newItem,
                      trainNo: e.target.value
                    })
                  }
                />
              </label>
            )}

            {newItem.type === 'cab' && (
              <label>
                Cab Type

                <input
                  className="input"
                  placeholder="Sedan, SUV, Mini..."
                  value={newItem.kind}
                  onChange={e =>
                    setNewItem({
                      ...newItem,
                      kind: e.target.value
                    })
                  }
                />
              </label>
            )}

            <label>
              Departure Time

              <input
                className="input"
                type="time"
                value={newItem.depart}
                onChange={e =>
                  setNewItem({
                    ...newItem,
                    depart: e.target.value
                  })
                }
              />
            </label>

            <label>
              Arrival Time

              <input
                className="input"
                type="time"
                value={newItem.arrive}
                onChange={e =>
                  setNewItem({
                    ...newItem,
                    arrive: e.target.value
                  })
                }
              />
            </label>

            <label>
              Duration / Additional Details

              <input
                className="input"
                placeholder="Example: 2h 15m"
                value={newItem.duration}
                onChange={e =>
                  setNewItem({
                    ...newItem,
                    duration: e.target.value
                  })
                }
              />
            </label>

            <label>
              Price (₹)

              <input
                className="input"
                type="number"
                min="1"
                required
                placeholder="Enter price"
                value={newItem.price}
                onChange={e =>
                  setNewItem({
                    ...newItem,
                    price: e.target.value
                  })
                }
              />
            </label>

            <button
              className="btn primary"
              type="submit"
            >
              <Plus size={16} />
              Add Travel Option
            </button>

          </form>

        </div>

        <h3>Current Inventory</h3>

        <div className="stats-grid">

          {['flights', 'trains', 'hotels', 'cabs'].map(kind => (
            <div className="card stat-card" key={kind}>

              <span className="muted">
                {kind.toUpperCase()}
              </span>

              <strong>
                {Array.isArray(inventoryData[kind])
                  ? inventoryData[kind].length
                  : 0}
              </strong>

            </div>
          ))}

        </div>

        <div className="row between section-card">
          <div className="tabs">
            {['flights', 'trains', 'hotels', 'cabs'].map(kind => (
              <button
                key={kind}
                className={'tab ' + (invTab === kind ? 'active' : '')}
                onClick={() => setInvTab(kind)}
              >
                {kind.toUpperCase()}
              </button>
            ))}
          </div>

          <input
            className="input compact"
            placeholder="Filter inventory..."
            value={invFilter}
            onChange={e => setInvFilter(e.target.value)}
          />
        </div>

        {(Array.isArray(inventoryData[invTab]) ? inventoryData[invTab] : [])
          .filter(x =>
            JSON.stringify(x).toLowerCase().includes(invFilter.toLowerCase())
          )
          .slice(0, 40)
          .map(x => (
            <div className="card result-card" key={x.id}>
              <div>
                <b>{x.name || x.airline || x.kind || x.id}</b>
                <p className="muted">
                  {x.from && x.to ? `${x.from} → ${x.to}` : x.city || ''}
                  {' · '}
                  {INR(x.price || x.fares?.SL || 0)}
                </p>
              </div>
              <button
                className="btn ghost"
                onClick={() => deleteInventoryItem(invTab, x.id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          ))}

      </>
    );
  }

  // Admin user management

  if (route === '/admin/users') {

    return shell(
      <>
        <h2>User Management</h2>

        {users.map(u => (
          <div className="card result-card" key={u.id}>

            <div>
              <b>{u.name}</b>
              <p>{u.email} · {u.role}{u.blocked ? ' · Blocked' : ''}</p>
            </div>

            {u.role !== 'admin' && (
              <button
                className="btn ghost"
                onClick={() => {
                  const nextUsers = users.map(x =>
                    x.id === u.id
                      ? { ...x, blocked: !x.blocked }
                      : x
                  );
                  write('users', nextUsers);
                  setUsers(nextUsers);

                  notify(
                    u.blocked
                      ? 'User unblocked'
                      : 'User blocked'
                  );
                }}
              >
                {u.blocked ? 'Unblock' : 'Block user'}
              </button>
            )}

          </div>
        ))}

      </>
    );
  }

  // Admin partners

  if (route === '/admin/partners') {

    return shell(
      <>

        <div className="row between">

          <div>
            <h2>Travel Partners</h2>

            <p className="muted">
              Manage the external booking providers shown
              with travel search results.
            </p>
          </div>

          <span className="badge success">
            {
              Object.values(partnersMap)
                .flat()
                .filter(p => p.active).length
            } active
          </span>

        </div>

        {Object.entries(partnersMap).map(([mode, list]) => (

          <section className="section-card" key={mode}>

            <h3>
              {mode[0].toUpperCase() + mode.slice(1)} partners
            </h3>

            {list.map(p => (

              <div
                className="card result-card partner-admin-row"
                key={p.id}
              >

                <div>
                  <b>{p.name}</b>
                  <p className="muted">{p.url}</p>
                </div>

                <div className="row">

                  <span className={'badge ' + (p.active ? 'success' : '')}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>

                  <button
                    className="btn ghost"
                    onClick={() => {

                      const all = {
                        ...partnersMap,
                        [mode]: partnersMap[mode].map(x =>
                          x.id === p.id
                            ? { ...x, active: !x.active }
                            : x
                        )
                      };

                      write('partners', all);
                      setPartnersMap(all);

                      notify(
                        `${p.name} ${p.active ? 'disabled' : 'enabled'}`
                      );
                    }}
                  >
                    {p.active ? 'Disable' : 'Enable'}
                  </button>

                  <a
                    className="btn ghost"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit ↗
                  </a>

                </div>

              </div>

            ))}

          </section>

        ))}

      </>
    );
  }

  // Admin bookings

  if (route === '/admin/bookings') {

    return shell(
      <>
        <h2>Saved Travel Records</h2>

        {bookings.map(b => (

          <div className="card result-card" key={b.id}>

            <div>
              <b>
                {b.item?.airline || b.item?.name || b.type}
              </b>

              <p>
                {b.userId} · {b.status}
              </p>
            </div>

            <strong>{INR(b.price)}</strong>

          </div>

        ))}

      </>
    );
  }

  // Admin reports

  if (route === '/admin/reports') {

    return shell(
      <>
        <h2>Reports</h2>

        <div className="stats-grid">

          <Stat
            label="Users"
            value={users.length}
          />

          <Stat
            label="Saved records"
            value={bookings.length}
          />

          <Stat
            label="Alerts"
            value={read('alerts', []).length}
          />

        </div>

        <button
          className="btn primary"
          onClick={() => {

            const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

            const rows = [
              ['id', 'type', 'price', 'status'],
              ...bookings.map(b => [
                b.id,
                b.type,
                b.price,
                b.status
              ])
            ];

            const csv = rows
              .map(r => r.map(esc).join(','))
              .join('\n');

            const url = URL.createObjectURL(
              new Blob([csv], { type: 'text/csv' })
            );

            const a = document.createElement('a');
            a.href = url;
            a.download = 'voyago-report.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV report
        </button>

      </>
    );
  }

  return shell(
    <div className="card">
      <h2>Module</h2>
      <p>This section is being prepared.</p>
    </div>
  );

  };

  return (
    <>
      {renderPage()}
      <datalist id="voyago-cities">
        {cities.map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }) {

  return (
    <div className="card stat-card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(
  document.getElementById('root')
).render(<App/>);

