import { Trash, Check, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserCardProps {
  name: string;
  email: string;
  onDelete: () => void;
  onEdit: () => void;
  isSelected: boolean;
  onToggle: () => void;
}

export function UserCard({ name, email, onDelete, onEdit, isSelected, onToggle }: UserCardProps) {
  // Gera o avatar baseado no e-mail
  const avatarUrl = `https://www.gravatar.com/avatar/${btoa(email.toLowerCase())}?d=identicon`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-4 bg-zinc-900 border ${isSelected ? 'border-emerald-500/50' : 'border-zinc-800'} 
                 rounded-lg flex items-center gap-4 group hover:border-emerald-500/30 transition-all`}
    >
      {/* 1. Checkbox Customizado */}
      <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-5 h-5 bg-zinc-800 border-zinc-700 rounded text-emerald-500 
                     appearance-none checked:bg-emerald-500 checked:border-transparent
                     border transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
        />
        {isSelected && (
          <Check size={14} className="absolute left-0.5 text-zinc-900 pointer-events-none" />
        )}
      </div>

      {/* 2. Avatar */}
      <img 
        src={avatarUrl} 
        alt={name} 
        className="w-12 h-12 rounded-full border-2 border-zinc-800 group-hover:border-emerald-500/50 transition-colors" 
      />

      {/* 3. Informações */}
      <div className="flex-1">
        <p className="font-bold text-zinc-100">{name}</p>
        <p className="text-zinc-500 text-sm">{email}</p>
      </div>

      {/* 4. Ações Individuais */}
      <div className="flex gap-1">
        <button 
          onClick={onEdit} 
          className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
        >
          <Edit2 size={18} />
        </button>
        <button 
          onClick={onDelete} 
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash size={18} />
        </button>
      </div>
    </motion.article>
  );
}