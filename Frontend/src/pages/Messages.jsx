import React, { useState } from "react";
import { Send, Search, MoreVertical, Phone, Video, Plus } from "lucide-react";

const mockChats = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    lastMessage: "Great work on the project! Looking forward to the next phase.",
    timestamp: "2 min",
    unread: 2,
    isOnline: true,
    role: "Client",
  },
  {
    id: 2,
    name: "Tech Innovations Inc",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TechInnovations",
    lastMessage: "Can you start by Monday?",
    timestamp: "1 hour",
    unread: 0,
    isOnline: true,
    role: "Client",
  },
  {
    id: 3,
    name: "Alex Dev",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    lastMessage: "I'll review and send you feedback",
    timestamp: "5 hours",
    unread: 0,
    isOnline: false,
    role: "Freelancer",
  },
  {
    id: 4,
    name: "Digital Solutions LLC",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DigitalSolutions",
    lastMessage: "Budget has been approved for the project",
    timestamp: "Yesterday",
    unread: 0,
    isOnline: true,
    role: "Client",
  },
];

const mockMessages = [
  {
    id: 1,
    sender: "Sarah Johnson",
    content: "Hi! I wanted to discuss the project timeline.",
    timestamp: "10:30 AM",
    isOwn: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: 2,
    sender: "You",
    content: "Sure! I'm available right now. What would you like to discuss?",
    timestamp: "10:32 AM",
    isOwn: true,
  },
  {
    id: 3,
    sender: "Sarah Johnson",
    content: "I'd like to move up the delivery date by one week if possible.",
    timestamp: "10:35 AM",
    isOwn: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: 4,
    sender: "Sarah Johnson",
    content: "We have a client event coming up and would love to showcase the work.",
    timestamp: "10:36 AM",
    isOwn: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: 5,
    sender: "You",
    content: "That sounds great! Let me check my schedule and I'll get back to you within the next hour.",
    timestamp: "10:38 AM",
    isOwn: true,
  },
  {
    id: 6,
    sender: "Sarah Johnson",
    content: "Perfect! Thanks so much.",
    timestamp: "10:40 AM",
    isOwn: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
];

function Messages() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "You",
        content: messageInput,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };
      setMessages([...messages, newMessage]);
      setMessageInput("");
    }
  };

  const filteredChats = mockChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dark:bg-[#0f111d] bg-[#161c32] w-full h-screen flex overflow-hidden">
      {/* Chat List */}
      <div className="hidden top-0 sticky overflow-scroll lg:flex w-80 left-0 border-r border-[#14a19f]/20 bg-[#0d1224]/50 flex-col ">
        {/* Header */}
        <div className="p-4 border-b border-[#14a19f]/20">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#161c32] border border-[#14a19f]/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#14a19f]/50 transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="relative left-0">
          <div className="flex-1 sticky">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`px-4 py-3 border-b border-[#14a19f]/10 cursor-pointer transition-all ${selectedChat.id === chat.id
                  ? "bg-[#14a19f]/20 border-l-2 border-l-[#14a19f]"
                  : "hover:bg-[#14a19f]/10"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full"
                    />
                    {chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d1224]" />
                    )}
                  </div>

                  {/* Chat info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500 shrink-0">
                        {chat.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {chat.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {chat.unread > 0 && (
                    <div className="bg-[#14a19f] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex relative flex-1 flex-col bg-[#0d1224]/50">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#14a19f]/20 bg-[#0d1224]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                    className="w-10 h-10 rounded-full"
                  />
                  {selectedChat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0d1224]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {selectedChat.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedChat.isOnline ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f]">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f]">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f]">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.isOwn ? "justify-end" : "justify-start"}`}
                >
                  {!msg.isOwn && msg.avatar && (
                    <img
                      src={msg.avatar}
                      alt={msg.sender}
                      className="w-8 h-8 rounded-full"
                    />
                  )}

                  <div className={`flex flex-col gap-1 ${msg.isOwn ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs text-sm ${msg.isOwn
                        ? "bg-[#14a19f] text-white"
                        : "bg-[#161c32] text-gray-100 border border-[#14a19f]/20"
                        }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#14a19f]/20 bg-[#0d1224]/80 backdrop-blur-sm">
              <div className="flex gap-3 items-end">
                <button className="p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors text-gray-400 hover:text-[#14a19f] shrink-0">
                  <Plus className="h-5 w-5" />
                </button>

                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  className="flex-1 px-4 py-2 bg-[#161c32] border border-[#14a19f]/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#14a19f]/50 transition-colors resize-none max-h-24"
                  rows="1"
                />

                <button
                  onClick={handleSendMessage}
                  className="p-2 hover:bg-[#14a19f] bg-[#14a19f]/80 rounded-lg transition-colors text-white shrink-0"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Select a conversation</div>
              <p className="text-gray-500 text-sm">
                Choose from your messages to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

  );
}

export default Messages;
