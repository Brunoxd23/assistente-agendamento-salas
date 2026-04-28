/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FiltrosAgendamento {
  data?: string;
  unidade?: string;
  sala?: string;
  nome_evento?: string;
}

export interface Agendamento {
  solicitacao: string;
  unidade: string;
  sala: string;
  data: string;
  horario: string;
  evento: string;
  tipo_sala: string;
}

// Mock database with more volume to simulate busy days
const mockAgendamentos: Agendamento[] = [
  // MANHÃ (Morning)
  ...Array.from({ length: 6 }).map((_, i) => ({
    solicitacao: `M${100 + i}`,
    unidade: "Paulista I",
    sala: `Lab ${i + 1}`,
    data: "2026-04-28",
    horario: "08:00 - 12:00",
    evento: `Prática de Laboratório ${i + 1}`,
    tipo_sala: "Laboratório",
  })),
  ...Array.from({ length: 9 }).map((_, i) => ({
    solicitacao: `M${200 + i}`,
    unidade: "Paulista I",
    sala: `Sala ${i + 10}`,
    data: "2026-04-28",
    horario: "08:30 - 10:30",
    evento: `Aula Teórica ${i + 1}`,
    tipo_sala: "Presencial",
  })),
  // TARDE (Afternoon)
  ...Array.from({ length: 5 }).map((_, i) => ({
    solicitacao: `T${300 + i}`,
    unidade: "Paulista I",
    sala: `Lab ${i + 1}`,
    data: "2026-04-28",
    horario: "14:00 - 18:00",
    evento: `Pesquisa Avançada ${i + 1}`,
    tipo_sala: "Laboratório",
  })),
  ...Array.from({ length: 8 }).map((_, i) => ({
    solicitacao: `T${400 + i}`,
    unidade: "Paulista I",
    sala: `Sala ${i + 20}`,
    data: "2026-04-28",
    horario: "14:00 - 16:00",
    evento: `Seminário de Gestão ${i + 1}`,
    tipo_sala: "Presencial",
  })),
  // NOITE (Night)
  ...Array.from({ length: 4 }).map((_, i) => ({
    solicitacao: `N${500 + i}`,
    unidade: "Paulista I",
    sala: `Lab ${i + 1}`,
    data: "2026-04-28",
    horario: "19:00 - 22:30",
    evento: `Laboratório Noturno ${i + 1}`,
    tipo_sala: "Laboratório",
  })),
  ...Array.from({ length: 9 }).map((_, i) => ({
    solicitacao: `N${600 + i}`,
    unidade: "Paulista I",
    sala: `Sala ${i + 30}`,
    data: "2026-04-28",
    horario: "19:00 - 21:00",
    evento: `Curso de Extensão ${i + 1}`,
    tipo_sala: "Presencial",
  })),
  // Other units
  {
    solicitacao: "67890",
    unidade: "Morumbi",
    sala: "Auditório Central",
    data: "2026-04-28",
    horario: "14:00 - 17:00",
    evento: "Workshop de TI e Inovação",
    tipo_sala: "Evento",
  },
  {
    solicitacao: "44556",
    unidade: "Morato",
    sala: "Sala 01",
    data: "2026-04-28",
    horario: "08:00 - 12:00",
    evento: "Reunião de Coordenação",
    tipo_sala: "Presencial",
  }
];

/**
 * Simula a chamada para a API de agendamentos.
 */
export async function getAgendamentos(filtros: FiltrosAgendamento): Promise<Agendamento[]> {
  console.log("Chamando get_agendamentos com filtros:", filtros);
  
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return mockAgendamentos.filter((item) => {
    if (filtros.unidade && !item.unidade.toLowerCase().includes(filtros.unidade.toLowerCase())) return false;
    if (filtros.sala && !item.sala.toLowerCase().includes(filtros.sala.toLowerCase())) return false;
    if (filtros.nome_evento && !item.evento.toLowerCase().includes(filtros.nome_evento.toLowerCase())) return false;
    if (filtros.data) {
      // Handle simple date format equality for now
      // This could be improved for intervals if needed
      if (item.data !== filtros.data) return false;
    }
    return true;
  });
}
