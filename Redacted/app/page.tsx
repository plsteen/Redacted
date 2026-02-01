"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";

interface Mystery {
  id: string;
  slug: string;
  title: string;
  locale: string;
  difficulty: number;
  priceNok: number;
  isPurchased?: boolean;
  summary?: string;
  backstory?: string;
  location?: string;
  date?: string;
  estimatedMinutes?: number;
  playCount?: number;
  createdAt?: string;
}

type SortOption = "newest" | "oldest" | "difficulty-asc" | "difficulty-desc" | "duration-asc" | "duration-desc" | "popular";
type DifficultyFilter = "all" | 1 | 2 | 3 | 4;
type DurationFilter = "all" | "short" | "medium" | "long" | "epic";

interface User {
  id: string;
  email: string;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-[var(--color-muted)]">Loading...</p></div>}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  
  // Locale
  const getCookieLocale = (): "en" | "no" => {
    if (typeof document === "undefined") return "en";
    const cookies = document.cookie.split("; ");
    const localeCookie = cookies.find((row) => row.startsWith("locale="));
    return localeCookie?.split("=")[1] === "no" ? "no" : "en";
  };
  
  const [locale, setLocale] = useState<"en" | "no">("en");
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & inputs
  const [selectedMystery, setSelectedMystery] = useState<Mystery | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  // Form inputs
  const [joinCode, setJoinCode] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSent, setAuthSent] = useState(false);
  
  // Filter & Sort
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchMysteries = useCallback(async () => {
    try {
      const loc = getCookieLocale();
      const res = await fetch(`/api/catalog?locale=${loc}`);
      const data = await res.json();
      setMysteries(data.mysteries || []);
    } catch {
      console.error("Failed to fetch mysteries");
    }
  }, []);

  useEffect(() => {
    setLocale(getCookieLocale());
    setIsHydrated(true);
    Promise.all([fetchUser(), fetchMysteries()]).finally(() => setLoading(false));
  }, [fetchMysteries]);

  // Escape key handler for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMystery(null);
        setShowJoinModal(false);
        setShowRedeemModal(false);
        setShowAuthModal(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {
      console.error("Failed to fetch user");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (authMode === "signup" && authPassword !== authConfirmPassword) {
      setAuthError(locale === "no" ? "Passordene er ikke like" : "Passwords do not match");
      setAuthLoading(false);
      return;
    }

    if (authMode === "signup" && authPassword.length < 8) {
      setAuthError(locale === "no" ? "Passord må være minst 8 tegn" : "Password must be at least 8 characters");
      setAuthLoading(false);
      return;
    }

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword, locale }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requiresConfirmation) {
          setAuthSent(true);
        } else {
          setShowAuthModal(false);
          window.location.reload();
        }
      } else {
        setAuthError(data.error);
      }
    } catch {
      setAuthError(locale === "no" ? "Noe gikk galt" : "Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    
    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase() }),
      });
      const data = await res.json();

      if (res.ok) {
        setRedeemSuccess(locale === "no" ? `Koden er løst inn! Du har nå tilgang til ${data.mysteryId}` : `Code redeemed! You now have access to ${data.mysteryId}`);
        setRedeemCode("");
        fetchMysteries();
        setTimeout(() => {
          setShowRedeemModal(false);
          setRedeemSuccess(null);
        }, 2000);
      } else {
        setRedeemError(data.error);
      }
    } catch {
      setRedeemError(locale === "no" ? "Noe gikk galt" : "Something went wrong");
    } finally {
      setRedeemLoading(false);
    }
  }

  function handlePlayCase(mystery: Mystery) {
    if (mystery.isPurchased) {
      router.push(`/play?case=${mystery.slug}&mode=host`);
    } else if (mystery.priceNok === 0) {
      router.push(`/play?case=${mystery.slug}&mode=host`);
    } else {
      // Go to checkout
      handleBuyCase(mystery);
    }
  }

  async function handleBuyCase(mystery: Mystery) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mysteryId: mystery.id, userId: user.id, locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  }

  function handleJoinGame() {
    if (joinCode.trim()) {
      router.push(`/play?mode=join&code=${joinCode.trim().toUpperCase()}`);
    }
  }

  // Text content
  const t = {
    en: {
      tagline: "Solve fictional mysteries with friends in real-time",
      players: "2-8 players",
      duration: "45-60 min",
      coop: "Cooperative",
      selectCase: "Choose a case to begin",
      difficulty: "Difficulty",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      veryHard: "Very Hard",
      free: "Free",
      sortBy: "Sort by",
      newest: "Newest",
      oldest: "Oldest",
      difficultyAsc: "Easiest first",
      difficultyDesc: "Hardest first",
      durationAsc: "Shortest first",
      durationDesc: "Longest first",
      popular: "Most popular",
      filterDifficulty: "Difficulty",
      filterDuration: "Duration",
      allDifficulties: "All",
      allDurations: "All",
      durationShort: "< 1 hour",
      durationMedium: "1-2 hours",
      durationLong: "2-4 hours",
      durationEpic: "4+ hours",
      filters: "Filters",
      clearFilters: "Clear",
      cases: "cases",
      hours: "h",
      minutes: "min",
      playNow: "Play now",
      details: "Details",
      buy: "Buy",
      joinGame: "Join a game",
      joinDesc: "Enter the room code shared by the host",
      roomCode: "Room code",
      join: "Join",
      haveCode: "Have an access code?",
      redeem: "Redeem",
      redeemCode: "Access code",
      redeemPlaceholder: "XXXX-XXXX",
      login: "Log in",
      signup: "Sign up",
      logout: "Log out",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      passwordHint: "At least 8 characters",
      checkEmail: "Check your inbox",
      checkEmailDesc: "We sent you a confirmation link.",
      close: "Close",
      cancel: "Cancel",
      or: "or",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      footer: "Nordic noir investigation game • Real-time multiplayer",
    },
    no: {
      tagline: "Løs fiktive mysterier med venner i sanntid",
      players: "2-8 spillere",
      duration: "45-60 min",
      coop: "Samarbeid",
      selectCase: "Velg et case for å begynne",
      difficulty: "Vanskelighetsgrad",
      easy: "Lett",
      medium: "Middels",
      hard: "Vanskelig",
      veryHard: "Veldig vanskelig",
      free: "Gratis",
      sortBy: "Sorter etter",
      newest: "Nyeste",
      oldest: "Eldste",
      difficultyAsc: "Enkleste først",
      difficultyDesc: "Vanskeligste først",
      durationAsc: "Korteste først",
      durationDesc: "Lengste først",
      popular: "Mest populære",
      filterDifficulty: "Vanskelighetsgrad",
      filterDuration: "Varighet",
      allDifficulties: "Alle",
      allDurations: "Alle",
      durationShort: "< 1 time",
      durationMedium: "1-2 timer",
      durationLong: "2-4 timer",
      durationEpic: "4+ timer",
      filters: "Filtre",
      clearFilters: "Nullstill",
      cases: "saker",
      hours: "t",
      minutes: "min",
      playNow: "Spill nå",
      details: "Detaljer",
      buy: "Kjøp",
      joinGame: "Bli med i et spill",
      joinDesc: "Skriv inn romkoden du har fått fra verten",
      roomCode: "Romkode",
      join: "Bli med",
      haveCode: "Har du en tilgangskode?",
      redeem: "Løs inn",
      redeemCode: "Tilgangskode",
      redeemPlaceholder: "XXXX-XXXX",
      login: "Logg inn",
      signup: "Opprett konto",
      logout: "Logg ut",
      email: "E-post",
      password: "Passord",
      confirmPassword: "Bekreft passord",
      passwordHint: "Minst 8 tegn",
      checkEmail: "Sjekk innboksen",
      checkEmailDesc: "Vi sendte deg en bekreftelseslenke.",
      close: "Lukk",
      cancel: "Avbryt",
      or: "eller",
      noAccount: "Har du ikke konto?",
      haveAccount: "Har du allerede konto?",
      footer: "Nordic noir etterforskningsspill • Sanntids multiplayer",
    },
  };
  const txt = t[locale];

  const getDifficultyText = (d: number) => {
    if (d === 1) return txt.easy;
    if (d === 2) return txt.medium;
    if (d === 3) return txt.hard;
    return txt.veryHard;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "45 " + txt.minutes;
    if (minutes < 60) return `${minutes} ${txt.minutes}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ${txt.hours}`;
    return `${hours}${txt.hours} ${mins}${txt.minutes}`;
  };

  // Duration filter helper
  const matchesDurationFilter = (minutes: number = 45): boolean => {
    switch (durationFilter) {
      case "short": return minutes < 60;
      case "medium": return minutes >= 60 && minutes < 120;
      case "long": return minutes >= 120 && minutes < 240;
      case "epic": return minutes >= 240;
      default: return true;
    }
  };

  // Filter and sort mysteries
  const filteredMysteries = mysteries
    .filter(m => difficultyFilter === "all" || m.difficulty === difficultyFilter)
    .filter(m => matchesDurationFilter(m.estimatedMinutes))
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "difficulty-asc":
          return a.difficulty - b.difficulty;
        case "difficulty-desc":
          return b.difficulty - a.difficulty;
        case "duration-asc":
          return (a.estimatedMinutes || 45) - (b.estimatedMinutes || 45);
        case "duration-desc":
          return (b.estimatedMinutes || 45) - (a.estimatedMinutes || 45);
        case "popular":
          return (b.playCount || 0) - (a.playCount || 0);
        default:
          return 0;
      }
    });

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-gold)]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--color-accent)]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color-gold)]/3 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Geometric decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 border border-[var(--color-gold)] rotate-45" />
        <div className="absolute bottom-20 left-10 w-24 h-24 border-2 border-[var(--color-accent)]" />
        <div className="absolute top-1/3 left-1/4 w-2 h-20 bg-[var(--color-gold)]" />
      </div>

      <div className="noise-bg" />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-0">
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-[var(--color-gold)]" />
              <h1 className="font-serif text-5xl sm:text-6xl font-bold leading-none text-white mb-1 tracking-tight">
                REDACTED
              </h1>
              <p className="text-[var(--color-gold)] text-xs uppercase tracking-[0.15em] font-semibold">
                Nordic Noir Mystery Game
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <LanguageSwitcher />
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-[var(--color-muted)] hover:text-white text-sm transition cursor-pointer"
                >
                  {txt.logout}
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-[var(--color-gold)] text-black rounded-lg font-medium hover:bg-[var(--color-gold)]/90 transition cursor-pointer"
                >
                  {txt.login}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <p className="text-xl sm:text-2xl text-white/90 font-light mb-4">
            {txt.tagline}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-muted)]">
            <span>{txt.players}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
            <span>{txt.duration}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
            <span>{txt.coop}</span>
          </div>
        </div>

        {/* Case Grid */}
        <div className="mb-12">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-sm uppercase tracking-wide text-[var(--color-muted)] font-semibold">
              {txt.selectCase} <span className="text-white/50">({filteredMysteries.length} {txt.cases})</span>
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:border-[var(--color-gold)]/50 outline-none cursor-pointer"
              >
                <option value="newest">{txt.newest}</option>
                <option value="oldest">{txt.oldest}</option>
                <option value="popular">{txt.popular}</option>
                <option value="difficulty-asc">{txt.difficultyAsc}</option>
                <option value="difficulty-desc">{txt.difficultyDesc}</option>
                <option value="duration-asc">{txt.durationAsc}</option>
                <option value="duration-desc">{txt.durationDesc}</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-lg text-sm transition cursor-pointer ${
                  showFilters || difficultyFilter !== "all" || durationFilter !== "all"
                    ? "border-[var(--color-gold)]/50 text-[var(--color-gold)]"
                    : "border-white/10 text-[var(--color-muted)] hover:text-white"
                }`}
              >
                ⚙️ {txt.filters}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="glass-panel border border-white/10 p-4 rounded-lg mb-6 animate-fade-in space-y-4">
              {/* Difficulty Filter */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm text-[var(--color-muted)] min-w-[100px]">{txt.filterDifficulty}:</span>
                <div className="flex flex-wrap gap-2">
                  {(["all", 1, 2, 3, 4] as DifficultyFilter[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficultyFilter(level)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${
                        difficultyFilter === level
                          ? "bg-[var(--color-gold)] text-black font-medium"
                          : "bg-black/30 text-[var(--color-muted)] hover:text-white border border-white/10"
                      }`}
                    >
                      {level === "all" ? txt.allDifficulties : getDifficultyText(level)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm text-[var(--color-muted)] min-w-[100px]">{txt.filterDuration}:</span>
                <div className="flex flex-wrap gap-2">
                  {(["all", "short", "medium", "long", "epic"] as DurationFilter[]).map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setDurationFilter(duration)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${
                        durationFilter === duration
                          ? "bg-[var(--color-gold)] text-black font-medium"
                          : "bg-black/30 text-[var(--color-muted)] hover:text-white border border-white/10"
                      }`}
                    >
                      {duration === "all" ? txt.allDurations : 
                       duration === "short" ? txt.durationShort :
                       duration === "medium" ? txt.durationMedium :
                       duration === "long" ? txt.durationLong : txt.durationEpic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {(difficultyFilter !== "all" || durationFilter !== "all") && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => { setDifficultyFilter("all"); setDurationFilter("all"); }}
                    className="text-xs text-[var(--color-muted)] hover:text-white underline cursor-pointer"
                  >
                    {txt.clearFilters}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMysteries.map((mystery) => (
              <div
                key={mystery.slug}
                className="group glass-panel border border-white/10 hover:border-[var(--color-gold)]/40 transition overflow-hidden"
              >
                {/* Card Content */}
                <div className="p-6">
                  {/* Title + Owned badge */}
                  <div className="flex items-start justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMystery(mystery)}
                      className="text-left font-serif text-xl text-white group-hover:text-[var(--color-gold)] transition"
                    >
                      {mystery.title}
                    </button>
                    {mystery.isPurchased && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 text-white/70 text-[10px] px-2 py-0.5 font-semibold shrink-0 ml-2">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/20 text-white/70">✓</span>
                        <span>{locale === "no" ? "Eid" : "Owned"}</span>
                      </span>
                    )}
                  </div>

                  {/* Difficulty + Duration */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`w-1.5 h-4 rounded-sm ${
                            level <= mystery.difficulty
                              ? "bg-[var(--color-gold)]"
                              : "bg-stone-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {getDifficultyText(mystery.difficulty)}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">•</span>
                    <span className="text-xs text-[var(--color-muted)]">{formatDuration(mystery.estimatedMinutes)}</span>
                    {mystery.playCount && mystery.playCount > 0 && (
                      <>
                        <span className="text-xs text-[var(--color-muted)]">•</span>
                        <span className="text-xs text-[var(--color-muted)]">{mystery.playCount} 🎮</span>
                      </>
                    )}
                  </div>

                  {/* Short description */}
                  <p className="text-sm text-[var(--color-muted)] font-light line-clamp-2 mb-4">
                    {mystery.summary || mystery.backstory || "A thrilling mystery awaits..."}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {mystery.isPurchased || mystery.priceNok === 0 ? (
                      <button
                        onClick={() => handlePlayCase(mystery)}
                        className="flex-1 py-2 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition cursor-pointer"
                      >
                        {txt.playNow} →
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyCase(mystery)}
                        className="flex-1 py-2 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition cursor-pointer"
                      >
                        {txt.buy} • {mystery.priceNok} kr
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedMystery(mystery)}
                      className="px-4 py-2 border border-white/20 rounded-lg text-sm text-[var(--color-muted)] hover:border-[var(--color-gold)]/40 hover:text-white transition cursor-pointer"
                    >
                      {txt.details}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Coming Soon placeholder - show if total mysteries is low */}
            {mysteries.length < 3 && (
              <div className="glass-panel border border-white/5 p-6 opacity-50">
                <h3 className="font-serif text-xl text-white/50 mb-2">Coming Soon</h3>
                <p className="text-sm text-[var(--color-muted)]/50">
                  {locale === "no" ? "Flere saker på vei..." : "More cases coming..."}
                </p>
              </div>
            )}

            {/* No results message */}
            {filteredMysteries.length === 0 && mysteries.length > 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-[var(--color-muted)]">
                  {locale === "no" ? "Ingen saker matcher filteret" : "No cases match the filter"}
                </p>
                <button
                  onClick={() => { setDifficultyFilter("all"); setDurationFilter("all"); }}
                  className="mt-4 px-4 py-2 text-sm text-[var(--color-gold)] hover:underline cursor-pointer"
                >
                  {txt.clearFilters}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Join & Redeem Section */}
        <div className="glass-panel border border-white/10 p-6 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition cursor-pointer"
              >
                <span className="text-xl">🎮</span>
                <span className="text-sm font-medium">{txt.joinGame}</span>
              </button>
              {user && (
                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition cursor-pointer"
                >
                  <span className="text-xl">🎟️</span>
                  <span className="text-sm font-medium">{txt.haveCode}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              {txt.footer}
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Case Details Modal */}
      {selectedMystery && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMystery(null)}
        >
          <div 
            className="glass-panel max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMystery(null)}
              className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>

            <h2 className="font-serif text-3xl text-white mb-2">{selectedMystery.title}</h2>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-5 rounded-sm ${
                      level <= selectedMystery.difficulty
                        ? "bg-[var(--color-gold)]"
                        : "bg-stone-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--color-muted)]">
                {getDifficultyText(selectedMystery.difficulty)}
              </span>
              <span className="text-[var(--color-muted)]">•</span>
              <span className="text-sm text-[var(--color-muted)]">
                {formatDuration(selectedMystery.estimatedMinutes)}
              </span>
              {selectedMystery.location && (
                <>
                  <span className="text-[var(--color-muted)]">•</span>
                  <span className="text-sm text-[var(--color-muted)]">{selectedMystery.location}</span>
                </>
              )}
            </div>

            {selectedMystery.backstory && (
              <div className="mb-6">
                <p className="text-[var(--color-muted)] leading-relaxed font-light">
                  {selectedMystery.backstory}
                </p>
              </div>
            )}

            {selectedMystery.summary && selectedMystery.summary !== selectedMystery.backstory && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-2 border-[var(--color-gold)]">
                <p className="text-white/90 italic">
                  &ldquo;{selectedMystery.summary}&rdquo;
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              {selectedMystery.isPurchased || selectedMystery.priceNok === 0 ? (
                <button
                  onClick={() => {
                    setSelectedMystery(null);
                    handlePlayCase(selectedMystery);
                  }}
                  className="flex-1 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition cursor-pointer"
                >
                  {txt.playNow} →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedMystery(null);
                    handleBuyCase(selectedMystery);
                  }}
                  className="flex-1 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition cursor-pointer"
                >
                  {txt.buy} • {selectedMystery.priceNok} kr
                </button>
              )}
              <button
                onClick={() => setSelectedMystery(null)}
                className="px-6 py-3 border border-white/20 rounded-lg text-[var(--color-muted)] hover:border-white/40 hover:text-white transition cursor-pointer"
              >
                {txt.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Game Modal */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <div 
            className="glass-panel max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-white mb-2">{txt.joinGame}</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">{txt.joinDesc}</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--color-muted)] block mb-2">{txt.roomCode}</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                  placeholder="XXXX"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-lg font-mono uppercase tracking-widest text-center focus:border-[var(--color-gold)]/50 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleJoinGame}
                  disabled={!joinCode.trim()}
                  className="flex-1 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {txt.join} →
                </button>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-6 py-3 border border-white/20 rounded-lg text-[var(--color-muted)] hover:border-white/40 hover:text-white transition cursor-pointer"
                >
                  {txt.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Code Modal */}
      {showRedeemModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRedeemModal(false)}
        >
          <div 
            className="glass-panel max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-white mb-6">{txt.haveCode}</h2>

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="text-sm text-[var(--color-muted)] block mb-2">{txt.redeemCode}</label>
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder={txt.redeemPlaceholder}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-lg font-mono uppercase tracking-widest text-center focus:border-[var(--color-gold)]/50 outline-none"
                  autoFocus
                />
              </div>

              {redeemError && (
                <p className="text-red-400 text-sm">{redeemError}</p>
              )}
              {redeemSuccess && (
                <p className="text-green-400 text-sm">{redeemSuccess}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={redeemLoading || !redeemCode.trim()}
                  className="flex-1 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {redeemLoading ? "..." : txt.redeem}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-6 py-3 border border-white/20 rounded-lg text-[var(--color-muted)] hover:border-white/40 hover:text-white transition cursor-pointer"
                >
                  {txt.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="glass-panel max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-white mb-6">
              {authMode === "login" ? txt.login : txt.signup}
            </h2>

            {authSent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📧</div>
                <h3 className="text-xl text-white mb-2">{txt.checkEmail}</h3>
                <p className="text-[var(--color-muted)]">{txt.checkEmailDesc}</p>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthSent(false);
                  }}
                  className="mt-6 px-6 py-2 border border-white/20 rounded-lg text-[var(--color-muted)] hover:text-white transition cursor-pointer"
                >
                  {txt.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-muted)] block mb-2">{txt.email}</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:border-[var(--color-gold)]/50 outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--color-muted)] block mb-2">{txt.password}</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:border-[var(--color-gold)]/50 outline-none"
                    required
                  />
                  {authMode === "signup" && (
                    <p className="text-xs text-[var(--color-muted)] mt-1">{txt.passwordHint}</p>
                  )}
                </div>
                {authMode === "signup" && (
                  <div>
                    <label className="text-sm text-[var(--color-muted)] block mb-2">{txt.confirmPassword}</label>
                    <input
                      type="password"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:border-[var(--color-gold)]/50 outline-none"
                      required
                    />
                  </div>
                )}

                {authError && (
                  <p className="text-red-400 text-sm">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? "..." : authMode === "login" ? txt.login : txt.signup}
                </button>

                <p className="text-center text-sm text-[var(--color-muted)]">
                  {authMode === "login" ? txt.noAccount : txt.haveAccount}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "signup" : "login");
                      setAuthError(null);
                    }}
                    className="text-[var(--color-gold)] hover:underline cursor-pointer"
                  >
                    {authMode === "login" ? txt.signup : txt.login}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
