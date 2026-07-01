import { MessageSquare } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <MessageSquare size={36} className="text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Select a chat to start messaging
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Choose from your existing conversations or start a new one
        </p>
      </div>
    </div>
  );
}
