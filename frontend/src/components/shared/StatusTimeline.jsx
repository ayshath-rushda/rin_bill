import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_STATUSES = ['new', 'confirmed', 'packing', 'dispatched', 'delivered'];
const EXCLUDE = ['cancelled', 'returned'];

function StatusTimeline({ currentStatus, timestamps = {} }) {
  const isTerminal = EXCLUDE.includes(currentStatus);
  const displayed = isTerminal
    ? [...ALL_STATUSES, currentStatus]
    : ALL_STATUSES;

  const currentIdx = displayed.indexOf(currentStatus);

  return (
    <div className="space-y-0">
      {displayed.map((status, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'size-6 rounded-full flex items-center justify-center',
                  isCompleted && 'bg-green-500',
                  isCurrent && !isTerminal && 'bg-blue-500 ring-2 ring-blue-200',
                  isCurrent && isTerminal && 'bg-red-400',
                  isFuture && 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5 text-white" />
                ) : (
                  <Circle
                    className={cn(
                      'size-2.5',
                      isCurrent ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                    )}
                    fill="currentColor"
                  />
                )}
              </div>
              {idx < displayed.length - 1 && (
                <div
                  className={cn(
                    'w-px h-8',
                    idx < currentIdx
                      ? 'bg-green-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
            <div className="pb-6">
              <p
                className={cn(
                  'text-sm font-medium capitalize',
                  isCompleted && 'text-green-600 line-through',
                  isCurrent && !isTerminal && 'text-blue-600 font-semibold',
                  isCurrent && isTerminal && 'text-red-500 font-semibold',
                  isFuture && 'text-gray-400'
                )}
              >
                {status}
              </p>
              {timestamps[status] && (
                <p className="text-xs text-muted-foreground">
                  {new Date(timestamps[status]).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatusTimeline;
