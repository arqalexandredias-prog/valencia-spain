import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Euro,
  FileText,
  Home,
  Landmark,
  Pencil,
  Plane,
  Plus,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";

const STORAGE_KEYS = {
  savings: "valencia_spain_savings_v1",
  euroPurchases: "valencia_spain_euro_purchases_v1",
  documents: "valencia_spain_documents_v1",
  plan: "valencia_spain_plan_v1",
};

const defaultPlan = {
  goalBRL: 60000,
  goalEUR: 7000,
  euroRate: 5.9,
  targetDate: "2027-04-01",
  city: "Valência",
  country: "Espanha",
  note:
    "Juntar reserva, organizar documentos, comprar euros aos poucos e preparar a mudança com segurança.",
  steps: [
    {
      id: 1,
      title: "Organizar documentos principais",
      done: false,
      note: "Passaporte, certidões, diploma, currículo, portfólio e comprovantes.",
    },
    {
      id: 2,
      title: "Atingir a reserva mínima",
      done: false,
      note: "Construir a reserva em reais e euros para chegar com segurança.",
    },
    {
      id: 3,
      title: "Comprar euros aos poucos",
      done: false,
      note: "Registrar compras e acompanhar preço médio.",
    },
    {
      id: 4,
      title: "Definir cidade e moradia inicial",
      done: false,
      note: "Pesquisar custo de vida, aluguel, transporte e bairros.",
    },
  ],
};

const defaultSavings = [
  {
    id: 1,
    title: "Reserva inicial",
    place: "Dinheiro já guardado",
    amount: 13000,
    date: new Date().toISOString().slice(0, 10),
    note: "Valor inicial cadastrado no VALENCIA.",
  },
];

const defaultEuroPurchases = [];

const defaultDocuments = [
  {
    id: 1,
    title: "Passaporte",
    category: "Identificação",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "Ver validade e documentos necessários.",
  },
  {
    id: 2,
    title: "Certidões",
    category: "Civil",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "Organizar certidões atualizadas.",
  },
  {
    id: 3,
    title: "Apostilamento",
    category: "Legalização",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "Separar documentos que precisam de apostila.",
  },
  {
    id: 4,
    title: "Diploma / histórico",
    category: "Profissional",
    priority: "Média",
    deadline: "",
    done: false,
    note: "Reunir diploma, histórico e comprovações.",
  },
  {
    id: 5,
    title: "Currículo e portfólio",
    category: "Trabalho",
    priority: "Média",
    deadline: "",
    done: false,
    note: "Preparar versão voltada para Espanha.",
  },
  {
    id: 6,
    title: "Comprovantes financeiros",
    category: "Financeiro",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "Guardar extratos e comprovantes da reserva.",
  },
];

const navItems = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "reserva", label: "Reserva", icon: Wallet },
  { id: "euros", label: "Euros", icon: Landmark },
  { id: "documentos", label: "Docs", icon: FileText },
  { id: "plano", label: "Plano", icon: Plane },
];

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }

    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseMoney(value) {
  if (typeof value === "number") return value;

  let normalized = String(value || "")
    .trim()
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace("€", "");

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (hasDot) {
    const parts = normalized.split(".");

    if (parts.length === 2 && parts[1].length === 3 && parts[0].length > 1) {
      normalized = normalized.replace(".", "");
    }
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatBRLWithCents(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatEUR(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatEURWithCents(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(date) {
  if (!date) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatMonthYear(date) {
  if (!date) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getSavingsTotal(savings) {
  return savings.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getEuroSummary(euroPurchases, euroRate) {
  const totalEUR = euroPurchases.reduce(
    (sum, item) => sum + Number(item.amountEUR || 0),
    0
  );

  const totalBRL = euroPurchases.reduce(
    (sum, item) => sum + Number(item.amountBRL || 0),
    0
  );

  const averageRate = totalEUR > 0 ? totalBRL / totalEUR : 0;
  const currentValueBRL = totalEUR * Number(euroRate || 0);

  return {
    totalEUR,
    totalBRL,
    averageRate,
    currentValueBRL,
  };
}

function getDocumentsSummary(documents) {
  const total = documents.length;
  const done = documents.filter((item) => item.done).length;
  const pending = Math.max(total - done, 0);
  const progress = total > 0 ? (done / total) * 100 : 0;

  return {
    total,
    done,
    pending,
    progress,
  };
}

function getStepsSummary(steps = []) {
  const total = steps.length;
  const done = steps.filter((item) => item.done).length;
  const pending = Math.max(total - done, 0);
  const progress = total > 0 ? (done / total) * 100 : 0;

  return {
    total,
    done,
    pending,
    progress,
  };
}

function AppShell({ activePage, setActivePage, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">V</div>

        <div>
          <strong className="brand-name">VALENCIA</strong>
          <span className="brand-subtitle">
            Sua vida organizada para a Espanha
          </span>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;

          return (
            <button
              key={item.id}
              className={active ? "nav-item active" : "nav-item"}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">
                <Icon size={19} />
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="page-header">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function StatCard({ label, value, helper }) {
  return (
    <Card>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <p className="stat-helper">{helper}</p>
    </Card>
  );
}

function ProgressBar({ value }) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function Dashboard({ savings, euroPurchases, documents, plan }) {
  const summary = useMemo(() => {
    const savedBRL = getSavingsTotal(savings);
    const euroSummary = getEuroSummary(euroPurchases, plan.euroRate);
    const docsSummary = getDocumentsSummary(documents);
    const stepsSummary = getStepsSummary(plan.steps);

    const totalSaved = savedBRL + euroSummary.currentValueBRL;
    const missing = Math.max(Number(plan.goalBRL || 0) - totalSaved, 0);
    const progress =
      Number(plan.goalBRL || 0) > 0
        ? (totalSaved / Number(plan.goalBRL || 0)) * 100
        : 0;

    return {
      savedBRL,
      totalSaved,
      missing,
      progress,
      docsSummary,
      stepsSummary,
      ...euroSummary,
    };
  }, [savings, euroPurchases, documents, plan]);

  return (
    <>
      <PageHeader
        eyebrow="Plano Espanha"
        title="Quanto falta para ir embora?"
        description="O VALENCIA agora existe para uma única missão: organizar sua preparação para viver na Espanha."
      />

      <Card className="hero-card">
        <div className="hero-grid">
          <div>
            <span className="section-eyebrow">Meta principal</span>
            <h2>{Math.round(summary.progress)}%</h2>
            <p>
              Você já tem <strong>{formatBRL(summary.totalSaved)}</strong>{" "}
              preparados para a Espanha.
            </p>
          </div>

          <div className="hero-missing">
            <span>Falta juntar</span>
            <strong>{formatBRL(summary.missing)}</strong>
          </div>
        </div>

        <ProgressBar value={summary.progress} />

        <div className="hero-footer">
          <span>Meta: {formatBRL(plan.goalBRL)}</span>
          <span>Destino: {plan.city}</span>
          <span>Data-alvo: {formatMonthYear(plan.targetDate)}</span>
        </div>
      </Card>

      <section className="stats-grid">
        <StatCard
          label="Guardado"
          value={formatBRL(summary.savedBRL)}
          helper="Reserva em reais para a mudança"
        />

        <StatCard
          label="Euros"
          value={formatEUR(summary.totalEUR)}
          helper={`Valor atual: ${formatBRL(summary.currentValueBRL)}`}
        />

        <StatCard
          label="Documentos"
          value={`${Math.round(summary.docsSummary.progress)}%`}
          helper={`${summary.docsSummary.done} de ${summary.docsSummary.total} concluídos`}
        />
      </section>

      <section className="content-grid">
        <Card>
          <div className="card-title-row">
            <div>
              <span className="section-eyebrow">Próxima ação</span>
              <h3>
                {summary.docsSummary.progress < 100
                  ? "Avançar nos documentos essenciais"
                  : summary.stepsSummary.progress < 100
                    ? "Avançar nas etapas do plano"
                    : "Revisar seu plano final"}
              </h3>
            </div>

            <CheckCircle2 size={22} />
          </div>

          <p className="muted">
            {summary.docsSummary.progress < 100
              ? "A parte financeira está andando, mas os documentos precisam caminhar junto. Priorize passaporte, certidões, diploma, currículo, portfólio e comprovantes financeiros."
              : summary.stepsSummary.progress < 100
                ? "Agora foque nas etapas principais: reserva, euros, cidade, moradia inicial e prazo realista."
                : "Seu plano está bem encaminhado. Agora vale revisar prazos, valores, documentos e próximos passos antes da mudança."}
          </p>
        </Card>

        <Card>
          <span className="section-eyebrow">Resumo</span>

          <div className="record-list">
            <div className="record-row">
              <span>Meta Espanha</span>
              <strong>{formatBRL(plan.goalBRL)}</strong>
            </div>

            <div className="record-row">
              <span>Reserva em reais</span>
              <strong>{formatBRL(summary.savedBRL)}</strong>
            </div>

            <div className="record-row">
              <span>Euros convertidos</span>
              <strong>{formatBRL(summary.currentValueBRL)}</strong>
            </div>

            <div className="record-row">
              <span>Preparado hoje</span>
              <strong>{formatBRL(summary.totalSaved)}</strong>
            </div>

            <div className="record-row">
              <span>Falta</span>
              <strong>{formatBRL(summary.missing)}</strong>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}

function SavingsForm({ onSave, editingItem, onCancel }) {
  const [form, setForm] = useState({
    title: editingItem?.title || "",
    place: editingItem?.place || "",
    amount: editingItem?.amount ? String(editingItem.amount) : "",
    date: editingItem?.date || new Date().toISOString().slice(0, 10),
    note: editingItem?.note || "",
  });

  useEffect(() => {
    setForm({
      title: editingItem?.title || "",
      place: editingItem?.place || "",
      amount: editingItem?.amount ? String(editingItem.amount) : "",
      date: editingItem?.date || new Date().toISOString().slice(0, 10),
      note: editingItem?.note || "",
    });
  }, [editingItem]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const amount = parseMoney(form.amount);

    if (!form.title.trim()) {
      alert("Informe um nome para esse valor.");
      return;
    }

    if (amount <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    onSave({
      ...editingItem,
      id: editingItem?.id || Date.now(),
      title: form.title.trim(),
      place: form.place.trim(),
      amount,
      date: form.date,
      note: form.note.trim(),
    });

    setForm({
      title: "",
      place: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  }

  return (
    <Card>
      <div className="card-title-row">
        <div>
          <span className="section-eyebrow">
            {editingItem ? "Editar reserva" : "Novo valor"}
          </span>
          <h3>
            {editingItem ? "Atualizar valor guardado" : "Adicionar reserva"}
          </h3>
        </div>

        <Plus size={22} />
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome</span>
          <input
            name="title"
            value={form.title}
            placeholder="Ex: Nubank, Ailos, Inter..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Onde está guardado</span>
          <input
            name="place"
            value={form.place}
            placeholder="Ex: Caixinha, CDB, conta corrente..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Valor</span>
          <input
            name="amount"
            value={form.amount}
            inputMode="decimal"
            placeholder="13000"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Data</span>
          <input
            name="date"
            value={form.date}
            type="date"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full">
          <span>Observação</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            placeholder="Ex: dinheiro reservado exclusivamente para a Espanha."
            onChange={handleChange}
          />
        </label>

        <div className="form-actions field-full">
          {editingItem && (
            <button className="button ghost" type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}

          <button className="button primary" type="submit">
            {editingItem ? "Salvar alteração" : "Adicionar valor"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function ReservaPage({ savings, setSavings, plan }) {
  const [editingItem, setEditingItem] = useState(null);

  const totalSaved = useMemo(() => {
    return getSavingsTotal(savings);
  }, [savings]);

  function handleSave(item) {
    setSavings((current) => {
      const exists = current.some((saving) => saving.id === item.id);

      if (exists) {
        return current.map((saving) => (saving.id === item.id ? item : saving));
      }

      return [item, ...current];
    });

    setEditingItem(null);
  }

  function handleDelete(item) {
    const confirmDelete = window.confirm(`Excluir "${item.title}" da reserva?`);

    if (!confirmDelete) return;

    setSavings((current) => current.filter((saving) => saving.id !== item.id));
  }

  return (
    <>
      <PageHeader
        eyebrow="Reserva Espanha"
        title="Seu dinheiro para a mudança"
        description="Cadastre apenas valores que fazem parte do plano Espanha. Nada de controle financeiro geral aqui."
      />

      <section className="stats-grid">
        <StatCard
          label="Total guardado"
          value={formatBRL(totalSaved)}
          helper="Soma da reserva em reais"
        />

        <StatCard
          label="Meta Espanha"
          value={formatBRL(plan.goalBRL)}
          helper="Objetivo financeiro principal"
        />

        <StatCard
          label="Falta juntar"
          value={formatBRL(Math.max(Number(plan.goalBRL || 0) - totalSaved, 0))}
          helper="Diferença até a meta"
        />
      </section>

      <SavingsForm
        editingItem={editingItem}
        onSave={handleSave}
        onCancel={() => setEditingItem(null)}
      />

      <Card>
        <div className="card-title-row">
          <div>
            <span className="section-eyebrow">Reserva cadastrada</span>
            <h3>Valores guardados</h3>
          </div>

          <Wallet size={22} />
        </div>

        {savings.length > 0 ? (
          <div className="record-list">
            {savings.map((item) => (
              <div className="saving-row" key={item.id}>
                <div className="saving-info">
                  <strong>{item.title}</strong>
                  <span>
                    {item.place || "Sem local informado"} •{" "}
                    {formatDate(item.date)}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>

                <div className="saving-actions">
                  <strong>{formatBRL(item.amount)}</strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setEditingItem(item)}
                    aria-label="Editar"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label="Excluir"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Nenhum valor cadastrado ainda. Adicione sua primeira reserva para a
            Espanha.
          </p>
        )}
      </Card>
    </>
  );
}

function EuroForm({ onSave, editingItem, onCancel, euroRate }) {
  const [form, setForm] = useState({
    account: editingItem?.account || "",
    amountEUR: editingItem?.amountEUR ? String(editingItem.amountEUR) : "",
    rate: editingItem?.rate
      ? String(editingItem.rate).replace(".", ",")
      : String(euroRate).replace(".", ","),
    amountBRL: editingItem?.amountBRL ? String(editingItem.amountBRL) : "",
    date: editingItem?.date || new Date().toISOString().slice(0, 10),
    note: editingItem?.note || "",
  });

  const preview = useMemo(() => {
    const amountEUR = parseMoney(form.amountEUR);
    const rate = parseMoney(form.rate);
    const typedBRL = parseMoney(form.amountBRL);
    const calculatedBRL = amountEUR * rate;

    return {
      amountEUR,
      rate,
      amountBRL: typedBRL > 0 ? typedBRL : calculatedBRL,
      calculatedBRL,
    };
  }, [form]);

  useEffect(() => {
    setForm({
      account: editingItem?.account || "",
      amountEUR: editingItem?.amountEUR ? String(editingItem.amountEUR) : "",
      rate: editingItem?.rate
        ? String(editingItem.rate).replace(".", ",")
        : String(euroRate).replace(".", ","),
      amountBRL: editingItem?.amountBRL ? String(editingItem.amountBRL) : "",
      date: editingItem?.date || new Date().toISOString().slice(0, 10),
      note: editingItem?.note || "",
    });
  }, [editingItem, euroRate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const amountEUR = parseMoney(form.amountEUR);
    const rate = parseMoney(form.rate);
    const amountBRLTyped = parseMoney(form.amountBRL);
    const amountBRL = amountBRLTyped > 0 ? amountBRLTyped : amountEUR * rate;

    if (amountEUR <= 0) {
      alert("Informe a quantidade de euros comprados.");
      return;
    }

    if (rate <= 0) {
      alert("Informe a cotação usada.");
      return;
    }

    onSave({
      ...editingItem,
      id: editingItem?.id || Date.now(),
      account: form.account.trim() || "Conta não informada",
      amountEUR,
      rate,
      amountBRL,
      date: form.date,
      note: form.note.trim(),
    });

    setForm({
      account: "",
      amountEUR: "",
      rate: String(euroRate).replace(".", ","),
      amountBRL: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  }

  return (
    <Card>
      <div className="card-title-row">
        <div>
          <span className="section-eyebrow">
            {editingItem ? "Editar compra" : "Nova compra"}
          </span>
          <h3>{editingItem ? "Atualizar euros" : "Adicionar compra de euro"}</h3>
        </div>

        <Euro size={22} />
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Conta usada</span>
          <input
            name="account"
            value={form.account}
            placeholder="Ex: Nomad, Wise, banco..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Quantidade em €</span>
          <input
            name="amountEUR"
            value={form.amountEUR}
            inputMode="decimal"
            placeholder="500"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Cotação</span>
          <input
            name="rate"
            value={form.rate}
            inputMode="decimal"
            placeholder="5,90"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Valor pago em R$</span>
          <input
            name="amountBRL"
            value={form.amountBRL}
            inputMode="decimal"
            placeholder="Opcional. Ex: 2950"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Data</span>
          <input
            name="date"
            value={form.date}
            type="date"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full">
          <span>Observação</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            placeholder="Ex: compra feita aos poucos para reduzir risco do câmbio."
            onChange={handleChange}
          />
        </label>

        <Card className="field-full preview-card">
          <span className="section-eyebrow">Prévia</span>

          <div className="record-list">
            <div className="record-row">
              <span>Euros comprados</span>
              <strong>{formatEURWithCents(preview.amountEUR)}</strong>
            </div>

            <div className="record-row">
              <span>Cotação usada</span>
              <strong>{formatBRLWithCents(preview.rate)}</strong>
            </div>

            <div className="record-row">
              <span>Valor em reais</span>
              <strong>{formatBRLWithCents(preview.amountBRL)}</strong>
            </div>
          </div>
        </Card>

        <div className="form-actions field-full">
          {editingItem && (
            <button className="button ghost" type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}

          <button className="button primary" type="submit">
            {editingItem ? "Salvar alteração" : "Adicionar compra"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function EurosPage({ euroPurchases, setEuroPurchases, plan }) {
  const [editingItem, setEditingItem] = useState(null);

  const summary = useMemo(() => {
    return getEuroSummary(euroPurchases, plan.euroRate);
  }, [euroPurchases, plan.euroRate]);

  function handleSave(item) {
    setEuroPurchases((current) => {
      const exists = current.some((purchase) => purchase.id === item.id);

      if (exists) {
        return current.map((purchase) =>
          purchase.id === item.id ? item : purchase
        );
      }

      return [item, ...current];
    });

    setEditingItem(null);
  }

  function handleDelete(item) {
    const confirmDelete = window.confirm(
      `Excluir compra de ${formatEURWithCents(item.amountEUR)}?`
    );

    if (!confirmDelete) return;

    setEuroPurchases((current) =>
      current.filter((purchase) => purchase.id !== item.id)
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Compra de euros"
        title="Controle dos euros comprados"
        description="Registre apenas euros comprados para a Espanha. Aqui não entra gasto comum, cartão ou financeiro geral."
      />

      <section className="stats-grid">
        <StatCard
          label="Euros comprados"
          value={formatEUR(summary.totalEUR)}
          helper={`Meta: ${formatEUR(plan.goalEUR)}`}
        />

        <StatCard
          label="Valor pago"
          value={formatBRL(summary.totalBRL)}
          helper="Total pago em reais"
        />

        <StatCard
          label="Cotação média"
          value={
            summary.averageRate > 0
              ? formatBRLWithCents(summary.averageRate)
              : "R$ 0,00"
          }
          helper={`Base atual: ${formatBRLWithCents(plan.euroRate)}`}
        />
      </section>

      <EuroForm
        editingItem={editingItem}
        euroRate={plan.euroRate}
        onSave={handleSave}
        onCancel={() => setEditingItem(null)}
      />

      <Card>
        <div className="card-title-row">
          <div>
            <span className="section-eyebrow">Histórico</span>
            <h3>Compras de euro</h3>
          </div>

          <Landmark size={22} />
        </div>

        {euroPurchases.length > 0 ? (
          <div className="record-list">
            {euroPurchases.map((item) => (
              <div className="saving-row" key={item.id}>
                <div className="saving-info">
                  <strong>{item.account}</strong>
                  <span>
                    {formatDate(item.date)} • Cotação{" "}
                    {formatBRLWithCents(item.rate)}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>

                <div className="saving-actions">
                  <div className="money-stack">
                    <strong>{formatEURWithCents(item.amountEUR)}</strong>
                    <small>{formatBRLWithCents(item.amountBRL)}</small>
                  </div>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setEditingItem(item)}
                    aria-label="Editar"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label="Excluir"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Nenhuma compra de euro cadastrada ainda. Quando comprar euro na
            Nomad, Wise ou outro banco, registre aqui.
          </p>
        )}
      </Card>
    </>
  );
}

function DocumentForm({ onSave, editingItem, onCancel }) {
  const [form, setForm] = useState({
    title: editingItem?.title || "",
    category: editingItem?.category || "",
    priority: editingItem?.priority || "Média",
    deadline: editingItem?.deadline || "",
    done: editingItem?.done || false,
    note: editingItem?.note || "",
  });

  useEffect(() => {
    setForm({
      title: editingItem?.title || "",
      category: editingItem?.category || "",
      priority: editingItem?.priority || "Média",
      deadline: editingItem?.deadline || "",
      done: editingItem?.done || false,
      note: editingItem?.note || "",
    });
  }, [editingItem]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o nome do documento.");
      return;
    }

    onSave({
      ...editingItem,
      id: editingItem?.id || Date.now(),
      title: form.title.trim(),
      category: form.category.trim() || "Geral",
      priority: form.priority,
      deadline: form.deadline,
      done: form.done,
      note: form.note.trim(),
    });

    setForm({
      title: "",
      category: "",
      priority: "Média",
      deadline: "",
      done: false,
      note: "",
    });
  }

  return (
    <Card>
      <div className="card-title-row">
        <div>
          <span className="section-eyebrow">
            {editingItem ? "Editar documento" : "Novo documento"}
          </span>
          <h3>
            {editingItem
              ? "Atualizar item do checklist"
              : "Adicionar documento"}
          </h3>
        </div>

        <FileText size={22} />
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Documento</span>
          <input
            name="title"
            value={form.title}
            placeholder="Ex: Passaporte, certidão, diploma..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <input
            name="category"
            value={form.category}
            placeholder="Ex: Identificação, civil, trabalho..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Prioridade</span>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </label>

        <label className="field">
          <span>Prazo</span>
          <input
            name="deadline"
            value={form.deadline}
            type="date"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full checkbox-field">
          <input
            name="done"
            checked={form.done}
            type="checkbox"
            onChange={handleChange}
          />
          <span>Marcar como concluído</span>
        </label>

        <label className="field field-full">
          <span>Observação</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            placeholder="Ex: precisa atualizar, apostilar, traduzir ou separar cópia."
            onChange={handleChange}
          />
        </label>

        <div className="form-actions field-full">
          {editingItem && (
            <button className="button ghost" type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}

          <button className="button primary" type="submit">
            {editingItem ? "Salvar alteração" : "Adicionar documento"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function DocumentosPage({ documents, setDocuments }) {
  const [editingItem, setEditingItem] = useState(null);

  const summary = useMemo(() => {
    return getDocumentsSummary(documents);
  }, [documents]);

  const sortedDocuments = useMemo(() => {
    const priorityOrder = {
      Alta: 1,
      Média: 2,
      Baixa: 3,
    };

    return [...documents].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }

      return (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9);
    });
  }, [documents]);

  function handleSave(item) {
    setDocuments((current) => {
      const exists = current.some((document) => document.id === item.id);

      if (exists) {
        return current.map((document) =>
          document.id === item.id ? item : document
        );
      }

      return [item, ...current];
    });

    setEditingItem(null);
  }

  function handleDelete(item) {
    const confirmDelete = window.confirm(`Excluir "${item.title}"?`);

    if (!confirmDelete) return;

    setDocuments((current) =>
      current.filter((document) => document.id !== item.id)
    );
  }

  function toggleDone(item) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === item.id
          ? {
              ...document,
              done: !document.done,
            }
          : document
      )
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title="Checklist da imigração"
        description="Organize documentos, comprovantes e pendências importantes para a Espanha."
      />

      <section className="stats-grid">
        <StatCard
          label="Progresso"
          value={`${Math.round(summary.progress)}%`}
          helper={`${summary.done} de ${summary.total} concluídos`}
        />

        <StatCard
          label="Pendentes"
          value={String(summary.pending)}
          helper="Itens que ainda precisam andar"
        />

        <StatCard
          label="Concluídos"
          value={String(summary.done)}
          helper="Documentos já resolvidos"
        />
      </section>

      <Card>
        <span className="section-eyebrow">Progresso documental</span>
        <div style={{ marginTop: 14 }}>
          <ProgressBar value={summary.progress} />
        </div>
      </Card>

      <DocumentForm
        editingItem={editingItem}
        onSave={handleSave}
        onCancel={() => setEditingItem(null)}
      />

      <Card>
        <div className="card-title-row">
          <div>
            <span className="section-eyebrow">Checklist</span>
            <h3>Documentos cadastrados</h3>
          </div>

          <FileText size={22} />
        </div>

        {sortedDocuments.length > 0 ? (
          <div className="record-list">
            {sortedDocuments.map((item) => (
              <div
                className={item.done ? "document-row done" : "document-row"}
                key={item.id}
              >
                <button
                  className={item.done ? "check-button checked" : "check-button"}
                  type="button"
                  onClick={() => toggleDone(item)}
                  aria-label="Marcar documento"
                >
                  <CheckCircle2 size={19} />
                </button>

                <div className="saving-info">
                  <strong>{item.title}</strong>
                  <span>
                    {item.category || "Geral"} • Prioridade {item.priority}
                    {item.deadline ? ` • Prazo ${formatDate(item.deadline)}` : ""}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>

                <div className="document-actions">
                  <strong className={item.done ? "success" : "warning"}>
                    {item.done ? "Concluído" : "Pendente"}
                  </strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setEditingItem(item)}
                    aria-label="Editar"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label="Excluir"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Nenhum documento cadastrado ainda. Adicione o primeiro item do seu
            checklist da Espanha.
          </p>
        )}
      </Card>
    </>
  );
}

function PlanForm({ plan, setPlan }) {
  const [form, setForm] = useState({
    city: plan.city || "",
    country: plan.country || "Espanha",
    targetDate: plan.targetDate || "",
    goalBRL: String(plan.goalBRL || ""),
    goalEUR: String(plan.goalEUR || ""),
    euroRate: String(plan.euroRate || "").replace(".", ","),
    note: plan.note || "",
  });

  useEffect(() => {
    setForm({
      city: plan.city || "",
      country: plan.country || "Espanha",
      targetDate: plan.targetDate || "",
      goalBRL: String(plan.goalBRL || ""),
      goalEUR: String(plan.goalEUR || ""),
      euroRate: String(plan.euroRate || "").replace(".", ","),
      note: plan.note || "",
    });
  }, [plan]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const goalBRL = parseMoney(form.goalBRL);
    const goalEUR = parseMoney(form.goalEUR);
    const euroRate = parseMoney(form.euroRate);

    if (!form.city.trim()) {
      alert("Informe a cidade desejada.");
      return;
    }

    if (goalBRL <= 0) {
      alert("Informe uma meta em reais maior que zero.");
      return;
    }

    if (euroRate <= 0) {
      alert("Informe uma cotação base válida.");
      return;
    }

    setPlan((current) => ({
      ...current,
      city: form.city.trim(),
      country: form.country.trim() || "Espanha",
      targetDate: form.targetDate,
      goalBRL,
      goalEUR,
      euroRate,
      note: form.note.trim(),
    }));

    alert("Plano atualizado.");
  }

  return (
    <Card>
      <div className="card-title-row">
        <div>
          <span className="section-eyebrow">Plano principal</span>
          <h3>Editar estratégia da mudança</h3>
        </div>

        <Save size={22} />
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Cidade desejada</span>
          <input
            name="city"
            value={form.city}
            placeholder="Ex: Valência, Madrid, Barcelona..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>País</span>
          <input
            name="country"
            value={form.country}
            placeholder="Espanha"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Data-alvo</span>
          <input
            name="targetDate"
            value={form.targetDate}
            type="date"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Meta em reais</span>
          <input
            name="goalBRL"
            value={form.goalBRL}
            inputMode="decimal"
            placeholder="60000"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Meta em euros</span>
          <input
            name="goalEUR"
            value={form.goalEUR}
            inputMode="decimal"
            placeholder="7000"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Cotação base</span>
          <input
            name="euroRate"
            value={form.euroRate}
            inputMode="decimal"
            placeholder="5,90"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full">
          <span>Observação do plano</span>
          <textarea
            name="note"
            value={form.note}
            rows={4}
            placeholder="Ex: objetivo, motivo da mudança, estratégia financeira..."
            onChange={handleChange}
          />
        </label>

        <div className="form-actions field-full">
          <button className="button primary" type="submit">
            Salvar plano
          </button>
        </div>
      </form>
    </Card>
  );
}

function StepForm({ onSave }) {
  const [form, setForm] = useState({
    title: "",
    note: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Informe o nome da etapa.");
      return;
    }

    onSave({
      id: Date.now(),
      title: form.title.trim(),
      note: form.note.trim(),
      done: false,
    });

    setForm({
      title: "",
      note: "",
    });
  }

  return (
    <Card>
      <div className="card-title-row">
        <div>
          <span className="section-eyebrow">Nova etapa</span>
          <h3>Adicionar passo do plano</h3>
        </div>

        <Plus size={22} />
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Etapa</span>
          <input
            name="title"
            value={form.title}
            placeholder="Ex: pesquisar aluguel inicial"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full">
          <span>Observação</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            placeholder="Ex: o que precisa ser feito nesta etapa."
            onChange={handleChange}
          />
        </label>

        <div className="form-actions field-full">
          <button className="button primary" type="submit">
            Adicionar etapa
          </button>
        </div>
      </form>
    </Card>
  );
}

function PlanoPage({ plan, setPlan }) {
  const summary = useMemo(() => {
    return getStepsSummary(plan.steps || []);
  }, [plan.steps]);

  function addStep(step) {
    setPlan((current) => ({
      ...current,
      steps: [step, ...(current.steps || [])],
    }));
  }

  function toggleStep(step) {
    setPlan((current) => ({
      ...current,
      steps: (current.steps || []).map((item) =>
        item.id === step.id ? { ...item, done: !item.done } : item
      ),
    }));
  }

  function deleteStep(step) {
    const confirmDelete = window.confirm(`Excluir etapa "${step.title}"?`);

    if (!confirmDelete) return;

    setPlan((current) => ({
      ...current,
      steps: (current.steps || []).filter((item) => item.id !== step.id),
    }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Plano Espanha"
        title="Estratégia da mudança"
        description="Defina cidade, data-alvo, meta financeira, cotação base e etapas principais da imigração."
      />

      <section className="stats-grid">
        <StatCard
          label="Destino"
          value={plan.city}
          helper={plan.country || "Espanha"}
        />

        <StatCard
          label="Data-alvo"
          value={formatMonthYear(plan.targetDate)}
          helper="Previsão da mudança"
        />

        <StatCard
          label="Etapas"
          value={`${Math.round(summary.progress)}%`}
          helper={`${summary.done} de ${summary.total} concluídas`}
        />
      </section>

      <section className="content-grid">
        <Card>
          <span className="section-eyebrow">Metas</span>

          <div className="record-list">
            <div className="record-row">
              <span>Meta em reais</span>
              <strong>{formatBRL(plan.goalBRL)}</strong>
            </div>

            <div className="record-row">
              <span>Meta em euros</span>
              <strong>{formatEUR(plan.goalEUR)}</strong>
            </div>

            <div className="record-row">
              <span>Cotação base</span>
              <strong>{formatBRLWithCents(plan.euroRate)}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <span className="section-eyebrow">Observação</span>
          <p className="muted">{plan.note || "Nenhuma observação cadastrada."}</p>
        </Card>
      </section>

      <Card>
        <span className="section-eyebrow">Progresso das etapas</span>
        <div style={{ marginTop: 14 }}>
          <ProgressBar value={summary.progress} />
        </div>
      </Card>

      <PlanForm plan={plan} setPlan={setPlan} />

      <StepForm onSave={addStep} />

      <Card>
        <div className="card-title-row">
          <div>
            <span className="section-eyebrow">Etapas principais</span>
            <h3>Checklist do plano</h3>
          </div>

          <Plane size={22} />
        </div>

        {(plan.steps || []).length > 0 ? (
          <div className="record-list">
            {(plan.steps || []).map((step) => (
              <div
                className={step.done ? "document-row done" : "document-row"}
                key={step.id}
              >
                <button
                  className={step.done ? "check-button checked" : "check-button"}
                  type="button"
                  onClick={() => toggleStep(step)}
                  aria-label="Marcar etapa"
                >
                  <CheckCircle2 size={19} />
                </button>

                <div className="saving-info">
                  <strong>{step.title}</strong>
                  {step.note && <small>{step.note}</small>}
                </div>

                <div className="document-actions">
                  <strong className={step.done ? "success" : "warning"}>
                    {step.done ? "Concluído" : "Pendente"}
                  </strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => deleteStep(step)}
                    aria-label="Excluir"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Nenhuma etapa cadastrada ainda. Adicione os próximos passos do plano.
          </p>
        )}
      </Card>
    </>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("inicio");

  const [savings, setSavings] = useState(() =>
    loadFromStorage(STORAGE_KEYS.savings, defaultSavings)
  );

  const [euroPurchases, setEuroPurchases] = useState(() =>
    loadFromStorage(STORAGE_KEYS.euroPurchases, defaultEuroPurchases)
  );

  const [documents, setDocuments] = useState(() =>
    loadFromStorage(STORAGE_KEYS.documents, defaultDocuments)
  );

  const [plan, setPlan] = useState(() =>
    loadFromStorage(STORAGE_KEYS.plan, defaultPlan)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.savings, savings);
  }, [savings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.euroPurchases, euroPurchases);
  }, [euroPurchases]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.documents, documents);
  }, [documents]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.plan, plan);
  }, [plan]);

  function renderPage() {
    if (activePage === "reserva") {
      return <ReservaPage savings={savings} setSavings={setSavings} plan={plan} />;
    }

    if (activePage === "euros") {
      return (
        <EurosPage
          euroPurchases={euroPurchases}
          setEuroPurchases={setEuroPurchases}
          plan={plan}
        />
      );
    }

    if (activePage === "documentos") {
      return (
        <DocumentosPage documents={documents} setDocuments={setDocuments} />
      );
    }

    if (activePage === "plano") {
      return <PlanoPage plan={plan} setPlan={setPlan} />;
    }

    return (
      <Dashboard
        savings={savings}
        euroPurchases={euroPurchases}
        documents={documents}
        plan={plan}
      />
    );
  }

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </AppShell>
  );
}