/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Calendar, 
  Send, 
  User, 
  Bot, 
  MapPin, 
  Loader2,
  CalendarDays,
  Info,
  Clock,
  BookOpen,
  Hash,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { chatWithGemini, Message } from "./services/geminiService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Olá! Sou seu Assistente de Agendamento. Como posso ajudar você hoje?\n\nExemplo: *'Tem sala disponível no Morumbi hoje?'* ou *'O que tem na Paulista I agora?'*"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const textToChat = overrideText || input;
    if (!textToChat.trim() || isLoading) return;

    const userMessage = textToChat.trim();
    if (!overrideText) setInput("");
    
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);
    setIsSidebarOpen(false);

    try {
      const response = await chatWithGemini(userMessage, messages);
      setMessages((prev) => [...prev, { role: "model", text: response }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "model", text: "Ops! Tive um problema técnico. Por favor, tente novamente em instantes." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (text: string) => {
    handleSend(text);
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-10 pt-2">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
          <Building2 size={24} />
        </div>
        <h1 className="font-bold text-xl leading-tight text-slate-800 tracking-tight">
          Gestão de <br /> <span className="text-blue-600">Agendamentos</span>
        </h1>
      </div>

      <div className="space-y-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Unidades</p>
          <div className="grid grid-cols-1 gap-1">
            {["Paulista I", "Paulista II", "Morumbi", "Vila Santa Catarina", "Morato"].map((unidade) => (
              <button 
                key={unidade}
                onClick={() => handleQuickAction(`O que tem agendado na unidade ${unidade}?`)}
                className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 p-2.5 rounded-xl transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <MapPin size={14} className="text-slate-400 group-hover:text-blue-600" />
                </div>
                {unidade}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Períodos Sugeridos</p>
          <div className="flex flex-col gap-2">
            {["Manhã", "Tarde", "Noite"].map((periodo) => (
              <button 
                key={periodo}
                onClick={() => handleQuickAction(`O que tem agendado na Paulista I no período da ${periodo}?`)}
                className="w-full text-sm font-semibold py-2.5 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-center"
              >
                {periodo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100/50">
        <div className="flex items-start gap-3 p-4 bg-blue-50/40 rounded-2xl border border-blue-100/30">
          <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Monitoramento em tempo real dos laboratórios e salas.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-blue-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-80 flex-col bg-white border-r border-slate-100 p-8">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 p-6 flex flex-col shadow-2xl lg:hidden"
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute right-4 top-6 p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-18 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 hidden sm:flex items-center justify-center">
                <CalendarDays size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 tracking-tight text-sm sm:text-base leading-none">Agendador Central</h2>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Base Ativa</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-700 tracking-tight">28 de Abril, 2026</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Terça-feira</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <User size={20} className="text-slate-600" />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 scroll-smooth"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex items-start gap-4 max-w-[95%] sm:max-w-[85%] md:max-w-[80%]",
                  message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                  "bg-blue-600 text-white"
                )}>
                  {message.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                
                <div className={cn(
                  "p-5 sm:p-6 rounded-3xl text-sm leading-relaxed shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] w-full",
                  message.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none max-w-fit" 
                    : "bg-white text-slate-700 border border-slate-50 rounded-tl-none"
                )}>
                  <div className="prose prose-sm max-w-none prose-slate prose-headings:m-0 prose-p:m-0 overflow-hidden">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h3: ({ node, ...props }) => {
                          const originalContent = props.children?.toString() || "";
                          const content = originalContent.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F000}-\u{1F02B}]/gu, "").trim();
                          
                          let Icon = Info;
                          let bgColor = "bg-slate-100";
                          let color = "text-slate-600";
                          
                          if (content.includes("Unidade")) { Icon = MapPin; bgColor = "bg-blue-100"; color = "text-blue-600"; }
                          else if (content.includes("Sala")) { Icon = Building2; bgColor = "bg-indigo-100"; color = "text-indigo-600"; }
                          else if (content.includes("Data")) { Icon = CalendarDays; bgColor = "bg-emerald-100"; color = "text-emerald-600"; }
                          else if (content.includes("Horário")) { Icon = Clock; bgColor = "bg-amber-100"; color = "text-amber-600"; }
                          else if (content.includes("Evento")) { Icon = BookOpen; bgColor = "bg-rose-100"; color = "text-rose-600"; }
                          else if (content.includes("Solicitação")) { Icon = Hash; bgColor = "bg-slate-100"; color = "text-slate-500"; }

                          return (
                            <div className="flex items-center gap-3 mt-4 first:mt-0 mb-2 p-2 rounded-xl border-b border-slate-50">
                              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm", bgColor)}>
                                <Icon size={14} className={color} />
                              </div>
                              <span className="font-bold text-slate-800 tracking-tight text-xs sm:text-sm">
                                {content}
                              </span>
                            </div>
                          );
                        },
                        table: ({ node, ...props }) => (
                          <div className="my-4 overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                            <table className="w-full border-collapse text-xs text-left" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-slate-50/50 border-b border-slate-100" {...props} />,
                        th: ({ node, ...props }) => <th className="p-3 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap" {...props} />,
                        td: ({ node, ...props }) => <td className="p-3 border-b border-slate-50 text-slate-600" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-600">{props.children}</p>,
                        strong: ({ node, ...props }) => <strong className="font-bold text-blue-600">{props.children}</strong>
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Acessando base de agendamentos...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto relative group">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ex: 'O que está agendado na Paulista I hoje?'"
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-4 pl-6 pr-16 text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none max-h-32 placeholder:text-slate-400 font-medium"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-2 top-2 bottom-2 aspect-square rounded-2xl flex items-center justify-center transition-all",
                input.trim() && !isLoading
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="max-w-4xl mx-auto mt-4 px-2 overflow-x-auto flex gap-2 no-scrollbar">
            {["Lab de Anatomia", "Paulista I Noite", "Ocupação Morumbi"].map((chip) => (
              <button 
                key={chip}
                onClick={() => handleQuickAction(`Buscar ${chip}`)}
                className="whitespace-nowrap px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


