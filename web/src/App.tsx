import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'
import { api } from './services/api'
import { Header } from './components/Header'
import { UserCard } from './components/UserCard' // Importação restaurada
import { AnimatePresence } from 'framer-motion' // Componente, não estado!
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
  const [search, setSearch] = useState('') // Estado da busca
  const [loading, setLoading] = useState(true)

  // 1. BUSCA INICIAL
  async function loadUsers() {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  // 2. FILTRO EM TEMPO REAL
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase())
  )

  // 3. CADASTRO
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = userSchema.safeParse({ name, email })
    if (!result.success) return toast.error(result.error.issues[0].message)

    try {
      const response = await api.post('/users', { name, email })
      setUsers(allUsers => [...allUsers, response.data])
      setName(''); setEmail(''); toast.success("Cadastrado!")
    } catch { toast.error("Erro ao cadastrar.") }
  }

  // 4. DELETAR (A função que tinha sumido!)
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
        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10 flex flex-col gap-4">
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="bg-emerald-500 hover:bg-emerald-600 font-bold py-3 rounded-lg transition-colors">Cadastrar</button>
        </form>

        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-zinc-300">Desenvolvedores Ativos:</h2>
            <input 
              placeholder="Buscar por nome..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-zinc-500 animate-pulse text-center py-10">Buscando na nuvem...</p>
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {filteredUsers.map(user => (
                  <UserCard 
                    key={user.id} 
                    name={user.name} 
                    email={user.email} 
                    onDelete={() => handleDelete(user.id)} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}