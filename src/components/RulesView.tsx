import React from 'react';
import { ARENA_EFFECTS_ENABLED, ARENA_LIST } from '../data/arenas';

interface RulesViewProps {
  onStartMatch: () => void;
}

// Glossário copiado de REGRAS_DO_JOGO.md (seção 8). Mantenha os dois iguais.
const KEYWORD_GROUPS = [
  {
    title: 'Ataque e Bloqueio',
    items: [
      { name: 'Furtivo (LoR: Elusivo)', desc: 'Só pode ser bloqueado por unidades com Furtivo ou Visão Ninja.' },
      { name: 'Visão Ninja (LoR: Visão Aguçada)', desc: 'Pode bloquear atacantes Furtivos e vê as cartas Oculto do rival enquanto estiver em campo.' },
      { name: 'Perfurante (LoR: Sobrepujar)', desc: 'O dano excedente acima da Vida do bloqueador atinge diretamente a Vitalidade inimiga.' },
      { name: 'Golpe Veloz (LoR: Ataque Rápido)', desc: 'Ao atacar, golpeia antes do bloqueador.' },
      { name: 'Combo (LoR: Ataque Duplo)', desc: 'Ao atacar, golpeia antes e novamente junto com o bloqueador.' },
      { name: 'Provocar (LoR: Desafiador)', desc: 'O jogador atacante escolhe qual unidade inimiga vai bloquear este atacante (como no LoR).' },
      { name: 'Intimidação (LoR: Assustador)', desc: 'Só pode ser bloqueado por inimigos com 3 ou mais de Poder.' },
      { name: 'Ímpeto (LoR: Imprudente)', desc: 'Só pode ser bloqueado por inimigos com 3 ou mais de Vida.' },
      { name: 'Muralha (LoR: Formidável)', desc: 'Ataca usando sua Vida atual no lugar do Poder.' },
      { name: 'Ataque à Vitalidade (LoR: Impacto)', desc: 'Ao golpear atacando, causa 1 de dano direto à Vitalidade inimiga por acúmulo.' },
      { name: 'Sem Guarda (LoR: Não Bloqueia) / Imobilizado (LoR: Imóvel)', desc: 'Não pode bloquear ataques, ou não pode atacar nem bloquear.' },
    ],
  },
  {
    title: 'Proteção e Sobrevivência',
    items: [
      { name: 'Substituição (LoR: Barreira)', desc: 'Anula o próximo dano recebido durante a rodada.' },
      { name: 'Contra-Jutsu (LoR: Escudo de Feitiço)', desc: 'Anula o próximo Jutsu ou habilidade hostil direcionada à unidade.' },
      { name: 'Resistente (LoR: Robusto)', desc: 'Sofre 1 de dano a menos de todas as fontes.' },
      { name: 'Cura Natural (LoR: Regeneração)', desc: 'Restaura toda sua Vida máxima no início de cada rodada.' },
      { name: 'Segunda Chance (LoR: Imortal)', desc: 'Na primeira vez que morreria, retorna ao campo Paralisado com 1 de Vida.' },
      { name: 'Absorção de Chakra (LoR: Roubo de Vida) / Dreno de Chakra (LoR: Drenar)', desc: 'Todo dano causado por esta unidade ou efeito cura a sua Vitalidade.' },
    ],
  },
  {
    title: 'Efeitos Negativos',
    items: [
      { name: 'Paralisia (LoR: Atordoar)', desc: 'Remove do combate atual e impede que a unidade ataque ou bloqueie nesta rodada.' },
      { name: 'Bloqueio de Chakra (LoR: Congelar)', desc: 'Reduz o Poder da unidade para 0 nesta rodada.' },
      { name: 'Recuar (LoR: Retornar)', desc: 'Devolve a carta à mão do dono, limpando bônus e efeitos. Um Token afetado por Recuar deixa de existir.' },
      { name: 'Selado (LoR: Silenciado)', desc: 'Remove texto de habilidade e todas as palavras-chave da unidade, e desliga os bônus do Equipamento enquanto durar.' },
      { name: 'Exposto (LoR: Vulnerável)', desc: 'Permite que atacantes inimigos forcem esta unidade a bloquear.' },
      { name: 'Clone (LoR: Efêmero)', desc: 'Morre após golpear ou ao fim da rodada (o Token Clone das Sombras tem Clone).' },
      { name: 'Veneno X', desc: 'Ao golpear e causar dano, envenena o alvo: no início de cada rodada ele sofre 1 de dano, por X rodadas. Não acumula: um novo Veneno só renova a duração. O dano de Veneno ignora Substituição e Resistente.' },
      { name: 'Genjutsu (estado)', desc: 'Não ataca nem bloqueia até o fim da próxima rodada. Só o efeito Kai remove. Diferente da Paralisia (física), que dura só a rodada atual e que Kai não remove.' },
      { name: 'Kai (Jutsu Genjutsu, Rápido)', desc: 'Remove Genjutsu e Selado de um aliado (não remove Paralisia).' },
      { name: 'Exaustão (LoR: Melancolia)', desc: 'Aplica -1/-1 permanente cumulativo na unidade.' },
      { name: 'Maldição (LoR: Amaldiçoar)', desc: 'Aumenta o custo de Chakra de cartas na mão.' },
      { name: 'Aprisionar (LoR: Capturar)', desc: 'Remove um alvo do campo até a unidade que aplicou Aprisionar sair de jogo.' },
    ],
  },
  {
    title: 'Gatilhos e Crescimento',
    items: [
      { name: 'Ninja Único', desc: 'Só pode haver 1 cópia de cada Ninja em campo, incluindo as formas Gennin, Chuunin e Jounnin. A segunda cópia só pode ser jogada depois que a primeira morrer; até lá, cópias que chegam à mão viram o Exclusivo.' },
      { name: 'Jutsu Exclusivo', desc: 'Jutsu próprio de cada Ninja; não entra no baralho e é criado na mão sempre que o Ninja entra em campo. Cópias repetidas do Ninja viram o Token Exclusivo (se houver) ou o Jutsu Exclusivo (veja 4.1).' },
      { name: 'Token Exclusivo', desc: 'Token próprio de um Ninja (opcional). Quando definido, é a carta em que as cópias repetidas do Ninja se transformam.' },
      { name: 'Entrada (LoR: Jogar) / Investida (LoR: Atacar) / Último Desejo (LoR: Suspiro Final)', desc: 'Disparam ao invocar da mão, ao declarar ataque ou ao morrer.' },
      { name: 'Habilidades recorrentes', desc: 'Além da Entrada, um Ninja ou Unidade pode ter gatilhos que disparam várias vezes na partida. Os alvos são automáticos. Unidades Seladas não disparam, e Contra-Jutsu anula o efeito inimigo na unidade.' },
      { name: 'Início da rodada / Fim da rodada', desc: 'Disparam no começo de cada rodada (depois da compra) e no fim dela (antes de os Clones caírem). Começa quem tem a Ficha de Ataque.' },
      { name: 'Investida (Ao atacar) / Ao bloquear', desc: 'Investida dispara ao ser declarado atacante; Ao bloquear dispara ao bloquear, antes dos golpes.' },
      { name: 'Ao golpear', desc: 'Dispara quando a unidade golpeia em combate (atacando ou bloqueando) e continua viva.' },
      { name: 'Ao conjurar', desc: 'Dispara sempre que você resolve um Jutsu com a unidade em campo.' },
      { name: 'Vingança / Último Desejo', desc: 'Vingança dispara quando outro aliado seu morre; Último Desejo dispara quando a própria unidade morre.' },
      { name: 'Repouso', desc: 'Dispara no fim da rodada se a unidade não atacou nem bloqueou nela.' },
      { name: 'Apoio (LoR: Auxiliar)', desc: 'Ao atacar, concede bônus temporário ao aliado posicionado à sua direita na linha de ataque.' },
      { name: 'Fluxo de Chakra (LoR: Imbuir)', desc: 'Dispara efeitos sempre que você resolve um Jutsu.' },
      { name: 'Formação', desc: 'Bônus +1/+1 enquanto você controla 3 ou mais aliados em campo (quaisquer aliados, incluindo a própria unidade; Tokens contam). Nunca é requisito para jogar a carta e não acumula (1 por carta).' },
      { name: 'Parceiro', desc: 'Token que acompanha um Ninja (ex.: Akamaru). Se o Ninja sair de campo, o Parceiro vai com ele.' },
      { name: 'Copiar', desc: 'Quando um Jutsu do rival resolve, cria uma cópia Fugaz dele na sua mão, 1 vez por rodada. Não copia Jutsu Exclusivo nem outra cópia. A cópia Fugaz que ficar na mão some no fim da rodada.' },
      { name: 'Cadeia de Jutsus (LoR: Fluxo) / Contagem (LoR: Contagem)', desc: 'Cadeia de Jutsus ativa na rodada seguinte após conjurar 2+ Jutsus; Contagem reduz marcadores por rodada até disparar.' },
      { name: 'Sede de Batalha (LoR: Fúria)', desc: 'Ganha +1/+1 permanente ao abater uma unidade em combate.' },
      { name: 'Determinação (LoR: Destinado)', desc: 'Ganha +1/+1 permanente na 1ª vez na rodada que você a alveja com Jutsu ou Equipamento.' },
      { name: 'Treinamento (LoR: Aperfeiçoar)', desc: 'Ganha +1/+0 permanente ao jogar cartas criadas ou equipar aliados.' },
      { name: 'Promoção (LoR: Subir de Nível)', desc: 'Promoção de um Ninja pelas patentes Gennin → Chuunin → Jounnin ao cumprir suas missões.' },
      { name: 'Despertar (LoR: Evoluir)', desc: 'Ganha +2/+2 depois que você jogar unidades com 6 palavras-chave positivas distintas.' },
      { name: 'Chakra Extra (LoR: Espírito) / Legado (LoR: Sagrado)', desc: 'Chakra Extra acumula +1/+1; Legado deixa +1/+0 cumulativo ao morrer para fortalecer o primeiro atacante aliado.' },
      { name: 'Meditação (LoR: Sintonia)', desc: 'Recarrega +1 de Reserva de Jutsu ao entrar.' },
    ],
  },
];

export const RulesView: React.FC<RulesViewProps> = ({ onStartMatch }) => {
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
            <li><strong className="text-amber-200">Vitória:</strong> reduza a Vitalidade adversária a 0 (ataques não bloqueados, excedente de Perfurante, Ataque à Vitalidade, habilidades ou Jutsus diretos).</li>
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
            <li><strong className="text-purple-300">Oculto (velocidade de Jutsu):</strong> joga virado para baixo, só fora de combate com a Pilha vazia; ativa no gatilho. Máx. <strong>3</strong> em jogo. O disparo entra na Pilha como <strong>Rápido</strong>. Detectar/Revelar descarta Ocultos sem ativá-los. (Tipo Armadilha removido.)</li>
            <li><strong className="text-cyan-300">Equipamentos:</strong> 1 por aliado (equipar outro devolve o anterior à mão). Voltam à mão quando o portador sai de campo; são destruídos se a mão tiver 9 cartas. Com o portador <strong>Selado</strong>, ficam ligados a ele, mas bônus e palavras-chave ficam desligados.</li>
            <li><strong className="text-orange-300">Tokens:</strong> criados por habilidades e Jutsus; não entram no baralho. Dependendo da carta, um Token é uma Unidade (vai ao campo e conta como Unidade em todas as regras) ou um Jutsu (vai para a mão). Um Ninja pode ter um Token Exclusivo. Tokens com Clone (como o Clone das Sombras) somem ao golpear ou no fim da rodada. Token que sofre Recuar deixa de existir.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#111927] p-5 space-y-2.5">
          <h2 className="text-base font-display font-bold text-amber-300">04. Velocidades de Jutsu e Pilha (LIFO)</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><strong className="text-emerald-300">Instantâneo:</strong> a qualquer momento (mesmo em combate ou com a Pilha cheia); não entra na Pilha, o oponente não responde, resolve na hora e você mantém a vez.</li>
            <li><strong className="text-sky-300">Rápido:</strong> a qualquer momento (inclusive em combate ou como resposta); entra na Pilha e o oponente pode responder com Rápido ou Instantâneo.</li>
            <li><strong className="text-amber-300">Preparado:</strong> só fora de combate e com a Pilha vazia; entra na Pilha e passa a prioridade antes de resolver. </li>
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
            <li><strong className="text-white">Início da Rodada:</strong> o Chakra enche até o novo máximo, a Reserva guarda até 3, ambos compram 1 carta, Cura Natural cura totalmente, efeitos temporários, Paralisia e Bloqueio de Chakra expiram, Clones caem e a Ficha de Ataque alterna.</li>
            <li><strong className="text-white">Arrasto:</strong> Ninjas/Unidades vão da mão ao campo; Equipamentos vão sobre um aliado; Jutsus e Ocultos vão ao alvo (ou à zona central).</li>
            <li><strong className="text-amber-200">Atacar:</strong> com a Ficha ativa, arraste os atacantes para a <strong>Zona de Combate</strong>; Passar Turno dispara o ataque. Atacante com <strong>Provocar</strong> (ou contra um inimigo <strong>Exposto</strong>): clique nele e depois no inimigo, ou arraste-o até o inimigo, para escolher quem vai bloquear. O defensor não pode trocar esse bloqueio.</li>
            <li><strong className="text-amber-200">Bloquear:</strong> arraste defensores sobre os atacantes; Passar Turno resolve. Todo ataque passa pela fase de bloqueio; qualquer atacante que não for bloqueado acerta a Vitalidade com todo o seu Poder.</li>
            <li><strong className="text-white">Resolução:</strong> Golpe Veloz golpeia primeiro e, se abater o bloqueador, não sofre contra-ataque; Combo golpeia antes e de novo junto com o bloqueador. <strong>Passar Duplo:</strong> se ambos passam seguidos sem agir, a rodada termina.</li>
          </ul>
        </section>
      </div>

      {/* Categorized Keywords */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-display font-bold text-white">06. Glossário de Palavras-Chave</h2>
          <p className="text-xs text-slate-400 mt-1">
            Termos gerais do mundo ninja; nomes de técnicas, clãs e personagens ficam só nas cartas. Entre parênteses, o equivalente em Legends of Runeterra.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Palavras-chave cortadas na Parte 5: Batedor, Instável, Iniciativa, Sequência, Pilhagem e Emboscada. Os bônus que existiam viraram texto da própria carta (ex.: "Se for sua 1ª carta da rodada: …").
          </p>
        </div>
        {KEYWORD_GROUPS.map((group) => (
          <section key={group.title} className="rounded-xl border border-slate-800 bg-[#111927] p-5">
            <h2 className="text-base font-display font-bold text-white mb-3.5">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {group.items.map((kw) => (
                <div key={kw.name} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-sm font-semibold text-amber-300">{kw.name}</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{kw.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Arenas: só com ARENA_EFFECTS_ENABLED (hoje o fundo de batalha é fixo) */}
      {ARENA_EFFECTS_ENABLED && (
      <section className="rounded-xl border border-slate-800 bg-[#111927] p-5">
        <h2 className="text-base font-display font-bold text-white mb-4">
          {ARENA_EFFECTS_ENABLED
            ? 'Arenas Dinâmicas (sorteadas a cada partida ou trocadas por Jutsu/Habilidade)'
            : 'Cenários das Arenas (sorteados a cada partida · sem efeito de regra)'}
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
              {ARENA_EFFECTS_ENABLED && (
                <p className="p-3 text-xs text-slate-300 leading-relaxed">{arena.detailedRule}</p>
              )}
            </div>
          ))}
        </div>
      </section>
      )}
    </div>
  );
};
