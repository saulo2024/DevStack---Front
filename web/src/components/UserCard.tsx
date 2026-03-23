import { Trash } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserCardProps {
  name: string;
  email: string;
  onDelete: () => void;
  onEdit: () => void;
}

export function UserCard({ name, email, onDelete, onEdit }: UserCardProps) {
  // Gera o link da imagem baseada no email (usando Gravatar)
  const avatarUrl = `https://www.gravatar.com/avatar/${btoa(email.toLowerCase())}?d=identicon`

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-4 group hover:border-emerald-500/50 transition-all"
    >
      {/* Foto do Dev */}
      <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full border-2 border-zinc-800 group-hover:border-emerald-500 transition-colors" />

      <div className="flex-1">
        <p className="font-bold">{name}</p>
        <p className="text-zinc-500 text-sm">{email}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">Editar</button>
        <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
          <Trash size={18} />
        </button>
      </div>
    </motion.article>
  )
}