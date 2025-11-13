import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Users, Bot, Search } from "lucide-react";

const DEMO_CONVERSATIONS = [
  {
    id: "1",
    patient: "Sarah Johnson",
    lastMessage: "Thank you for checking in on me, Doctor.",
    time: "10 minutes ago",
    unread: 2,
    type: "patient",
  },
  {
    id: "2",
    patient: "Michael Chen",
    lastMessage: "I'm feeling much better today after adjusting my medication.",
    time: "1 hour ago",
    unread: 0,
    type: "patient",
  },
  {
    id: "3",
    patient: "Care Team - Emily Rodriguez",
    lastMessage: "Patient requires follow-up consultation.",
    time: "2 hours ago",
    unread: 1,
    type: "team",
  },
  {
    id: "4",
    patient: "Emma AI Insights",
    lastMessage: "Patient trending down emotionally - Sarah Johnson",
    time: "3 hours ago",
    unread: 1,
    type: "ai",
  },
];

const DEMO_MESSAGES = [
  {
    id: "1",
    sender: "Dr. Smith",
    message: "Good morning Sarah! How are you feeling today?",
    time: "9:00 AM",
    type: "provider",
  },
  {
    id: "2",
    sender: "Sarah Johnson",
    message: "Good morning Doctor. I'm feeling a bit better today. The new medication seems to be helping.",
    time: "9:15 AM",
    type: "patient",
  },
  {
    id: "3",
    sender: "Dr. Smith",
    message: "That's wonderful to hear! Have you been taking it as prescribed?",
    time: "9:20 AM",
    type: "provider",
  },
  {
    id: "4",
    sender: "Sarah Johnson",
    message: "Yes, twice daily with meals. I set up reminders on my phone.",
    time: "9:25 AM",
    type: "patient",
  },
  {
    id: "5",
    sender: "Dr. Smith",
    message: "Excellent! Keep up the good work. Let me know if you experience any side effects.",
    time: "9:30 AM",
    type: "provider",
  },
  {
    id: "6",
    sender: "Sarah Johnson",
    message: "Thank you for checking in on me, Doctor.",
    time: "9:35 AM",
    type: "patient",
  },
];

export default function CommunicationsView() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = DEMO_CONVERSATIONS.filter((conv) =>
    conv.patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversationIcon = (type: string) => {
    switch (type) {
      case "team": return <Users className="w-5 h-5 text-blue-600" />;
      case "ai": return <Bot className="w-5 h-5 text-purple-600" />;
      default: return <MessageSquare className="w-5 h-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Communication Center</h2>
        <p className="text-gray-600">Secure HIPAA-compliant messaging with patients and care team</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 300px)" }}>
        <div className="grid grid-cols-12 h-full">
          <div className="col-span-4 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? "bg-[#6656cb]/10 border-l-4 border-l-[#6656cb]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getConversationIcon(conv.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{conv.patient}</h4>
                        {conv.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-500 mt-1">{conv.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-8 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold">
                      SJ
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sarah Johnson</h3>
                      <p className="text-sm text-gray-600">Patient • Active now</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {DEMO_MESSAGES.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === "provider" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.type === "provider"
                            ? "bg-[#6656cb] text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">{msg.sender}</p>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-2 ${
                          msg.type === "provider" ? "text-purple-200" : "text-gray-500"
                        }`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          setNewMessage("");
                        }
                      }}
                    />
                    <Button>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 HIPAA-compliant secure messaging
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            Emma AI Insights
          </h3>
          <p className="text-sm text-gray-600 mt-1">Automated care team notifications</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Patient Trending Down Emotionally</p>
                <p className="text-sm text-gray-700 mt-1">
                  Sarah Johnson's mood scores have declined 40% this week. Consider outreach.
                </p>
                <p className="text-xs text-gray-500 mt-2">3 hours ago</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Medication Adherence Drop</p>
                <p className="text-sm text-gray-700 mt-1">
                  Robert Wilson's medication adherence has dropped 40% this week.
                </p>
                <p className="text-xs text-gray-500 mt-2">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
