import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, RefreshCw, Search, Filter, ChevronDown, ChevronUp, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Message } from "~backend/admin_portal/messages_types";

type DirectionFilter = 'all' | 'inbound' | 'outbound';
type ViewMode = 'list' | 'conversation';

export default function MessagesView() {
  const [to, setTo] = useState("+1");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [searchPhone, setSearchPhone] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();
  const intervalRef = useRef<number | null>(null);
  
  const limit = 20;

  useEffect(() => {
    loadMessages();
  }, [offset, directionFilter, searchPhone]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = window.setInterval(() => {
        loadMessages();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, offset, directionFilter, searchPhone]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await backend.admin_portal.listMessages({
        limit,
        offset,
        channel: 'sms',
        direction: directionFilter === 'all' ? undefined : directionFilter
      });
      
      let filteredMessages = response.messages;
      if (searchPhone) {
        const search = searchPhone.toLowerCase();
        filteredMessages = response.messages.filter(msg => 
          msg.to.toLowerCase().includes(search) || 
          msg.from.toLowerCase().includes(search)
        );
      }
      
      setMessages(filteredMessages);
      setTotal(searchPhone ? filteredMessages.length : response.total);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!to || !body) {
      toast({
        title: "Validation Error",
        description: "Phone number and message body are required",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const response = await backend.admin_portal.sendTestSMS({ to, body });
      
      if (response.success) {
        toast({
          title: "SMS Sent",
          description: `Message sent successfully (ID: ${response.message_id})`,
        });
        setBody("");
        loadMessages();
      } else {
        toast({
          title: "Send Failed",
          description: response.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
      toast({
        title: "Error",
        description: "Failed to send test SMS",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'received':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const toggleExpanded = (msgId: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(msgId)) {
      newExpanded.delete(msgId);
    } else {
      newExpanded.add(msgId);
    }
    setExpandedMessages(newExpanded);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    setTo(msg.from);
    setBody('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getConversations = () => {
    const conversations: { [phone: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const otherParty = msg.direction === 'inbound' ? msg.from : msg.to;
      if (!conversations[otherParty]) {
        conversations[otherParty] = [];
      }
      conversations[otherParty].push(msg);
    });
    
    return Object.entries(conversations).map(([phone, msgs]) => ({
      phone,
      messages: msgs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      lastMessage: msgs[0],
      unreadCount: msgs.filter(m => m.direction === 'inbound' && m.status === 'received').length
    })).sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">
            {replyingTo ? `Reply to ${replyingTo.from}` : 'Send Test SMS'}
          </h2>
          {replyingTo && (
            <Button
              onClick={() => {
                setReplyingTo(null);
                setTo('+1');
                setBody('');
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              To Phone Number
            </label>
            <Input
              type="tel"
              placeholder="+12345678900"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Message Body
            </label>
            <textarea
              placeholder="Enter your test message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full border rounded-lg p-2 font-sans text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {body.length} / 160 characters
            </p>
          </div>

          <Button
            onClick={async () => {
              await handleSendTest();
              if (replyingTo) {
                setReplyingTo(null);
                setTo('+1');
              }
            }}
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {replyingTo ? 'Send Reply' : 'Send Test SMS'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Message History</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button
                onClick={loadMessages}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
              >
                List View
              </Button>
              <Button
                onClick={() => setViewMode('conversation')}
                variant={viewMode === 'conversation' ? 'default' : 'outline'}
                size="sm"
              >
                Conversation View
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={directionFilter}
                onChange={(e) => {
                  setDirectionFilter(e.target.value as DirectionFilter);
                  setOffset(0);
                }}
                className="border rounded px-3 py-1.5 text-sm"
              >
                <option value="all">All Messages</option>
                <option value="inbound">Inbound Only</option>
                <option value="outbound">Outbound Only</option>
              </select>
            </div>

            <div className="flex gap-2 items-center flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search phone number..."
                value={searchPhone}
                onChange={(e) => {
                  setSearchPhone(e.target.value);
                  setOffset(0);
                }}
                className="flex-1"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {total} total message{total !== 1 ? 's' : ''}
            {directionFilter !== 'all' && ` (${directionFilter})`}
            {searchPhone && ` matching "${searchPhone}"`}
          </p>
        </div>

        {viewMode === 'conversation' ? (
          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Loading conversations...
              </div>
            ) : getConversations().length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No conversations yet. Send a test SMS to get started.
              </div>
            ) : (
              getConversations().map((conv) => (
                <div key={conv.phone} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-mono font-semibold">{conv.phone}</div>
                        <div className="text-xs text-gray-500">
                          {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(conv.lastMessage.created_at)}
                      </span>
                      <Button
                        onClick={() => handleReply(conv.messages[0])} 
                        variant="outline"
                        size="sm"
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="ml-13 space-y-2">
                    {conv.messages.slice(0, 3).map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-2xl ${
                          msg.direction === 'inbound'
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'bg-purple-50 border-l-4 border-purple-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`text-xs font-semibold ${
                            msg.direction === 'inbound' ? 'text-blue-700' : 'text-purple-700'
                          }`}>
                            {msg.direction === 'inbound' ? '← Inbound' : '→ Outbound'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(msg.status)}`}>
                            {msg.status}
                          </span>
                        </div>
                        <div className="text-sm">{msg.body}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(msg.created_at)}
                        </div>
                      </div>
                    ))}
                    {conv.messages.length > 3 && (
                      <div className="text-xs text-gray-500 ml-3">
                        + {conv.messages.length - 3} more message{conv.messages.length - 3 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading messages...
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No messages yet. Send a test SMS to get started.
                    </td>
                  </tr>
                ) : (
                  messages.map((msg) => {
                    const isExpanded = expandedMessages.has(msg.id);
                    const isTruncated = msg.body.length > 100;
                    const displayBody = isExpanded ? msg.body : msg.body.substring(0, 100);
                    
                    return (
                      <tr 
                        key={msg.id} 
                        className={`hover:bg-gray-50 ${
                          msg.direction === 'inbound' ? 'bg-blue-50/30' : 'bg-purple-50/30'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(msg.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${
                            msg.direction === 'inbound' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {msg.direction === 'inbound' ? '← In' : '→ Out'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">
                          {msg.to}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">
                          {msg.from}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-md">
                          <div className={isTruncated && !isExpanded ? '' : 'whitespace-pre-wrap'}>
                            {displayBody}
                            {isTruncated && !isExpanded && '...'}
                          </div>
                          {isTruncated && (
                            <button
                              onClick={() => toggleExpanded(msg.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <><ChevronUp className="w-3 h-3" /> Show less</>
                              ) : (
                                <><ChevronDown className="w-3 h-3" /> Show more</>
                              )}
                            </button>
                          )}
                          {msg.metadata?.auto_reply && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">
                              Auto-reply
                            </span>
                          )}
                          {msg.error && (
                            <div className="text-xs text-red-600 mt-1">
                              Error: {msg.error}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(msg.status)}`}>
                            {msg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {msg.direction === 'inbound' && (
                            <Button
                              onClick={() => handleReply(msg)}
                              variant="outline"
                              size="sm"
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <Button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
            </span>
            <Button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + messages.length >= total}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
