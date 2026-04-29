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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [loginStep, setLoginStep] = useState<"email" | "code">("email");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
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
  
  const handleSendCode = async () => {
    if (!emailInput.includes("@")) {
      alert("Por favor, insira um e-mail válido.");
      return;
    }

    // VERIFICAÇÃO DE "CONFIANÇA": Se já entrou com esse e-mail nos últimos 30 dias
    const savedSession = localStorage.getItem("auth_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const now = Date.now();
        const expiresAt = session.expiresAt || (session.timestamp + (24 * 60 * 60 * 1000));
        
        if (session.user.email.toLowerCase() === emailInput.toLowerCase() && now < expiresAt) {
          // Pular código e entrar direto
          setIsLoading(true);
          setTimeout(() => {
            setUser(session.user);
            setIsAuthenticated(true);
            setIsLoading(false);
          }, 800);
          return;
        }
      } catch (e) {
        localStorage.removeItem("auth_session");
      }
    }

    setIsLoading(true);
    
    const showToast = (message: string) => {
      setToast({ message, type: "error" });
      setTimeout(() => setToast(null), 4000);
    };
    
    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      const response = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, code }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          showToast("E-MAIL NÃO CADASTRADO. ENTRE EM CONTATO COM SEU ADMIN.");
        } else {
          showToast(data.error || "E-MAIL NÃO CADASTRADO. ENTRE EM CONTATO COM SEU ADMIN.");
        }
        return;
      }

      setLoginStep("code");
    } catch (error) {
      console.error("Erro no envio:", error);
      showToast("E-MAIL NÃO CADASTRADO. ENTRE EM CONTATO COM SEU ADMIN.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    const codeEntered = otpInput.join("");
    if (codeEntered !== generatedCode) {
      alert("Código inválido! Por favor, utilize o código enviado (ver dica abaixo).");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const userData = { 
        name: emailInput.split("@")[0].charAt(0).toUpperCase() + emailInput.split("@")[0].slice(1), 
        email: emailInput 
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);

      // Calcular tempo de expiração: 24h ou 30 dias
      const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      
      // Salvar sessão com expiração dinâmica
      localStorage.setItem("auth_session", JSON.stringify({
        user: userData,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      }));
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);

    // Auto-focus para o próximo campo
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setLoginStep("email");
    setIsEditingName(false);
    
    // Verificamos se a sessão deve ser limpa ou mantida (se for de 30 dias, mantemos para pular o código no próximo login)
    const savedSession = localStorage.getItem("auth_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const duration = session.expiresAt - session.timestamp;
        const isLongSession = duration > 2 * 24 * 60 * 60 * 1000; // Mais de 2 dias = sessão de 30 dias
        
        if (!isLongSession) {
          localStorage.removeItem("auth_session");
        }
      } catch (e) {
        localStorage.removeItem("auth_session");
      }
    }

    setOtpInput(["", "", "", "", "", ""]);
    setGeneratedCode("");
  };

  useEffect(() => {
    // Verificar sessão persistente
    const savedSession = localStorage.getItem("auth_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const now = Date.now();
        
        // Versão legada pode não ter expiresAt, mantemos o fallback de 24h
        const expiresAt = session.expiresAt || (session.timestamp + (24 * 60 * 60 * 1000));
        
        if (now < expiresAt) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("auth_session");
        }
      } catch (e) {
        localStorage.removeItem("auth_session");
      }
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isAuthenticated]);

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

  const handleUpdateName = () => {
    if (!user || !nameInput.trim()) {
      setIsEditingName(false);
      return;
    }
    
    const updatedUser = { ...user, name: nameInput.trim() };
    setUser(updatedUser);
    setIsEditingName(false);
    
    // Atualizar no localStorage
    const savedSession = localStorage.getItem("auth_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        session.user = updatedUser;
        localStorage.setItem("auth_session", JSON.stringify(session));
      } catch (e) {
        console.error("Erro ao atualizar nome na sessão:", e);
      }
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4 font-sans selection:bg-blue-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 p-8 sm:p-12 text-center"
        >
          <div className="inline-flex p-5 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-600/30 mb-8">
            <Building2 size={32} />
          </div>
          
          <AnimatePresence mode="wait">
            {loginStep === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                  Acesso <span className="text-blue-600">Institucional</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Digite seu e-mail para receber um código de acesso rápido.
                </p>

                <div className="space-y-4">
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-2 block">E-mail Corporativo</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                      }}
                      placeholder="seu@instituicao.edu.br"
                      className={cn(
                        "w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 text-sm font-semibold focus:outline-none transition-all placeholder:text-slate-300",
                        "border-slate-100 focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      )}
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={isLoading || !emailInput.includes("@")}
                    className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Entrar"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                  Verificar <span className="text-blue-600">Código</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Enviamos um código de 6 dígitos para o endereço <strong className="text-slate-600">{emailInput}</strong>
                </p>

                <div className="flex justify-between gap-2 max-w-xs mx-auto py-4">
                  {otpInput.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-10 h-14 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-xl font-bold text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mb-6 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center",
                    rememberMe ? "bg-blue-600 border-blue-600" : "bg-slate-50 border-slate-200 group-hover:border-blue-300"
                  )}>
                    {rememberMe && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 tracking-tight select-none">Manter conectado por 30 dias</span>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleVerifyCode}
                    disabled={isLoading || otpInput.some(d => !d)}
                    className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Entrar no Sistema"}
                  </button>
                  <button
                    onClick={() => {
                      setLoginStep("email");
                    }}
                    className="text-xs text-slate-400 font-bold hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
                  >
                    Alterar E-mail
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, x: 50, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="fixed top-8 right-8 z-[100] w-full max-w-sm"
              >
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_-20px_rgba(239,68,68,0.3)] border border-red-50 overflow-hidden">
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <X className="text-red-500" size={20} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1.5">Erro de Acesso</p>
                      <p className="text-xs font-bold text-slate-700 leading-tight">
                        {toast.message}
                      </p>
                    </div>
                  </div>
                  <div className="h-1 bg-red-50 w-full relative">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 4, ease: "linear" }}
                      className="absolute inset-0 bg-red-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Servidor Seguro Ativo</span>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <div className="hidden md:flex flex-col items-end min-w-[120px]">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={handleUpdateName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-blue-200 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : (
                <span 
                  onClick={() => {
                    setNameInput(user?.name || "");
                    setIsEditingName(true);
                  }}
                  className="text-xs font-bold text-slate-700 tracking-tight cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1.5"
                  title="Clique para editar seu nome"
                >
                  {user?.name || "Usuário"}
                </span>
              )}
              <button 
                onClick={handleLogout}
                className="text-[9px] text-red-500 font-bold uppercase tracking-widest hover:underline"
              >
                Encerrar Sessão
              </button>
            </div>
            <div 
              className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer hover:border-blue-200 transition-all"
              onClick={() => {
                setNameInput(user?.name || "");
                setIsEditingName(true);
              }}
            >
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


