import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AgentAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'lg'
  className?: string
}

export default function AgentAvatar({ name, avatarUrl, size = 'sm', className }: AgentAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const letter = name.charAt(0).toUpperCase()

  const sizeClasses = size === 'sm' ? 'size-10 text-sm' : 'size-14 text-lg'

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={cn(
          'rounded-full object-cover shrink-0',
          sizeClasses,
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-secondary font-semibold text-white shrink-0',
        sizeClasses,
        className
      )}
    >
      {letter}
    </div>
  )
}
