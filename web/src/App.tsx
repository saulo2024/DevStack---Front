import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { api } from "./services/api";
import { Header } from "./components/Header";
import { UserCard } from "./components/UserCard";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Skeleton } from "./components/Skeleton";

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
  const [theme, setTheme] = useState<'dark' | 'light'> (() => {
    return (localStorage.getItem('@devstack:theme') as 'dark' | 'light' || 'dark')
  })
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    loadUsers();
  }, []);

  // ADICIONAR: Sincroniza o tema com o HTML e o LocalStorage
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('@devstack:theme', theme)
  }, [theme])

  // SITUAÇÃO 2: SINCRONIZAR A BUSCA (Gravar no navegador)
  useEffect(() => {
    localStorage.setItem("@devstack:search", search);
  }, [search]); // Executa toda vez que a variável 'search' mudar

  // ---------------------------------------------------------
  // SITUAÇÃO 2: FILTRO EM TEMPO REAL (Pesquisa)
  // ---------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordenação A-Z
  }, [users, search]);

  // ADICIONAR: Uma contagem simples (Estado Derivado)
  const totalDevs = users.length;

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
    const result = userSchema.safeParse({ name, email });
    if (!result.success) return toast.error(result.error.issues[0].message);

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
    } catch {
      toast.error("Erro ao cadastrar.");
    } finally {
      setIsSubmitting(false); // Desliga o carregamento
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

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 p-8 flex flex-col items-center ">
      <Toaster position="top-right" />
      <Header />
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="mb-8 p-2 rounded-full bg-zinc-900 border border-zinc-800 hover: border:emerald-500 transition-all text-xs font-bold uppercase tracking-widest text-zinc-400">
        {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
      </button>

      <main className="w-full max-w-2xl">
        {/* FORMULÁRIO */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10 flex flex-col gap-4"
        >
          <h3 className="text-zinc-400 text-sm font-medium">
            {isEditing ? "Editando Desenvolvedor" : "Novo Cadastro"}
          </h3>
          <input
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <h2 className="text-xl font-semibold text-zinc-300">
            Desenvolvedores Ativos:{" "}
            <span className="text-emerald-500">{totalDevs}</span>
          </h2>

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

        {/* LISTAGEM E BUSCA */}
        <section className="flex flex-col gap-4">
          <div className="relative flex items-center mb-2">
            <input
              placeholder="Buscar desenvolvedores..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-4 pr-10 py-2 text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Botão de Limpar (Aparece só se tiver texto) */}
            {search.length > 0 && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 text-zinc-500 hover:text-zinc-500 transition-colors font-bold text-lg"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-4">
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {/* Caso 1: A busca não encontrou ninguém */}
                {search !== "" && filteredUsers.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-10 text-zinc-500 italic"
                  >
                    Nenhum desenvolvedor encontrado com "{search}"...
                  </motion.p>
                ) : /* Caso 2: O banco de dados está realmente vazio */
                users.length === 0 ? (
                  <motion.div
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
                  /* Caso 3: Tudo certo, mostra a lista filtrada */
                  filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      name={user.name}
                      email={user.email}
                      onDelete={() => setUserToDelete(user)}
                      onEdit={() => handleEditClick(user)}
                    />
                  ))
                )}
              </AnimatePresence>
            )}
          </div>
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
