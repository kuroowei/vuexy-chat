interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

export default function StatusIndicator({ status, className = '' }: StatusIndicatorProps) {
  return (
    <span 
      className={'block w-2.5 h-2.5 rounded-full border-2 border-white ' + statusColors[status] + ' ' + className}
      title={status}
    />
  );
}
