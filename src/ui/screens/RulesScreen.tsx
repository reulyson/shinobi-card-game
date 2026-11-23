import React from 'react';
import { ARENA_EFFECTS_ENABLED, ARENA_LIST } from '../../data/arenas';
import { KEYWORD_ICON_CREDITS } from '../../data/keywordIconCredits';
import { CardIcon } from '../card/CardIcon';
import type { CardIconId } from '../card/theme';

interface RulesScreenProps {
  onStartMatch: () => void;
}

const TERM_GROUPS: Array<{
  title: string;
  subtitle: string;
  cardCls: string;
  titleCls: string;
  nameCls: string;
  items: Array<{ name: string; desc: string }>;
}> = [
  {
    title: 'Palavras-chave',
    subtitle: 'Habilidades estáticas que ficam na carta',
    cardCls: 'border-amber-500/35 bg-[#111927]',
    titleCls: 'text-amber-300',
    nameCls: 'text-amber-300',
    items: [
      { name: 'Furtivo', desc: 'Só bloqueado por Furtivo ou Sensor.' },
      { name: 'Sensor', desc: 'Bloqueia Furtivos; vê Ocultos.' },
      { name: 'Perfurante', desc: 'Dano excedente vai à Vitalidade.' },
      { name: 'Ágil', desc: 'Golpeia antes do bloqueador.' },
      { name: 'Veloz', desc: 'Golpeia antes e de novo junto com o bloqueador.' },
      { name: 'Provocar', desc: 'Atacante escolhe quem bloqueia.' },
      { name: 'Intimidação', desc: 'Só bloqueado por Poder 3+.' },
      { name: 'Imprudente', desc: 'Só bloqueado por Vida 3+.' },
      { name: 'Muralha', desc: 'Golpeia usando a Vida no lugar do Poder.' },
      { name: 'Impacto', desc: 'Ao golpear atacando, causa 1 de dano à Vitalidade.' },
      { name: 'Imobilizado', desc: 'Não ataca nem bloqueia.' },
      { name: 'Indefeso', desc: 'Não pode bloquear.' },
      { name: 'Esquiva', desc: 'Começa com escudo que anula o próximo dano.' },
      { name: 'Anulação', desc: 'Começa com escudo contra o próximo Jutsu/efeito inimigo.' },
      { name: 'Resistente', desc: 'Sofre 1 de dano a menos.' },
      { name: 'Regenerar', desc: 'Cura toda a Vida no início da rodada.' },
      { name: 'Renascer', desc: 'Na 1ª morte volta Paralisado com 1 de Vida.' },
      { name: 'Roubo de Vida', desc: 'Ao golpear, cura a sua Vitalidade pelo dano causado.' },
      { name: 'Drenar', desc: 'O dano deste efeito cura a sua Vitalidade.' },
      { name: 'Clone', desc: 'Morre ao golpear ou no fim da rodada.' },
      { name: 'Fúria', desc: '+1/+1 permanente ao abater em combate.' },
      { name: 'Determinação', desc: '+1/+1 na 1ª vez por rodada que você a alveja.' },
      { name: 'Treinamento', desc: '+1/+0 permanente ao equipar ou jogar cartas criadas.' },
      { name: 'Despertar', desc: 'Ganha +2/+2 após você jogar 6 palavras-chave positivas distintas.' },
      { name: 'Legado', desc: 'Ao morrer, próximo atacante aliado ganha +1/+0.' },
      { name: 'Concentrar', desc: 'Ao entrar, +1 Reserva de Jutsu (máx. 3).' },
      { name: 'Apoio', desc: 'Ao atacar, +1/+1 (+2/+2 Jounnin) ao atacante aliado à direita.' },
      { name: 'Veneno', desc: 'Ao causar dano, aplica o Status Envenenado.' },
      { name: 'Parceiro', desc: 'Token acompanha o Ninja; sai de campo junto com ele.' },
      { name: 'Formação', desc: '+1/+1 enquanto você tiver 3+ aliados em campo.' },
      { name: 'Copiar', desc: 'Cria cópia Fugaz de Jutsu rival (1×/rodada).' },
      { name: 'Fluxo', desc: 'Ativa na rodada seguinte se você conjurou 2+ Jutsus.' },
      { name: 'Ressonância', desc: 'Dispara sempre que você resolve um Jutsu.' },
      { name: 'Fugaz / Exclusivo', desc: 'Propriedades de carta (Fugaz some da mão no fim da rodada; Exclusivo não vai ao baralho).' },
    ],
  },
  {
    title: 'Status',
    subtitle: 'Estados temporários aplicados a uma unidade',
    cardCls: 'border-violet-500/35 bg-[#111927]',
    titleCls: 'text-violet-300',
    nameCls: 'text-violet-300',
    items: [
      { name: 'Esquiva ativa', desc: 'Anula o próximo dano nesta rodada.' },
      { name: 'Anulação ativa', desc: 'Anula o próximo Jutsu/efeito inimigo.' },
      { name: 'Paralisado', desc: 'Não ataca nem bloqueia na rodada.' },
      { name: 'Bloqueio de Chakra', desc: 'Poder 0 na rodada.' },
      { name: 'Selado', desc: 'Sem habilidades/palavras-chave; Equipamento desligado.' },
      { name: 'Genjutsu', desc: 'Não ataca nem bloqueia até Kai remover.' },
      { name: 'Envenenado', desc: '1 de dano no início da rodada por X rodadas (ignora Esquiva e Resistente).' },
      { name: 'Formação ativa', desc: '+1/+1 enquanto houver 3+ aliados.' },
      { name: 'Exposto', desc: 'Atacantes podem forçar a bloquear.' },
      { name: 'Exaustão', desc: '-1/-1 aplicado por efeito.' },
      { name: 'Bônus temporário (+X/+Y nesta rodada)', desc: 'Modificador de Poder e Vida até o fim da rodada.' },
      { name: 'Cópia Fugaz (carta na mão)', desc: 'Cópia que some da mão no fim da rodada.' },
    ],
  },
  {
    title: 'Gatilhos',
    subtitle: 'Dizem quando algo acontece',
    cardCls: 'border-emerald-500/35 bg-[#111927]',
    titleCls: 'text-emerald-300',
    nameCls: 'text-emerald-300',
    items: [
      { name: 'Entrada', desc: 'Dispara ao entrar em campo.' },
      { name: 'Investida (Ao atacar)', desc: 'Dispara ao ser declarado atacante.' },
      { name: 'Ao bloquear', desc: 'Dispara ao bloquear, antes dos golpes.' },
      { name: 'Ao golpear', desc: 'Dispara ao golpear em combate.' },
      { name: 'Ao abater', desc: 'Dispara ao matar a unidade inimiga em combate.' },
      { name: 'Ao sofrer dano', desc: 'Dispara ao perder Vida e sobreviver.' },
      { name: 'Ao conjurar', desc: 'Quando você resolve um Jutsu.' },
      { name: 'Último Desejo (Ao morrer)', desc: 'Quando a própria unidade morre.' },
      { name: 'Vingança', desc: 'Quando outro aliado morre.' },
      { name: 'Início da rodada', desc: 'No começo da rodada, após a compra.' },
      { name: 'Fim da rodada', desc: 'No fim da rodada.' },
      { name: 'Repouso', desc: 'No fim da rodada se não atacou nem bloqueou.' },
      { name: 'Gatilhos de Oculto ("Quando o rival atacar/conjurar/invocar")', desc: 'Carta virada ativa na ação do rival.' },
    ],
  },
  {
    title: 'Ações',
    subtitle: 'Verbos com regra própria no texto da habilidade',
    cardCls: 'border-orange-500/35 bg-[#111927]',
    titleCls: 'text-orange-300',
    nameCls: 'text-orange-300',
    items: [
      { name: 'Causar dano', desc: 'Dano direto a alvo ou Vitalidade.' },
      { name: 'Curar', desc: 'Cura Vida (alvo) ou Vitalidade.' },
      { name: 'Paralisar', desc: 'Aplica o status Paralisado.' },
      { name: 'Selar', desc: 'Aplica o status Selado.' },
      { name: 'Bloquear chakra', desc: 'Aplica Bloqueio de Chakra.' },
      { name: 'Dar Esquiva', desc: 'Concede escudo de Esquiva.' },
      { name: 'Envenenar', desc: 'Aplica o status Envenenado.' },
      { name: 'Aplicar Genjutsu / Kai', desc: 'Genjutsu aplica imobilização; Kai remove Genjutsu e Selado.' },
      { name: 'Comprar', desc: 'Compra carta do baralho.' },
      { name: 'Drenar Reserva / perder Reserva', desc: 'Tira Reserva de Jutsu do rival.' },
      { name: 'Recarregar Reserva', desc: 'Soma Reserva de Jutsu.' },
      { name: 'Criar (carta na mão)', desc: 'Cria carta na mão.' },
      { name: 'Invocar', desc: 'Invoca Token ou unidade em campo.' },
      { name: 'Equipar', desc: 'Anexa Equipamento a um aliado.' },
      { name: 'Ganhar palavra-chave até a próxima rodada', desc: 'Concede palavra-chave temporária.' },
      { name: 'Pagar Vida', desc: 'Paga pontos da sua própria Vitalidade.' },
      { name: 'Atravessar', desc: 'Ignora bloqueadores ou atinge direto através da defesa.' },
    ],
  },
];

export const RulesScreen: React.FC<RulesScreenProps> = ({ onStartMatch }) => {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Naruto Combate — Documentação Oficial (v2)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manual oficial com regras de deck, Promoção em 3 níveis (Gennin → Chuunin → Jounnin), Pilha LIFO e combate tático.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartMatch}
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          Jogar Agora
        </button>
      </div>

      {/* Core Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-2.5">
          <h2 className="text-base font-display font-bold text-amber-300">01. Objetivo e Condição de Vitória</h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li>Cada jogador começa com <strong>Vitalidade 20</strong>, 5 cartas na mão e um baralho de 24 cartas.</li>
            <li><strong className="text-amber-200">Vitória:</strong> reduza a Vitalidade adversária a 0 (ataques não bloqueados, excedente de Perfurante, Impacto, habilidades ou Jutsus diretos).</li>
            <li><strong className="text-white">Campo:</strong> até 5 aliados (Ninjas, Unidades ou Tokens) e até 3 Ocultos em jogo por lado; mão máx. 9.</li>
            <li><strong className="text-white">Sorteio:</strong> quem vai primeiro é sorteado e começa com a Ficha de Ataque na Rodada 1.</li>
            <li><strong className="text-white">Mulligan:</strong> antes da Rodada 1, troque uma única vez qualquer quantidade das 5 cartas iniciais.</li>
            <li><strong className="text-red-300">Baralho vazio:</strong> precisar comprar com o baralho vazio é derrota na hora.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-2.5">
          <h2 className="text-base font-display font-bold text-amber-300">02. Baralho e Chakra</h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li><strong className="text-white">24 cartas exatas.</strong> Máx. 3 Ninjas distintos, até 2 cópias de cada (máx. 6 cartas de Ninja).</li>
            <li>Unidades, Jutsus e Equipamentos: até 3 cópias. Tokens não entram no baralho.</li>
            <li><strong className="text-rose-300">Jutsus Exclusivos e Tokens não entram no baralho:</strong> são criados durante a partida.</li>
            <li><strong className="text-sky-300">Chakra:</strong> começa em 1/1 e sobe +1 por rodada até 10/10.</li>
            <li><strong className="text-sky-300">Reserva de Jutsu:</strong> até 3 de Chakra não gasto ficam guardados; só servem para Jutsus (incl. armar Ocultos) e são gastos antes do Chakra principal.</li>
            <li><strong className="text-sky-300">Custo mínimo 1:</strong> nenhuma carta custa menos de 1 depois de descontos, e os descontos somados valem no máximo −2 por carta. Aumentos (ex.: Maldição) somam por cima.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-2.5">
          <h2 className="text-base font-display font-bold text-amber-300">03. Tipos de Cartas + Tokens</h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li><strong className="text-amber-200">Ninjas (3 níveis):</strong> sobem de <strong>Gennin → Chuunin → Jounnin</strong> ao cumprir missões em campo. Cada graduação tem sua imagem.</li>
            <li><strong className="text-amber-200">Jogar um Ninja:</strong> custa só <strong>Chakra principal</strong> (a Reserva de Jutsu não paga Ninjas) e ele entra sempre como <strong>Gennin</strong>, com a habilidade de Entrada e o Jutsu Exclusivo criado na mão.</li>
            <li><strong className="text-rose-300">Ninja Único:</strong> só 1 cópia de cada Ninja em campo, em qualquer forma. A segunda cópia só pode ser jogada depois que a primeira morrer: enquanto ele está em campo, qualquer cópia que chegar à sua mão (compra, retorno, criada ou roubada) vira na hora o Jutsu/Token Exclusivo dele (ou o Jutsu geral).</li>
            <li><strong className="text-emerald-300">Patente salva:</strong> quando o Ninja morre, as cópias transformadas na mão voltam a ser o Ninja e o jogo guarda a patente e o progresso da promoção. A próxima cópia entra nessa patente (indicador ★ na carta) pagando o custo dela: Gennin = custo normal, Chuunin = +1, Jounnin = +2 (só Chakra principal, mín. 1, descontos até −2).</li>
            <li><strong className="text-rose-300">Jutsu Exclusivo:</strong> não entra no baralho. Sempre que o Ninja entra em campo (da mão ou por efeito), 1 cópia do Jutsu Exclusivo dele é criada na sua mão. Conjurá-lo com o Ninja em campo conta +1 na missão de Promoção.</li>
            <li><strong className="text-rose-300">Cópia repetida e Token Exclusivo:</strong> enquanto o Ninja estiver em campo, as cópias dele na mão (ou compradas depois) viram o Token Exclusivo dele, se tiver um, ou o Jutsu Exclusivo, e voltam a ser o Ninja quando ele morre (com a patente salva). Se um efeito tentar invocar outra cópia, a invocação falha e você recebe essa mesma carta na mão.</li>
            <li><strong className="text-slate-100">Unidades:</strong> tropas das vilas (Anbu, Raiz, Médicos de Campo, Oinin etc.). Não são promovidas.</li>
            <li><strong className="text-sky-300">Jutsus:</strong> Ataque (direto, individual, múltiplo, área), Fortalecer, Enfraquecer, Cura, Invocação e Detectar/Revelar (categoria própria, remove cartas Oculto).</li>
            <li><strong className="text-purple-300">Oculto (velocidade de Jutsu):</strong> joga virado para baixo, só fora de combate com a Pilha vazia; ativa no gatilho. Máx. <strong>3</strong> em jogo. O disparo entra na Pilha como <strong>Rápido</strong>. Detectar/Revelar descarta Ocultos sem ativá-los.</li>
            <li><strong className="text-cyan-300">Equipamentos:</strong> 1 por aliado (equipar outro devolve o anterior à mão). Voltam à mão quando o portador sai de campo; são destruídos se a mão tiver 9 cartas. Com o portador <strong>Selado</strong>, ficam ligados a ele, mas bônus e palavras-chave ficam desligados.</li>
            <li><strong className="text-orange-300">Tokens:</strong> criados por habilidades e Jutsus; não entram no baralho. Dependendo da carta, um Token é uma Unidade (vai ao campo e conta como Unidade em todas as regras) ou um Jutsu (vai para a mão). Um Ninja pode ter um Token Exclusivo. Tokens com Clone (como o Clone das Sombras) somem ao golpear ou no fim da rodada. Token que sofre Recuar deixa de existir.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-2.5">
          <h2 className="text-base font-display font-bold text-amber-300">04. Velocidades de Jutsu e Pilha (LIFO)</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><strong className="text-emerald-300">Instantâneo:</strong> a qualquer momento (mesmo em combate ou com a Pilha cheia); não entra na Pilha, o oponente não responde, resolve na hora e você mantém a vez.</li>
            <li><strong className="text-sky-300">Rápido:</strong> a qualquer momento (inclusive em combate ou como resposta); entra na Pilha e o oponente pode responder com Rápido ou Instantâneo.</li>
            <li><strong className="text-amber-300">Preparado:</strong> só fora de combate e com a Pilha vazia; entra na Pilha e passa a prioridade antes de resolver.</li>
            <li><strong className="text-teal-300">Concentrado:</strong> só fora de combate e com a Pilha vazia; não entra na Pilha e resolve na hora, sem resposta (compra, invocação e utilidade).</li>
            <li><strong className="text-purple-300">Oculto:</strong> só fora de combate e com a Pilha vazia; joga virado para baixo e ativa no gatilho (máx. 3 em jogo).</li>
          </ul>
          <p className="text-xs text-slate-400 pt-1">
            Quando ambos param de responder e o jogador ativo clica em <strong>Passar Turno</strong>, a Pilha resolve de cima para baixo (o último a entrar resolve primeiro).
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-2.5 md:col-span-2">
          <h2 className="text-base font-display font-bold text-amber-300">05. Fluxo de Turno e Combate por Arrasto (um único botão)</h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li><strong className="text-white">Início da Rodada:</strong> o Chakra enche até o novo máximo, a Reserva guarda até 3, ambos compram 1 carta, Regenerar cura totalmente, efeitos temporários, Paralisado e Bloqueio de Chakra expiram, Clones caem e a Ficha de Ataque alterna.</li>
            <li><strong className="text-white">Arrasto:</strong> Ninjas/Unidades vão da mão ao campo; Equipamentos vão sobre um aliado; Jutsus e Ocultos vão ao alvo (ou à zona central).</li>
            <li><strong className="text-amber-200">Atacar:</strong> com a Ficha ativa, arraste os atacantes para a <strong>Zona de Combate</strong>; Passar Turno dispara o ataque. Atacante com <strong>Provocar</strong> (ou contra um inimigo <strong>Exposto</strong>): clique nele e depois no inimigo, ou arraste-o até o inimigo, para escolher quem vai bloquear. O defensor não pode trocar esse bloqueio.</li>
            <li><strong className="text-amber-200">Bloquear:</strong> arraste defensores sobre os atacantes; Passar Turno resolve. Todo ataque passa pela fase de bloqueio; qualquer atacante que não for bloqueado acerta a Vitalidade com todo o seu Poder.</li>
            <li><strong className="text-white">Resolução:</strong> Ágil golpeia primeiro e, se abater o bloqueador, não sofre contra-ataque; Veloz golpeia antes e de novo junto com o bloqueador. <strong>Passar Duplo:</strong> se ambos passam seguidos sem agir, a rodada termina.</li>
          </ul>
        </section>
      </div>

      {/* Glossário em 4 grupos coloridos */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-display font-bold text-white">06. Termos do Jogo (4 grupos)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Termos organizados conforme aparecem no detalhe lateral da carta: Palavras-chave (âmbar), Status (violeta), Gatilhos (verde) e Ações (laranja).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {TERM_GROUPS.map((group) => (
            <section key={group.title} className={`rounded-xl border p-5 ${group.cardCls}`}>
              <div className="mb-3">
                <h3 className={`text-base font-display font-bold ${group.titleCls}`}>{group.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{group.subtitle}</p>
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed">
                {group.items.map((item) => (
                  <li key={item.name} className="text-slate-300">
                    <span className={`font-semibold ${group.nameCls}`}>{item.name}</span>
                    {' — '}
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* Arenas: só com ARENA_EFFECTS_ENABLED */}
      {ARENA_EFFECTS_ENABLED && (
        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5">
          <h2 className="text-base font-display font-bold text-white mb-4">
            Arenas Dinâmicas (sorteadas a cada partida ou trocadas por Jutsu/Habilidade)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ARENA_LIST.map((arena) => (
              <div
                key={arena.id}
                className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex flex-col"
              >
                <div className="h-28 relative">
                  <img
                    src={arena.imageUrl}
                    alt={arena.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <div className="text-sm font-display font-bold text-white">{arena.name}</div>
                    <div className="text-[11px] text-slate-300">{arena.subtitle}</div>
                  </div>
                </div>
                <p className="p-3 text-xs text-slate-300 leading-relaxed">{arena.detailedRule}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Créditos dos ícones */}
      <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-4">
        <div>
          <h2 className="text-base font-display font-bold tracking-wide text-white uppercase">
            Créditos
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Ícones das palavras-chave:{' '}
            <strong className="text-white">game-icons.net</strong> (Lorc, Delapouite, Skoll, Darkzaitzev e colaboradores), licença{' '}
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 underline hover:text-amber-200"
            >
              CC BY 3.0
            </a>
            ; <strong className="text-white">Lucide</strong> (ISC); <strong className="text-white">Phosphor Icons</strong> (MIT). Alguns ícones foram recoloridos ou adaptados.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
          {KEYWORD_ICON_CREDITS.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2.5 text-xs leading-relaxed">
              <CardIcon id={entry.id} size={18} className="shrink-0 mt-0.5" title={entry.name} />
              <div className="text-slate-300">
                <strong className="text-amber-300">{entry.name}</strong>
                {' — '}
                <span>{entry.credit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
