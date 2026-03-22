import { Trash } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserCardProps {
  name: string;
  email: string;
  onDelete: () => void;
}

// Usamos 'export function' para o App.tsx encontrar pelo nome
export function UserCard({ name, email, onDelete }: UserCardProps) {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center group hover:border-emerald-500/50 transition-all"
    >
      <div>
        <p className="font-bold">{name}</p>
        <p className="text-zinc-500 text-sm">{email}</p>
      </div>
      <button onClick={onDelete} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
        <Trash size={18} />
      </button>
    </motion.article>
  )
}