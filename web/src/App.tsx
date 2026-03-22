import { useEffect, useState } from 'react' // Importando as ferramentas
import type { FormEvent } from 'react'
import { z } from 'zod'
import { api } from './services/api'
import toast, { Toaster } from 'react-hot-toast'

// 1. A REGRA DO ZOD (Fica do lado de fora)
const userSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido")
})

interface User {
  id: string; name: string; email: string;
}

export default function App() {
  // 2. AS CAIXINHAS (Estados)
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // 3. BUSCANDO OS DADOS (Aqui usamos o useEffect)
  async function loadUsers() {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } finally {
      setLoading(false)
    }
  }

  // O "useEffect" entra aqui! Ele chama a busca assim que o site abre.
  // ISSO FAZ O ERRO SUMIR!
  useEffect(() => {
    loadUsers()
  }, [])

  // 4. SALVANDO NOVO USUÁRIO
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const result = userSchema.safeParse({ name, email })

    if (!result.success) {
      return toast.error(result.error.issues[0].message)
    }

    try {
      const response = await api.post('/users', { name, email })
      setUsers(allUsers => [...allUsers, response.data])
      setName(''); setEmail('')
      toast.success("Desenvolvedor cadastrado!")
    } catch {
      toast.error("Erro ao salvar.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <Toaster />
      <h1 className="text-3xl font-bold text-center text-emerald-400 mb-8">DevStack</h1>
      
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-4 mb-10">
        <input 
          className="bg-zinc-900 p-3 rounded border border-zinc-800"
          placeholder="Nome" value={name} onChange={e => setName(e.target.value)} 
        />
        <input 
          className="bg-zinc-900 p-3 rounded border border-zinc-800"
          placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} 
        />
        <button className="bg-emerald-500 p-3 rounded font-bold hover:bg-emerald-600 transition-colors">
          Cadastrar
        </button>
      </form>

      {/* Lista */}
      <div className="max-w-md mx-auto">
        <h2 className="text-xl mb-4">Desenvolvedores Ativos:</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded mb-2">
              <p className="font-bold">{user.name}</p>
              <p className="text-zinc-500 text-sm">{user.email}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}