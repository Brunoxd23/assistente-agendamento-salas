/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getAgendamentos, FiltrosAgendamento } from "./schedulingService";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined. Please set it in the Secrets panel.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getAgendamentosTool: FunctionDeclaration = {
  name: "get_agendamentos",
  description: "Consulta a ocupação de salas, eventos e disponibilidade de agendamentos.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      data: {
        type: Type.STRING,
        description: "Data para consulta (formato YYYY-MM-DD). Ex: '2026-04-28'.",
      },
      unidade: {
        type: Type.STRING,
        description: "Nome da unidade (ex: Paulista I, Morumbi, Morato).",
      },
      sala: {
        type: Type.STRING,
        description: "Identificação da sala.",
      },
      nome_evento: {
        type: Type.STRING,
        description: "Nome ou palavra-chave do evento.",
      },
    },
    required: [],
  },
};

const SYSTEM_INSTRUCTION = `
Você é um Assistente Inteligente de Agendamento de Salas de uma instituição de ensino.
Seu objetivo é responder perguntas de alunos, professores e colaboradores sobre a ocupação de salas, eventos e disponibilidade.

COMPORTAMENTO:
1. Sempre entenda a intenção do usuário antes de responder.
2. Quando necessário, monte filtros e consulte a API get_agendamentos.
3. Responda de forma clara, organizada e amigável.

VISUALIZAÇÃO DE RESULTADOS:
- Se houver POUCOS agendamentos (até 3), use este formato para cada um:
### 📍 Unidade: [nome]
### 🏫 Sala: [nome]
### 📅 Data: [data]
### ⏰ Horário: [horário]
### 📘 Evento: [nome]
### 🧾 Solicitação: #[numero]

- Se houver MUITOS agendamentos (mais de 3), você DEVE AGRUPAR por PERÍODO (Manhã, Tarde, Noite).
- Dentro de cada período, se houver muitos agendamentos, você pode usar uma TABELA Markdown para facilitar a leitura.
  Exemplo de tabela:
  | Sala | Horário | Evento | Tipo | Solicitação |
  | :--- | :--- | :--- | :--- | :--- |
  | 101 | 08:00 | Anatomia | Lab | #123 |
  | 102 | 10:00 | Cálculo | Presenc | #124 |

- Forneça um breve resumo no início se houver muitos agendamentos. Ex: "Encontrei 42 agendamentos para hoje na Paulista I. Aqui está o resumo por período:"

4. Se não encontrar resultados:
   - Informe educadamente que não há agendamentos.
   - Sugira verificar outra data ou unidade.
5. Se a pergunta for vaga (ex: "tem sala disponível?"), peça esclarecimentos:
   "Para qual unidade e data você gostaria de consultar?"
6. Seja direto e útil. Evite respostas longas desnecessárias.

REGRAS IMPORTANTES:
- Nunca invente dados.
- Sempre use a API quando precisar de informação real.
- Tom de voz: Profissional, Educado, Claro, Objetivo.

Data atual para referência: 28/04/2026.
`;

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function chatWithGemini(userText: string, history: Message[]): Promise<string> {
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: userText }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [getAgendamentosTool] }],
    },
  });

  const functionCalls = response.functionCalls;

  if (functionCalls) {
    const results = [];
    for (const call of functionCalls) {
      if (call.name === "get_agendamentos") {
        const filters = call.args as FiltrosAgendamento;
        const agendamentos = await getAgendamentos(filters);
        results.push({
          functionResponse: {
            name: call.name,
            response: { content: agendamentos },
          },
        });
      }
    }

    // Call model again with function results
    const finalResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...contents,
        {
          role: "model",
          parts: response.candidates[0].content.parts,
        },
        {
          role: "user",
          parts: results,
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return finalResponse.text || "Desculpe, ocorreu um erro ao processar sua solicitação.";
  }

  return response.text || "Não entendi sua solicitação. Pode repetir?";
}
