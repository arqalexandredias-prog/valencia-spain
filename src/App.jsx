import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Home,
  Landmark,
  Plane,
  Wallet,
} from "lucide-react";

const initialData = {
  goalBRL: 60000,
  savedBRL: 13000,
  euros: 0,
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

const navItems = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "reserva", label: "Reserva", icon: Wallet },
  { id: "euros", label: "Euros", icon: Landmark },
  { id: "documentos", label: "Docs", icon: FileText },
  { id: "plano", label: "Plano", icon: Plane },
];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatEUR(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function Dashboard() {
  const data = initialData;

  const summary = useMemo(() => {
    const euroValueBRL = data.euros * data.euroRate;
    const totalSaved = data.savedBRL + euroValueBRL;
    const missing = Math.max(data.goalBRL - totalSaved, 0);
    const progress = data.goalBRL > 0 ? (totalSaved / data.goalBRL) * 100 : 0;

    const doneDocs = data.documents.filter((doc) => doc.done).length;
    const docsProgress =
      data.documents.length > 0 ? (doneDocs / data.documents.length) * 100 : 0;

    return {
      totalSaved,
      missing,
      progress,
      doneDocs,
      docsProgress,
    };
  }, [data]);

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
          value={formatBRL(data.savedBRL)}
          helper="Reserva em reais para a mudança"
        />

        <StatCard
          label="Euros"
          value={formatEUR(data.euros)}
          helper={`Cotação usada: R$ ${data.euroRate.toFixed(2)}`}
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

function ReservaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reserva Espanha"
        title="Seu dinheiro para a mudança"
        description="Aqui vai entrar apenas o dinheiro separado para o plano Espanha."
      />

      <Card>
        <span className="section-eyebrow">Em breve</span>
        <h3>Cadastro da reserva</h3>
        <p className="muted">
          Próximo passo: criar campos para Nubank, Ailos, Inter, Nomad/Wise e
          outros valores guardados para a Espanha.
        </p>
      </Card>
    </>
  );
}

function EurosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Compra de euros"
        title="Controle dos euros comprados"
        description="Aqui você vai registrar quantidade de euros, cotação, valor pago e conta usada."
      />

      <Card>
        <span className="section-eyebrow">Em breve</span>
        <h3>Histórico de compras</h3>
        <p className="muted">
          A ideia é acompanhar euro comprado aos poucos, sem misturar com
          financeiro geral.
        </p>
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
        </div>
      </Card>
    </>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("inicio");

  function renderPage() {
    if (activePage === "reserva") return <ReservaPage />;
    if (activePage === "euros") return <EurosPage />;
    if (activePage === "documentos") return <DocumentosPage />;
    if (activePage === "plano") return <PlanoPage />;

    return <Dashboard />;
  }

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </AppShell>
  );
}