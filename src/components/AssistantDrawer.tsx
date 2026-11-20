import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, Loader2, AlertCircle, CheckCircle2, Camera, Mic, MicOff } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';

interface Attachment {
  mimeType: string;
  data: string; // base64
  preview?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isFunctionCall?: boolean;
  attachments?: Attachment[];
}

interface AssistantDrawerProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onRegisterExpense: (data: any) => Promise<void> | void;
  onEditExpense: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  context: {
    userName: string;
    availableBalance: number;
    currentDate: string;
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentación': 'Utensils',
  'Transporte': 'Bus',
  'Servicios públicos': 'Zap',
  'Ropa y compras': 'ShoppingBag',
  'Entretenimiento': 'Film',
};

export default function AssistantDrawer({
  userId,
  isOpen,
  onClose,
  transactions,
  onRegisterExpense,
  onEditExpense,
  onDeleteExpense,
  context,
}: AssistantDrawerProps) {
  const buildWelcomeMessage = (name: string) =>
    `¡Hola ${name}! Soy tu asistente financiero. Puedo registrar, editar o eliminar gastos por ti. Por ejemplo: "Gasté 50k en almuerzo", "Cambia el almuerzo a 35 mil" o "Borra el gasto de cine".`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: buildWelcomeMessage(context.userName) },
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: buildWelcomeMessage(context.userName) }]);
    setInput('');
    setAttachments([]);
    setError(null);
  }, [userId, context.userName]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const preview = URL.createObjectURL(file);
        setAttachments((prev) => [
          ...prev,
          {
            mimeType: file.type,
            data: base64,
            preview: file.type.startsWith('image/') ? preview : undefined,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              mimeType: 'audio/webm',
              data: base64,
            },
          ]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch {
      setError('No se pudo acceder al micrófono. Por favor verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const currentAttachments = [...attachments];

    setInput('');
    setAttachments([]);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        attachments: currentAttachments,
      },
    ]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content: userMessage, attachments: currentAttachments },
          ],
          context: {
            ...context,
            transactions: transactions.slice(0, 50).map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              description: t.description,
              category: t.category,
              date: t.date,
              isoDate: t.isoDate,
              paymentMethod: t.paymentMethod,
              notes: t.notes,
            })),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 503) {
          throw new Error(
            'El asistente está muy solicitado en este momento. Por favor, intenta de nuevo en un minuto.'
          );
        } else if (data.code === 429) {
          throw new Error('He alcanzado mi límite de mensajes por ahora. Intenta de nuevo más tarde.');
        } else {
          throw new Error(data.error || 'Algo salió mal. Por favor intenta de nuevo.');
        }
      }

      const { text, functionCalls } = data;

      if (text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      }

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'registerExpense') {
            await onRegisterExpense(call.args);
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `¡Listo, ${context.userName}! Guardé el gasto "${call.args.description}" por ${formatCurrency(Number(call.args.amount) || 0)} en ${call.args.category}.`,
                isFunctionCall: true,
              },
            ]);
          } else if (call.name === 'editExpense') {
            const target = transactions.find((t) => t.id === call.args?.expenseId);
            if (!target) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: 'No encontré ese gasto en tu historial actual para editarlo.',
                },
              ]);
              continue;
            }

            const updates: Partial<Transaction> = {};
            if (call.args.amount !== undefined) updates.amount = Number(call.args.amount);
            if (call.args.description !== undefined) updates.description = String(call.args.description);
            if (call.args.category !== undefined) {
              updates.category = String(call.args.category);
              updates.icon = CATEGORY_ICONS[updates.category] || target.icon || 'ShoppingBag';
            }
            if (call.args.date && /^\d{4}-\d{2}-\d{2}$/.test(call.args.date)) {
              updates.isoDate = call.args.date;
              updates.date = new Date(`${call.args.date}T12:00:00`).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
            }
            if (call.args.paymentMethod !== undefined) {
              updates.paymentMethod = String(call.args.paymentMethod);
            }
            if (call.args.notes !== undefined) {
              updates.notes = String(call.args.notes);
            }

            await onEditExpense(target.id, updates);
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `¡Listo, ${context.userName}! Actualicé el gasto "${updates.description || target.description}"${updates.amount !== undefined ? ` a ${formatCurrency(updates.amount)}` : ''}.`,
                isFunctionCall: true,
              },
            ]);
          } else if (call.name === 'deleteExpense') {
            const target = transactions.find((t) => t.id === call.args?.expenseId);
            if (!target) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: 'No encontré ese gasto en tu historial actual para eliminarlo.',
                },
              ]);
              continue;
            }

            await onDeleteExpense(target.id);
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `¡Listo, ${context.userName}! Eliminé el gasto "${target.description}" (${formatCurrency(target.amount)}).`,
                isFunctionCall: true,
              },
            ]);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-white font-display font-bold">Asistente Inteligente</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm space-y-2 ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : msg.isFunctionCall 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-tl-none flex items-start gap-2'
                        : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.isFunctionCall && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.attachments.map((att, attIdx) => (
                          <div key={attIdx} className="relative group">
                            {att.mimeType.startsWith('image/') ? (
                              <img src={`data:${att.mimeType};base64,${att.data}`} className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                            ) : (
                              <div className="w-20 h-20 bg-slate-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-white/10">
                                <Mic size={16} className="text-brand-primary" />
                                <span className="text-[8px] uppercase tracking-tighter text-slate-500">Audio</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p>{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-brand-primary" />
                    <span className="text-xs text-slate-400">Analizando modelos...</span>
                  </div>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-200 font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-white/5 space-y-4">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      {att.mimeType.startsWith('image/') ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 relative">
                           <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                          <Mic size={18} className="text-brand-primary" />
                        </div>
                      )}
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
                  >
                    <Camera size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                  />
                  
                  <button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                      isRecording 
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-500 animate-pulse' 
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "Grabando..." : "Escribe un mensaje..."}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-lg hover:bg-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-widest">
                Impulsado por Gemini AI Multi-modal
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
