// ADICIONAR: Componente de Skeleton para a lista
export function UserSkeleton() {
  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl animate-pulse">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 w-full">
          {/* Círculo do Avatar */}
          <div className="h-12 w-12 bg-zinc-800 rounded-full"></div>
          
          <div className="flex-1 space-y-2">
            {/* Linha do Nome */}
            <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
            {/* Linha do E-mail */}
            <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-zinc-800 rounded-lg"></div>
          <div className="h-8 w-8 bg-zinc-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}