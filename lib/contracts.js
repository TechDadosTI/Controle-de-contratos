// ---------- Datas / valores ----------
export function parseDate(v) {
  if (!v) return null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m2) return new Date(parseInt(m2[3]), parseInt(m2[2]) - 1, parseInt(m2[1]));
  return null;
}
export function parseLeadingInt(v) {
  if (!v) return null;
  const m = String(v).match(/-?\d+/);
  return m ? parseInt(m[0]) : null;
}
export function parseValorNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
export function fmtValor(v) {
  const n = parseValorNum(v);
  if (n === null) return v && String(v).trim() ? String(v) : '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function fmtDate(v) {
  const d = parseDate(v);
  if (d) return d.toLocaleDateString('pt-BR');
  return v && String(v).trim() ? String(v) : '—';
}
function today0() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}
function diffDays(d) {
  return Math.round((d - today0()) / 86400000);
}

export function computeAlert(c) {
  if (c.origem === 'Encerrados') {
    return { code: 'ENCERRADO', label: 'Encerrado' };
  }
  const term = parseDate(c.dataTermino);
  if (!term) {
    return { code: 'SEMDATA', label: 'Sem data definida' };
  }
  const dTerm = diffDays(term);
  if (dTerm < 0) {
    return { code: 'VENCIDO', label: 'Contrato vencido' };
  }
  const avisoDias = parseLeadingInt(c.prazoAviso);
  if (avisoDias !== null) {
    const limite = new Date(term);
    limite.setDate(limite.getDate() - avisoDias);
    if (diffDays(limite) <= 0) {
      return { code: 'AVISAR', label: 'Avisar rescisão agora' };
    }
  }
  if (dTerm <= 30) {
    return { code: 'VENCE_EM_BREVE', label: 'Vence em breve' };
  }
  return { code: 'OK', label: 'OK' };
}

// ---------- Campos do formulário / Supabase ----------
// Ordem usada no formulário de Novo Contrato/Editar.
export const FIELDS = [
  'empresaContratante', 'empresaContratada', 'centroCusto', 'responsavel', 'objeto',
  'objetoDetalhe', 'valor', 'pagamento', 'dataInicio', 'dataTermino', 'prazoVigencia',
  'prazoAviso', 'status', 'assinado', 'origem',
];

// Nomes dos campos no app (camelCase) x nomes das colunas na tabela "contracts" do Supabase
// (snake_case).
export const FIELD_TO_COLUMN = {
  empresaContratante: 'empresa_contratante',
  empresaContratada: 'empresa_contratada',
  centroCusto: 'centro_custo',
  responsavel: 'responsavel',
  objeto: 'objeto',
  objetoDetalhe: 'objeto_detalhe',
  valor: 'valor',
  pagamento: 'pagamento',
  dataInicio: 'data_inicio',
  dataTermino: 'data_termino',
  prazoVigencia: 'prazo_vigencia',
  prazoAviso: 'prazo_aviso',
  status: 'status',
  assinado: 'assinado',
  origem: 'origem',
};
export const COLUMN_TO_FIELD = Object.fromEntries(
  Object.entries(FIELD_TO_COLUMN).map(([f, c]) => [c, f])
);

export function rowToContract(row) {
  const c = { id: row.id };
  Object.entries(COLUMN_TO_FIELD).forEach(([col, field]) => {
    c[field] = row[col] || '';
  });
  return c;
}
export function dataToRow(data, company) {
  const row = { company };
  Object.entries(FIELD_TO_COLUMN).forEach(([field, col]) => {
    row[col] = data[field] || '';
  });
  return row;
}

// Campos que sugerem valores já usados NESTA empresa (Categoria, Objeto, Pagamento, datas,
// prazos) via <input list>+<datalist>.
export const SUGGESTED_FIELDS = [
  ['origem', 'origemOpts'],
  ['objeto', 'objetoOpts'],
  ['pagamento', 'pagamentoOpts'],
  ['dataTermino', 'dataTerminoOpts'],
  ['prazoVigencia', 'prazoVigenciaOpts'],
  ['prazoAviso', 'prazoAvisoOpts'],
];
// Centro de Custo e Responsável: Pilar/Tarpon nunca tiveram esses campos preenchidos na
// planilha original, então sugerimos a partir de TODAS as empresas (na prática, hoje, a lista
// vem quase toda da Agrobiotech).
export const SUGGESTED_FIELDS_GLOBAL = [
  ['centroCusto', 'centroCustoOpts'],
  ['responsavel', 'responsavelOpts'],
];

// ---------- Export/Import (.xlsx/.csv) ----------
export const EXPORT_HEADER_MAP = [
  ['empresaContratante', 'Empresa Contratante', 22],
  ['empresaContratada', 'Empresa Contratada', 28],
  ['centroCusto', 'Centro de Custo', 14],
  ['responsavel', 'Responsável', 18],
  ['objeto', 'Objeto do Contrato', 26],
  ['objetoDetalhe', 'Observações', 34],
  ['valor', 'Valor', 14],
  ['dataInicio', 'Data de Início', 13],
  ['dataTermino', 'Data de Término', 14],
  ['prazoVigencia', 'Prazo de Vigência', 15],
  ['pagamento', 'Pagamento', 12],
  ['prazoAviso', 'Prazo para Aviso de Rescisão', 16],
  ['status', 'Status', 12],
  ['assinado', 'Assinado', 10],
  ['origem', 'Categoria', 19],
];

export const IMPORT_REV_MAP = {
  'Empresa Contratante': 'empresaContratante',
  'Empresa Contratada': 'empresaContratada',
  'Centro de Custo': 'centroCusto',
  'Responsável': 'responsavel',
  'Objeto do Contrato': 'objeto',
  'Observações': 'objetoDetalhe',
  Valor: 'valor',
  'Data de Início': 'dataInicio',
  'Data de Término': 'dataTermino',
  'Prazo de Vigência': 'prazoVigencia',
  Pagamento: 'pagamento',
  'Prazo para Aviso de Rescisão': 'prazoAviso',
  Status: 'status',
  Assinado: 'assinado',
  Categoria: 'origem',
};

export function cellToText(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  if (typeof v === 'object') {
    if (v.text) return String(v.text);
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if (v.result !== undefined) return String(v.result);
    return '';
  }
  return String(v);
}

export function rowsToContracts(rowsOfArrays, headers) {
  return rowsOfArrays
    .map((vals, i) => {
      const o = { id: i + 1 };
      headers.forEach((h, idx) => {
        const key = IMPORT_REV_MAP[String(h || '').trim()];
        if (key) o[key] = cellToText(vals[idx]);
      });
      if (!o.origem) o.origem = 'Contratos Ativos';
      return o;
    })
    .filter((o) => o.empresaContratada);
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
}

export function argb(hex) {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

// Cores SEMÂNTICAS de alerta/status (verde=bom, vermelho=problema) - de propósito iguais em
// todas as empresas, não fazem parte da identidade visual de marca. Nunca trocar por
// COMPANY_ACCENT.
export const ALERT_COLORS = {
  OK: { bg: '#E4F3E8', fg: '#005D2B' },
  VENCE_EM_BREVE: { bg: '#FFF8DC', fg: '#8A6D00' },
  AVISAR: { bg: '#FFF1E0', fg: '#B56B00' },
  VENCIDO: { bg: '#FDECEA', fg: '#C62828' },
  ENCERRADO: { bg: '#ECEFF1', fg: '#546069' },
  SEMDATA: { bg: '#EEF2FF', fg: '#3B4FA0' },
};
export const STATUS_COLORS = {
  Ativo: { bg: '#E4F3E8', fg: '#005D2B' },
  Inativo: { bg: '#FDECEA', fg: '#C62828' },
  Encerrado: { bg: '#ECEFF1', fg: '#546069' },
};

export function uniqueVals(contracts, key) {
  const s = new Set();
  contracts.forEach((c) => {
    if (c[key] && String(c[key]).trim()) s.add(String(c[key]).trim());
  });
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
// Igual a uniqueVals(), mas juntando os contratos de TODAS as empresas.
export function uniqueValsAllCompanies(companyStore, companyOrder, key) {
  const s = new Set();
  companyOrder.forEach((k) => {
    (companyStore[k] || []).forEach((c) => {
      if (c[key] && String(c[key]).trim()) s.add(String(c[key]).trim());
    });
  });
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
