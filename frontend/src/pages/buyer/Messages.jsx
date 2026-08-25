import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar.jsx";
import ChatWindow from "../../components/buyer/ChatWindow.jsx";
import { messageService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const Message = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (user) {
      messageService.getConversations().then(({ data }) => {
        setConversations(data || []);
      });
    }
  }, [user]);

  const handleSelectConversation = (partnerId) => {
    setSelectedConversation(partnerId);
    messageService.getMessages(partnerId).then(({ data }) => {
      setMessages(data || []);
    });
  };

  const handleSendMessage = (text) => {
    if (selectedConversation) {
      messageService.send({ receiver_id: selectedConversation, content: text }).then(({ data }) => {
        setMessages((prev) => [...prev, { ...data, content: data.content, sender_id: data.sender_id }]);
      });
    }
  };

  return (
    <div>
      <Navbar />
      <div className="message-page container">
        <h1>Messages</h1>
        <div className="conversations">
          {conversations.map((conv) => {
            const partner = conv.partner || conv;
            return (
              <div
                key={partner.id}
                onClick={() => handleSelectConversation(partner.id)}
                className={`conversation ${selectedConversation === partner.id ? "active" : ""}`}
              >
                {partner.name}
              </div>
            );
          })}
        </div>
        {selectedConversation && (
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default Message;