import { useEffect, useState} from 'react'
import type { FormEvent } from 'react'
import { api } from './services/api'
import { Trash, UserPlus } from 'lucide-react' // Ícones
import toast, { Toaster } from 'react-hot-toast' // Notificações

interface User {
  id: string;
  name: string;
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  async function loadUsers() {
    const response = await api.get('/users')
    setUsers(response.data)
  }

  useEffect(() => { loadUsers() }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name || !email) {
      toast.error("Preencha todos os campos!")
      return
    }

    try {
      const response = await api.post('/users', { name, email })
      setUsers(allUsers => [...allUsers, response.data])
      setName(''); setEmail('')
      toast.success("Desenvolvedor cadastrado!")
    } catch (err) {
      toast.error("Erro ao cadastrar.")
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/users/${id}`)
      setUsers(users.filter(user => user.id !== id))
      toast.success("Removido com sucesso!")
    } catch (err) {
      toast.error("Erro ao deletar.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 flex flex-col items-center">
      <Toaster position="top-right" reverseOrder={false} />
      
      <header className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-4xl font-bold text-emerald-400 flex items-center justify-center gap-2">
          <UserPlus size={32} /> DevStack
        </h1>
      </header>

      <main className="w-full max-w-2xl">
        {/* Formulário (Mesmo estilo anterior) */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10 flex flex-col gap-4">
          <input 
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500"
            placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)}
          />
          <input 
            className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500"
            placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
          />
          <button className="bg-emerald-500 hover:bg-emerald-600 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            Cadastrar
          </button>
        </form>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-zinc-300">Desenvolvedores Ativos:</h2>
          {users.map(user => (
            <article key={user.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center group hover:border-emerald-500/50 transition-all">
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-zinc-500 text-sm">{user.email}</p>
              </div>
              <button 
                onClick={() => handleDelete(user.id)}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-all"
              >
                <Trash size={18} />
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App