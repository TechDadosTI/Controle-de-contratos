// Rótulos de cada empresa. Não existe mais nenhum snapshot de contratos embutido aqui: dados
// reais de contrato nunca devem estar em um módulo importado pelo cliente ('use client'), pois
// isso os envia para o navegador de qualquer visitante, logado ou não. Se o Supabase estiver
// fora do ar, o app mostra uma tela de indisponibilidade em vez de cair para dados locais.
// Ver initData() em app/page.js.
//
// As 7 empresas abaixo (bgc até hidrossoluvel) foram cadastradas só com a estrutura/tema - sem
// nenhum contrato de exemplo. A lista delas começa vazia porque a tabela "contracts" no Supabase
// ainda não tem nenhuma linha com esse "company"; quem for lançar os contratos de cada uma faz
// isso direto pela tela "+ Novo Contrato", como já acontece com as outras 4.
export const COMPANIES = {
  agrobiotech: { label: 'Agrobiotech' },
  pilar: { label: 'Pilar' },
  tarponFranca: { label: 'Tarpon Franca' },
  tarponAraxa: { label: 'Tarpon Araxá' },
  bgc: { label: 'BGC' },
  agroBgc: { label: 'AgroBGC' },
  cempra: { label: 'Cempra' },
  goldenDrops: { label: 'Golden Drops' },
  biosulfa: { label: 'Biosulfa' },
  // A chave continua "agrobics" (sem o r) de propósito: é o valor gravado na coluna "company"
  // dos contratos e na lista aceita por import_contracts(). Só o rótulo, que é o que aparece na
  // tela, leva o nome certo da empresa.
  agrobics: { label: 'Agrobrics' },
  hidrossoluvel: { label: 'Hidrossolúvel' },

  // Listas de representantes: seis empresas têm, além do controle de contratos, uma segunda
  // lista com a mesma tela e os mesmos campos, só que com dados separados. No banco elas são
  // apenas outros valores da coluna "company" - não há estrutura nova. O rótulo precisa dizer
  // de quem é a lista porque ele aparece no crachá do cabeçalho.
  agrobiotechRep: { label: 'Agrobiotech — Representantes' },
  pilarRep: { label: 'Pilar — Representantes' },
  tarponFrancaRep: { label: 'Tarpon Franca — Representantes' },
  tarponAraxaRep: { label: 'Tarpon Araxá — Representantes' },
  agrobicsRep: { label: 'Agrobrics — Representantes' },
  hidrossoluvelRep: { label: 'Hidrossolúvel — Representantes' },
};

export const COMPANY_ORDER = [
  'agrobiotech',
  'pilar',
  'tarponFranca',
  'tarponAraxa',
  'bgc',
  'agroBgc',
  'cempra',
  'goldenDrops',
  'biosulfa',
  'agrobics',
  'hidrossoluvel',
];

// Qual empresa tem lista de representantes e qual é a chave dela. De propósito fora de
// COMPANY_ORDER: aquele array continua sendo só a lista de empresas, que é o que a barra
// lateral percorre - as listas de representantes aparecem recuadas dentro do grupo da empresa.
export const COMPANY_REPS = {
  agrobiotech: 'agrobiotechRep',
  pilar: 'pilarRep',
  tarponFranca: 'tarponFrancaRep',
  tarponAraxa: 'tarponAraxaRep',
  agrobics: 'agrobicsRep',
  hidrossoluvel: 'hidrossoluvelRep',
};

// Todas as chaves que guardam contratos. É o que deve ser percorrido para tratar DADOS (montar
// o store vindo do Supabase, juntar sugestões de todas as listas); COMPANY_ORDER serve para
// desenhar o menu.
export const ALL_COMPANY_KEYS = [...COMPANY_ORDER, ...Object.values(COMPANY_REPS)];

export const COMPANY_ICONS = {
  agrobiotech: '/logos/agrobiotech-icon.png',
  pilar: '/logos/pilar-icon.png',
  tarponFranca: '/logos/tarpon-icon.png',
  tarponAraxa: '/logos/tarpon-icon.png',
  bgc: '/logos/bgc-icon.png',
  agroBgc: '/logos/agrobgc-icon.png',
  cempra: '/logos/cempra-icon.png',
  goldenDrops: '/logos/golden-drops-icon.png',
  biosulfa: '/logos/biosulfa-icon.png',
  agrobics: '/logos/agrobics-icon.png',
  hidrossoluvel: '/logos/hidrossoluvel-icon.png',
};

// Logo grande exibida no cabeçalho, já na variante certa para o tema de cada empresa (branca
// para cabeçalhos escuros, colorida para o cabeçalho branco da Tarpon).
export const COMPANY_HEADER_LOGOS = {
  agrobiotech: '/logos/agrobiotech-header.png',
  pilar: '/logos/pilar-header.png',
  tarponFranca: '/logos/tarpon-header.png',
  tarponAraxa: '/logos/tarpon-header.png',
  bgc: '/logos/bgc-header.png',
  agroBgc: '/logos/agrobgc-header.png',
  cempra: '/logos/cempra-header.png',
  goldenDrops: '/logos/golden-drops-header.png',
  biosulfa: '/logos/biosulfa-header.png',
  agrobics: '/logos/agrobics-header.png',
  hidrossoluvel: '/logos/hidrossoluvel-header.png',
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
    bg: '#6DB930', text: '#F3FAEC', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#46761F',
  },
  tarponAraxa: {
    bg: '#6DB930', text: '#F3FAEC', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#46761F',
  },
  bgc: {
    bg: '#1F355E', text: '#EBEEF4', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#1F355E',
  },
  agroBgc: {
    bg: '#11114E', text: '#EAEAF5', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#11114E',
  },
  cempra: {
    bg: '#45250D', text: '#F5EFEA', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#45250D',
  },
  goldenDrops: {
    bg: '#002043', text: '#EAEFF6', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#002043',
  },
  biosulfa: {
    bg: '#26A74F', text: '#EAF5EE', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#155C2B',
  },
  agrobics: {
    bg: '#484D50', text: '#EFF0F0', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#282A2C',
  },
  hidrossoluvel: {
    bg: '#32B4DE', text: '#EAF3F6', border: 'none',
    btnBg: 'rgba(255,255,255,.14)', btnBgHover: 'rgba(255,255,255,.26)', btnColor: '#fff',
    badgeBg: '#fff', badgeText: '#156681',
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
  tarponFranca: { accent: '#6DB930', accentDark: '#46761F', accentText: '#fff', accentTint: '#F1F8EA' },
  tarponAraxa: { accent: '#6DB930', accentDark: '#46761F', accentText: '#fff', accentTint: '#F1F8EA' },
  bgc: { accent: '#1F355E', accentDark: '#14233E', accentText: '#fff', accentTint: '#F1F3F6' },
  agroBgc: { accent: '#11114E', accentDark: '#11114E', accentText: '#fff', accentTint: '#F1F1F6' },
  cempra: { accent: '#45250D', accentDark: '#45250D', accentText: '#fff', accentTint: '#F7F3F0' },
  goldenDrops: { accent: '#002043', accentDark: '#002043', accentText: '#fff', accentTint: '#F0F3F7' },
  biosulfa: { accent: '#26A74F', accentDark: '#196E34', accentText: '#fff', accentTint: '#F1F6F2' },
  agrobics: { accent: '#484D50', accentDark: '#303335', accentText: '#fff', accentTint: '#F3F4F4' },
  hidrossoluvel: { accent: '#32B4DE', accentDark: '#197B9B', accentText: '#fff', accentTint: '#F0F5F7' },
};

// Altura da logo do cabeçalho por empresa: o desenho da Pilar (coluna fina + texto) tem menos
// "peso visual" que os wordmarks da Agrobiotech/Tarpon na mesma altura, então ela precisa de
// mais px para parecer do mesmo tamanho. Ajuste os valores abaixo se alguma logo nova aparecer
// grande/pequena demais no cabeçalho depois de ver na tela.
export const COMPANY_LOGO_HEIGHT = {
  agrobiotech: 56,
  pilar: 64,
  tarponFranca: 56,
  tarponAraxa: 56,
  bgc: 56,
  agroBgc: 56,
  cempra: 56,
  goldenDrops: 56,
  biosulfa: 60,
  agrobics: 56,
  hidrossoluvel: 56,
};

// Cada lista de representantes usa o mesmo visual da empresa dona dela (logo, tema, cor de
// destaque, altura da logo). Copiado por código em vez de repetido à mão de propósito: se a cor
// ou a logo de uma empresa mudar, a lista de representantes dela acompanha sozinha.
Object.entries(COMPANY_REPS).forEach(([empresa, rep]) => {
  COMPANY_ICONS[rep] = COMPANY_ICONS[empresa];
  COMPANY_HEADER_LOGOS[rep] = COMPANY_HEADER_LOGOS[empresa];
  COMPANY_HEADER_THEME[rep] = COMPANY_HEADER_THEME[empresa];
  COMPANY_ACCENT[rep] = COMPANY_ACCENT[empresa];
  COMPANY_LOGO_HEIGHT[rep] = COMPANY_LOGO_HEIGHT[empresa];
});
