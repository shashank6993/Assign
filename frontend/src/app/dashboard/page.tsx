'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore, toast } from '@/store/useToastStore';
import { useSse } from '@/hooks/useSse';
import ThemeToggle from '@/components/ThemeToggle';
import TaskModal from '@/components/TaskModal';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import {
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Trash2,
  Edit,
  User,
  Paperclip,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Connect to live updates
  useSse();

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [detailTask, setDetailTask] = useState<any>(null);

  // Filter query keys shorthand
  const tasksQueryKey = ['tasks', page, statusFilter, searchQuery, sortBy, sortOrder, selectedUserId];

  // Fetch Tasks Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => {
      let queryStr = `?page=${page}&limit=${limit}&sort=${sortBy}&order=${sortOrder}`;
      if (statusFilter) queryStr += `&status=${statusFilter}`;
      if (searchQuery) queryStr += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedUserId) queryStr += `&userId=${selectedUserId}`;
      return apiRequest(`/api/tasks${queryStr}`);
    }
  });

  // Fetch Users Query (Only for ADMIN)
  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest('/api/auth/users'),
    enabled: user?.role === 'ADMIN'
  });

  // Logout Handler
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    router.push('/login');
  };

  // Create Task Mutation (Optimistic Update)
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    }),
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(tasksQueryKey);

      const tempTask = {
        id: `temp-${Math.random().toString(36).substring(2, 9)}`,
        title: newTaskData.title,
        description: newTaskData.description || null,
        status: newTaskData.status || 'TODO',
        priority: newTaskData.priority || 'MEDIUM',
        dueDate: newTaskData.dueDate ? new Date(newTaskData.dueDate).toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: []
      };

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: [tempTask, ...(old.tasks || [])].slice(0, limit),
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total || 0) + 1
          }
        };
      });

      return { previousTasks };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
      toast.error(err.message || 'Failed to create task. Rollback applied.');
    },
    onSuccess: () => {
      toast.success('Task created successfully!');
      setIsCreateOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Update Task Mutation (Optimistic Update)
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }: { id: string; taskData: any }) => apiRequest(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData)
    }),
    onMutate: async ({ id, taskData }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(tasksQueryKey);

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) =>
            t.id === id ? { ...t, ...taskData } : t
          )
        };
      });

      return { previousTasks };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
      toast.error(err.message || 'Failed to update task. Rollback applied.');
    },
    onSuccess: () => {
      toast.success('Task updated successfully!');
      setEditingTask(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Complete Task Mutation (Optimistic Update)
  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' })
    }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(tasksQueryKey);

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) =>
            t.id === id ? { ...t, status: 'COMPLETED' } : t
          )
        };
      });

      return { previousTasks };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
      toast.error(err.message || 'Failed to complete task. Rollback applied.');
    },
    onSuccess: () => {
      toast.success('Task completed! 🎉');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Delete Task Mutation (Optimistic Update)
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tasks/${id}`, {
      method: 'DELETE'
    }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(tasksQueryKey);

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.filter((t: any) => t.id !== id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, (old.pagination?.total || 1) - 1)
          }
        };
      });

      return { previousTasks };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
      toast.error(err.message || 'Failed to delete task. Rollback applied.');
    },
    onSuccess: () => {
      toast.success('Task deleted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleCreateSubmit = async (formData: any) => {
    await createTaskMutation.mutateAsync(formData);
  };

  const handleEditSubmit = async (formData: any) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, taskData: formData });
    }
  };

  const tasks = data?.tasks || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-violet-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/55 dark:border-zinc-800/55 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-violet-600" />
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              TaskFlow
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {user?.name}
              </span>
              <span className="text-xs bg-violet-100 text-violet-800 dark:bg-violet-950/65 dark:text-violet-300 px-1.5 py-0.5 rounded font-bold">
                {user?.role}
              </span>
            </div>

            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-rose-100 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-zinc-800 dark:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-6 py-8 space-y-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Your Board</span>
              <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create, update, and manage your tasks.
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-750 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-md shadow-violet-200 dark:shadow-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="block w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="block w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm cursor-pointer"
            >
              <option value="createdAt">Sort by Created Date</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setPage(1);
              }}
              className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200"
              title="Toggle Sort Order"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Admin User Filter */}
          {user?.role === 'ADMIN' && (
            <div>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setPage(1);
                }}
                className="block w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm cursor-pointer"
              >
                <option value="">All Users Tasks</option>
                {usersList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-300">Failed to load tasks</h3>
            <p className="text-sm text-rose-600 dark:text-rose-455 mt-1 max-w-md">
              {(error as any)?.message || 'An unexpected error occurred. Please verify your connection.'}
            </p>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-4 animate-pulse">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div>
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center shadow-sm">
            <CheckSquare className="w-14 h-14 text-zinc-300 dark:text-zinc-600 mb-4" />
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">No tasks found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 max-w-sm">
              Create a new task to get started, or change your search filter settings.
            </p>
          </div>
        )}

        {/* Task Grid */}
        {!isLoading && !isError && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task: any) => {
              const hasDueDate = !!task.dueDate;
              const isOverdue = hasDueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className="flex flex-col justify-between p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    {/* Header: Title and Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        onClick={() => setDetailTask(task)}
                        className={`text-lg font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 cursor-pointer transition-colors line-clamp-1 ${
                          task.status === 'COMPLETED' ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                        }`}
                        title="Click to view details"
                      >
                        {task.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[40px]">
                      {task.description || <span className="italic text-zinc-400">No description.</span>}
                    </p>

                    {/* Priority and Due Date */}
                    <div className="flex flex-wrap gap-2 items-center text-xs pt-1">
                      {/* Priority */}
                      <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                        task.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' :
                        task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' :
                        'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900'
                      }`}>
                        {task.priority} Priority
                      </span>

                      {/* Due Date */}
                      {hasDueDate && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                          isOverdue ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          {isOverdue && <span className="font-bold text-[9px] uppercase tracking-wider ml-0.5">(Overdue)</span>}
                        </span>
                      )}

                      {/* Attachment Badge */}
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-550">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{task.attachments.length}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 mt-4 pt-3">
                    {task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => completeTaskMutation.mutate(task.id)}
                        className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Mark as Completed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          deleteTaskMutation.mutate(task.id);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* User label if Admin */}
                  {user?.role === 'ADMIN' && task.user && (
                    <div className="absolute top-0 right-0 bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
                      User: {task.user.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && !isError && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* Task Modals */}
      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={createTaskMutation.isPending}
      />

      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSubmit={handleEditSubmit}
        isSubmitting={updateTaskMutation.isPending}
      />

      <TaskDetailsModal
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        task={detailTask}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200/55 dark:border-zinc-800/55 bg-white dark:bg-zinc-900 py-6 mt-12 text-center text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
