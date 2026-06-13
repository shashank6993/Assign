import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/store/useToastStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function useSse() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/api/events`, {
      withCredentials: true
    });

    eventSource.addEventListener('TASK_CREATED', (e: MessageEvent) => {
      try {
        const task = JSON.parse(e.data);
        toast.info(`Task created: "${task.title}"`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.addEventListener('TASK_UPDATED', (e: MessageEvent) => {
      try {
        const task = JSON.parse(e.data);
        toast.info(`Task updated: "${task.title}"`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.addEventListener('TASK_DELETED', () => {
      toast.info('A task was deleted.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    eventSource.addEventListener('TASK_COMPLETED', (e: MessageEvent) => {
      try {
        const task = JSON.parse(e.data);
        toast.success(`Task completed: "${task.title}"! 🎉`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
