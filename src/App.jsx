import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
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
  X,
} from "lucide-react";

const STORAGE_KEYS = {
  savings: "valencia_spain_savings_v1",
  euroPurchases: "valencia_spain_euro_purchases_v1",
  documents: "valencia_spain_documents_v1",
  plan: "valencia_spain_plan_v1",
  costs: "valencia_spain_costs_v1",
};

const defaultPlan = {
  goalBRL: 60000,
  goalEUR: 7000,
  euroRate: 5.9,
  targetDate: "2027-04-01",
  city: "Valência",
  country: "Espanha",
  note: "",
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
      note: "Construir a reserva em reais e euros.",
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
      note: "Pesquisar aluguel, bairros e custo de vida.",
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
    note: "",
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
    note: "",
  },
  {
    id: 2,
    title: "Certidões",
    category: "Civil",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "",
  },
  {
    id: 3,
    title: "Apostilamento",
    category: "Legalização",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "",
  },
  {
    id: 4,
    title: "Diploma / histórico",
    category: "Profissional",
    priority: "Média",
    deadline: "",
    done: false,
    note: "",
  },
  {
    id: 5,
    title: "Currículo e portfólio",
    category: "Trabalho",
    priority: "Média",
    deadline: "",
    done: false,
    note: "",
  },
  {
    id: 6,
    title: "Comprovantes financeiros",
    category: "Financeiro",
    priority: "Alta",
    deadline: "",
    done: false,
    note: "",
  },
];

const defaultCosts = [
  {
    id: 1,
    title: "Passagens",
    category: "Viagem",
    amount: 8000,
    priority: "Alta",
    paid: false,
    note: "Estimativa para duas pessoas.",
  },
  {
    id: 2,
    title: "Aluguel inicial",
    category: "Moradia",
    amount: 7000,
    priority: "Alta",
    paid: false,
    note: "",
  },
  {
    id: 3,
    title: "Caução / depósito",
    category: "Moradia",
    amount: 14000,
    priority: "Alta",
    paid: false,
    note: "",
  },
  {
    id: 4,
    title: "Alimentação inicial",
    category: "Custo de vida",
    amount: 5000,
    priority: "Média",
    paid: false,
    note: "",
  },
  {
    id: 5,
    title: "Documentos",
    category: "Documentação",
    amount: 4000,
    priority: "Alta",
    paid: false,
    note: "",
  },
  {
    id: 6,
    title: "Reserva de emergência",
    category: "Segurança",
    amount: 22000,
    priority: "Alta",
    paid: false,
    note: "",
  },
];

const navItems = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "reserva", label: "Reserva", icon: Wallet },
  { id: "euros", label: "Euros", icon: Landmark },
  { id: "documentos", label: "Docs", icon: FileText },
  { id: "custos", label: "Custos", icon: Calculator },
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

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return 0;

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

  return { totalEUR, totalBRL, averageRate, currentValueBRL };
}

function getDocumentsSummary(documents) {
  const total = documents.length;
  const done = documents.filter((item) => item.done).length;
  const pending = Math.max(total - done, 0);
  const progress = total > 0 ? (done / total) * 100 : 0;

  return { total, done, pending, progress };
}

function getStepsSummary(steps = []) {
  const total = steps.length;
  const done = steps.filter((item) => item.done).length;
  const pending = Math.max(total - done, 0);
  const progress = total > 0 ? (done / total) * 100 : 0;

  return { total, done, pending, progress };
}

function getCostsSummary(costs = []) {
  const total = costs.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const paid = costs
    .filter((item) => item.paid)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pending = Math.max(total - paid, 0);
  const paidItems = costs.filter((item) => item.paid).length;
  const totalItems = costs.length;
  const progress = totalItems > 0 ? (paidItems / totalItems) * 100 : 0;

  return { total, paid, pending, totalItems, paidItems, progress };
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

function PageHeader({ eyebrow, title, right }) {
  return (
    <section className="page-header clean-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>

      {right}
    </section>
  );
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function ProgressBar({ value }) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function SummaryStrip({ items }) {
  return (
    <Card className="summary-strip">
      {items.map((item) => (
        <div className="summary-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </Card>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <Card className="metric-card">
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </Card>
  );
}

function AddButton({ children, onClick, active }) {
  return (
    <button
      className={active ? "button ghost" : "button primary"}
      type="button"
      onClick={onClick}
    >
      {active ? <X size={17} /> : <Plus size={17} />}
      {children}
    </button>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="section-title">
      <span className="section-eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
    </div>
  );
}

function Dashboard({ savings, euroPurchases, documents, plan, costs }) {
  const summary = useMemo(() => {
    const savedBRL = getSavingsTotal(savings);
    const euroSummary = getEuroSummary(euroPurchases, plan.euroRate);
    const docsSummary = getDocumentsSummary(documents);
    const costsSummary = getCostsSummary(costs);

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
      costsSummary,
      ...euroSummary,
    };
  }, [savings, euroPurchases, documents, plan, costs]);

  return (
    <>
      <PageHeader eyebrow="Plano Espanha" title="Quanto falta para ir embora?" />

      <Card className="hero-card clean-hero-card">
        <div className="hero-grid">
          <div>
            <span className="section-eyebrow">Meta principal</span>
            <h2>{Math.round(summary.progress)}%</h2>
            <p>
              <strong>{formatBRL(summary.totalSaved)}</strong> preparados
            </p>
          </div>

          <div className="hero-missing">
            <span>Falta</span>
            <strong>{formatBRL(summary.missing)}</strong>
          </div>
        </div>

        <ProgressBar value={summary.progress} />
      </Card>

      <section className="compact-metrics">
        <MetricCard
          label="Guardado"
          value={formatBRL(summary.savedBRL)}
          helper="Reserva"
        />

        <MetricCard
          label="Euros"
          value={formatEUR(summary.totalEUR)}
          helper={formatBRL(summary.currentValueBRL)}
        />

        <MetricCard
          label="Docs"
          value={`${summary.docsSummary.done}/${summary.docsSummary.total}`}
          helper={`${Math.round(summary.docsSummary.progress)}%`}
        />

        <MetricCard
          label="Custos"
          value={formatBRL(summary.costsSummary.total)}
          helper="Estimativa"
        />
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

    if (!form.title.trim()) return alert("Informe um nome.");
    if (amount <= 0) return alert("Informe um valor maior que zero.");

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
      <SectionTitle
        eyebrow={editingItem ? "Editar" : "Novo"}
        title={editingItem ? "Atualizar reserva" : "Adicionar reserva"}
      />

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome</span>
          <input
            name="title"
            value={form.title}
            placeholder="Nubank, Ailos, Inter..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Local</span>
          <input
            name="place"
            value={form.place}
            placeholder="Caixinha, CDB, conta..."
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
          <span>Obs.</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
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
            Salvar
          </button>
        </div>
      </form>
    </Card>
  );
}

function ReservaPage({ savings, setSavings, plan }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const totalSaved = useMemo(() => getSavingsTotal(savings), [savings]);
  const missing = Math.max(Number(plan.goalBRL || 0) - totalSaved, 0);

  function handleSave(item) {
    setSavings((current) => {
      const exists = current.some((saving) => saving.id === item.id);

      if (exists) {
        return current.map((saving) => (saving.id === item.id ? item : saving));
      }

      return [item, ...current];
    });

    setEditingItem(null);
    setShowForm(false);
  }

  function handleDelete(item) {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;

    setSavings((current) => current.filter((saving) => saving.id !== item.id));
  }

  function handleEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Reserva"
        title={formatBRL(totalSaved)}
        right={
          <AddButton
            active={showForm}
            onClick={() => {
              setEditingItem(null);
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Fechar" : "Adicionar"}
          </AddButton>
        }
      />

      <SummaryStrip
        items={[
          { label: "Meta", value: formatBRL(plan.goalBRL) },
          { label: "Falta", value: formatBRL(missing) },
        ]}
      />

      {showForm && (
        <SavingsForm
          editingItem={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setEditingItem(null);
            setShowForm(false);
          }}
        />
      )}

      <Card>
        <SectionTitle eyebrow="Lista" title="Valores guardados" />

        {savings.length > 0 ? (
          <div className="record-list">
            {savings.map((item) => (
              <div className="saving-row" key={item.id}>
                <div className="saving-info">
                  <strong>{item.title}</strong>
                  <span>
                    {item.place || "Sem local"} · {formatDate(item.date)}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>

                <div className="saving-actions">
                  <strong>{formatBRL(item.amount)}</strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum valor cadastrado.</p>
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

    if (amountEUR <= 0) return alert("Informe os euros.");
    if (rate <= 0) return alert("Informe a cotação.");

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
      <SectionTitle
        eyebrow={editingItem ? "Editar" : "Novo"}
        title={editingItem ? "Atualizar compra" : "Adicionar euros"}
      />

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Conta</span>
          <input
            name="account"
            value={form.account}
            placeholder="Nomad, Wise..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Euros</span>
          <input
            name="amountEUR"
            value={form.amountEUR}
            inputMode="decimal"
            placeholder="100"
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
          <span>Pago em R$</span>
          <input
            name="amountBRL"
            value={form.amountBRL}
            inputMode="decimal"
            placeholder="Opcional"
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
          <span>Obs.</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            onChange={handleChange}
          />
        </label>

        <SummaryStrip
          items={[
            { label: "Euros", value: formatEURWithCents(preview.amountEUR) },
            { label: "Cotação", value: formatBRLWithCents(preview.rate) },
            { label: "Total", value: formatBRLWithCents(preview.amountBRL) },
          ]}
        />

        <div className="form-actions field-full">
          {editingItem && (
            <button className="button ghost" type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}

          <button className="button primary" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </Card>
  );
}

function EurosPage({ euroPurchases, setEuroPurchases, plan }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const summary = useMemo(
    () => getEuroSummary(euroPurchases, plan.euroRate),
    [euroPurchases, plan.euroRate]
  );

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
    setShowForm(false);
  }

  function handleDelete(item) {
    if (!window.confirm(`Excluir ${formatEURWithCents(item.amountEUR)}?`)) return;

    setEuroPurchases((current) =>
      current.filter((purchase) => purchase.id !== item.id)
    );
  }

  function handleEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Euros"
        title={formatEUR(summary.totalEUR)}
        right={
          <AddButton
            active={showForm}
            onClick={() => {
              setEditingItem(null);
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Fechar" : "Adicionar"}
          </AddButton>
        }
      />

      <SummaryStrip
        items={[
          { label: "Pago", value: formatBRL(summary.totalBRL) },
          {
            label: "Média",
            value:
              summary.averageRate > 0
                ? formatBRLWithCents(summary.averageRate)
                : "R$ 0,00",
          },
          { label: "Meta", value: formatEUR(plan.goalEUR) },
        ]}
      />

      {showForm && (
        <EuroForm
          editingItem={editingItem}
          euroRate={plan.euroRate}
          onSave={handleSave}
          onCancel={() => {
            setEditingItem(null);
            setShowForm(false);
          }}
        />
      )}

      <Card>
        <SectionTitle eyebrow="Histórico" title="Compras" />

        {euroPurchases.length > 0 ? (
          <div className="record-list">
            {euroPurchases.map((item) => (
              <div className="saving-row" key={item.id}>
                <div className="saving-info">
                  <strong>{item.account}</strong>
                  <span>
                    {formatDate(item.date)} · {formatBRLWithCents(item.rate)}
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
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhuma compra cadastrada.</p>
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

    if (!form.title.trim()) return alert("Informe o documento.");

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
      <SectionTitle
        eyebrow={editingItem ? "Editar" : "Novo"}
        title={editingItem ? "Atualizar documento" : "Adicionar documento"}
      />

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Documento</span>
          <input
            name="title"
            value={form.title}
            placeholder="Passaporte, certidão..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <input
            name="category"
            value={form.category}
            placeholder="Identificação, trabalho..."
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
          <span>Concluído</span>
        </label>

        <label className="field field-full">
          <span>Obs.</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
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
            Salvar
          </button>
        </div>
      </form>
    </Card>
  );
}

function DocumentosPage({ documents, setDocuments }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const summary = useMemo(() => getDocumentsSummary(documents), [documents]);

  const sortedDocuments = useMemo(() => {
    const priorityOrder = { Alta: 1, Média: 2, Baixa: 3 };

    return [...documents].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
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
    setShowForm(false);
  }

  function handleDelete(item) {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;

    setDocuments((current) =>
      current.filter((document) => document.id !== item.id)
    );
  }

  function toggleDone(item) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === item.id
          ? { ...document, done: !document.done }
          : document
      )
    );
  }

  function handleEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title={`${summary.done}/${summary.total}`}
        right={
          <AddButton
            active={showForm}
            onClick={() => {
              setEditingItem(null);
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Fechar" : "Adicionar"}
          </AddButton>
        }
      />

      <Card className="compact-progress-card">
        <ProgressBar value={summary.progress} />
      </Card>

      {showForm && (
        <DocumentForm
          editingItem={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setEditingItem(null);
            setShowForm(false);
          }}
        />
      )}

      <Card>
        <SectionTitle eyebrow="Checklist" title="Documentos" />

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
                >
                  <CheckCircle2 size={19} />
                </button>

                <div className="saving-info">
                  <strong>{item.title}</strong>
                  <span>
                    {item.category || "Geral"} · {item.priority}
                    {item.deadline ? ` · ${formatDate(item.deadline)}` : ""}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>

                <div className="document-actions">
                  <strong className={item.done ? "success" : "warning"}>
                    {item.done ? "OK" : "Pendente"}
                  </strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum documento cadastrado.</p>
        )}
      </Card>
    </>
  );
}

function CostForm({ onSave, editingItem, onCancel }) {
  const [form, setForm] = useState({
    title: editingItem?.title || "",
    category: editingItem?.category || "",
    amount: editingItem?.amount ? String(editingItem.amount) : "",
    priority: editingItem?.priority || "Média",
    paid: editingItem?.paid || false,
    note: editingItem?.note || "",
  });

  useEffect(() => {
    setForm({
      title: editingItem?.title || "",
      category: editingItem?.category || "",
      amount: editingItem?.amount ? String(editingItem.amount) : "",
      priority: editingItem?.priority || "Média",
      paid: editingItem?.paid || false,
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

    const amount = parseMoney(form.amount);

    if (!form.title.trim()) return alert("Informe o custo.");
    if (amount <= 0) return alert("Informe um valor maior que zero.");

    onSave({
      ...editingItem,
      id: editingItem?.id || Date.now(),
      title: form.title.trim(),
      category: form.category.trim() || "Geral",
      amount,
      priority: form.priority,
      paid: form.paid,
      note: form.note.trim(),
    });

    setForm({
      title: "",
      category: "",
      amount: "",
      priority: "Média",
      paid: false,
      note: "",
    });
  }

  return (
    <Card>
      <SectionTitle
        eyebrow={editingItem ? "Editar" : "Novo"}
        title={editingItem ? "Atualizar custo" : "Adicionar custo"}
      />

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Custo</span>
          <input
            name="title"
            value={form.title}
            placeholder="Passagem, caução..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <input
            name="category"
            value={form.category}
            placeholder="Moradia, viagem..."
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Valor</span>
          <input
            name="amount"
            value={form.amount}
            inputMode="decimal"
            placeholder="8000"
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

        <label className="field field-full checkbox-field">
          <input
            name="paid"
            checked={form.paid}
            type="checkbox"
            onChange={handleChange}
          />
          <span>Resolvido</span>
        </label>

        <label className="field field-full">
          <span>Obs.</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
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
            Salvar
          </button>
        </div>
      </form>
    </Card>
  );
}

function CustosPage({ costs, setCosts, plan }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const summary = useMemo(() => getCostsSummary(costs), [costs]);

  const sortedCosts = useMemo(() => {
    const priorityOrder = { Alta: 1, Média: 2, Baixa: 3 };

    return [...costs].sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;
      return (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9);
    });
  }, [costs]);

  function handleSave(item) {
    setCosts((current) => {
      const exists = current.some((cost) => cost.id === item.id);

      if (exists) {
        return current.map((cost) => (cost.id === item.id ? item : cost));
      }

      return [item, ...current];
    });

    setEditingItem(null);
    setShowForm(false);
  }

  function handleDelete(item) {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;

    setCosts((current) => current.filter((cost) => cost.id !== item.id));
  }

  function togglePaid(item) {
    setCosts((current) =>
      current.map((cost) =>
        cost.id === item.id ? { ...cost, paid: !cost.paid } : cost
      )
    );
  }

  function handleEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Custos"
        title={formatBRL(summary.total)}
        right={
          <AddButton
            active={showForm}
            onClick={() => {
              setEditingItem(null);
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Fechar" : "Adicionar"}
          </AddButton>
        }
      />

      <SummaryStrip
        items={[
          { label: "Meta", value: formatBRL(plan.goalBRL) },
          {
            label: "Diferença",
            value: formatBRL(Number(plan.goalBRL || 0) - summary.total),
          },
          { label: "Resolvido", value: formatBRL(summary.paid) },
        ]}
      />

      {showForm && (
        <CostForm
          editingItem={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setEditingItem(null);
            setShowForm(false);
          }}
        />
      )}

      <Card>
        <SectionTitle eyebrow="Lista" title="Estimativa" />

        {sortedCosts.length > 0 ? (
          <div className="record-list">
            {sortedCosts.map((item) => (
              <div
                className={item.paid ? "document-row done" : "document-row"}
                key={item.id}
              >
                <button
                  className={item.paid ? "check-button checked" : "check-button"}
                  type="button"
                  onClick={() => togglePaid(item)}
                >
                  <CheckCircle2 size={19} />
                </button>

                <div className="saving-info">
                  <strong>{item.title}</strong>
                  <span>
                    {item.category || "Geral"} · {item.priority}
                  </span>
                  {item.note && <small>{item.note}</small>}
                </div>

                <div className="document-actions">
                  <strong>{formatBRL(item.amount)}</strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum custo cadastrado.</p>
        )}
      </Card>
    </>
  );
}

function PlanForm({ plan, setPlan, onDone }) {
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

    if (!form.city.trim()) return alert("Informe a cidade.");
    if (goalBRL <= 0) return alert("Informe a meta.");
    if (euroRate <= 0) return alert("Informe a cotação.");

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

    onDone();
  }

  return (
    <Card>
      <SectionTitle eyebrow="Plano" title="Editar" />

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Cidade</span>
          <input name="city" value={form.city} onChange={handleChange} />
        </label>

        <label className="field">
          <span>País</span>
          <input name="country" value={form.country} onChange={handleChange} />
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
          <span>Meta R$</span>
          <input
            name="goalBRL"
            value={form.goalBRL}
            inputMode="decimal"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Meta €</span>
          <input
            name="goalEUR"
            value={form.goalEUR}
            inputMode="decimal"
            onChange={handleChange}
          />
        </label>

        <label className="field">
          <span>Cotação</span>
          <input
            name="euroRate"
            value={form.euroRate}
            inputMode="decimal"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full">
          <span>Obs.</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            onChange={handleChange}
          />
        </label>

        <div className="form-actions field-full">
          <button className="button primary" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </Card>
  );
}

function StepForm({ onSave, onDone }) {
  const [form, setForm] = useState({ title: "", note: "" });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) return alert("Informe a etapa.");

    onSave({
      id: Date.now(),
      title: form.title.trim(),
      note: form.note.trim(),
      done: false,
    });

    setForm({ title: "", note: "" });
    onDone();
  }

  return (
    <Card>
      <SectionTitle eyebrow="Etapa" title="Adicionar" />

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Etapa</span>
          <input
            name="title"
            value={form.title}
            placeholder="Pesquisar aluguel"
            onChange={handleChange}
          />
        </label>

        <label className="field field-full">
          <span>Obs.</span>
          <textarea
            name="note"
            value={form.note}
            rows={3}
            onChange={handleChange}
          />
        </label>

        <div className="form-actions field-full">
          <button className="button primary" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </Card>
  );
}

function PlanoPage({ plan, setPlan }) {
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);

  const summary = useMemo(() => getStepsSummary(plan.steps || []), [plan.steps]);

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
    if (!window.confirm(`Excluir "${step.title}"?`)) return;

    setPlan((current) => ({
      ...current,
      steps: (current.steps || []).filter((item) => item.id !== step.id),
    }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Plano"
        title={plan.city}
        right={
          <AddButton
            active={showPlanForm}
            onClick={() => setShowPlanForm((current) => !current)}
          >
            {showPlanForm ? "Fechar" : "Editar"}
          </AddButton>
        }
      />

      <SummaryStrip
        items={[
          { label: "Data", value: formatMonthYear(plan.targetDate) },
          { label: "Meta", value: formatBRL(plan.goalBRL) },
          { label: "Etapas", value: `${summary.done}/${summary.total}` },
        ]}
      />

      {showPlanForm && (
        <PlanForm
          plan={plan}
          setPlan={setPlan}
          onDone={() => setShowPlanForm(false)}
        />
      )}

      <div className="toolbar-row">
        <SectionTitle eyebrow="Checklist" title="Etapas" />

        <AddButton
          active={showStepForm}
          onClick={() => setShowStepForm((current) => !current)}
        >
          {showStepForm ? "Fechar" : "Adicionar"}
        </AddButton>
      </div>

      {showStepForm && (
        <StepForm onSave={addStep} onDone={() => setShowStepForm(false)} />
      )}

      <Card>
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
                >
                  <CheckCircle2 size={19} />
                </button>

                <div className="saving-info">
                  <strong>{step.title}</strong>
                  {step.note && <small>{step.note}</small>}
                </div>

                <div className="document-actions">
                  <strong className={step.done ? "success" : "warning"}>
                    {step.done ? "OK" : "Pendente"}
                  </strong>

                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => deleteStep(step)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhuma etapa cadastrada.</p>
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

  const [costs, setCosts] = useState(() =>
    loadFromStorage(STORAGE_KEYS.costs, defaultCosts)
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
    saveToStorage(STORAGE_KEYS.costs, costs);
  }, [costs]);

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

    if (activePage === "custos") {
      return <CustosPage costs={costs} setCosts={setCosts} plan={plan} />;
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
        costs={costs}
      />
    );
  }

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </AppShell>
  );
}