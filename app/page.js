'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  COMPANIES,
  COMPANY_ORDER,
  COMPANY_ICONS,
  COMPANY_HEADER_LOGOS,
  COMPANY_HEADER_THEME,
  COMPANY_ACCENT,
  COMPANY_LOGO_HEIGHT,
} from '@/lib/companies';
import {
  FIELDS,
  SUGGESTED_FIELDS,
  SUGGESTED_FIELDS_GLOBAL,
  EXPORT_HEADER_MAP,
  ALERT_COLORS,
  STATUS_COLORS,
  argb,
  computeAlert,
  fmtValor,
  fmtDate,
  parseDate,
  parseValorNum,
  rowToContract,
  dataToRow,
  uniqueVals,
  uniqueValsAllCompanies,
  rowsToContracts,
  parseCSV,
} from '@/lib/contracts';

const EMPTY_FORM = FIELDS.reduce((acc, f) => {
  acc[f] = '';
  return acc;
}, {});

export default function ControleContratosPage() {
  // ---------- Dados: por empresa, com fallback embutido pra quando o Supabase falhar ----------
  const [companyStore, setCompanyStore] = useState(() => {
    const store = {};
    COMPANY_ORDER.forEach((k) => {
      store[k] = JSON.parse(JSON.stringify(COMPANIES[k].data));
    });
    return store;
  });
  const [activeCompany, setActiveCompany] = useState('agrobiotech');
  const [loading, setLoading] = useState(true);
  const [supabaseOnline, setSupabaseOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState(''); // '', 'saving', 'saved', 'error', 'offline'

  // ---------- Login ----------
  // session === undefined: ainda verificando se já existe sessão salva (localStorage).
  // session === null: ninguém logado -> mostra tela de login.
  // session === {...}: usuário autenticado -> mostra o sistema.
  const [session, setSession] = useState(undefined);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(ev) {
    ev.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoginBusy(false);
    if (error) {
      setLoginError('E-mail ou senha inválidos.');
      return;
    }
    setLoginPassword('');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const [activeCard, setActiveCard] = useState('');
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fAlerta, setFAlerta] = useState('');
  const [fResp, setFResp] = useState('');

  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const companyMenuRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [savingForm, setSavingForm] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const fileInputRef = useRef(null);

  const contracts = useMemo(
    () => companyStore[activeCompany] || [],
    [companyStore, activeCompany]
  );

  // ---------- Carregamento inicial: Supabase, com fallback pros dados embutidos ----------
  // Se a leitura falhar (sem internet, tabela ainda não criada, chave errada, Supabase fora do
  // ar), caímos no snapshot embutido (modo leitura, com aviso na tela) pra pessoa nunca ver a
  // tela em branco - mas nesse modo nada que ela fizer é salvo de verdade.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function initData() {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const byCompany = {};
        COMPANY_ORDER.forEach((k) => {
          byCompany[k] = [];
        });
        data.forEach((row) => {
          if (byCompany[row.company]) byCompany[row.company].push(rowToContract(row));
        });
        setCompanyStore(byCompany);
        setSupabaseOnline(true);
        setSyncStatus('saved');
      } catch (err) {
        console.error(
          'Não foi possível carregar do Supabase, usando os dados salvos neste arquivo:',
          err
        );
        if (cancelled) return;
        setSupabaseOnline(false);
        setSyncStatus('offline');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    initData();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // ---------- Fechar o menu "Trocar de empresa" ao clicar fora ----------
  // Nota: no Next.js o React delega os eventos a partir do próprio `document` (diferente do
  // app single-file original, onde o botão e este listener ficavam em nós diferentes da árvore
  // e `stopPropagation()` bastava). Por isso, além de checar se o clique foi fora do menu,
  // ignoramos explicitamente cliques no próprio botão que abre/fecha o menu - senão o mesmo
  // clique que abre o menu (via onClick do botão) também cai neste listener e fecha na hora.
  useEffect(() => {
    function onDocClick(ev) {
      if (ev.target.closest('.company-menu-btn')) return;
      if (companyMenuRef.current && !companyMenuRef.current.contains(ev.target)) {
        setCompanyMenuOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function updateContracts(company, updater) {
    setCompanyStore((prev) => ({ ...prev, [company]: updater(prev[company] || []) }));
  }

  function switchCompany(key) {
    if (!COMPANIES[key] || key === activeCompany) {
      setCompanyMenuOpen(false);
      return;
    }
    setActiveCompany(key);
    setActiveCard('');
    setEditingId(null);
    setSearch('');
    setFStatus('');
    setFAlerta('');
    setFResp('');
    setCompanyMenuOpen(false);
  }

  // ---------- Formulário: sugestões (autocomplete) ----------
  const suggestedOptions = useMemo(() => {
    const opts = {};
    SUGGESTED_FIELDS.forEach(([key, listId]) => {
      opts[listId] = uniqueVals(contracts, key);
    });
    SUGGESTED_FIELDS_GLOBAL.forEach(([key, listId]) => {
      opts[listId] = uniqueValsAllCompanies(companyStore, COMPANY_ORDER, key);
    });
    return opts;
  }, [contracts, companyStore]);

  function openNew() {
    setEditingId(null);
    const existingOrigem = uniqueVals(contracts, 'origem');
    const preferredDefault = existingOrigem.includes('Controle de Contratos')
      ? 'Controle de Contratos'
      : existingOrigem[0] || 'Controle de Contratos';
    setFormData({ ...EMPTY_FORM, status: 'Ativo', assinado: 'Sim', origem: preferredDefault });
    setFormOpen(true);
  }
  function openEdit(id) {
    const c = contracts.find((x) => x.id === id);
    if (!c) return;
    setEditingId(id);
    const data = {};
    FIELDS.forEach((f) => {
      if (f === 'dataInicio') {
        const d = parseDate(c.dataInicio);
        data[f] = d ? d.toISOString().slice(0, 10) : '';
      } else {
        data[f] = c[f] || '';
      }
    });
    setFormData(data);
    setFormOpen(true);
  }
  function setField(f, v) {
    setFormData((prev) => ({ ...prev, [f]: v }));
  }

  async function handleSaveForm() {
    const empresa = (formData.empresaContratada || '').trim();
    if (!empresa) {
      alert('Informe a Empresa Contratada.');
      return;
    }
    const data = {};
    FIELDS.forEach((f) => {
      data[f] = (formData[f] || '').trim();
    });

    setSavingForm(true);
    if (supabaseOnline) setSyncStatus('saving');
    try {
      if (editingId) {
        if (supabaseOnline) {
          const { data: updated, error } = await supabase
            .from('contracts')
            .update(dataToRow(data, activeCompany))
            .eq('id', editingId)
            .select()
            .single();
          if (error) throw error;
          updateContracts(activeCompany, (prev) =>
            prev.map((x) => (x.id === editingId ? rowToContract(updated) : x))
          );
        } else {
          updateContracts(activeCompany, (prev) =>
            prev.map((x) => (x.id === editingId ? { ...x, ...data } : x))
          );
        }
      } else if (supabaseOnline) {
        const { data: inserted, error } = await supabase
          .from('contracts')
          .insert(dataToRow(data, activeCompany))
          .select()
          .single();
        if (error) throw error;
        updateContracts(activeCompany, (prev) => [...prev, rowToContract(inserted)]);
      } else {
        updateContracts(activeCompany, (prev) => {
          const newId = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
          return [...prev, { id: newId, ...data }];
        });
      }
      setFormOpen(false);
      if (supabaseOnline) setSyncStatus('saved');
    } catch (err) {
      console.error(err);
      if (supabaseOnline) setSyncStatus('error');
      alert(
        'Não foi possível salvar no banco de dados agora. Verifique sua internet e tente novamente.\n\nDetalhe técnico: ' +
          (err.message || err)
      );
    } finally {
      setSavingForm(false);
    }
  }

  function askDelete(id) {
    const c = contracts.find((x) => x.id === id);
    if (!c) return;
    setDeletingId(id);
    setConfirmOpen(true);
  }
  const deletingContract = contracts.find((x) => x.id === deletingId);

  async function confirmDelete() {
    setDeletingBusy(true);
    if (supabaseOnline) setSyncStatus('saving');
    try {
      if (supabaseOnline) {
        const { error } = await supabase.from('contracts').delete().eq('id', deletingId);
        if (error) throw error;
      }
      updateContracts(activeCompany, (prev) => prev.filter((c) => c.id !== deletingId));
      setConfirmOpen(false);
      if (supabaseOnline) setSyncStatus('saved');
    } catch (err) {
      console.error(err);
      if (supabaseOnline) setSyncStatus('error');
      alert(
        'Não foi possível excluir no banco de dados agora. Verifique sua internet e tente novamente.\n\nDetalhe técnico: ' +
          (err.message || err)
      );
    } finally {
      setDeletingBusy(false);
    }
  }

  // ---------- Cartões de KPI ----------
  const kpis = useMemo(() => {
    const total = contracts.length;
    const ativos = contracts.filter(
      (c) => c.origem !== 'Encerrados' && String(c.status).trim().toLowerCase() === 'ativo'
    ).length;
    let venceEmBreve = 0,
      vencidos = 0,
      avisar = 0;
    contracts.forEach((c) => {
      const a = computeAlert(c);
      if (a.code === 'VENCE_EM_BREVE') venceEmBreve++;
      if (a.code === 'VENCIDO') vencidos++;
      if (a.code === 'AVISAR') avisar++;
    });
    const valorAtivos = contracts
      .filter((c) => c.origem !== 'Encerrados' && String(c.status).trim().toLowerCase() === 'ativo')
      .reduce((acc, c) => acc + (parseValorNum(c.valor) || 0), 0);
    return [
      { l: 'Total de Contratos', n: total, cls: 'navy', key: '', title: 'Clique para ver todos os contratos' },
      { l: 'Ativos', n: ativos, cls: 'green', key: 'ATIVOS', title: 'Clique para ver só os contratos ativos' },
      {
        l: 'Vencendo em 30 dias',
        n: venceEmBreve,
        cls: 'yellow',
        key: 'VENCE_EM_BREVE',
        title: 'Clique para ver só os contratos que vencem em até 30 dias',
      },
      {
        l: 'Aviso de Rescisão Urgente',
        n: avisar,
        cls: 'orange',
        key: 'AVISAR',
        title: 'Clique para ver só os contratos com aviso de rescisão urgente',
      },
      { l: 'Contratos Vencidos', n: vencidos, cls: 'red', key: 'VENCIDO', title: 'Clique para ver só os contratos vencidos' },
      {
        l: 'Valor Total Ativos',
        n: valorAtivos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        cls: 'navy',
        key: 'ATIVOS',
        title: 'Clique para ver só os contratos ativos',
      },
    ];
  }, [contracts]);

  const statusOptions = useMemo(() => uniqueVals(contracts, 'status'), [contracts]);
  const responsavelOptions = useMemo(() => uniqueVals(contracts, 'responsavel'), [contracts]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter((c) => {
      if (
        activeCard === 'ATIVOS' &&
        !(c.origem !== 'Encerrados' && String(c.status).trim().toLowerCase() === 'ativo')
      )
        return false;
      if (activeCard === 'VENCE_EM_BREVE' && computeAlert(c).code !== 'VENCE_EM_BREVE') return false;
      if (activeCard === 'AVISAR' && computeAlert(c).code !== 'AVISAR') return false;
      if (activeCard === 'VENCIDO' && computeAlert(c).code !== 'VENCIDO') return false;
      if (fStatus && String(c.status).trim() !== fStatus) return false;
      if (fResp && String(c.responsavel).trim() !== fResp) return false;
      if (fAlerta && computeAlert(c).code !== fAlerta) return false;
      if (q) {
        const hay = [c.empresaContratada, c.empresaContratante, c.objeto, c.objetoDetalhe, c.responsavel, c.centroCusto]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contracts, activeCard, fStatus, fResp, fAlerta, search]);

  // ---------- Exportar (.xlsx bonito, com cores e formatação via ExcelJS) ----------
  async function handleExport() {
    const ExcelJSMod = await import('exceljs');
    const ExcelJS = ExcelJSMod.default || ExcelJSMod;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Agrobiotech';
    const ws = wb.addWorksheet('Contratos', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = EXPORT_HEADER_MAP.map(([key, label, width]) => ({ header: label, key, width }));
    ws.getColumn(EXPORT_HEADER_MAP.length + 1).width = 20;

    const headerRow = ws.getRow(1);
    headerRow.getCell(EXPORT_HEADER_MAP.length + 1).value = 'Alerta';
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: argb(COMPANY_ACCENT[activeCompany].accent) },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
    });

    contracts.forEach((c, i) => {
      const alertInfo = computeAlert(c);
      const rowVals = {};
      EXPORT_HEADER_MAP.forEach(([key]) => {
        rowVals[key] = c[key] || '';
      });
      const row = ws.addRow(rowVals);

      const valorNum = parseValorNum(c.valor);
      const valorCell = row.getCell('valor');
      if (valorNum !== null) {
        valorCell.value = valorNum;
        valorCell.numFmt = '"R$" #,##0.00';
      }

      const alertCell = row.getCell(EXPORT_HEADER_MAP.length + 1);
      alertCell.value = alertInfo.label;
      const ac = ALERT_COLORS[alertInfo.code] || ALERT_COLORS.OK;
      alertCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(ac.bg) } };
      alertCell.font = { name: 'Arial', bold: true, color: { argb: argb(ac.fg) }, size: 10.5 };
      alertCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const statusCell = row.getCell('status');
      const sc = STATUS_COLORS[String(c.status).trim()];
      if (sc) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(sc.bg) } };
        statusCell.font = { name: 'Arial', bold: true, color: { argb: argb(sc.fg) }, size: 10.5 };
        statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      row.eachCell({ includeEmpty: true }, (cell) => {
        if (!cell.font) cell.font = { name: 'Arial', size: 10.5 };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFEDEDED' } } };
        if (i % 2 === 1 && !cell.fill) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb('#F7F9F7') } };
        }
      });
      row.height = 18;
    });

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_HEADER_MAP.length + 1 } };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = COMPANIES[activeCompany].label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    a.href = url;
    a.download = `controle_de_contratos_${slug}_export.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- Importar (.xlsx/.xls/.csv) ----------
  async function handleImportFile(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const isCSV = /\.csv$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let headers, rowsOfArrays;
        if (isCSV) {
          const all = parseCSV(String(e.target.result));
          headers = all[0] || [];
          rowsOfArrays = all.slice(1);
        } else {
          const ExcelJSMod = await import('exceljs');
          const ExcelJS = ExcelJSMod.default || ExcelJSMod;
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(e.target.result);
          const ws = wb.worksheets[0];
          const all = [];
          ws.eachRow({ includeEmpty: false }, (row) => {
            all.push(row.values.slice(1));
          });
          headers = all[0] || [];
          rowsOfArrays = all.slice(1);
        }
        const imported = rowsToContracts(rowsOfArrays, headers);
        if (!imported.length) {
          alert(
            'Não encontrei contratos reconhecíveis nesse arquivo. Confira se as colunas seguem o padrão exportado por este sistema.'
          );
          return;
        }
        const companyLabel = COMPANIES[activeCompany].label;
        if (supabaseOnline) {
          const ok = confirm(
            `Isso vai APAGAR os ${contracts.length} contrato(s) atuais de "${companyLabel}" no banco de dados e substituir pelos ${imported.length} contrato(s) deste arquivo. Essa ação não pode ser desfeita. Deseja continuar?`
          );
          if (!ok) return;
        }
        if (supabaseOnline) setSyncStatus('saving');
        try {
          if (supabaseOnline) {
            const { error: delError } = await supabase
              .from('contracts')
              .delete()
              .eq('company', activeCompany);
            if (delError) throw delError;
            const rowsToInsert = imported.map((c) => dataToRow(c, activeCompany));
            const { data: insertedRows, error: insError } = await supabase
              .from('contracts')
              .insert(rowsToInsert)
              .select();
            if (insError) throw insError;
            const sorted = insertedRows.map(rowToContract).sort((a, b) => a.id - b.id);
            setCompanyStore((prev) => ({ ...prev, [activeCompany]: sorted }));
          } else {
            setCompanyStore((prev) => ({ ...prev, [activeCompany]: imported }));
          }
          if (supabaseOnline) setSyncStatus('saved');
          alert(`${imported.length} contratos importados em "${companyLabel}" com sucesso.`);
        } catch (syncErr) {
          console.error(syncErr);
          if (supabaseOnline) setSyncStatus('error');
          alert(
            'Não foi possível importar para o banco de dados agora. Verifique sua internet e tente novamente.\n\nDetalhe técnico: ' +
              (syncErr.message || syncErr)
          );
        }
      } catch (err) {
        alert('Não consegui ler esse arquivo: ' + err.message);
      }
    };
    if (isCSV) reader.readAsText(file, 'utf-8');
    else reader.readAsArrayBuffer(file);
    ev.target.value = '';
  }

  // ---------- Tema por empresa ----------
  const theme = COMPANY_HEADER_THEME[activeCompany];
  const accent = COMPANY_ACCENT[activeCompany];
  const rootVars = {
    '--accent': accent.accent,
    '--accent-dark': accent.accentDark,
    '--accent-text': accent.accentText,
    '--accent-tint': accent.accentTint,
  };
  const headerVars = {
    '--header-bg': theme.bg,
    '--header-text': theme.text,
    '--header-border': theme.border,
    '--header-btn-bg': theme.btnBg,
    '--header-btn-bg-hover': theme.btnBgHover,
    '--header-btn-color': theme.btnColor,
    '--header-badge-bg': theme.badgeBg,
    '--header-badge-text': theme.badgeText,
    '--logo-height': COMPANY_LOGO_HEIGHT[activeCompany] + 'px',
  };

  function syncStatusText() {
    if (syncStatus === 'saving') return 'Salvando...';
    if (syncStatus === 'error') return 'Erro ao salvar';
    if (syncStatus === 'saved') return '';
    if (syncStatus === 'offline') return 'Modo offline';
    return '';
  }

  function statusClassOf(c) {
    return 'status-' + (String(c.status).trim() || 'Ativo').replace(/[^A-Za-zÀ-ú]/g, '');
  }

  if (session === undefined) {
    return (
      <div className="loading-overlay" style={{ position: 'static', minHeight: '100vh' }}>
        <div className="loading-box">
          <div className="loading-spinner"></div>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={handleLogin}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo" src={COMPANY_ICONS.agrobiotech} alt="Agrobiotech" />
          <h1>Controle de Contratos</h1>
          <p className="login-subtitle">Entre com seu e-mail e senha para acessar.</p>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={loginEmail}
            onChange={(ev) => setLoginEmail(ev.target.value)}
          />
          <label htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={loginPassword}
            onChange={(ev) => setLoginPassword(ev.target.value)}
          />
          <label className="login-show-pass">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(ev) => setShowPassword(ev.target.checked)}
            />
            Mostrar senha
          </label>
          {loginError && <div className="login-error">{loginError}</div>}
          <button type="submit" disabled={loginBusy}>
            {loginBusy ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={rootVars}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <div>Carregando contratos...</div>
          </div>
        </div>
      )}

      <header style={headerVars}>
        <button
          type="button"
          className="company-menu-btn"
          title="Trocar de empresa"
          onClick={(ev) => {
            ev.stopPropagation();
            setCompanyMenuOpen((v) => !v);
          }}
        >
          &#9776;
        </button>
        <div className={'company-menu' + (companyMenuOpen ? ' open' : '')} ref={companyMenuRef}>
          <div className="cm-title">Trocar de empresa</div>
          <div className="cm-list">
            {COMPANY_ORDER.map((k) => {
              const isActive = k === activeCompany;
              return (
                <button key={k} className={isActive ? 'active' : ''} onClick={() => switchCompany(k)}>
                  <span className="cm-avatar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={COMPANY_ICONS[k]} alt={COMPANIES[k].label} />
                  </span>
                  <span className="cm-name">{COMPANIES[k].label}</span>
                  {isActive && <span className="cm-check">&#10003;</span>}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className="header-help-btn"
          title="Clique aqui para ver como usar o sistema"
          onClick={() => setHelpOpen(true)}
        >
          ?
        </button>
        <div className="logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src={COMPANY_HEADER_LOGOS[activeCompany]} alt={COMPANIES[activeCompany].label} />
        </div>
        <p className="tagline">Controle de Contratos</p>
        <p className="company-badge">{COMPANIES[activeCompany].label}</p>
        <button type="button" className="logout-btn" title="Sair do sistema" onClick={handleLogout}>
          Sair
        </button>
        {syncStatus === 'saving' || syncStatus === 'error' || syncStatus === 'offline' ? (
          <span
            className={
              'sync-status' + (syncStatus === 'saving' ? ' saving' : syncStatus === 'error' ? ' error' : '')
            }
            title="Situação do salvamento na nuvem"
          >
            {syncStatusText()}
          </span>
        ) : null}
      </header>

      {!supabaseOnline && !loading && (
        <div className="offline-banner">
          Não foi possível conectar ao banco de dados agora. Você está vendo os últimos dados salvos, mas{' '}
          <b>alterações feitas agora não serão guardadas</b> — verifique sua internet e recarregue a página antes
          de cadastrar, editar ou excluir algo.
        </div>
      )}

      <div className="wrap">
        <div className="note">
          <b>Salvamento automático:</b> tudo que você cadastrar, editar ou excluir aqui é salvo automaticamente na
          nuvem — não precisa exportar nada para não perder. O botão <b>&quot;Exportar (.xlsx)&quot;</b> continua
          disponível caso você queira guardar uma cópia extra no seu computador. Se tiver dúvida em qualquer parte
          do sistema, clique no botão &quot;?&quot; no canto superior direito.
        </div>

        <div className="cards">
          {kpis.map((c, i) => (
            <div
              key={i}
              className={`card ${c.cls}${c.key === activeCard ? ' active' : ''}`}
              title={c.title}
              onClick={() => setActiveCard((prev) => (prev === c.key ? '' : c.key))}
            >
              <div className="n">{c.n}</div>
              <div className="l">{c.l}</div>
            </div>
          ))}
        </div>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Buscar empresa, objeto, responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            title="Mostrar só contratos com este status"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {statusOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            title="Mostrar só contratos com este alerta"
            value={fAlerta}
            onChange={(e) => setFAlerta(e.target.value)}
          >
            <option value="">Todos os alertas</option>
            <option value="OK">Tudo certo (OK)</option>
            <option value="VENCE_EM_BREVE">Vence em breve</option>
            <option value="AVISAR">Avisar rescisão agora</option>
            <option value="VENCIDO">Contrato vencido</option>
            <option value="ENCERRADO">Encerrado</option>
            <option value="SEMDATA">Sem data definida</option>
          </select>
          <select
            title="Mostrar só contratos deste responsável"
            value={fResp}
            onChange={(e) => setFResp(e.target.value)}
          >
            <option value="">Todos os responsáveis</option>
            {responsavelOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span className="spacer"></span>
          <button
            className="secondary"
            title="Salva um arquivo no seu computador com tudo que está na tela agora"
            onClick={handleExport}
          >
            Exportar (.xlsx)
          </button>
          <button
            className="secondary"
            title="Substitui os contratos desta empresa pelos de um arquivo .xlsx/.csv salvo antes"
            onClick={() => fileInputRef.current?.click()}
          >
            Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            id="fileImport"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
          />
          <button title="Cadastrar um contrato novo" onClick={openNew}>
            + Novo Contrato
          </button>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th title="Nome da empresa com quem o contrato foi feito">Empresa Contratada</th>
                <th title="Código do setor responsável pelo custo">Centro de Custo</th>
                <th title="Quem cuida deste contrato dentro da empresa">Responsável</th>
                <th title="O que esse contrato cobre / para que serve">Objeto do Contrato</th>
                <th title="Quanto custa o contrato">Valor</th>
                <th title="Data em que o contrato acaba">Data de Término</th>
                <th title="Por quanto tempo o contrato vale">Prazo de Vigência</th>
                <th title="Com que frequência se paga (mensal, anual...)">Pagamento</th>
                <th title="Com quantos dias de antecedência é preciso avisar se quiser cancelar">
                  Aviso de Rescisão
                </th>
                <th title="Se o contrato está em uso (Ativo) ou não (Inativo)">Status</th>
                <th title="Se o contrato já foi assinado pelas partes">Assinado</th>
                <th title="Em qual grupo este contrato está organizado">Categoria</th>
                <th title="Aviso automático sobre o vencimento deste contrato. Cores: Verde = tudo certo · Amarelo = vence em breve · Laranja = avisar rescisão · Vermelho = já venceu · Cinza = encerrado ou sem data">
                  Alerta
                </th>
                <th title="Botões para corrigir ou remover este contrato">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((c) => {
                const a = computeAlert(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <b>{c.empresaContratada}</b>
                      {c.empresaContratante && (
                        <div style={{ color: 'var(--muted)', fontSize: 11 }}>{c.empresaContratante}</div>
                      )}
                    </td>
                    <td>{c.centroCusto}</td>
                    <td>{c.responsavel}</td>
                    <td>
                      {c.objeto}
                      {c.objetoDetalhe && (
                        <div style={{ color: 'var(--muted)', fontSize: 11 }} title={c.objetoDetalhe}>
                          {c.objetoDetalhe.slice(0, 60)}
                          {c.objetoDetalhe.length > 60 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td>{fmtValor(c.valor)}</td>
                    <td>{fmtDate(c.dataTermino)}</td>
                    <td>{c.prazoVigencia || '—'}</td>
                    <td>{c.pagamento || '—'}</td>
                    <td>{c.prazoAviso || '—'}</td>
                    <td>
                      <span className={'pill ' + statusClassOf(c)}>{c.status || '—'}</span>
                    </td>
                    <td>{c.assinado || '—'}</td>
                    <td>{c.origem}</td>
                    <td>
                      <span className={'pill ' + a.code}>{a.label}</span>
                    </td>
                    <td className="actions-cell">
                      <button className="rowbtn" onClick={() => openEdit(c.id)}>
                        Editar
                      </button>
                      <button className="rowbtn del" onClick={() => askDelete(c.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredList.length === 0 && (
          <div className="empty">
            Não encontramos nenhum contrato com essa busca/filtro. Tente limpar a busca ou escolher outra opção nos
            filtros acima.
          </div>
        )}

        <footer>
          Total de contratos carregados em {COMPANIES[activeCompany].label}: {contracts.length}. Use o menu (☰) no
          topo para trocar de empresa.
        </footer>
      </div>

      {/* Modal: Novo/Editar Contrato */}
      <div
        className={'modal-bg' + (formOpen ? ' open' : '')}
        onMouseDown={(ev) => {
          if (ev.target === ev.currentTarget) setFormOpen(false);
        }}
      >
        <div className="modal">
          <h2>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h2>
          <div className="form-grid">
            <div>
              <label>Empresa Contratante</label>
              <input
                value={formData.empresaContratante || ''}
                onChange={(e) => setField('empresaContratante', e.target.value)}
              />
            </div>
            <div>
              <label>Empresa Contratada *</label>
              <input
                value={formData.empresaContratada || ''}
                onChange={(e) => setField('empresaContratada', e.target.value)}
              />
            </div>
            {/* Empresa Contratante/Contratada: sem datalist de propósito - ver histórico do projeto */}
            <div>
              <label>Centro de Custo</label>
              <input
                list="centroCustoOpts"
                autoComplete="off"
                value={formData.centroCusto || ''}
                onChange={(e) => setField('centroCusto', e.target.value)}
              />
              <datalist id="centroCustoOpts">
                {(suggestedOptions.centroCustoOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar um novo, ou escolher um já usado nesta empresa.</div>
            </div>
            <div>
              <label>Responsável</label>
              <input
                list="responsavelOpts"
                autoComplete="off"
                value={formData.responsavel || ''}
                onChange={(e) => setField('responsavel', e.target.value)}
              />
              <datalist id="responsavelOpts">
                {(suggestedOptions.responsavelOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar um novo, ou escolher um já usado nesta empresa.</div>
            </div>
            <div className="full">
              <label>Objeto do Contrato</label>
              <input
                list="objetoOpts"
                autoComplete="off"
                value={formData.objeto || ''}
                onChange={(e) => setField('objeto', e.target.value)}
              />
              <datalist id="objetoOpts">
                {(suggestedOptions.objetoOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar um novo, ou escolher um já usado nesta empresa.</div>
            </div>
            <div className="full">
              <label>Observações / Detalhes</label>
              <textarea
                value={formData.objetoDetalhe || ''}
                onChange={(e) => setField('objetoDetalhe', e.target.value)}
              />
            </div>
            <div>
              <label>Valor</label>
              <input
                placeholder="Ex: 1500.00 ou Variável"
                value={formData.valor || ''}
                onChange={(e) => setField('valor', e.target.value)}
              />
            </div>
            <div>
              <label>Pagamento</label>
              <input
                list="pagamentoOpts"
                placeholder="mensal, anual, quinzenal..."
                autoComplete="off"
                value={formData.pagamento || ''}
                onChange={(e) => setField('pagamento', e.target.value)}
              />
              <datalist id="pagamentoOpts">
                {(suggestedOptions.pagamentoOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar um novo, ou escolher um já usado nesta empresa.</div>
            </div>
            <div>
              <label>Data de Início</label>
              <input
                type="date"
                value={formData.dataInicio || ''}
                onChange={(e) => setField('dataInicio', e.target.value)}
              />
            </div>
            <div>
              <label>Data de Término</label>
              <input
                list="dataTerminoOpts"
                placeholder="AAAA-MM-DD ou Indeterminado"
                autoComplete="off"
                value={formData.dataTermino || ''}
                onChange={(e) => setField('dataTermino', e.target.value)}
              />
              <datalist id="dataTerminoOpts">
                {(suggestedOptions.dataTerminoOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">
                Pode digitar uma data nova, ou escolher &quot;Indeterminado&quot;/outro valor já usado.
              </div>
            </div>
            <div>
              <label>Prazo de Vigência</label>
              <input
                list="prazoVigenciaOpts"
                placeholder="Ex: 12 meses"
                autoComplete="off"
                value={formData.prazoVigencia || ''}
                onChange={(e) => setField('prazoVigencia', e.target.value)}
              />
              <datalist id="prazoVigenciaOpts">
                {(suggestedOptions.prazoVigenciaOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar um novo, ou escolher um já usado nesta empresa.</div>
            </div>
            <div>
              <label>Prazo p/ Aviso de Rescisão</label>
              <input
                list="prazoAvisoOpts"
                placeholder="Ex: 60 dias"
                autoComplete="off"
                value={formData.prazoAviso || ''}
                onChange={(e) => setField('prazoAviso', e.target.value)}
              />
              <datalist id="prazoAvisoOpts">
                {(suggestedOptions.prazoAvisoOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar um novo, ou escolher um já usado nesta empresa.</div>
            </div>
            <div>
              <label>Status</label>
              <select value={formData.status || ''} onChange={(e) => setField('status', e.target.value)}>
                {formData.status && !['Ativo', 'Inativo', 'Encerrado'].includes(formData.status) && (
                  <option value={formData.status}>{formData.status} (valor não padrão — escolha um abaixo)</option>
                )}
                {!formData.status && <option value="">Selecione...</option>}
                <option>Ativo</option>
                <option>Inativo</option>
                <option>Encerrado</option>
              </select>
            </div>
            <div>
              <label>Assinado</label>
              <select value={formData.assinado || ''} onChange={(e) => setField('assinado', e.target.value)}>
                {formData.assinado && !['Sim', 'Não'].includes(formData.assinado) && (
                  <option value={formData.assinado}>{formData.assinado} (valor não padrão — escolha um abaixo)</option>
                )}
                {!formData.assinado && <option value="">Selecione...</option>}
                <option>Sim</option>
                <option>Não</option>
              </select>
            </div>
            <div>
              <label>Categoria</label>
              <input
                list="origemOpts"
                placeholder="Ex: Controle de Contratos"
                autoComplete="off"
                value={formData.origem || ''}
                onChange={(e) => setField('origem', e.target.value)}
              />
              <datalist id="origemOpts">
                {(suggestedOptions.origemOpts || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <div className="field-hint">Pode digitar uma categoria nova, ou escolher uma já usada nesta empresa.</div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button onClick={handleSaveForm} disabled={savingForm}>
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Confirmar exclusão */}
      <div
        className={'modal-bg confirm-modal' + (confirmOpen ? ' open' : '')}
        onMouseDown={(ev) => {
          if (ev.target === ev.currentTarget) setConfirmOpen(false);
        }}
      >
        <div className="modal">
          <h2>Excluir contrato?</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            {deletingContract
              ? `Tem certeza que deseja excluir o contrato com "${deletingContract.empresaContratada}"?`
              : ''}
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </button>
            <button className="danger" onClick={confirmDelete} disabled={deletingBusy}>
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Ajuda */}
      <div
        className={'modal-bg help-modal' + (helpOpen ? ' open' : '')}
        onMouseDown={(ev) => {
          if (ev.target === ev.currentTarget) setHelpOpen(false);
        }}
      >
        <div className="modal">
          <h2>Como usar o sistema</h2>
          <div className="help-step">
            <div className="badge">1</div>
            <div className="txt">
              <b>Para trocar de empresa:</b> clique no ícone com três linhas (☰) no canto superior esquerdo e
              escolha Agrobiotech, Pilar, Tarpon Franca ou Tarpon Araxá. Cada empresa tem sua própria lista de
              contratos.
            </div>
          </div>
          <div className="help-step">
            <div className="badge">2</div>
            <div className="txt">
              <b>Para encontrar um contrato:</b> digite o nome da empresa, do responsável ou do que o contrato
              trata na caixa de busca, no topo da tela.
            </div>
          </div>
          <div className="help-step">
            <div className="badge">3</div>
            <div className="txt">
              <b>Para ver só um tipo de contrato:</b> clique num dos cartões coloridos no topo da página (por
              exemplo &quot;Ativos&quot; ou &quot;Contratos Vencidos&quot;). Clique de novo no mesmo cartão, ou em
              &quot;Total de Contratos&quot;, para voltar a ver todos.
            </div>
          </div>
          <div className="help-step">
            <div className="badge">4</div>
            <div className="txt">
              <b>Para cadastrar um contrato novo:</b> clique no botão verde &quot;+ Novo Contrato&quot;, preencha
              os campos e clique em &quot;Salvar&quot;.
            </div>
          </div>
          <div className="help-step">
            <div className="badge">5</div>
            <div className="txt">
              <b>Para corrigir ou remover um contrato:</b> encontre a linha dele na tabela e clique em
              &quot;Editar&quot; ou &quot;Excluir&quot;, do lado direito.
            </div>
          </div>
          <div className="help-step">
            <div className="badge">6</div>
            <div className="txt">
              <b>Sobre salvar o que você faz:</b> tudo que você cadastra, edita ou exclui é salvo automaticamente
              na nuvem assim que você clica em &quot;Salvar&quot; ou &quot;Excluir&quot; — não precisa fazer mais
              nada. O botão &quot;Exportar (.xlsx)&quot; é opcional, só para guardar uma cópia extra no seu
              computador se quiser.
            </div>
          </div>
          <div className="modal-actions">
            <button onClick={() => setHelpOpen(false)}>Entendi</button>
          </div>
        </div>
      </div>
    </div>
  );
}
