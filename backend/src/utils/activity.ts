import prisma from './prisma';

export const logActivity = async (
  taskId: string,
  userId: string,
  action: string,
  oldValue: any = null,
  newValue: any = null
) => {
  try {
    await prisma.activityLog.create({
      data: {
        taskId,
        userId,
        action,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
