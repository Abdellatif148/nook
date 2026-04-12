import * as React from 'react'
import { cn } from '../../utils/cn'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const colors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color = colors[hash % colors.length]

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-16 h-16 text-[18px]'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold shrink-0',
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}26`, // 15% opacity
        border: `1px solid ${color}4D`, // 30% opacity
        color: color
      }}
    >
      {initials}
    </div>
  )
}
