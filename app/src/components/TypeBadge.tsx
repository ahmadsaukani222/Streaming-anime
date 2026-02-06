interface TypeBadgeProps {
  type: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music' | string;
  variant?: 'card' | 'tooltip';
  className?: string;
}

const typeColors: Record<string, { bg: string; text: string }> = {
  TV: {
    bg: 'bg-blue-600',
    text: 'text-white',
  },
  Movie: {
    bg: 'bg-red-600',
    text: 'text-white',
  },
  OVA: {
    bg: 'bg-green-600',
    text: 'text-white',
  },
  ONA: {
    bg: 'bg-purple-600',
    text: 'text-white',
  },
  Special: {
    bg: 'bg-orange-500',
    text: 'text-white',
  },
  Music: {
    bg: 'bg-pink-500',
    text: 'text-white',
  },
};

export default function TypeBadge({ 
  type, 
  variant = 'card',
  className = '' 
}: TypeBadgeProps) {
  const colors = typeColors[type] || {
    bg: 'bg-gray-600',
    text: 'text-white',
  };

  const sizeClasses = variant === 'card' 
    ? 'px-1.5 py-0.5 text-[9px]' 
    : 'px-2 py-0.5 text-[10px]';

  return (
    <span 
      className={`
        ${sizeClasses}
        ${colors.bg}
        ${colors.text}
        font-bold
        rounded
        ${className}
      `}
    >
      {type}
    </span>
  );
}
