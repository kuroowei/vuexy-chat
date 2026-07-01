import StatusIndicator from './StatusIndicator';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export default function Avatar({ src, alt, size = 'md', status, className = '' }: AvatarProps) {
  return (
    <div className={'relative inline-block ' + className}>
      <img
        src={src}
        alt={alt}
        className={sizeClasses[size] + ' rounded-full object-cover'}
        loading="lazy"
      />
      {status && <StatusIndicator status={status} className="absolute bottom-0 right-0" />}
    </div>
  );
}
