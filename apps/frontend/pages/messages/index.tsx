import React, { useState, useRef, useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Send, MessageSquare, Search } from 'lucide-react'
import { apiGet, apiPost } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToastContext } from '../../components/ui/Toast'
import { cn } from '../../lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  userId:      string
  userName:    string
  lastMessage: string
  lastAt:      string
  unread:      number
}

interface Message {
  id:        string
  senderId:  string
  content:   string
  createdAt: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MessagesPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const qc = useQueryClient()
  const { addToast } = useToastContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset } = useForm<{ content: string }>()

  const { data: conversations = [], isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn:  () => apiGet<Conversation[]>('/messages/conversations'),
    enabled:  !authLoading && !!user,
    refetchInterval: 10_000,
  })

  const { data: messages = [], isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ['messages', selectedUserId],
    queryFn:  () => apiGet<Message[]>(`/messages/conversation/${selectedUserId}`),
    enabled:  !!selectedUserId,
    refetchInterval: 5_000,
  })

  const sendMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      apiPost<Message>('/messages', { recipientId: selectedUserId, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', selectedUserId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      reset()
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to send message', 'error')
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredConvs = conversations.filter((c) =>
    c.userName.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = conversations.find((c) => c.userId === selectedUserId)

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    return d.toLocaleDateString()
  }

  return (
    <>
      <Head><title>Messages — TutorHub</title></Head>

      <DashboardLayout>
        <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden flex h-[calc(100vh-8rem)]">
          {/* Conversation list */}
          <div className="w-72 border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {convsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))
              ) : filteredConvs.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No conversations yet.</p>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={cn(
                      'w-full text-left p-3 flex items-center gap-3 transition-colors hover:bg-gray-50',
                      selectedUserId === conv.userId && 'bg-primary-50'
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {conv.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{conv.userName}</p>
                        <span className="text-xs text-gray-400 shrink-0 ml-1">{formatTime(conv.lastAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="bg-primary-600 text-white text-xs font-medium rounded-full px-1.5 py-0.5 shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col">
            {!selectedUserId ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8" />}
                  title="Select a conversation"
                  description="Choose a contact from the left to start messaging."
                />
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                    {selectedConv?.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="font-semibold text-gray-900">{selectedConv?.userName}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                  {msgsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                      </div>
                    ))
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center mt-auto">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : ''}`}>
                          <div className={cn(
                            'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                            isMine
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          )}>
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                              {formatDate(msg.createdAt)} · {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send form */}
                <form
                  onSubmit={handleSubmit(async ({ content }) => {
                    if (!content.trim()) return
                    await sendMutation.mutateAsync({ content: content.trim() })
                  })}
                  className="px-4 py-3 border-t border-gray-100 flex items-center gap-3"
                >
                  <input
                    {...register('content', { required: true })}
                    placeholder="Type a message..."
                    autoComplete="off"
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default MessagesPage
