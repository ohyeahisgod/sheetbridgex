import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-green-50 text-green-700 border border-green-200': variant === 'success',
          'bg-red-50 text-red-700 border border-red-200': variant === 'error',
          'bg-yellow-50 text-yellow-700 border border-yellow-200': variant === 'warning',
          'border border-gray-200 text-gray-700': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
