import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from './services/api'

interface User {
  id: string;
  name: string;
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // 1. Função para buscar usuários (READ)
  async function loadUsers() {
    const response = await api.get('/users')
    setUsers(response.data)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // 2. Função para cadastrar novo usuário (CREATE)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name || !email) return;

    const response = await api.post('/users', {
      name,
      email
    })

    setUsers(allUsers => [...allUsers, response.data])
    setName('')
    setEmail('')
  }

  // --- 3. NOVA FUNÇÃO: DELETAR DESENVOLVEDOR (DELETE) ---
  async function handleDelete(id: string) {
    try {
      // Avisa o Backend para apagar no MongoDB
      await api.delete(`/users/${id}`)

      // Atualiza a lista no Frontend na hora (filtra e remove quem tem o ID deletado)
      const updatedUsers = users.filter(user => user.id !== id)
      setUsers(updatedUsers)
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir o desenvolvedor.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 flex flex-col items-center">
      <header className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-4xl font-bold text-emerald-400">DevStack</h1>
        <p className="text-zinc-400">Cadastre novos desenvolvedores na rede.</p>
      </header>

      <main className="w-full max-w-2xl">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nome completo:</label>
            <input 
              type="text" 
              placeholder="Ex: Saulo Dev"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">E-mail:</label>
            <input 
              type="email" 
              placeholder="Ex: saulo@valgroup.com.br"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 font-bold py-3 rounded-lg transition-all mt-2">
            Cadastrar Desenvolvedor
          </button>
        </form>

        {/* Listagem com o novo Botão de Excluir */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-zinc-300">Desenvolvedores Ativos:</h2>
          
          {users.map(user => (
            <article key={user.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center group hover:scale-[1.01] transition-all">
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-zinc-500 text-sm">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-emerald-500 text-xs font-mono">ID: {user.id.slice(-4)}</span>
                
                {/* BOTÃO EXCLUIR: Ele aparece quando você passa o mouse por cima (hover) */}
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 px-3 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-xs font-bold"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App