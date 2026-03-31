import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { api } from "./services/api";
import { Header } from "./components/Header";
import { UserCard } from "./components/UserCard";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { UserSkeleton } from "./components/UserSkeleton";
import { Pie, Cell, ResponsiveContainer, PieChart, Tooltip } from "recharts";
import { Users, Filter, Download, Trash2, Search } from "lucide-react";

// Variantes para o container pai (quem coordena a cascata)
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
// DEFINIÇÕES DE ANIMAÇÃO (Cole fora da função App)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as any;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
} as any;

// CONTRATO DE VALIDAÇÃO
const userSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
});

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState(() => {
    return localStorage.getItem("@devstack:search") || "";
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (
      (localStorage.getItem("@devstack:theme") as "dark" | "light") || "dark"
    );
  });
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); // Estado para o checkbox individual
  // ---------------------------------------------------------
  // SITUAÇÃO 1: BUSCA INICIAL (Carregamento de Dados)
  // ---------------------------------------------------------
  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    // 1. Primeiro, criamos as linhas do CSV com os dados filtrados
    const csvRows = [
      ["Nome", "E-mail"], // Cabeçalho
      ...filteredUsers.map((u) => [u.name, u.email]), // Dados dos usuários
    ];

    // 2. Transformamos o array em uma string formatada (separada por vírgula e quebra de linha)
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");

    // 3. Agora sim, criamos o Blob usando o conteúdo gerado acima
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // 4. Criamos o link de download e clicamos nele automaticamente
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "devstack_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório gerado com sucesso!");
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // ADICIONAR: Sincroniza o tema com o HTML e o LocalStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("@devstack:theme", theme);
  }, [theme]);

  // ---------------------------------------------------------
  // SITUAÇÃO 2: FILTRO EM TEMPO REAL (Pesquisa)
  // ---------------------------------------------------------
  const filteredUsers = useMemo(() => {
    let list = users;

    // Filtro por texto (o que você já tem)
    if (search.trim() !== "") {
      list = list.filter(
        (user) =>
          user.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          user.email.toLowerCase().includes(search.trim().toLowerCase()),
      );
    }

    // Novo: filtro por clique no gráfico
    if (activeDomain) {
      list = list.filter((user) => user.email.endsWith(`@${activeDomain}`));
    }
    return list;
  }, [users, search, activeDomain]); // Adicione activeDomain aqui!

  // ADICIONAR: Lógica para extrair e contar domínios de e-mail
  const domainStats = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((user) => {
      const domain = user.email.split("@")[1] || "Outros";
      counts[domain] = (counts[domain] || 0) + 1;
    });
    // Transforma em array e pega os 3 mais usados
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [users]);

  // ---------------------------------------------------------
  // SITUAÇÃO 3: CADASTRO E EDIÇÃO (Criação ou Atualização)
  // ---------------------------------------------------------
  function handleEditClick(user: User) {
    setIsEditing(true);
    setEditUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // 1. Validação do Zod
    const result = userSchema.safeParse({ name, email });
    if (!result.success) return toast.error(result.error.issues[0].message);

    // 2. NOVA REGRA: Validação de Duplicidade Local
    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.id !== editUserId,
    );

    if (emailExists) {
      return toast.error("Este e-mail já está cadastrado na sua stack!");
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editUserId) {
        await api.put(`/users/${editUserId}`, { name, email });
        setUsers(
          users.map((u) => (u.id === editUserId ? { ...u, name, email } : u)),
        );
        toast.success("Dados atualizados!");
      } else {
        const response = await api.post("/users", { name, email });
        setUsers([...users, response.data]);
        toast.success("Desenvolvedor cadastrado!");
      }
      resetForm();
    } catch (error) {
      console.error("ERRO COMPLETO DA API:", error); // <--- Isso vai aparecer no seu F12
      toast.error("Erro ao cadastrar. Verifique a conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setIsEditing(false);
    setEditUserId(null);
  }

  // ---------------------------------------------------------
  // SITUAÇÃO 4: DELETAR (Remoção com Confirmação)
  // ---------------------------------------------------------
  async function confirmDelete() {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      toast.success(`${userToDelete.name} removido!`);
      setUserToDelete(null);
    } catch {
      toast.error("Erro ao deletar.");
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Excluir ${selected.length} desenvolvedores?`)) {
      setUsers((prev) => prev.filter((user) => !selected.includes(user.id)));
      setSelected([]);
      toast.success("Excluídos com sucesso!");
    }
  };

  // SUBSTITUIR: Início do return (Limpo e sem caracteres fantasmas)
  return (
    <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 p-8 flex flex-col items-center">
      <Toaster position="top-right" />
      <Header />

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mb-8 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-all text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
      >
        {theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
      </button>

      <main className="w-full max-w-2xl">
        {/* FORMULÁRIO */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-10 flex flex-col gap-4"
        >
          <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            {isEditing ? "Editando Desenvolvedor" : "Novo Cadastro"}
          </h3>

          <input
            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors"
            placeholder="Nome"
            value={name}
            onChange={(e) =>
              setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
            } // Permite apenas letras e espaços
          />

          <input
            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Card 1: Total de Devs */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center hover:border-emerald-500/50 transition-all group cursor-default">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                  Devs Stack
                </p>
                <h3 className="text-3xl font-bold mt-1 text-white">
                  {users.length}
                </h3>
                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SISTEMA ATIVO
                </div>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
            {/* Card 2: Filtro Ativo */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                  Filtro Atual
                </p>
                <h3 className="text-lg font-bold mt-1 text-zinc-300 truncate`max-w-[150px]`">
                  {activeDomain || "Nenhum Selecionado"}
                </h3>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
                <Filter size={24} />
              </div>
            </div>

            {/* Card 3: Exportar (Ação Rápida) */}
            <div
              className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center hover:bg-zinc-800/50 transition-colors cursor-pointer"
              onClick={exportToCSV}
            >
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                  Relatório CSV
                </p>
                <h3 className="text-lg font-bold mt-1 text-zinc-300">
                  Baixar Dados
                </h3>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-xl text-purple-500">
                <Download size={24} />
              </div>
            </div>
          </div>

          <button
            disabled={isSubmitting}
            className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-500 hover:bg-emerald-600"} ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100 cursor-pointer"
            } `}
          >
            {isSubmitting ? (
              <>
                <span className="w- h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processando...
              </>
            ) : (
              <span>
                {isEditing ? "Salvar Alterações" : "Cadastrar Desenvolvedor"}
              </span>
            )}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="text-zinc-500 text-sm underline"
            >
              Cancelar
            </button>
          )}
        </form>

        {/* AQUI ENTRA O RESPONSIVE CONTAINER QUE ESTAVA FALTANDO */}
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={domainStats.map(([name, value]) => ({ name, value }))}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              onClick={(data) => {
                setActiveDomain(
                  activeDomain === data.name ? null : (data.name ?? null),
                );
              }}
              style={{ cursor: "pointer" }}
            >
              {domainStats.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <PieChart>
              <defs>
                <filter
                  id="shadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="2" dy="4" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.5" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={domainStats}
                innerRadius={65} // Aumentar o buraco do meio deixa mais elegante
                outerRadius={85}
                stroke="none" // Tirar a borda branca padrão é essencial
                /* ... resto das props ... */
              >
                {/* Aplique o filtro de sombra em cada Cell */}
                {domainStats.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{ filter: "url(#shadow)" }}
                  />
                ))}
              </Pie>
            </PieChart>

            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* BARRA DE BUSCA (Adicione aqui para o setSearch funcionar) */}
        <div className="relative flex items-center mb-4">
          <input
            placeholder="Buscar desenvolvedores na stack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)} // <--- Aqui o setSearch volta à ativa!
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-4 pr-10 py-3 text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
          />

          {/* Ícone de busca opcional ou botão de limpar */}
          {search.length > 0 && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {activeDomain && (
          <div className="mb-4 text-sm text-emerald-500">
            Filtrando por domínio: <strong>{activeDomain}</strong>{" "}
            <button
              onClick={() => setActiveDomain(null)}
              className="ml-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 p-1 rounded cursor-pointer transition-all"
            >
              ✕ Limpar Filtro
            </button>
          </div>
        )}

        {selected.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-4 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
            <span className="text-emerald-500 text-xs font-bold">
              {selected.length} selecionado(s)
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={14} /> Excluir Selecionados
            </button>
          </div>
        )}

        <section className="flex flex-col gap-4">
          {loading ? (
            /* 1. Estado de Carregamento (Skeletons) */
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <UserSkeleton key={i} />
              ))}
            </div>
          ) : (
            /* 2. Animações e Lista Real */
            <AnimatePresence mode="popLayout">
              {search !== "" && filteredUsers.length === 0 ? (
                /* Caso A: Busca vazia */
                <motion.p
                  key="search-empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-10 text-zinc-500 italic"
                >
                  Nenhum desenvolvedor encontrado com "{search}"...
                </motion.p>
              ) : users.length === 0 ? (
                /* Caso B: Banco vazio */
                <motion.div
                  key="db-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl"
                >
                  <p className="text-zinc-400">Sua stack ainda está vazia.</p>
                  <p className="text-zinc-600 text-sm">
                    Cadastre o primeiro dev acima! 🚀
                  </p>
                </motion.div>
              ) : (
                /* Caso C: LISTA COM ANIMAÇÃO DE CASCATA (STAGGER) */
                <motion.div
                  key="list-container"
                  variants={containerVariants} // Variáveis que criamos no topo
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-4"
                >
                  {filteredUsers.length === 0 ? (
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col items-center justify-center p-10 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-2xl"
                    >
                      <Search className="text-zinc-700 mb-2" size={32} />
                      <p className="text-zinc-500 text-sm">
                        Nenhum desenvolvedor encontrado com esse filtro.
                      </p>
                    </motion.div>
                  ) : (
                    // 555: Mudamos o parêntese ( por chaves {
                    filteredUsers.map((user) => {
                      const isSelected = selected.includes(user.id);

                      return (
                        <motion.div
                          key={user.id}
                          variants={itemVariants}
                          layout
                        >
                          <UserCard
                            name={user.name}
                            email={user.email}
                            onDelete={() => setUserToDelete(user)}
                            onEdit={() => handleEditClick(user)}
                            isSelected={isSelected}
                            onToggle={() => toggleSelect(user.id)}
                          />
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>

      {/* MODAL DE CONFIRMAÇÃO */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-sm w-full"
            >
              <h3 className="text-xl font-bold mb-2">Tem certeza?</h3>
              <p className="text-zinc-400 mb-6">
                Deseja remover <strong>{userToDelete.name}</strong> da stack?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold"
                >
                  Sim, remover
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
