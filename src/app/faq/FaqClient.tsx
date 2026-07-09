'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type FaqItem = { q: string; a: string | React.ReactNode }

const PLATAFORMA: FaqItem[] = [
  {
    q: 'O que é o MeuSemestreUCSAL?',
    a: 'É uma plataforma independente onde alunos da UCSAL avaliam professores de forma anônima. O objetivo é ajudar outros alunos a escolherem melhor seus professores e montar uma grade ideal.',
  },
  {
    q: 'Minha identidade fica exposta ao avaliar?',
    a: 'Não. Sua identidade é completamente anônima nas avaliações públicas. Usamos seu e-mail apenas para autenticação e controle de duplicidade — ele nunca aparece associado a nenhuma avaliação.',
  },
  {
    q: 'Preciso de conta para ver as avaliações?',
    a: 'Não. Qualquer pessoa pode ver os perfis de professores e as avaliações sem precisar entrar. A conta é necessária apenas para enviar uma avaliação.',
  },
  {
    q: 'Como faço login? Não existe senha?',
    a: 'Usamos login por código OTP (sem senha). Digite seu e-mail institucional @ucsal.edu.br, receba um código no seu e-mail e pronto — você está dentro.',
  },
  {
    q: 'Posso avaliar o mesmo professor mais de uma vez?',
    a: 'Você pode avaliar o mesmo professor em disciplinas diferentes. Mas só é permitida uma avaliação por professor por disciplina.',
  },
  {
    q: 'Posso editar uma avaliação depois de enviar?',
    a: 'Não é possível editar, mas você pode remover sua avaliação e enviar uma nova. Acesse seu perfil para gerenciar suas avaliações.',
  },
  {
    q: 'O que são as disciplinas EAD?',
    a: 'São eletivas cursadas à distância, disponíveis para todos os alunos. Nas avaliações de disciplinas EAD há perguntas extras sobre encontros presenciais e relevância do conteúdo.',
  },
  {
    q: 'Os professores podem ver quem os avaliou?',
    a: 'Não. Nenhuma avaliação é vinculada publicamente ao autor. Nem mesmo os administradores expõem essa informação na plataforma.',
  },
  {
    q: 'Este projeto é oficial da UCSAL?',
    a: 'Não. O MeuSemestreUCSAL é um projeto independente criado por alunos, sem vínculo oficial com a universidade.',
  },
]

const REMATRICULA_2026_2 = (
  <div className="space-y-4">
    <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide">Rematrícula 2026.2 — Etapa Financeira</p>
    <p>Neste semestre você antecipa a matrícula financeira e garante desconto especial no boleto. Fique atento aos prazos abaixo.</p>

    <div className="rounded-xl border border-edge overflow-hidden text-xs">
      {/* Etapa Financeira */}
      <div className="bg-surface-2 px-3 py-2 font-semibold text-fg border-b border-edge">Etapa Financeira</div>
      {[
        { periodo: '1º Período — 02/06 a 08/06/2026', detalhe: 'Desconto de 15% + prioridade na escolha de disciplinas', color: 'text-brand-400' },
        { periodo: '2º Período — 09/06 a 18/06/2026', detalhe: 'Desconto de 10%', color: 'text-accent-400' },
        { periodo: '3º Período — a partir de 19/06/2026', detalhe: 'Sem descontos', color: 'text-fg-subtle' },
      ].map((row) => (
        <div key={row.periodo} className="flex gap-3 px-3 py-2.5 border-b border-edge-muted last:border-0">
          <span className={`font-semibold flex-shrink-0 ${row.color}`}>{row.periodo}</span>
          <span className="text-fg-muted">{row.detalhe}</span>
        </div>
      ))}

      {/* Etapa Acadêmica */}
      <div className="bg-surface-2 px-3 py-2 font-semibold text-fg border-t border-b border-edge">Etapa Acadêmica (escolha de disciplinas)</div>
      {[
        { cond: 'Pagamento com 15% de desconto', periodo: '30/06 a 02/07/2026', color: 'text-brand-400' },
        { cond: 'Pagamento com 10% de desconto', periodo: '03/07 a 07/07/2026', color: 'text-accent-400' },
        { cond: 'Ainda não realizou o pagamento', periodo: 'A partir de 08/07/2026', color: 'text-fg-subtle' },
      ].map((row) => (
        <div key={row.cond} className="flex gap-3 px-3 py-2.5 border-b border-edge-muted last:border-0">
          <span className={`font-semibold flex-shrink-0 ${row.color}`}>{row.periodo}</span>
          <span className="text-fg-muted">{row.cond}</span>
        </div>
      ))}

      {/* Etapa de Ajustes */}
      <div className="bg-surface-2 px-3 py-2 font-semibold text-fg border-t border-b border-edge">Etapa de Ajustes</div>
      {[
        { periodo: '1º Ajuste — 13/07 a 15/07/2026', detalhe: 'Fechado e exclusivo', color: 'text-fg-muted' },
        { periodo: '2º Ajuste — 16/07 a 23/07/2026', detalhe: 'Abertura de outras disciplinas (via requerimento no portal)', color: 'text-fg-muted' },
        { periodo: '3º Ajuste — 24/07 a 07/08/2026', detalhe: 'Somente inclusão', color: 'text-fg-muted' },
      ].map((row) => (
        <div key={row.periodo} className="flex gap-3 px-3 py-2.5 border-b border-edge-muted last:border-0">
          <span className={`font-semibold flex-shrink-0 ${row.color}`}>{row.periodo}</span>
          <span className="text-fg-muted">{row.detalhe}</span>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-2 bg-brand-100 border border-brand-300 rounded-xl px-4 py-3">
      <span className="text-lg">🎓</span>
      <p className="text-brand-400 font-semibold text-sm">Início das Aulas: 10/08/2026</p>
    </div>
  </div>
)

const UCSAL: FaqItem[] = [
  {
    q: 'Quais são os prazos da rematrícula 2026.2?',
    a: REMATRICULA_2026_2,
  },
  {
    q: 'Como acesso o portal do aluno?',
    a: 'O portal do aluno da UCSAL fica em portal.ucsal.br. Use seu RA (registro acadêmico) e a senha cadastrada no ato da matrícula. Em caso de esquecimento de senha, acione a secretaria acadêmica presencialmente ou pelo e-mail da unidade.',
  },
  {
    q: 'Como funciona a matrícula em disciplinas?',
    a: 'A matrícula é feita todo semestre pelo portal do aluno dentro do prazo estabelecido pelo calendário acadêmico. Você escolhe as disciplinas disponíveis para o seu período e turno. Fique de olho no calendário — fora do prazo não há matrícula.',
  },
  {
    q: 'O que acontece se eu reprovar em uma disciplina?',
    a: 'Você pode cursar a disciplina novamente no próximo semestre em que ela for ofertada. Reprovações por falta (frequência abaixo de 75%) contam diferente de reprovações por nota — verifique o regimento acadêmico para os impactos no seu coeficiente.',
  },
  {
    q: 'Como funciona o aproveitamento de disciplinas cursadas em outra faculdade?',
    a: 'É possível solicitar aproveitamento de disciplinas cursadas em outras IES mediante análise da coordenação do curso. O processo é feito na secretaria acadêmica com histórico e ementa da disciplina cursada anteriormente.',
  },
  {
    q: 'Como solicitar documentos acadêmicos (declaração, histórico, atestado)?',
    a: 'Documentos são solicitados pelo portal do aluno na seção "Requerimentos". O prazo de emissão varia conforme o documento — declarações simples costumam sair em até 3 dias úteis.',
  },
  {
    q: 'Como funciona o estágio obrigatório?',
    a: 'O estágio obrigatório deve ser realizado conforme a carga horária mínima do seu curso. Você encontra a empresa, firma um termo de compromisso com intermediação da UCSAL e entrega relatórios parciais e finais. A coordenação do curso orienta sobre os requisitos específicos do BES e ADS.',
  },
  {
    q: 'O que é o ENADE e preciso me preocupar?',
    a: 'O ENADE (Exame Nacional de Desempenho de Estudantes) é aplicado pelo MEC a alunos ingressantes e concluintes. A participação é obrigatória para quem for convocado — a ausência sem justificativa pode gerar impedimento na colação de grau.',
  },
  {
    q: 'Tem bolsa PROUNI ou FIES na UCSAL?',
    a: 'Sim. A UCSAL participa do PROUNI (bolsas parciais e integrais via MEC) e aceita FIES. O processo é feito inteiramente pelo governo federal — acesse o portal do MEC para verificar disponibilidade por curso e semestre.',
  },
  {
    q: 'Como entro em contato com a coordenação do curso?',
    a: 'Cada curso tem um coordenador com sala no próprio campus Pituaçu. Você pode agendar pelo portal do aluno ou ir pessoalmente nos horários de atendimento afixados na porta da coordenação. BES e ADS têm coordenações separadas.',
  },
  {
    q: 'Como funciona a biblioteca da UCSAL Pituaçu?',
    a: 'A biblioteca fica no campus e oferece empréstimo de livros físicos, acesso a bases de dados acadêmicas e espaço de estudo. O acesso é feito com a carteira estudantil ou cadastro no sistema da biblioteca. Consulte o horário de funcionamento na coordenação.',
  },
  {
    q: 'Existe restaurante universitário ou cantina no campus?',
    a: 'O campus Pituaçu conta com cantina terceirizada. Não há restaurante universitário subsidiado, mas há opções de alimentação dentro e nas proximidades do campus.',
  },
  {
    q: 'Como funciona o TCC no BES e ADS?',
    a: 'O Trabalho de Conclusão de Curso é desenvolvido nos últimos semestres. No BES são 8 semestres e o TCC geralmente ocorre no 7º e 8º. No ADS (5 semestres), o projeto final acontece nos últimos períodos. Cada aluno escolhe um orientador e tema dentro das linhas do curso.',
  },
  {
    q: 'Posso trancar o curso? Como funciona?',
    a: 'Sim. O trancamento de matrícula é solicitado na secretaria dentro do prazo do calendário acadêmico. Existe um limite de semestres que o curso pode ficar trancado — verifique o regimento acadêmico da UCSAL para os limites vigentes.',
  },
]

function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details key={i} className="group bg-surface border border-edge rounded-2xl overflow-hidden">
          <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none select-none hover:bg-surface-hover transition-colors">
            <span className="text-sm font-semibold text-fg">{item.q}</span>
            <svg
              className="w-4 h-4 text-fg-subtle flex-shrink-0 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-6 pb-5 text-sm text-fg-muted leading-relaxed border-t border-edge-muted pt-4">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  )
}

export function FaqClient() {
  const [tab, setTab] = useState<'plataforma' | 'ucsal'>('plataforma')

  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-sm text-fg-subtle hover:text-brand-400 transition-colors">
          ← Início
        </Link>
        <h1 className="text-3xl font-bold text-fg mt-4 mb-2">Perguntas frequentes</h1>
        <p className="text-fg-muted text-sm">Dúvidas sobre a plataforma ou sobre a faculdade.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-surface border border-edge p-1 rounded-xl">
        <button
          onClick={() => setTab('plataforma')}
          className={cn(
            'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
            tab === 'plataforma'
              ? 'bg-surface-2 text-fg border border-edge'
              : 'text-fg-subtle hover:text-fg-muted'
          )}
        >
          Sobre a plataforma
        </button>
        <button
          onClick={() => setTab('ucsal')}
          className={cn(
            'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
            tab === 'ucsal'
              ? 'bg-surface-2 text-fg border border-edge'
              : 'text-fg-subtle hover:text-fg-muted'
          )}
        >
          Sobre a UCSAL
        </button>
      </div>

      {tab === 'plataforma' && <FaqAccordion items={PLATAFORMA} />}
      {tab === 'ucsal' && <FaqAccordion items={UCSAL} />}
    </div>
  )
}
