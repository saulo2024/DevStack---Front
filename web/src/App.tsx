import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { api } from "./services/api";
import { Header } from "./components/Header";
import { UserCard } from "./components/UserCard";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { UserSkeleton } from "./components/UserSkeleton";
import { Pie, Cell, ResponsiveContainer, PieChart, Tooltip } from "recharts";
import { Download, Search } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const domainStats = useMemo(() => {
    const stats: Record<string, number> = {};
    users.forEach((user) => {
      const domain = user.email.split("@")[1];
      if (domain) stats[domain] = (stats[domain] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                           user.email.toLowerCase().includes(search.toLowerCase());
      const matchesDomain = activeDomain ? user.email.endsWith(activeDomain) : true;
      return matchesSearch && matchesDomain;
    });
  }, [users, search, activeDomain]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !email) return toast.error("Preencha tudo!");
    setIsSubmitting(true);
    try {
      if (isEditing && editUserId) {
        await api.put(`/users/${editUserId}`, { name, email });
        setUsers(users.map(u => u.id === editUserId ? { ...u, name, email } : u));
        toast.success("Atualizado!");
      } else {
        const response = await api.post("/users", { name, email });
        setUsers([response.data, ...users]);
        toast.success("Cadastrado!");
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Excluir ${selected.length} selecionados?`)) {
      setUsers(users.filter(u => !selected.includes(u.id)));
      setSelected([]);
      toast.success("Excluídos!");
    }
  };

  const handleEditClick = (user: User) => {
    setIsEditing(true);
    setEditUserId(user.id);
    setName(user.name);
    setEmail(user.email);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditUserId(null);
    setName("");
    setEmail("");
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Nome,Email", ...filteredUsers.map(u => `${u.name},${u.email}`)].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "devstack_report.csv";
    link.click();
    toast.success("Exportado!");
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-50 text-zinc-600'} p-8`}>
      <Toaster position="top-right" />
      
      {/* 🟢 HEADER ÚNICO NO TOPO */}
      <div className="flex flex-col items-center mb-12">
        <Header />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="mt-4 p-2 px-4 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:border-emerald-500 transition-all"
        >
          {theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4">
        {/* 🟢 GRID QUE SEPARA EM DUAS COLUNAS NO DESKTOP */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-12 items-start">
          
          {/* LADO ESQUERDO: Formulário */}
          <aside className="lg:sticky lg:top-8 flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-4">
              <h3 className="text-zinc-500 text-sm font-medium">{isEditing ? "Editar" : "Novo Cadastro"}</h3>
              <input
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500 text-white"
                placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)}
              />
              <input
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500 text-white"
                placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <div className="bg-zinc-800/40 p-4 rounded-xl flex justify-between">
                <span className="text-[10px] font-bold uppercase">Total Devs</span>
                <span className="text-xl font-bold text-white">{users.length}</span>
              </div>
              <button className={`py-3 rounded-lg font-bold text-white ${isEditing ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                {isSubmitting ? "..." : (isEditing ? "Salvar" : "Cadastrar")}
              </button>
            </form>

            <button onClick={exportToCSV} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center hover:bg-zinc-800">
              <span className="text-zinc-400 font-bold text-xs uppercase">Relatório CSV</span>
              <Download size={18} className="text-purple-500" />
            </button>
          </aside>

          {/* LADO DIREITO: Gráfico e Lista */}
          <section className="flex flex-col gap-8">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="w-full md:w-50">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={domainStats.map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none"
                        onClick={(data) => {
                        const domain = data.name ?? null; // Se for undefined, vira null
                          setActiveDomain(activeDomain === domain ? null : domain);}}
                      >
                        {domainStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-bold text-2xl mb-4">Sua Stack de Talentos</h2>
                  <div className="relative">
                    <input
                      placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                    <Search className="absolute right-3 top-3 text-zinc-600" size={18} />
                  </div>
                </div>
              </div>

              {selected.length > 0 && (
                <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center">
                  <span className="text-emerald-500 text-xs font-bold">{selected.length} selecionados</span>
                  <button onClick={handleBulkDelete} className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold">Excluir Tudo</button>
                </div>
              )}

              <div className="max-h-150 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? <UserSkeleton /> : (
                  <AnimatePresence mode="popLayout">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-4">
                      {filteredUsers.map((user) => (
                        <motion.div key={user.id} variants={itemVariants} layout>
                          <UserCard
                            name={user.name} email={user.email}
                            onDelete={() => {}} onEdit={() => handleEditClick(user)}
                            isSelected={selected.includes(user.id)} onToggle={() => toggleSelect(user.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}