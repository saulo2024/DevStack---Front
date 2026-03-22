import { UserPlus } from 'lucide-react'

export function Header() {
    return (
        <header className="w-full max-w-2xl text-center mb-10">
            <h1 className="text-4xl font-bold text-emerald-400 flex items-center justify-center gap-2">
                <UserPlus size={32} /> DevStack
            </h1>
            <p className="text-zinc-500 mt-2">Gerencie seus desenvolvedores favoritos!</p>
        </header>
    )
}