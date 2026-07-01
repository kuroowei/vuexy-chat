import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export default function StatCard({ title, value, change, changeType, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={'w-12 h-12 ' + iconBg + ' rounded-xl flex items-center justify-center'}>
          <Icon size={24} className={iconColor} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        <span className={'text-sm font-medium ' +
          (changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-600')
        }>
          {change}
        </span>
        <span className="text-sm text-gray-400">vs last month</span>
      </div>
    </div>
  );
}
