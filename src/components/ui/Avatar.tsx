import * as React from 'react'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const colors = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777']
  const hash = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0)
  const color = colors[hash % colors.length]

  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-16 h-16 text-[20px]'
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${sizes[size]} ${className}`}
      style={{
        backgroundColor: `${color}26`,
        borderColor: `${color}4d`,
        borderWidth: '1px',
        color: color
      }}
    >
      {initials}
    </div>
  )
}
