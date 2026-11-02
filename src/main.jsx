import React, { useEffect, useState } from 'react';
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
  Heart,
  UserRound,
  Plus,
  Trash2,
  ShieldCheck
} from 'lucide-react';

import './style.css';

const S = window.VoyaStore;
const K = window.VoyaKeys;
const INR = window.VoyaFormatINR;

const read = (k, d = []) => S.read(K[k] || k, d);
const write = (k, v) => S.write(K[k] || k, v);

const ADMIN = 'admin@voyago.com';

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

  const [search, setSearch] = useState({
    type: 'flight',
    from: 'Delhi',
    to: 'Mumbai',
    city: 'Mumbai',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  });

  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  // NEW: Inventory form state

  const [newItem, setNewItem] = useState({
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
  });

  const go = p => {
    history.pushState({}, '', p);
    setPath(p);
    setResults([]);
    setFilter('');
  };

  useEffect(() => {
    const fn = () => setPath(location.pathname);

    addEventListener('popstate', fn);

    return () => removeEventListener('popstate', fn);
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
    setTimeout(() => setToast(''), 2800);
  };

  const isAdmin = user?.role === 'admin';
  const isAuth = !!user;

  const route = path.replace(/\/$/, '') || '/';

  const title = route.includes('/admin')
    ? 'Admin'
    : route.includes('/user')
      ? 'User'
      : 'VoyaGo';

  // NEW: Add inventory item

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

    const currentInventory = read('inventory', {});

    const item = {
      ...newItem,
      id: 'ADMIN-' + Date.now(),
      type,
      name: newItem.name.trim(),
      price: Number(newItem.price),
      rating: Number(newItem.rating) || 0
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

    setNewItem({
      type,
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
    });

    notify(`${type.toUpperCase()} added successfully!`);
  };

  const login = async (e, role = 'user') => {
    e.preventDefault();

    const users = read('users', []);

    const u = users.find(
      x =>
        x.email?.toLowerCase() === form.email.toLowerCase() &&
        x.role === role
    );

    if (
      !u ||
      u.blocked ||
      u.passwordHash !== await hash(form.password)
    ) {
      notify('Invalid credentials. Please try again.');
      return;
    }

    const session = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    };

    write('session', session);

    sessionStorage.setItem(
      'voyago_session',
      JSON.stringify(session)
    );

    setUser(session);

    go(role === 'admin'
      ? '/admin/dashboard'
      : '/user/dashboard'
    );

    notify('Welcome back!');
  };

  const signup = async e => {
    e.preventDefault();

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

    const users = read('users', []);

    if (
      users.some(
        u => u.email?.toLowerCase() === form.email.toLowerCase()
      )
    ) {
      return notify('An account with this email already exists.');
    }

    const u = {
      id: window.VoyaUid('U'),
      name: form.name,
      email: form.email,
      passwordHash: await hash(form.password),
      role: 'user',
      blocked: false,
      createdAt: new Date().toISOString()
    };

    write('users', [...users, u]);

    const session = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: 'user'
    };

    write('session', session);
    setUser(session);

    go('/user/dashboard');

    notify('Account created successfully');
  };

  const logout = () => {
    S.remove(K.session);
    sessionStorage.removeItem('voyago_session');

    setUser(null);

    go('/');

    notify('Logged out');
  };

  const inventory = read('inventory', {});

  // Travel search

  const doSearch = () => {

    const key = {
      flight: 'flights',
      train: 'trains',
      hotel: 'hotels',
      cab: 'cabs'
    }[search.type];

    let arr = Array.isArray(inventory[key])
      ? inventory[key]
      : [];

    const normalize = value =>
      String(value || '').trim().toLowerCase();

    arr = arr.filter(x => {

      if (search.type === 'hotel' || search.type === 'cab') {
        return (
          !search.city ||
          normalize(x.city) === normalize(search.city)
        );
      }

      return (
        (!search.from ||
          normalize(x.from) === normalize(search.from)) &&
        (!search.to ||
          normalize(x.to) === normalize(search.to))
      );
    });

    arr = arr
      .map(x => ({
        ...x,
        type: x.type || search.type
      }))
      .sort((a, b) =>
        (Number(a.price) || 0) - (Number(b.price) || 0)
      );

    setResults(arr.slice(0, 60));

    notify(`${arr.length} matching options found`);
  };

  const saveTrip = item => {

    const b = read('bookings', []);

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

    write('bookings', [rec, ...b]);

    notify('Saved to My Trips');
  };

  const userBookings = read('bookings', [])
    .filter(b => b.userId === user?.id);

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

  // Route protection

  if (
    (!isAuth && route.startsWith('/user')) ||
    (isAuth && route.startsWith('/admin') && !isAdmin) ||
    (isAuth && route.startsWith('/user') && isAdmin)
  ) {
    return (
      <main className="page">
        <div className="container">
          <div className="card auth-card">

            <a className="brand" href="/">
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
                logout();
                go('/login');
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
              <a onClick={() => go('/admin-login')}>
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

          <section className="hero aurora">

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

                <p>
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
                        onClick={() =>
                          setSearch({ ...search, type: t })
                        }
                      >
                        {t[0].toUpperCase() + t.slice(1)}s
                      </button>
                    ))}

                  </div>

                  <div className="search-fields">

                    <label>
                      {['hotel', 'cab'].includes(search.type)
                        ? 'City'
                        : 'From'}

                      <input
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
                      />
                    </label>

                    {!['hotel', 'cab'].includes(search.type) && (
                      <label>
                        To

                        <input
                          className="input"
                          value={search.to}
                          onChange={e =>
                            setSearch({
                              ...search,
                              to: e.target.value
                            })
                          }
                        />
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
                      className="btn primary"
                      onClick={() => {
                        if (!isAuth) {
                          go('/login');
                        } else {
                          go('/user/search');
                          doSearch();
                        }
                      }}
                    >
                      Compare prices
                    </button>

                  </div>

                </div>

                <button
                  className="btn primary"
                  onClick={() => go('/signup')}
                >
                  Create free account
                </button>

              </div>

              <div className="card gradient-border">

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
                    <div className="card">
                      <b>Flight arrival</b>
                      <p>Delhi → Mumbai</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="card">
                      <b>Cab pickup</b>
                      <p>Arrival + 30 minutes</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="card">
                      <b>Hotel check-in</b>
                      <p>Connected itinerary update</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </section>

          <section className="section" id="features">

            <div className="container">

              <span className="eyebrow">
                BUILT FOR COMPARISON
              </span>

              <h2>Less searching. Better decisions.</h2>

              <div className="grid grid-4">

                {[
                  ['Flights', Plane, 'Compare routes and fares.'],
                  ['Trains', Train, 'Explore rail options.'],
                  ['Hotels', Hotel, 'Compare stays by city.'],
                  ['Cabs', Car, 'Find local ride options.']
                ].map(([name, Icon, description]) => (
                  <div className="card" key={name}>
                    <Icon />
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
            value={
              read('priceAlerts', [])
                .filter(x => x.userId === user.id).length
            }
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

                setSearch({ ...search, type });
                go('/user/search');
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
                onClick={() => {
                  setSearch({ ...search, type: t });
                  setResults([]);
                }}
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

              <input
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
              />
            </label>

            {!['hotel', 'cab'].includes(search.type) && (
              <label>
                To

                <input
                  className="input"
                  value={search.to}
                  onChange={e =>
                    setSearch({
                      ...search,
                      to: e.target.value
                    })
                  }
                />
              </label>
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
              onClick={doSearch}
            >
              <Search size={16} />
              Search
            </button>

          </div>

        </div>

        <div className="row between section-card">

          <h2>Available options</h2>

          <input
            className="input compact"
            placeholder="Filter results"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />

        </div>

        {results
          .filter(x =>
            JSON.stringify(x)
              .toLowerCase()
              .includes(filter.toLowerCase())
          )
          .map((x, i) => {

            const mode = x.type || search.type;

            const partners = getPartners(mode)
              .filter(p => p.active);

            const label =
              mode === 'flight'
                ? `${x.from} → ${x.to}`
                : mode === 'train'
                  ? `${x.from} → ${x.to}`
                  : mode === 'hotel'
                    ? x.name
                    : `${x.kind || 'Cab'} · ${x.city}`;

            const detail =
              mode === 'flight'
                ? `${x.airline || ''} ${x.flightNo || ''} · ${x.depart || ''} · ${x.duration || ''}`
                : mode === 'train'
                  ? `${x.name || 'Train'} · ${x.trainNo || ''} · ${x.depart || ''} · ${x.duration || ''}`
                  : mode === 'hotel'
                    ? `${x.city} · ${(x.amenities || []).join(' · ')}`
                    : `${x.city} · ${x.kind || 'Cab'} · ETA ${x.eta || '—'} min`;

            return (
              <div
                className="card result-card travel-result"
                key={x.id}
              >

                <div className="travel-main">

                  <div className="row">

                    <span className="badge">
                      {mode}
                    </span>

                    {i === 0 && (
                      <span className="badge success">
                        Lowest listed price
                      </span>
                    )}

                  </div>

                  <h3>{label}</h3>

                  <p>{detail}</p>

                  <small className="muted">
                    Illustrative demo inventory.
                    Verify live price and availability with the provider.
                  </small>

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
                        >
                          Continue to {p.name} ↗
                        </a>
                      ))}

                    </div>

                  </div>

                </div>

                <div className="result-actions price-actions">

                  <strong>
                    {INR(x.price || x.fares?.SL || 0)}
                  </strong>

                  <button
                    className="btn primary"
                    onClick={() => saveTrip(x)}
                  >
                    Save to My Trips
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
                onClick={() => {
                  write(
                    'bookings',
                    read('bookings', []).filter(x => x.id !== b.id)
                  );

                  notify('Saved option removed');
                  setPath('/user/trips');
                }}
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
            value={read('users', []).filter(x => x.role === 'user').length}
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
            value={read('bookings', []).length}
          />

          <Stat
            label="Partner redirects"
            value={read('redirects', []).length}
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

    const inventoryData = read('inventory', {});

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

      </>
    );
  }

  // Admin user management

  if (route === '/admin/users') {

    return shell(
      <>
        <h2>User Management</h2>

        {read('users', []).map(u => (
          <div className="card result-card" key={u.id}>

            <div>
              <b>{u.name}</b>
              <p>{u.email} · {u.role}</p>
            </div>

            {u.role !== 'admin' && (
              <button
                className="btn ghost"
                onClick={() => {

                  write(
                    'users',
                    read('users', []).map(x =>
                      x.id === u.id
                        ? { ...x, blocked: !x.blocked }
                        : x
                    )
                  );

                  setPath(route);

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
              Object.values(ensurePartners())
                .flat()
                .filter(p => p.active).length
            } active
          </span>

        </div>

        {Object.entries(ensurePartners()).map(([mode, list]) => (

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

                      const all = ensurePartners();

                      all[mode] = all[mode].map(x =>
                        x.id === p.id
                          ? { ...x, active: !x.active }
                          : x
                      );

                      write('partners', all);

                      setPath(route);

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

        {read('bookings', []).map(b => (

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
            value={read('users', []).length}
          />

          <Stat
            label="Saved records"
            value={read('bookings', []).length}
          />

          <Stat
            label="Alerts"
            value={read('alerts', []).length}
          />

        </div>

        <button
          className="btn primary"
          onClick={() => {

            const rows = [
              ['id', 'type', 'price', 'status'],
              ...read('bookings', []).map(b => [
                b.id,
                b.type,
                b.price,
                b.status
              ])
            ];

            const csv = rows
              .map(r => r.join(','))
              .join('\n');

            const a = document.createElement('a');

            a.href = URL.createObjectURL(
              new Blob([csv], { type: 'text/csv' })
            );

            a.download = 'voyago-report.csv';

            a.click();
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

