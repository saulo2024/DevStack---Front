import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from './services/api'
import { Header } from './components/Header'
import { UserCard } from './components/UserCard' // Importação corrigida com { }
import toast, { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'

interface User {
  id: string; 
  name: string; 
  email: string;
}

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadUsers() {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name || !email) return toast.error("Preencha tudo!")
    
    try {
      const response = await api.post('/users', { name, email })
      setUsers(allUsers => [...allUsers, response.data])
      setName(''); setEmail(''); toast.success("Cadastrado!")
    } catch { toast.error("Erro ao cadastrar.") }
  }

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
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <input className="bg-zinc-950 border border-zinc-800 rounded-lg p-3" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="bg-emerald-500 hover:bg-emerald-600 font-bold py-3 rounded-lg">Cadastrar</button>
        </form>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-zinc-300">Desenvolvedores Ativos:</h2>
          
          {loading ? (
            <p className="text-zinc-500 animate-pulse text-center py-10">Carregando...</p>
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {users.map(user => (
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