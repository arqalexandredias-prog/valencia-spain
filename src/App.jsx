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
  Trash2,
  Wallet,
} from "lucide-react";

const STORAGE_KEYS = {
  savings: "valencia_spain_savings_v1",
  euroPurchases: "valencia_spain_euro_purchases_v1",
};

const initialData = {
  goalBRL: 60000,
  euroRate: 5.9,
  targetDate: "Abril de 2027",
  city: "Valência",
  documents: [
    { id: 1, title: "Passaporte", done: false },
    { id: 2, title: "Certidões", done: false },
    { id: 3, title: "Apostilamento", done: false },
    { id: 4, title: "Diploma / histórico", done: false },
    { id: 5, title: "Currículo e portfólio", done: false },
    { id: 6, title: "Comprovantes financeiros", done: false },
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

    return Array.isArray(parsed) ? parsed : fallback;
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

function getSavingsTotal(savings) {
  return savings.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getEuroSummary(euroPurchases) {
  const totalEUR = euroPurchases.reduce(
    (sum, item) => sum + Number(item.amountEUR || 0),
    0
  );

  const totalBRL = euroPurchases.reduce(
    (sum, item) => sum + Number(item.amountBRL || 0),
    0
  );

  const averageRate = totalEUR > 0 ? totalBRL / totalEUR : 0;
  const currentValueBRL = totalEUR * initialData.euroRate;

  return {
    totalEUR,
    totalBRL,
    averageRate,
    currentValueBRL,
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

function Dashboard({ savings, euroPurchases }) {
  const data = initialData;

  const summary = useMemo(() => {
    const savedBRL = getSavingsTotal(savings);
    const euroSummary = getEuroSummary(euroPurchases);

    const totalSaved = savedBRL + euroSummary.currentValueBRL;
    const missing = Math.max(data.goalBRL - totalSaved, 0);
    const progress = data.goalBRL > 0 ? (totalSaved / data.goalBRL) * 100 : 0;

    const doneDocs = data.documents.filter((doc) => doc.done).length;
    const docsProgress =
      data.documents.length > 0 ? (doneDocs / data.documents.length) * 100 : 0;

    return {
      savedBRL,
      totalSaved,
      missing,
      progress,
      doneDocs,
      docsProgress,
      ...euroSummary,
    };
  }, [data, savings, euroPurchases]);

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
          <span>Meta: {formatBRL(data.goalBRL)}</span>
          <span>Destino: {data.city}</span>
          <span>Data-alvo: {data.targetDate}</span>
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
          value={`${Math.round(summary.docsProgress)}%`}
          helper={`${summary.doneDocs} de ${data.documents.length} concluídos`}
        />
      </section>

      <section className="content-grid">
        <Card>
          <div className="card-title-row">
            <div>
              <span className="section-eyebrow">Próxima ação</span>
              <h3>Organizar os documentos essenciais</h3>
            </div>

            <CheckCircle2 size={22} />
          </div>

          <p className="muted">
            Antes de pensar em detalhes avançados, o primeiro bloco precisa ser:
            passaporte, certidões, diploma, currículo, portfólio e comprovantes
            financeiros.
          </p>
        </Card>

        <Card>
          <span className="section-eyebrow">Resumo</span>

          <div className="record-list">
            <div className="record-row">
              <span>Meta Espanha</span>
              <strong>{formatBRL(data.goalBRL)}</strong>
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

function ReservaPage({ savings, setSavings }) {
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
          value={formatBRL(initialData.goalBRL)}
          helper="Objetivo financeiro principal"
        />

        <StatCard
          label="Falta juntar"
          value={formatBRL(Math.max(initialData.goalBRL - totalSaved, 0))}
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

function EuroForm({ onSave, editingItem, onCancel }) {
  const [form, setForm] = useState({
    account: editingItem?.account || "",
    amountEUR: editingItem?.amountEUR ? String(editingItem.amountEUR) : "",
    rate: editingItem?.rate
      ? String(editingItem.rate).replace(".", ",")
      : String(initialData.euroRate).replace(".", ","),
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
        : String(initialData.euroRate).replace(".", ","),
      amountBRL: editingItem?.amountBRL ? String(editingItem.amountBRL) : "",
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
      rate: String(initialData.euroRate).replace(".", ","),
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

function EurosPage({ euroPurchases, setEuroPurchases }) {
  const [editingItem, setEditingItem] = useState(null);

  const summary = useMemo(() => {
    return getEuroSummary(euroPurchases);
  }, [euroPurchases]);

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
          helper="Total acumulado em moeda"
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
          helper="Preço médio das compras"
        />
      </section>

      <EuroForm
        editingItem={editingItem}
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

function DocumentosPage() {
  const docs = initialData.documents;

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title="Checklist da imigração"
        description="Documentos, comprovantes e pendências importantes para a Espanha."
      />

      <Card>
        <div className="record-list">
          {docs.map((doc) => (
            <div className="record-row" key={doc.id}>
              <span>{doc.title}</span>
              <strong className={doc.done ? "success" : "warning"}>
                {doc.done ? "Concluído" : "Pendente"}
              </strong>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function PlanoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Plano Espanha"
        title="Estratégia da mudança"
        description="Cidade, data-alvo, etapas e decisões importantes do plano."
      />

      <Card>
        <div className="record-list">
          <div className="record-row">
            <span>Cidade desejada</span>
            <strong>{initialData.city}</strong>
          </div>

          <div className="record-row">
            <span>Data-alvo</span>
            <strong>{initialData.targetDate}</strong>
          </div>

          <div className="record-row">
            <span>Meta financeira</span>
            <strong>{formatBRL(initialData.goalBRL)}</strong>
          </div>

          <div className="record-row">
            <span>Cotação base</span>
            <strong>{formatBRLWithCents(initialData.euroRate)}</strong>
          </div>
        </div>
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

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.savings, savings);
  }, [savings]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.euroPurchases, euroPurchases);
  }, [euroPurchases]);

  function renderPage() {
    if (activePage === "reserva") {
      return <ReservaPage savings={savings} setSavings={setSavings} />;
    }

    if (activePage === "euros") {
      return (
        <EurosPage
          euroPurchases={euroPurchases}
          setEuroPurchases={setEuroPurchases}
        />
      );
    }

    if (activePage === "documentos") return <DocumentosPage />;
    if (activePage === "plano") return <PlanoPage />;

    return <Dashboard savings={savings} euroPurchases={euroPurchases} />;
  }

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </AppShell>
  );
}