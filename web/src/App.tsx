import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'
import { api } from './services/api'
import { Header } from './components/Header'
import { UserCard } from './components/UserCard'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'


// CONTRATO DE VALIDAÇÃO
const userSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
})

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)

  // ---------------------------------------------------------
  // SITUAÇÃO 1: BUSCA INICIAL (Carregamento de Dados)
  // ---------------------------------------------------------
  async function loadUsers() {
    setLoading(true)
    try {
      const response = await api.get("/users")
      setUsers(response.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  // ---------------------------------------------------------
  // SITUAÇÃO 2: FILTRO EM TEMPO REAL (Pesquisa)
  // ---------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  // ---------------------------------------------------------
  // SITUAÇÃO 3: CADASTRO E EDIÇÃO (Criação ou Atualização)
  // ---------------------------------------------------------
  function handleEditClick(user: User) {
    setIsEditing(true)
    setEditUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = userSchema.safeParse({ name, email })
    if (!result.success) return toast.error(result.error.issues[0].message)

    try {
      if (isEditing && editUserId) {
        await api.put(`/users/${editUserId}`, { name, email })
        setUsers(users.map((u) => (u.id === editUserId ? { ...u, name, email } : u)))
        toast.success("Dados atualizados!")
      } else {
        const response = await api.post("/users", { name, email })
        setUsers((allUsers) => [...allUsers, response.data])
        toast.success("Cadastrado com sucesso!")
      }
      resetForm()
    } catch {
      toast.error("Erro na operação.")
    }
  }

  function resetForm() {
    setName(""); setEmail(""); setIsEditing(false); setEditUserId(null)
  }

  // ---------------------------------------------------------
  // SITUAÇÃO 4: DELETAR (Remoção com Confirmação)
  // ---------------------------------------------------------
  async function confirmDelete() {
    if (!userToDelete) return
    try {
      await api.delete(`/users/${userToDelete.id}`)
      setUsers(users.filter((u) => u.id !== userToDelete.id))
      toast.success(`${userToDelete.name} removido!`)
      setUserToDelete(null)
    } catch {
      toast.error("Erro ao deletar.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 flex flex-col items-center">
      <Toaster position="top-right" />
      <Header />

      <main className="w-full max-w-2xl">
        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10 flex flex-col gap-4">
          <h3 className="text-zinc-400 text-sm font-medium">
            {isEditing ? "Editando Desenvolvedor" : "Novo Cadastro"}
          </h3>
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          
          <button className={`${isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-500 hover:bg-emerald-600"} font-bold py-3 rounded-lg transition-colors`}>
            {isEditing ? "Salvar Alterações" : "Cadastrar Desenvolvedor"}
          </button>
          
          {isEditing && (
            <button type="button" onClick={resetForm} className="text-zinc-500 text-sm underline">Cancelar</button>
          )}
        </form>

        {/* LISTAGEM E BUSCA */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-zinc-300">Desenvolvedores Ativos:</h2>
            <input placeholder="Buscar..." className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <p className="text-center py-10 text-zinc-500 animate-pulse">Carregando devs...</p>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <UserCard 
                    key={user.id} 
                    name={user.name} 
                    email={user.email} 
                    onDelete={() => setUserToDelete(user)} 
                    onEdit={() => handleEditClick(user)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </main>

      {/* MODAL DE CONFIRMAÇÃO */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-sm w-full">
              <h3 className="text-xl font-bold mb-2">Tem certeza?</h3>
              <p className="text-zinc-400 mb-6">Deseja remover <strong>{userToDelete.name}</strong> da stack?</p>
              <div className="flex gap-3">
                <button onClick={() => setUserToDelete(null)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold">Sim, remover</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}