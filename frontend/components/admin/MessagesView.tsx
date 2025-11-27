import { useState, useEffect } from "react";
import { Send, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Message } from "~backend/admin_portal/messages_types";

export default function MessagesView() {
  const [to, setTo] = useState("+1");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  
  const limit = 20;

  useEffect(() => {
    loadMessages();
  }, [offset]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await backend.admin_portal.listMessages({
        limit,
        offset,
        channel: 'sms'
      });
      setMessages(response.messages);
      setTotal(response.total);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">Send Test SMS</h2>
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
            onClick={handleSendTest}
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Test SMS
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Message History</h2>
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
          <p className="text-sm text-gray-500 mt-1">
            {total} total message{total !== 1 ? 's' : ''}
          </p>
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No messages yet. Send a test SMS to get started.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(msg.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        msg.direction === 'inbound' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {msg.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {msg.to}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {msg.from}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-md">
                      <div className="truncate" title={msg.body}>
                        {msg.body}
                      </div>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
