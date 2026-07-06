import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  LogOut,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import "./cloud.css";

const STORAGE_KEYS = {
  savings: "valencia_spain_savings_v1",
  euroPurchases: "valencia_spain_euro_purchases_v1",
  documents: "valencia_spain_documents_v1",
  plan: "valencia_spain_plan_v1",
  costs: "valencia_spain_costs_v1",
};

const SYNC_FIELDS = {
  savings: STORAGE_KEYS.savings,
  euroPurchases: STORAGE_KEYS.euroPurchases,
  documents: STORAGE_KEYS.documents,
  plan: STORAGE_KEYS.plan,
  costs: STORAGE_KEYS.costs,
};

function safeParse(raw, fallback = null) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getErrorMessage(error) {
  if (!error) return "";

  const parts = [];

  if (error.message) {
    parts.push(error.message);
  }

  if (error.code) {
    parts.push(`Código: ${error.code}`);
  }

  if (error.status) {
    parts.push(`Status: ${error.status}`);
  }

  return parts.join(" · ") || "Erro desconhecido.";
}

function readLocalData() {
  return Object.entries(SYNC_FIELDS).reduce((acc, [field, key]) => {
    const raw = localStorage.getItem(key);
    const parsed = safeParse(raw);

    if (parsed !== null && parsed !== undefined) {
      acc[field] = parsed;
    }

    return acc;
  }, {});
}

function writeLocalData(data) {
  if (!data || typeof data !== "object") return;

  Object.entries(SYNC_FIELDS).forEach(([field, key]) => {
    if (data[field] !== undefined) {
      localStorage.setItem(key, JSON.stringify(data[field]));
    }
  });
}

async function loadCloudData(userId) {
  const { data, error } = await supabase
    .from("valencia_state")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data || null;
}

async function saveCloudData(userId) {
  const payload = readLocalData();

  const { error } = await supabase.from("valencia_state").upsert(
    {
      user_id: userId,
      data: payload,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }

  return payload;
}

function LoadingScreen({ title = "Carregando VALENCIA", subtitle }) {
  return (
    <main className="cloud-screen">
      <section className="cloud-card">
        <div className="cloud-logo">V</div>

        <div className="cloud-card-text">
          <span>VALENCIA</span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="cloud-loader" />
      </section>
    </main>
  );
}

function SetupScreen() {
  return (
    <main className="cloud-screen">
      <section className="cloud-auth-card">
        <div className="cloud-logo">V</div>

        <div className="cloud-card-text">
          <span>VALENCIA</span>
          <h1>Supabase não configurado</h1>
          <p>
            O app ainda não encontrou as variáveis do Supabase. Confira o
            arquivo <strong>.env.local</strong> na raiz do projeto.
          </p>
        </div>

        <div className="cloud-setup-box">
          <span>O arquivo precisa ter exatamente:</span>

          <code>
            VITE_SUPABASE_URL=https://orieinmbkxetujeaiusu.supabase.co
            {"\n"}
            VITE_SUPABASE_ANON_KEY=sb_publishable_SUA_CHAVE_INTEIRA
          </code>
        </div>

        <div className="cloud-security">
          <XCircle size={15} />
          <span>
            Depois de corrigir, pare o servidor com Ctrl + C e rode novamente.
          </span>
        </div>
      </section>
    </main>
  );
}

function CloudBadge({ status, email, onSignOut }) {
  const normalized = status.toLowerCase();

  const icon = useMemo(() => {
    if (normalized.includes("sincronizado")) {
      return <CheckCircle2 size={15} />;
    }

    if (normalized.includes("erro") || normalized.includes("offline")) {
      return <XCircle size={15} />;
    }

    if (normalized.includes("salvando") || normalized.includes("sincronizando")) {
      return <RefreshCw size={15} />;
    }

    return <Cloud size={15} />;
  }, [normalized]);

  return (
    <div className="cloud-badge online">
      <div className="cloud-badge-main">
        {icon}
        <span>{status}</span>
      </div>

      <small>{email}</small>

      <button type="button" onClick={onSignOut} title="Sair">
        <LogOut size={14} />
      </button>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Informe seu e-mail.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (signInError) {
          setError(`Erro real do Supabase: ${getErrorMessage(signInError)}`);
          return;
        }

        if (!data.session) {
          setError("O Supabase não retornou sessão. Verifique confirmação de e-mail.");
          return;
        }

        setNotice("Login realizado. Abrindo app...");
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (signUpError) {
          setError(`Erro real do Supabase: ${getErrorMessage(signUpError)}`);
          return;
        }

        if (!data.user) {
          setError("O Supabase não criou usuário. Confira as configurações de Auth.");
          return;
        }

        if (!data.session) {
          setNotice(
            "Conta criada, mas sem sessão ativa. Confirme o e-mail no Supabase ou na sua caixa de entrada."
          );
          return;
        }

        setNotice("Conta criada. Abrindo app...");
      }
    } catch (unknownError) {
      setError(`Erro inesperado: ${String(unknownError)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="cloud-screen">
      <section className="cloud-auth-card">
        <div className="cloud-logo">V</div>

        <div className="cloud-card-text">
          <span>VALENCIA</span>
          <h1>{isLogin ? "Entrar no app" : "Criar conta"}</h1>
          <p>Seus dados sincronizados entre computador e celular.</p>
        </div>

        <form className="cloud-form" onSubmit={handleSubmit}>
          <label>
            <span>E-mail</span>
            <input
              value={email}
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
                setNotice("");
              }}
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              value={password}
              type="password"
              placeholder="Mínimo 6 caracteres"
              autoComplete={isLogin ? "current-password" : "new-password"}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
                setNotice("");
              }}
            />
          </label>

          {error && <p className="cloud-error">{error}</p>}
          {notice && <p className="cloud-notice">{notice}</p>}

          <button
            className="cloud-primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          className="cloud-link-button"
          type="button"
          onClick={() => {
            setMode(isLogin ? "signup" : "login");
            setError("");
            setNotice("");
          }}
        >
          {isLogin ? "Criar uma conta nova" : "Já tenho conta"}
        </button>

        <div className="cloud-security">
          <Shield size={15} />
          <span>Dados protegidos por login e sincronização em nuvem.</span>
        </div>
      </section>
    </main>
  );
}

export default function CloudGate({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? "Conectando" : "Sem configuração"
  );

  const patchedRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setSession(null);
      } else {
        setSession(data.session);
      }

      setAuthLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user?.id) {
          setReady(false);
        } else {
          setReady(true);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!session?.user?.id) return;

    let cancelled = false;

    async function bootstrapCloud() {
      setReady(false);
      setSyncStatus("Sincronizando");

      try {
        const cloudData = await loadCloudData(session.user.id);

        if (cancelled) return;

        if (cloudData) {
          writeLocalData(cloudData);
        } else {
          await saveCloudData(session.user.id);
        }

        setSyncStatus("Sincronizado");
      } catch (error) {
        setSyncStatus("Offline");
        console.error("Erro ao sincronizar dados:", error);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    bootstrapCloud();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!session?.user?.id) return;
    if (!ready) return;
    if (patchedRef.current) return;

    const watchedKeys = new Set(Object.values(SYNC_FIELDS));
    const originalSetItem = Storage.prototype.setItem;

    function scheduleSave() {
      window.clearTimeout(saveTimerRef.current);

      setSyncStatus("Salvando");

      saveTimerRef.current = window.setTimeout(async () => {
        try {
          await saveCloudData(session.user.id);
          setSyncStatus("Sincronizado");
        } catch (error) {
          setSyncStatus("Offline");
          console.error("Erro ao salvar na nuvem:", error);
        }
      }, 700);
    }

    Storage.prototype.setItem = function patchedSetItem(key, value) {
      originalSetItem.call(this, key, value);

      if (watchedKeys.has(key)) {
        scheduleSave();
      }
    };

    patchedRef.current = true;

    return () => {
      Storage.prototype.setItem = originalSetItem;
      patchedRef.current = false;
      window.clearTimeout(saveTimerRef.current);
    };
  }, [ready, session?.user?.id]);

  async function handleSignOut() {
    setSyncStatus("Saindo");
    await supabase.auth.signOut();
    setSession(null);
    setReady(true);
  }

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (authLoading) {
    return (
      <LoadingScreen
        title="Abrindo VALENCIA"
        subtitle="Preparando sua sessão."
      />
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!ready) {
    return (
      <LoadingScreen
        title="Sincronizando"
        subtitle="Buscando seus dados salvos."
      />
    );
  }

  return (
    <>
      <CloudBadge
        status={syncStatus}
        email={session.user.email}
        onSignOut={handleSignOut}
      />

      {children}
    </>
  );
}