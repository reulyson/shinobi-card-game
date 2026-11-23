import type { AppDomain, ScreenFromDomain } from '../../navigation/domains';

export type DomainAccent = 'ember' | 'sky' | 'jade' | 'violet' | 'saffron';

export type MenuDomain = Exclude<ScreenFromDomain, 'battle'>;

export interface DomainPageMeta {
  domain: AppDomain;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: DomainAccent;
}

export const DOMAIN_PAGE_META: Record<MenuDomain, DomainPageMeta> = {
  lobby: {
    domain: 'lobby',
    eyebrow: 'Dojo · Início',
    title: 'Portal do Shinobi',
    subtitle: 'Status do deck, atalhos e duelo em um só lugar.',
    accent: 'ember',
  },
  grimorio: {
    domain: 'grimorio',
    eyebrow: 'Consulta · Biblioteca',
    title: 'Grimório de Cartas',
    subtitle: 'Leia efeitos, compare promoções e filtre o catálogo — aqui você não edita o baralho.',
    accent: 'sky',
  },
  'montar-deck': {
    domain: 'montar-deck',
    eyebrow: 'Construção · Baralho',
    title: 'Montar seu Deck',
    subtitle: 'Gerencie seus baralhos salvos. Só abre o catálogo de cartas ao criar ou editar um deck.',
    accent: 'jade',
  },
  'guia-ninja': {
    domain: 'guia-ninja',
    eyebrow: 'Domínio · Guia Ninja',
    title: 'Documentação Oficial',
    subtitle: 'Regras de deck, pilha LIFO, promoção Gennin → Jounnin e glossário de palavras-chave.',
    accent: 'violet',
  },
  historico: {
    domain: 'historico',
    eyebrow: 'Domínio · Histórico',
    title: 'Batalhas & Estatísticas',
    subtitle: 'Vitórias por arena, jutsus mais conjurados e duração média dos duelos.',
    accent: 'saffron',
  },
};

export const ACCENT_CLASS: Record<DomainAccent, string> = {
  ember: 'domain-accent-ember',
  sky: 'domain-accent-sky',
  jade: 'domain-accent-jade',
  violet: 'domain-accent-violet',
  saffron: 'domain-accent-saffron',
};