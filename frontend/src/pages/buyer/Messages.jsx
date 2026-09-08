import { useEffect, useMemo, useRef, useState } from "react";
import { Inbox, MessageCircle, RefreshCw, Search, XCircle } from "lucide-react";

import Navbar from "../../components/common/Navbar.jsx";
import Sidebar from "../../components/common/Sidebar.jsx";
import ChatWindow from "../../components/buyer/ChatWindow.jsx";
import { messageService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

import "./Messages.css";

const getArrayPayload = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

const getPartner = (conversation, currentUserId) => {
  if (conversation.partner) return conversation.partner;
  if (conversation.other_user) return conversation.other_user;
  if (conversation.profile) return conversation.profile;

  if (Array.isArray(conversation.participants)) {
    return (
      conversation.participants.find(
        (participant) => String(participant.id) !== String(currentUserId),
      ) || conversation.participants[0]
    );
  }

  return conversation;
};

const getPartnerId = (conversation, currentUserId) => {
  const partner = getPartner(conversation, currentUserId);
  return (
    partner?.id ||
    conversation.partner_id ||
    conversation.other_user_id ||
    conversation.receiver_id ||
    conversation.user_id
  );
};

const getPartnerName = (partner) =>
  partner?.full_name || partner?.name || partner?.username || "Campus seller";

const getInitials = (name) =>
  String(name || "CM")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getLastMessage = (conversation) => {
  const last = conversation.last_message || conversation.latest_message;
  if (typeof last === "string") return last;
  return (
    last?.content ||
    last?.text ||
    conversation.last_message_content ||
    "Start a conversation"
  );
};

const getConversationTime = (conversation) => {
  const value =
    conversation.last_message?.created_at ||
    conversation.latest_message?.created_at ||
    conversation.updated_at ||
    conversation.created_at;
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

export default function Messages({ sellerMode = false }) {
  const { user } = useAuth();
  const isSeller = sellerMode || user?.role === "seller";
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [query, setQuery] = useState("");
  const requestSequence = useRef(0);

  const loadConversations = async ({ background = false } = {}) => {
    if (!user) return;

    try {
      background ? setRefreshing(true) : setConversationLoading(true);
      setError("");
      const { data } = await messageService.getConversations();
      setConversations(getArrayPayload(data, "conversations"));
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "We could not load your conversations.",
      );
    } finally {
      setConversationLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) loadConversations();
    else setConversationLoading(false);
  }, [user?.id]);

  const visibleConversations = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return conversations;

    return conversations.filter((conversation) => {
      const partner = getPartner(conversation, user?.id);
      return [
        getPartnerName(partner),
        partner?.stall_name,
        getLastMessage(conversation),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [conversations, query, user?.id]);

  const handleSelectConversation = async (conversation) => {
    const partner = getPartner(conversation, user?.id);
    const partnerId = getPartnerId(conversation, user?.id);
    if (!partnerId) {
      toast.error("This conversation is missing a partner ID");
      return;
    }

    const requestId = ++requestSequence.current;
    setSelectedConversation({ conversation, partner, partnerId });
    setMessages([]);
    setMessageLoading(true);
    setMessageError("");

    try {
      const { data } = await messageService.getMessages(partnerId);
      if (requestId === requestSequence.current) {
        setMessages(getArrayPayload(data, "messages"));
      }
    } catch (requestError) {
      if (requestId === requestSequence.current) {
        setMessageError(
          requestError.response?.data?.error ||
            requestError.message ||
            "We could not load this conversation.",
        );
      }
    } finally {
      if (requestId === requestSequence.current) setMessageLoading(false);
    }
  };

  const retryMessages = () => {
    if (selectedConversation) {
      handleSelectConversation(selectedConversation.conversation);
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedConversation?.partnerId || sending) return false;

    try {
      setSending(true);
      const { data } = await messageService.send({
        receiver_id: selectedConversation.partnerId,
        content,
      });
      const responseMessage = data?.data || data?.message || data;
      const sentMessage =
        responseMessage && typeof responseMessage === "object"
          ? responseMessage
          : {};

      setMessages((current) => [
        ...current,
        {
          ...sentMessage,
          id: sentMessage?.id || `local-${Date.now()}`,
          content: sentMessage?.content || content,
          sender_id: sentMessage?.sender_id || user.id,
          created_at: sentMessage?.created_at || new Date().toISOString(),
        },
      ]);

      setConversations((current) =>
        current.map((conversation) =>
          String(getPartnerId(conversation, user?.id)) ===
          String(selectedConversation.partnerId)
            ? {
                ...conversation,
                last_message: {
                  content,
                  created_at: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
              }
            : conversation,
        ),
      );
      return true;
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.error ||
          requestError.message ||
          "Message could not be sent",
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  const closeMobileConversation = () => {
    requestSequence.current += 1;
    setSelectedConversation(null);
    setMessages([]);
    setMessageError("");
  };

  return (
    <div
      className={
        isSeller ? "dashboard-layout seller-messages-shell" : "messages-shell"
      }
    >
      {isSeller ? <Sidebar /> : <Navbar />}

      <main
        className={
          isSeller ? "dashboard-main seller-messages-main" : "messages-page"
        }
      >
        <header
          className={`messages-page-header ${
            isSeller ? "topbar seller-messages-header" : ""
          }`}
        >
          <div>
            <span>
              {isSeller ? "Seller conversations" : "Campus conversations"}
            </span>

            <h1>Messages</h1>

            <p>
              {isSeller
                ? "Answer buyer questions and coordinate orders in one place."
                : "Ask sellers questions and coordinate your orders in one place."}
            </p>
          </div>
          <button
            type="button"
            className="messages-refresh-btn"
            onClick={() => loadConversations({ background: true })}
            disabled={conversationLoading || refreshing}
          >
            <RefreshCw className={refreshing ? "is-spinning" : ""} size={15} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        <section
          className={`messages-layout ${
            isSeller ? "seller-messages-layout" : ""
          } ${selectedConversation ? "has-selection" : ""}`}
        >
          <aside className="conversation-panel" aria-label="Conversations">
            <div className="conversation-panel-header">
              <div>
                <strong>Inbox</strong>
                <span>{conversations.length}</span>
              </div>
              <label className="conversation-search">
                <Search size={15} />
                <span className="sr-only">Search conversations</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search messages"
                />
              </label>
            </div>

            <div className="conversation-list">
              {conversationLoading ? (
                <ConversationSkeleton />
              ) : error ? (
                <div className="conversation-state is-error">
                  <XCircle />
                  <strong>Inbox unavailable</strong>
                  <p>{error}</p>
                  <button type="button" onClick={() => loadConversations()}>
                    Try again
                  </button>
                </div>
              ) : !conversations.length ? (
                <div className="conversation-state">
                  <Inbox />
                  <strong>No conversations yet</strong>
                  <p>
                    {isSeller
                      ? "Buyer conversations will appear here when someone contacts your stall."
                      : "Open a product and message its seller to start chatting."}
                  </p>
                </div>
              ) : !visibleConversations.length ? (
                <div className="conversation-state compact">
                  <Search />
                  <strong>No matches</strong>
                  <p>Try another seller name.</p>
                </div>
              ) : (
                visibleConversations.map((conversation, index) => {
                  const partner = getPartner(conversation, user?.id);
                  const partnerId = getPartnerId(conversation, user?.id);
                  const partnerName = getPartnerName(partner);
                  const unread = Number(conversation.unread_count || 0);
                  const active =
                    String(selectedConversation?.partnerId) ===
                    String(partnerId);

                  return (
                    <button
                      type="button"
                      className={`conversation-row ${active ? "active" : ""}`}
                      key={conversation.id || partnerId || index}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <span className="conversation-avatar">
                        {partner?.avatar_url || partner?.profile_image ? (
                          <img
                            src={partner.avatar_url || partner.profile_image}
                            alt=""
                          />
                        ) : (
                          getInitials(partnerName)
                        )}
                      </span>
                      <span className="conversation-copy">
                        <span>
                          <strong>{partnerName}</strong>
                          <time>{getConversationTime(conversation)}</time>
                        </span>
                        <span>
                          <small>{getLastMessage(conversation)}</small>
                          {unread > 0 && (
                            <em>{unread > 99 ? "99+" : unread}</em>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="message-content-panel">
            {selectedConversation ? (
              <ChatWindow
                partner={selectedConversation.partner}
                messages={messages}
                currentUserId={user?.id}
                loading={messageLoading}
                error={messageError}
                sending={sending}
                onRetry={retryMessages}
                onBack={closeMobileConversation}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="message-welcome-state">
                <span>
                  <MessageCircle />
                </span>
                <small>Your inbox</small>
                <h2>Select a conversation</h2>
                <p>
                  {isSeller
                    ? "Choose a buyer conversation to read messages and reply."
                    : "Choose a seller from the left to read messages and continue your conversation."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="conversation-skeleton" aria-label="Loading conversations">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item}>
          <span className="skeleton" />
          <div>
            <i className="skeleton" />
            <i className="skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
