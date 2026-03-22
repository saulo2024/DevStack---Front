import { Trash } from 'lucide-react'

interface UserCardProps {
  name: string;
  email: string;
  onDelete: () => void;
}

export function UserCard({ name, email, onDelete }: UserCardProps) {
  return (
    <article className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center group hover:border-emerald-500/50 transition-all">
      <div>
        <p className="font-bold">{name}</p>
        <p className="text-zinc-500 text-sm">{email}</p>
      </div>
      <button onClick={onDelete} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
        <Trash size={18} />
      </button>
    </article>
  )
}