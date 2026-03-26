import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export default function UserAvatar({ 
  src, 
  alt = 'User', 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  // Size mappings
  const sizeClasses = {
    'sm': 'w-8 h-8 text-xs',
    'md': 'w-10 h-10 text-sm',
    'lg': 'w-12 h-12 text-base',
    'xl': 'w-16 h-16 text-lg',
    '2xl': 'w-32 h-32 text-4xl'
  };

  const iconSizes = {
    'sm': 'w-4 h-4',
    'md': 'w-5 h-5',
    'lg': 'w-6 h-6',
    'xl': 'w-8 h-8',
    '2xl': 'w-16 h-16'
  };

  const baseClasses = `${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center ${className}`;

  // If image source exists and is valid, show image
  if (src && src.trim() !== '') {
    return (
      <div className={baseClasses}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, replace with fallback
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              target.style.display = 'none';
              const initial = alt?.[0]?.toUpperCase() || 'U';
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-[#00bcd4] to-[#6366f1] flex items-center justify-center text-white font-bold ${sizeClasses[size].split(' ').pop()}">
                  ${initial}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  // Fallback: Show colored circle with initial or icon
  const initial = alt?.[0]?.toUpperCase() || 'U';
  const hasValidInitial = /[A-Z0-9]/.test(initial);

  return (
    <div className={`${baseClasses} bg-gradient-to-br from-[#00bcd4] to-[#6366f1]`}>
      {hasValidInitial ? (
        <span className="text-white font-bold">
          {initial}
        </span>
      ) : (
        <User className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
}
