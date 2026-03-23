// ADICIONAR: Crie este arquivo novo
export function Skeleton() {
  return (
    <div className="w-full `h-[82px]` bg-zinc-900/50 border border-zinc-800 rounded-lg animate-pulse flex items-center p-4 gap-4">
      <div className="w-12 h-12 rounded-full bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  )
}