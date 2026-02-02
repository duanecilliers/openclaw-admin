import { cn } from '@/lib/utils'

interface AgentAvatarProps {
  name: string
  size?: 'sm' | 'lg'
  className?: string
}

export default function AgentAvatar({ name, size = 'sm', className }: AgentAvatarProps) {
  const letter = name.charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-secondary font-semibold text-white shrink-0',
        size === 'sm' ? 'size-10 text-sm' : 'size-14 text-lg',
        className
      )}
    >
      {letter}
    </div>
  )
}
