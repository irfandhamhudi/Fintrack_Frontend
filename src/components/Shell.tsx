import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  LogOut,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  CreditCard,
  FolderKanban,
  Menu,
  PiggyBank,
  Repeat,
  Search,
  Tags,
  X,
} from "lucide-react";
import { Brand } from "./UI";
import { Footer } from "./Footer";
import { useFin } from "../context/FinContext";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "./PageSkeleton";
import {
  budgetAlertLevel,
  budgetRate,
  cat,
  rupiah,
  spentBudget,
} from "../lib/finance";

const links = [
  ["dashboard", "Dasbor"],
  ["tracker", "Pelacak"],
  ["transactions", "Transaksi"],
  ["calendar", "Kalender"],
  ["analytics", "Analitik"],
  ["settings", "Pengaturan"],
];
const more = [
  ["wallets", "Dompet Saya", CreditCard],
  ["budgets", "Anggaran", FolderKanban],
  ["savings", "Target Tabungan", PiggyBank],
  ["recurring", "Berulang", Repeat],
  ["categories", "Kategori", Tags],
  ["reports", "Laporan", FolderKanban],
] as const;
const notificationStorageKey = (email: string) =>
  `fintrack-dismissed-notifications:${email.toLowerCase()}`;
const readNotificationStorageKey = (email: string) =>
  `fintrack-read-notifications:${email.toLowerCase()}`;
const nav = ([url, label]: string[]) => (
  <NavLink
    key={url}
    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
    to={`/${url}`}
  >
    {label}
  </NavLink>
);
export function Shell() {
  const [menu, setMenu] = useState(false),
    [dropdown, setDropdown] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
     [notificationOpen, setNotificationOpen] = useState(false),
     [avatarOpen, setAvatarOpen] = useState(false),
     [query, setQuery] = useState(""),
     [notificationsLoaded, setNotificationsLoaded] = useState(false),
     [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
       try {
         const email = localStorage.getItem("fintrack-session");
         const session = email ? (JSON.parse(email) as { email?: string }) : null;
         const stored = session?.email ? localStorage.getItem(readNotificationStorageKey(session.email)) : null;
         return stored ? (JSON.parse(stored) as string[]) : [];
       } catch {
         return [];
       }
     }),
     [hiddenNotificationIds, setHiddenNotificationIds] = useState<string[]>(

      () => {
        try {
          const email = localStorage.getItem("fintrack-session");
          const session = email
            ? (JSON.parse(email) as { email?: string })
            : null;
          const stored = session?.email
            ? localStorage.getItem(notificationStorageKey(session.email))
            : null;
          return stored ? (JSON.parse(stored) as string[]) : [];
        } catch {
          return [];
        }
      },
    );
  const moreRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const popoversRef = useRef<HTMLDivElement>(null);
   const { data, loading: dataLoading } = useFin();
  const { user, logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
  const activeRecurring = data.recurring.filter(
    (item) => item.status === "ACTIVE",
  );
  const recentTransactions = [...data.transactions]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 5);
  const budgetNotifications = data.budgets
    .map((budget) => ({
      budget,
      rate: budgetRate(budget, data),
      spent: spentBudget(budget, data),
      level: budgetAlertLevel(budget, data),
    }))
    .filter(({ level }) => level !== "ok")
    .map(({ budget, rate, spent, level }) => ({
      id: `budget-${budget.id}-${level}`,
      kind: "budget" as const,
      budget,
      rate,
      spent,
      level,
    }));
  const notificationItems = [
    ...budgetNotifications,
    ...activeRecurring,
    ...recentTransactions,
  ].filter((item) => !hiddenNotificationIds.includes(item.id));
  const visibleBudgets = budgetNotifications.filter(
    (item) => !hiddenNotificationIds.includes(item.id),
  );
  const visibleRecurring = activeRecurring.filter(
    (item) => !hiddenNotificationIds.includes(item.id),
  );
  const visibleTransactions = recentTransactions.filter(
    (item) => !hiddenNotificationIds.includes(item.id),
  );
   const unreadNotificationCount = notificationsLoaded
     ? notificationItems.filter((item) => !readNotificationIds.includes(item.id)).length
     : 0;
   useEffect(() => {
     if (!user?.email) {
       setNotificationsLoaded(false);
       return;
     }
     try {
       const storedRead = localStorage.getItem(readNotificationStorageKey(user.email));
       const storedHidden = localStorage.getItem(notificationStorageKey(user.email));
       setReadNotificationIds(storedRead ? (JSON.parse(storedRead) as string[]) : []);
       setHiddenNotificationIds(storedHidden ? (JSON.parse(storedHidden) as string[]) : []);
       setNotificationsLoaded(true);
     } catch {
       setReadNotificationIds([]);
       setHiddenNotificationIds([]);
       setNotificationsLoaded(true);
     }
   }, [user?.email]);
   useEffect(() => {
     if (!user?.email) return;
     localStorage.setItem(
       notificationStorageKey(user.email),
       JSON.stringify(hiddenNotificationIds),
     );
   }, [hiddenNotificationIds, user?.email]);
   useEffect(() => {
     if (!user?.email || !notificationsLoaded) return;
     localStorage.setItem(
       readNotificationStorageKey(user.email),
       JSON.stringify(readNotificationIds),
     );
   }, [readNotificationIds, notificationsLoaded, user?.email]);
  const markRead = (id: string) =>
    setReadNotificationIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  const removeNotification = (id: string) => {
    setHiddenNotificationIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setReadNotificationIds((current) =>
      current.filter((itemId) => itemId !== id),
    );
  };
  const removeAllNotifications = () => {
    const ids = notificationItems.map((item) => item.id);
    setHiddenNotificationIds((current) => [...new Set([...current, ...ids])]);
    setReadNotificationIds([]);
  };
  const matches = data.transactions
    .filter((transaction) =>
      `${transaction.description} ${transaction.date}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 5);
  useEffect(() => {
    const closeOnOutsidePress = (event: MouseEvent) => {
      const target = event.target as Node;
       if (!moreRef.current?.contains(target) && !mobileMoreRef.current?.contains(target)) setDropdown(false);
      if (!popoversRef.current?.contains(target)) {
        setSearchOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsidePress, true);
    return () =>
      document.removeEventListener("mousedown", closeOnOutsidePress, true);
  }, []);
   const closeMobileNavigation = () => {
     setMenu(false);
     setDropdown(false);
     setAvatarOpen(false);
   };
   useEffect(() => {
     closeMobileNavigation();
   }, [location.pathname]);
   const initials = (user?.name || data.profile.name)

     .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
  return (
    <div className="app-frame">
      <div className="app-interior">
        <header className="app-header">
          <Brand />
          <nav className="header-nav" aria-label="Navigasi utama">
            {links.map(nav)}
            <div
              ref={moreRef}
              className={`more-wrap ${dropdown ? "open" : ""}`}
            >
              <button
                className="nav-link flex items-center gap-1"
                type="button"
                onClick={() => setDropdown(!dropdown)}
                aria-expanded={dropdown}
              >
                Lainnya <ChevronDown size={13} />
              </button>
              <div className="more-menu">
                {more.map(([url, label, Icon]) => (
                  <NavLink
                    key={url}
                    to={`/${url}`}
                    onClick={() => setDropdown(false)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
          <div ref={popoversRef} className="header-right">
            <button
              className="logout-button mobile-header-action"

              type="button"
              title="Keluar"
              aria-label="Keluar"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
            <div className="header-popover-wrap">
              <button
                className="circle-action mobile-header-action"
                type="button"
                title="Cari transaksi"
                aria-label="Cari transaksi"
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setNotificationOpen(false);
                }}
              >
                <Search size={18} />
              </button>
              {searchOpen && (
                <div className="header-popover search-popover">
                  <div className="search-popover-heading">
                    <div>
                      <strong>Cari transaksi</strong>
                      <span>Cari berdasarkan deskripsi atau tanggal</span>
                    </div>
                    <Search size={17} aria-hidden="true" />
                  </div>
                  <div className="search-input-wrap">
                    <Search size={15} aria-hidden="true" />
                    <input
                      autoFocus
                      placeholder="Cari transaksi..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <div className="header-result-list">
                    {matches.map((transaction) => (
                      <button
                        key={transaction.id}
                        type="button"
                        onClick={() => navigate("/transactions")}
                      >
                        <span
                          className={`search-result-icon ${transaction.type.toLowerCase()}`}
                        >
                          {transaction.type === "INCOME" ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownLeft size={16} />
                          )}
                        </span>
                        <span className="search-result-copy">
                          <strong>{transaction.description}</strong>
                          <span>
                            <CalendarDays size={12} /> {transaction.date}
                          </span>
                        </span>
                        <strong
                          className={
                            transaction.type === "INCOME"
                              ? "amount-pos"
                              : "amount-neg"
                          }
                        >
                          {transaction.type === "INCOME" ? "+" : "−"}
                          {transaction.amount.toLocaleString("id-ID")}
                        </strong>
                      </button>
                    ))}
                    {!matches.length && (
                      <div className="header-empty search-no-results">
                        <span className="search-empty-icon">
                          <Search size={18} />
                        </span>
                        <strong>Tidak ada transaksi yang cocok.</strong>
                        <span>Coba kata kunci atau tanggal lain.</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="search-view-all"
                    type="button"
                    onClick={() => navigate("/transactions")}
                  >
                    Lihat semua transaksi
                  </button>
                </div>
              )}
            </div>
            <div className="header-popover-wrap">
              <button
                className="circle-action"
                type="button"
                title="Notifikasi"
                aria-label="Notifikasi"
                aria-expanded={notificationOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setSearchOpen(false);
                }}
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && <span className="dot-notice" />}
              </button>
              {notificationOpen && (
                <div className="header-popover notification-popover">
                  <div className="notification-heading">
                    <div>
                      <strong>Notifikasi</strong>
                      <span>
                        {notificationItems.length
                          ? `${notificationItems.length} pemberitahuan`
                          : "Semua sudah diperiksa"}
                      </span>
                    </div>
                    <span className="notification-bell">
                      <Bell size={16} />
                    </span>
                  </div>
                  {notificationItems.length > 0 && (
                    <div className="notification-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setReadNotificationIds(
                            notificationItems.map((item) => item.id),
                          )
                        }
                      >
                        <CheckCheck size={13} /> Tandai semua dibaca
                      </button>
                      <button type="button" onClick={removeAllNotifications}>
                        Hapus semua
                      </button>
                    </div>
                  )}
                  {notificationItems.length > 0 ? (
                    <div className="notification-list">
                      {visibleBudgets.map((item) => (
                        <Link
                          key={item.id}
                          to="/budgets"
                          onClick={() => setNotificationOpen(false)}
                          className={`notification-item ${readNotificationIds.includes(item.id) ? "is-read" : "is-unread"}`}
                        >
                          <span className="notification-icon">
                            <FolderKanban size={16} />
                          </span>
                          <span className="notification-copy">
                            <strong>
                              {cat(data, item.budget.categoryId).name}
                            </strong>
                            <span>
                              Budget{" "}
                              {item.level === "over"
                                ? "terlampaui"
                                : `terpakai ${Math.round(item.rate)}%`}
                            </span>
                          </span>
                          <span className="amount-neg">
                            {rupiah(item.spent)}
                          </span>
                          <span className="notification-item-actions">
                            <button
                              type="button"
                              title="Tandai dibaca"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                markRead(item.id);
                              }}
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              title="Hapus"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                removeNotification(item.id);
                              }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        </Link>
                      ))}
                      {visibleRecurring.map((item) => (
                        <Link
                          key={`recurring-${item.id}`}
                          to="/recurring"
                          onClick={() => setNotificationOpen(false)}
                          className={`notification-item ${readNotificationIds.includes(item.id) ? "is-read" : "is-unread"}`}
                        >
                          <span className="notification-icon">
                            <CalendarClock size={16} />
                          </span>
                          <span className="notification-copy">
                            <strong>{item.description}</strong>
                            <span>
                              {
                                (
                                  {
                                    DAILY: "Harian",
                                    WEEKLY: "Mingguan",
                                    MONTHLY: "Bulanan",
                                  } as const
                                )[item.frequency]
                              }{" "}
                              · berikutnya{" "}
                              {item.nextRun
                                ? new Date(
                                    `${item.nextRun}T00:00:00`,
                                  ).toLocaleDateString("id-ID")
                                : `hari ${item.day}`}
                            </span>
                          </span>
                          <span
                            className={
                              item.type === "INCOME"
                                ? "amount-pos"
                                : "amount-neg"
                            }
                          >
                            {item.type === "INCOME" ? "+" : "−"}
                            {item.amount.toLocaleString("id-ID")}
                          </span>
                          <span className="notification-item-actions">
                            <button
                              type="button"
                              title="Tandai dibaca"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                markRead(item.id);
                              }}
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              title="Hapus"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                removeNotification(item.id);
                              }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        </Link>
                      ))}
                      {visibleTransactions.map((item) => (
                        <Link
                          key={`transaction-${item.id}`}
                          to="/transactions"
                          onClick={() => setNotificationOpen(false)}
                          className={`notification-item ${readNotificationIds.includes(item.id) ? "is-read" : "is-unread"}`}
                        >
                          <span className="notification-icon">
                            <Bell size={16} />
                          </span>
                          <span className="notification-copy">
                            <strong>
                              {item.description || "Transaksi baru"}
                            </strong>
                            <span>Transaksi · {item.date}</span>
                          </span>
                          <span
                            className={
                              item.type === "INCOME"
                                ? "amount-pos"
                                : "amount-neg"
                            }
                          >
                            {item.type === "INCOME" ? "+" : "−"}
                            {item.amount.toLocaleString("id-ID")}
                          </span>
                          <span className="notification-item-actions">
                            <button
                              className="notification-read-button"
                              type="button"
                              title="Tandai dibaca"
                              aria-label="Tandai notifikasi dibaca"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                markRead(item.id);
                              }}
                            >
                              <Check size={13} />
                            </button>
                            <button
                              className="notification-delete-button"
                              type="button"
                              title="Hapus"
                              aria-label="Hapus notifikasi"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                removeNotification(item.id);
                              }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="notification-empty">
                      <Bell size={22} />
                      <span>Tidak ada notifikasi baru</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="avatar-mobile-wrap">
              <button
                type="button"
                className="avatar avatar-mobile-trigger"
                title="Menu akun"
                aria-label="Menu akun"
                aria-expanded={avatarOpen}
                onClick={() => {
                  setAvatarOpen(!avatarOpen);
                  setSearchOpen(false);
                  setNotificationOpen(false);
                }}
              >
                 {data.profile.avatarUrl ? <img src={data.profile.avatarUrl} alt="Avatar profil" /> : initials}
               </button>
              {avatarOpen && (
                <div className="avatar-mobile-popover">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(true);
                      setAvatarOpen(false);
                    }}
                  >
                    <Search size={16} /> Cari transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/login", { replace: true });
                    }}
                  >
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
            <Link to="/settings" className="avatar avatar-desktop" title="Pengaturan akun">
              {data.profile.avatarUrl ? <img src={data.profile.avatarUrl} alt="Avatar profil" /> : initials}
            </Link>
            <button
              className="circle-action menu-toggle"
              type="button"
              aria-label="Buka navigasi"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
          {menu && (
            <nav className="mobile-menu open" aria-label="Navigasi seluler">
               {links.map(([url, label]) => (
                 <NavLink
                   key={url}
                   to={`/${url}`}
                    onClick={closeMobileNavigation}
                 >
                   {label}
                 </NavLink>
               ))}
                <div ref={mobileMoreRef} className={`mobile-more-wrap ${dropdown ? "open" : ""}`}>
                 <button
                   type="button"
                   className="mobile-more-trigger"
                   aria-expanded={dropdown}
                   onClick={() => setDropdown(!dropdown)}
                 >
                   Lainnya <ChevronDown size={14} />
                 </button>
                 {dropdown && (
                   <div className="mobile-more-menu">
                     {more.map(([url, label, Icon]) => (
                       <NavLink
                         key={url}
                         to={`/${url}`}
                          onClick={() => {
                            closeMobileNavigation();
                            navigate(`/${url}`);
                          }}
                       >
                         <Icon size={16} aria-hidden="true" />
                         <span>{label}</span>
                       </NavLink>
                     ))}
                   </div>
                 )}
               </div>

            </nav>
          )}
        </header>
         <main className="page-container">
           {dataLoading ? <PageSkeleton /> : <Outlet />}
         </main>
        <Footer />
      </div>
    </div>
  );
}
