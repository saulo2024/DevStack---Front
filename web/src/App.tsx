import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'
import { api } from './services/api'
import { Header } from './components/Header'
import { UserCard } from './components/UserCard'
import { AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'

const userSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido")
})

interface User {
  id: string; name: string; email: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // ESTADOS DA EDIÇÃO (Novos!)
  const [isEditing, setIsEditing] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)

  // ---------------------------------------------------------
  // SITUAÇÃO 1: BUSCA INICIAL (Carregamento de Dados)
  // ---------------------------------------------------------
  async function loadUsers() {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  // ---------------------------------------------------------
  // SITUAÇÃO 2: FILTRO EM TEMPO REAL (Pesquisa)
  // ---------------------------------------------------------
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase())
  )

  // ---------------------------------------------------------
  // SITUAÇÃO 3: CADASTRO E EDIÇÃO (Criação ou Atualização)
  // ---------------------------------------------------------
  
  // Função para preencher o formulário com os dados atuais
  function handleEditClick(user: User) {
    setIsEditing(true)
    setEditUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Sobe para o form
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = userSchema.safeParse({ name, email })
    if (!result.success) return toast.error(result.error.issues[0].message)

    try {
      if (isEditing && editUserId) {
        // LÓGICA DE EDIÇÃO (PUT)
        await api.put(`/users/${editUserId}`, { name, email })
        setUsers(users.map(u => u.id === editUserId ? { ...u, name, email } : u))
        toast.success("Dados atualizados!")
      } else {
        // LÓGICA DE CADASTRO (POST)
        const response = await api.post('/users', { name, email })
        setUsers(allUsers => [...allUsers, response.data])
        toast.success("Cadastrado com sucesso!")
      }
      
      // Limpeza após sucesso
      setName(''); setEmail(''); setIsEditing(false); setEditUserId(null)
    } catch {
      toast.error("Erro na operação.")
    }
  }

  // ---------------------------------------------------------
  // SITUAÇÃO 4: DELETAR (Remoção de Usuários)
  // ---------------------------------------------------------
  async function handleDelete(id: string) {
    try {
      await api.delete(`/users/${id}`)
      setUsers(users.filter(u => u.id !== id))
      toast.success("Removido!")
    } catch { toast.error("Erro ao deletar.") }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 flex flex-col items-center">
      <Toaster position="top-right" />
      <Header />

      <main className="w-full max-w-2xl">
        {/* O formulário agora muda o título do botão se estiver editando */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10 flex flex-col gap-4">
          <h3 className="text-zinc-400 text-sm font-medium">
            {isEditing ? "Editando Desenvolvedor" : "Novo Cadastro"}
          </h3>
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <button className={`${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-500 hover:bg-emerald-600'} font-bold py-3 rounded-lg transition-colors`}>
            {isEditing ? "Salvar Alterações" : "Cadastrar Desenvolvedor"}
          </button>
          {isEditing && (
            <button type="button" onClick={() => { setIsEditing(false); setName(''); setEmail('') }} className="text-zinc-500 text-sm underline">Cancelar</button>
          )}
        </form>

        <section className="flex flex-col gap-4">
          {/* Barra de Busca (Situação 2) */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-zinc-300">Desenvolvedores Ativos:</h2>
            <input placeholder="Buscar..." className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {!loading && filteredUsers.map(user => (
                <div key={user.id} className="relative group">
                  <UserCard name={user.name} email={user.email} onDelete={() => handleDelete(user.id)} onEdit={() => handleEditClick(user)} />
                  {/* Botão de Editar flutuante */}
                  <button 
                    onClick={() => handleEditClick(user)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-zinc-800 p-2 rounded-lg text-blue-400 hover:text-blue-300 transition-all"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  )
}