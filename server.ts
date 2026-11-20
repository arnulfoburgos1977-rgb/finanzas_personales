import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Priority list of models based on @google/genai skill
const MODELS = [
  "gemini-4-hydrogen",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const tools: any = [
  {
    functionDeclarations: [
      {
        name: "registerExpense",
        description: "Registers a new expense in the system with amount, date, description and category.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: {
              type: Type.NUMBER,
              description: "The amount of the expense in COP.",
            },
            date: {
              type: Type.STRING,
              description: "The date of the expense in YYYY-MM-DD format.",
            },
            description: {
              type: Type.STRING,
              description: "A brief description of what was bought.",
            },
            category: {
              type: Type.STRING,
              description: "The category in Spanish: Alimentación, Transporte, Servicios públicos, Ropa y compras, Entretenimiento, or Otro.",
            },
            paymentMethod: {
              type: Type.STRING,
              description: "Optional payment method (e.g. Efectivo, Débito, Crédito, Nequi, Daviplata).",
            },
            notes: {
              type: Type.STRING,
              description: "Optional additional notes about the expense.",
            },
          },
          required: ["amount", "date", "description", "category"],
        },
      },
      {
        name: "editExpense",
        description: "Edits an existing expense identified by its exact expenseId from the user's transaction list.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            expenseId: {
              type: Type.STRING,
              description: "The exact ID of the existing expense to update.",
            },
            amount: {
              type: Type.NUMBER,
              description: "New amount of the expense in COP.",
            },
            date: {
              type: Type.STRING,
              description: "New date of the expense in YYYY-MM-DD format.",
            },
            description: {
              type: Type.STRING,
              description: "New brief description of the expense.",
            },
            category: {
              type: Type.STRING,
              description: "New category in Spanish: Alimentación, Transporte, Servicios públicos, Ropa y compras, Entretenimiento, or Otro.",
            },
            paymentMethod: {
              type: Type.STRING,
              description: "New payment method.",
            },
            notes: {
              type: Type.STRING,
              description: "New notes for the expense.",
            },
          },
          required: ["expenseId"],
        },
      },
      {
        name: "deleteExpense",
        description: "Deletes an existing expense identified by its exact expenseId from the user's transaction list.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            expenseId: {
              type: Type.STRING,
              description: "The exact ID of the existing expense to delete.",
            },
          },
          required: ["expenseId"],
        },
      },
    ],
  },
];

const systemInstruction = `Eres un asistente experto en finanzas personales, breve y amable. 
Ayudas al usuario a registrar, consultar, editar y eliminar sus gastos.
- Para registrar un gasto nuevo desde texto, imagen (ticket, recibo, apunte) o audio (nota de voz), extrae monto, fecha y descripción y usa registerExpense.
- Para editar un gasto existente, busca el gasto en la lista de movimientos actuales del usuario y usa editExpense con su expenseId exacto y únicamente los campos que el usuario pidió cambiar.
- Para eliminar un gasto existente, busca el gasto en la lista de movimientos actuales del usuario y usa deleteExpense con su expenseId exacto.
- Si el usuario pide editar o borrar un gasto pero hay ambigüedad entre varios gastos similares (por ejemplo, dos gastos con la misma descripción), NO adivines: muéstrale las opciones (descripción, monto y fecha) y pregúntale cuál desea modificar o eliminar.
- Si el gasto que menciona no existe en su lista, infórmaselo amablemente.
- NO inventes datos ni IDs. Si un dato falta o está dudoso, pregunta al usuario antes de guardar.
- Si el archivo o mensaje no tiene que ver con gastos o finanzas, indica que no puedes procesarlo.
- Al finalizar una acción, dirígete al usuario por su nombre y confirma brevemente qué se registró, editó o eliminó.
- Para consultas de compras, compara el gasto solicitado con el saldo disponible proporcionado.`;

app.post("/api/chat", async (req, res) => {
  const { messages, context } = req.body;
  const { userName, availableBalance, currentDate, transactions } = context || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  const formattedTransactions = Array.isArray(transactions) && transactions.length > 0
    ? transactions
        .filter((t: any) => t && t.type === "expense")
        .slice(0, 50)
        .map(
          (t: any) =>
            `- ID: ${t.id} | Descripción: "${t.description}" | Monto: ${t.amount} COP | Categoría: ${t.category} | Fecha: ${t.isoDate || t.date}${t.paymentMethod ? ` | Pago: ${t.paymentMethod}` : ""}${t.notes ? ` | Notas: ${t.notes}` : ""}`
        )
        .join("\n")
    : "No hay gastos registrados actualmente.";

  const dynamicSystemInstruction = `${systemInstruction}

Contexto Dinámico Actual:
- Fecha Actual: ${currentDate || new Date().toISOString().split('T')[0]}
- Nombre del Usuario: ${userName || 'Usuario'}
- Saldo Disponible: ${availableBalance || 0} COP

Gastos actuales del usuario:
${formattedTransactions}`;

  let lastError = null;

  for (const modelName of MODELS) {
    try {
      const lastMessageData = messages[messages.length - 1];
      
      // Find the first user message to ensure history starts with 'user' role
      const firstUserIndex = messages.findIndex((m: any) => m.role === 'user');
      const historyMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex, -1) : [];

      // Format history according to @google/genai patterns
      const contents = historyMessages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [
          ...(m.attachments ? m.attachments.map((a: any) => ({
            inlineData: {
              mimeType: a.mimeType,
              data: a.data,
            }
          })) : []),
          { text: m.content || "" }
        ]
      }));

      // Add last message parts
      const lastMessageParts: any[] = [];
      if (lastMessageData.attachments) {
        lastMessageData.attachments.forEach((a: any) => {
          lastMessageParts.push({
            inlineData: {
              mimeType: a.mimeType,
              data: a.data,
            }
          });
        });
      }
      lastMessageParts.push({ text: lastMessageData.content || "" });

      contents.push({
        role: "user",
        parts: lastMessageParts
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          tools,
        }
      });
      
      return res.json({ 
        text: response.text || "", 
        functionCalls: response.functionCalls || [] 
      });

    } catch (error: any) {
      lastError = error;
      const status = error.status || 
                     error.response?.status || 
                     (error.message?.includes('404') ? 404 : 
                     (error.message?.includes('429') ? 429 : 
                     (error.message?.includes('503') ? 503 : null)));
      
      if (status === 429 || status === 503 || status === 404) {
        console.warn(`Model ${modelName} failed with status ${status}, trying next...`);
        continue;
      }
      break;
    }
  }

  const finalStatus = lastError?.status || 
                      lastError?.response?.status || 
                      (lastError?.message?.includes('404') ? 404 : 
                      (lastError?.message?.includes('429') ? 429 : 
                      (lastError?.message?.includes('503') ? 503 : 500)));

  res.status(finalStatus).json({ 
    error: lastError?.message || "All models failed",
    code: finalStatus
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
