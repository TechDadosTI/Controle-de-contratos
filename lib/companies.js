// Rótulos de cada empresa. Não existe mais nenhum snapshot de contratos embutido aqui: dados
// reais de contrato nunca devem estar em um módulo importado pelo cliente ('use client'), pois
// isso os envia para o navegador de qualquer visitante, logado ou não. Se o Supabase estiver
// fora do ar, o app mostra uma tela de indisponibilidade em vez de cair para dados locais.
// Ver initData() em app/page.js.
export const COMPANIES = {
  agrobiotech: { label: 'Agrobiotech' },
  pilar: { label: 'Pilar' },
  tarponFranca: { label: 'Tarpon Franca' },
  tarponAraxa: { label: 'Tarpon Araxá' },
};

export const COMPANY_ORDER = ['agrobiotech', 'pilar', 'tarponFranca', 'tarponAraxa'];

export const COMPANY_ICONS = {
  agrobiotech: '/logos/agrobiotech-icon.png',
  pilar: '/logos/pilar-icon.png',
  tarponFranca: '/logos/tarpon-icon.png',
  tarponAraxa: '/logos/tarpon-icon.png',
};

// Logo grande exibida no cabeçalho, já na variante certa para o tema de cada empresa (branca
// para cabeçalhos escuros, colorida para o cabeçalho branco da Tarpon).
export const COMPANY_HEADER_LOGOS = {
  agrobiotech: '/logos/agrobiotech-header.png',
  pilar: '/logos/pilar-header.png',
  tarponFranca: '/logos/tarpon-header.png',
  tarponAraxa: '/logos/tarpon-header.png',
};

// Tema do cabeçalho por empresa: cada uma com a cor de marca própria, no mesmo padrão
// "profissional" usado na Agrobiotech (fundo sólido + logo + textos legíveis em cima).
export const COMPANY_HEADER_THEME = {
  agrobiotech: {
    bg: '#008D44', text: '#EAFBF1', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#005D2B',
  },
  pilar: {
    bg: '#0A2A43', text: '#EAF1F7', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#0A2A43',
  },
  tarponFranca: {
    bg: '#008D44', text: '#EAFBF1', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#005D2B',
  },
  tarponAraxa: {
    bg: '#008D44', text: '#EAFBF1', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#005D2B',
  },
};

// Cor de destaque (botões, cabeçalho da tabela, cartão "Total de Contratos", título dos
// modais, botões de linha, hover/ativo do menu "Trocar de empresa") usada no restante da
// tela - por padrão é o verde institucional, mas empresas com identidade própria (ex.: Pilar)
// usam a cor da sua própria marca em vez do verde institucional da Agrobiotech.
// accentTint: versão bem clara da cor de destaque, usada como fundo suave (hover do menu,
// item ativo desse menu, hover dos botões "Editar"/"Excluir" da tabela, bolinha numerada da
// tela de ajuda).
export const COMPANY_ACCENT = {
  agrobiotech: { accent: '#008D44', accentDark: '#005D2B', accentText: '#fff', accentTint: '#F0F8F4' },
  pilar: { accent: '#0A2A43', accentDark: '#0A2A43', accentText: '#fff', accentTint: '#E6EAEC' },
  tarponFranca: { accent: '#008D44', accentDark: '#005D2B', accentText: '#fff', accentTint: '#F0F8F4' },
  tarponAraxa: { accent: '#008D44', accentDark: '#005D2B', accentText: '#fff', accentTint: '#F0F8F4' },
};

// Altura da logo do cabeçalho por empresa: o desenho da Pilar (coluna fina + texto) tem menos
// "peso visual" que os wordmarks da Agrobiotech/Tarpon na mesma altura, então ela precisa de
// mais px para parecer do mesmo tamanho.
export const COMPANY_LOGO_HEIGHT = {
  agrobiotech: 56,
  pilar: 64,
  tarponFranca: 56,
  tarponAraxa: 56,
};
