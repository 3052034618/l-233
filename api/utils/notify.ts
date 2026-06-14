import { notifications, users } from '../db/index.js'
import type { Notification } from '../db/memoryStore.js'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export async function createNotification(
  type: Notification['type'],
  priority: Notification['priority'],
  title: string,
  content: string,
  recipientRole: string,
  relatedId?: string,
): Promise<Notification[]> {
  const createdNotifications: Notification[] = []

  const roleUsers = await users.getByRole(recipientRole)

  for (const user of roleUsers) {
    const notification: Omit<Notification, 'id' | 'created_at'> = {
      type,
      priority,
      title,
      content,
      related_id: relatedId,
      related_type: type,
      recipient_id: user.id,
      recipient_role: recipientRole,
      is_read: 0,
    }

    const id = generateId('notif')
    const fullNotification: Notification = {
      ...notification,
      id,
      created_at: formatDate(new Date()),
    }

    await notifications.create(fullNotification)
    createdNotifications.push(fullNotification)
  }

  return createdNotifications
}
