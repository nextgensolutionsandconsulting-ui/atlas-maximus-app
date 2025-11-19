
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  Send,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Users,
  MessageSquare,
  ListTodo,
  Activity,
  Bell,
  Settings,
  XCircle
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

interface WorkspaceMessage {
  id: string
  workspaceId: string
  userId: string
  content: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo: string[]
  dueDate?: string
  createdAt: string
}

interface Notification {
  id: string
  notificationType: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function CollaborationWorkspace() {
  const { data: session } = useSession() || {}
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)

  useEffect(() => {
    loadWorkspaces()
    loadNotifications()
  }, [])

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceData()
    }
  }, [selectedWorkspace])

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
        if (data.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(data[0])
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }

  const loadWorkspaceData = async () => {
    if (!selectedWorkspace) return

    try {
      const [messagesRes, tasksRes] = await Promise.all([
        fetch(`/api/workspaces/${selectedWorkspace.id}/messages`),
        fetch(`/api/workspaces/${selectedWorkspace.id}/tasks`)
      ])

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setMessages(messagesData.reverse())
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }
    } catch (error) {
      console.error('Error loading workspace data:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const createWorkspace = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      if (response.ok) {
        const newWorkspace = await response.json()
        setWorkspaces([...workspaces, newWorkspace])
        setSelectedWorkspace(newWorkspace)
        setShowCreateWorkspace(false)
        toast.success('Workspace created successfully')
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast.error('Failed to create workspace')
    }
  }

  const sendMessage = async () => {
    if (!selectedWorkspace || !messageInput.trim()) return

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages([...messages, newMessage])
        setMessageInput('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const createTask = async (taskData: any) => {
    if (!selectedWorkspace) return

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks([newTask, ...tasks])
        setShowCreateTask(false)
        toast.success('Task created successfully')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Circle className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'IN_REVIEW':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'BLOCKED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive'
      case 'HIGH':
        return 'default'
      case 'MEDIUM':
        return 'secondary'
      case 'LOW':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Collaboration</h2>
          <p className="text-muted-foreground">
            Collaborate with your team in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadNotifications}>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </Button>
          <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
                <DialogDescription>
                  Create a new collaborative workspace for your team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                createWorkspace(
                  formData.get('name') as string,
                  formData.get('description') as string
                )
              }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input id="name" name="name" placeholder="Sprint 42 Team" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Collaboration space for Sprint 42"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateWorkspace(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedWorkspace?.id === workspace.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedWorkspace(workspace)}
                  >
                    <p className="font-medium">{workspace.name}</p>
                    {workspace.description && (
                      <p className="text-xs opacity-80 mt-1">{workspace.description}</p>
                    )}
                  </div>
                ))}
                {workspaces.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No workspaces yet. Create one to get started!
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {selectedWorkspace ? (
            <Tabs defaultValue="messages" className="space-y-4">
              <TabsList>
                <TabsTrigger value="messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <ListTodo className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedWorkspace.name}</CardTitle>
                    <CardDescription>{selectedWorkspace.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div key={message.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">User</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{message.content}</p>
                            </div>
                          </div>
                        ))}
                        {messages.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No messages yet. Start the conversation!
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-end">
                  <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                          Create a new collaborative task
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        createTask({
                          title: formData.get('title'),
                          description: formData.get('description'),
                          priority: formData.get('priority'),
                          status: 'TODO',
                        })
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="title">Task Title</Label>
                          <Input id="title" name="title" placeholder="Implement feature X" required />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea 
                            id="description" 
                            name="description" 
                            placeholder="Detailed description..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select name="priority" defaultValue="MEDIUM">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowCreateTask(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Task</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3 flex-1">
                            {getStatusIcon(task.status)}
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge variant={getPriorityColor(task.priority) as any}>
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline">{task.status}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {tasks.length === 0 && (
                    <Card>
                      <CardContent className="py-12">
                        <p className="text-sm text-muted-foreground text-center">
                          No tasks yet. Create one to get started!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Feed</CardTitle>
                    <CardDescription>Recent activity in this workspace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Activity feed coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Select a workspace to start collaborating
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Unread Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.filter(n => !n.isRead).slice(0, 5).map((notification) => (
                <div key={notification.id} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
