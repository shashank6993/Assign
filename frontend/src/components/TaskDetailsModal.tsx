'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/utils/api';
import { toast } from '@/store/useToastStore';
import { X, FileText, Download, Calendar, Activity, Paperclip, Loader2, UploadCloud } from 'lucide-react';
import { useState, useRef } from 'react';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TaskDetailsModal({ isOpen, onClose, task }: TaskDetailsModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const taskId = task?.id;

  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['task', taskId, 'activity'],
    queryFn: () => apiRequest(`/api/tasks/${taskId}/activity`),
    enabled: !!taskId && isOpen
  });

  const { data: attachments = [], isLoading: isAttachmentsLoading } = useQuery({
    queryKey: ['task', taskId, 'attachments'],
    queryFn: () => apiRequest(`/api/tasks/${taskId}/attachments`),
    enabled: !!taskId && isOpen
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return apiRequest(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      toast.success('Attachment uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId, 'attachments'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload attachment.');
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl h-[85vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>{task.title}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Due Date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                Description
              </h4>
              <p className="mt-2 text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                {task.description || <span className="italic text-zinc-400">No description provided.</span>}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4" />
                  <span>Attachments</span>
                </h4>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <button
                    onClick={triggerFileUpload}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    Upload
                  </button>
                </div>
              </div>

              {isAttachmentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-zinc-400 italic py-2">No attachments uploaded yet. Images and PDFs are supported.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file: any) => {
                    const isImage = file.mimeType.startsWith('image/');
                    const fullUrl = `${API_URL}${file.fileUrl}`;

                    return (
                      <div
                        key={file.id}
                        className="flex flex-col p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 gap-2"
                      >
                        {isImage ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <img
                              src={fullUrl}
                              alt={file.fileName}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video rounded-lg bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                            <FileText className="w-8 h-8 text-zinc-500" />
                            <span className="text-xs font-medium">PDF Document</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={file.fileName}>
                            {file.fileName}
                          </span>
                          <a
                            href={fullUrl}
                            download={file.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 pt-6 md:pt-0 md:pl-6 space-y-4 flex flex-col h-full overflow-hidden">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <Activity className="w-4 h-4" />
              <span>Activity History</span>
            </h4>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[40vh] md:max-h-full">
              {isActivitiesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-zinc-400 italic">No activity logs recorded.</p>
              ) : (
                <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-2.5 pl-4 space-y-5 py-1">
                  {activities.map((log: any) => {
                    let detailText = '';
                    if (log.action === 'CREATE') {
                      detailText = 'created this task';
                    } else if (log.action === 'DELETE') {
                      detailText = 'deleted this task';
                    } else if (log.action === 'UPDATE') {
                      detailText = 'updated task details';
                    } else if (log.action === 'STATUS_CHANGE') {
                      const oldVal = log.oldValue?.status || 'Unknown';
                      const newVal = log.newValue?.status || 'Unknown';
                      detailText = `changed status from ${oldVal} to ${newVal}`;
                    } else if (log.action === 'ATTACHMENT_ADDED') {
                      detailText = `attached file: "${log.newValue?.fileName || 'file'}"`;
                    } else {
                      detailText = log.action.replace('_', ' ').toLowerCase();
                    }

                    return (
                      <div key={log.id} className="relative text-xs">
                        <div className="absolute -left-[22.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {log.user?.name || 'System User'}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-450">
                            {detailText}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
