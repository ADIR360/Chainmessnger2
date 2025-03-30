import React, { useState, useEffect } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import "./chatting.css";

function ChattingContent() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize provider and connect to MetaMask
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const web3Signer = await web3Provider.getSigner();
          const address = await web3Signer.getAddress();
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setSenderAddress(address);
          setIsConnected(true);
          console.log("Connected to wallet:", address);
        } catch (error) {
          console.error("MetaMask connection error:", error);
          alert("Error connecting to MetaMask. Please make sure it's installed and unlocked.");
        }
      } else {
        alert("MetaMask not detected. Please install MetaMask to use this app.");
        console.error("MetaMask not detected");
      }
    };
    
    initProvider();
  }, []);

  // Initialize XMTP client
  useEffect(() => {
    const initXMTP = async () => {
      if (signer) {
        try {
          console.log("Initializing XMTP client...");
          const xmtpClient = await Client.create(signer, { env: "production" });
          setClient(xmtpClient);
          setIsInitialized(true);
          console.log("XMTP client initialized");
        } catch (error) {
          console.error("XMTP initialization error:", error);
          alert("Error initializing XMTP client. Please try again.");
        }
      }
    };
    
    if (isConnected && signer) {
      initXMTP();
    }
  }, [signer, isConnected]);

  // Load all conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (client) {
        try {
          console.log("Loading all conversations...");
          const allConversations = await client.conversations.list();
          
          // Group conversations by peer address
          const conversationsByAddress = {};
          
          // Format conversations for display
          await Promise.all(allConversations.map(async (convo) => {
            const peerAddress = convo.peerAddress;
            const lastMessage = await convo.messages({ limit: 1 });
            const messagePreview = lastMessage.length > 0 ? lastMessage[0].content : "No messages yet";
            const timestamp = lastMessage.length > 0 ? new Date(lastMessage[0].sent) : new Date();
            
            // Add to the grouped conversations
            if (!conversationsByAddress[peerAddress]) {
              conversationsByAddress[peerAddress] = {
                peerAddress,
                messagePreview: messagePreview.length > 30 ? messagePreview.substring(0, 27) + "..." : messagePreview,
                timestamp,
                conversation: convo
              };
            } else if (timestamp > conversationsByAddress[peerAddress].timestamp) {
              // Update if this message is newer
              conversationsByAddress[peerAddress] = {
                peerAddress,
                messagePreview: messagePreview.length > 30 ? messagePreview.substring(0, 27) + "..." : messagePreview,
                timestamp,
                conversation: convo
              };
            }
          }));
          
          // Convert object to array and sort by most recent message
          const formattedConversations = Object.values(conversationsByAddress);
          formattedConversations.sort((a, b) => b.timestamp - a.timestamp);
          
          setConversations(formattedConversations);
          console.log("Loaded conversations:", formattedConversations.length);
          
          // Subscribe to new conversations
          const unsubscribe = await client.conversations.stream(conversation => {
            console.log("New conversation detected:", conversation.peerAddress);
            
            // Update conversations list
            setConversations(prevConversations => {
              // Check if conversation with this peer already exists
              const existingIndex = prevConversations.findIndex(c => 
                c.peerAddress === conversation.peerAddress
              );
              
              // Notify about new conversation
              if (existingIndex === -1) {
                showNotification(`New conversation from ${conversation.peerAddress.substring(0, 8)}...`);
                
                // Add new conversation
                return [{
                  peerAddress: conversation.peerAddress,
                  messagePreview: "New conversation",
                  timestamp: new Date(),
                  conversation
                }, ...prevConversations];
              }
              
              return prevConversations;
            });
          });
          
          // Set first conversation as active if no active conversation and there are conversations
          if (!activeConversation && formattedConversations.length > 0) {
            setActiveConversation(formattedConversations[0].conversation);
            setRecipientAddress(formattedConversations[0].peerAddress);
          }
          
          return unsubscribe;
        } catch (error) {
          console.error("Error loading conversations:", error);
        }
      }
    };
    
    if (isInitialized) {
      loadConversations();
    }
  }, [client, isInitialized, activeConversation]);

  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (activeConversation) {
        try {
          console.log("Loading messages for conversation with:", activeConversation.peerAddress);
          const messageList = await activeConversation.messages();
          
          // Format messages for display
          const formattedMessages = messageList.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.senderAddress === senderAddress ? 'sender' : 'recipient',
            timestamp: new Date(msg.sent),
            displayTime: new Date(msg.sent).toLocaleTimeString() + " " + new Date(msg.sent).toLocaleDateString()
          }));
          
          setMessages(formattedMessages);
          console.log("Loaded messages:", formattedMessages.length);
          
          // Update last seen timestamp for this conversation
          setLastSeenTimestamps(prev => ({
            ...prev,
            [activeConversation.peerAddress]: new Date()
          }));
          
          // Reset unread count for this conversation
          setUnreadCounts(prev => ({
            ...prev,
            [activeConversation.peerAddress]: 0
          }));
          
          // Close the menu when a conversation is loaded
          setMenuOpen(false);
          
          // Subscribe to new messages for this conversation
          const unsubscribe = await activeConversation.streamMessages(newMsg => {
            console.log("New message received:", newMsg.content);
            
            // Show notification if message is from recipient
            if (newMsg.senderAddress !== senderAddress) {
              showNotification(`${newMsg.senderAddress.substring(0, 8)}...: ${newMsg.content.substring(0, 20)}${newMsg.content.length > 20 ? '...' : ''}`);
            }
            
            // Add message to UI
            setMessages(prevMessages => [
              ...prevMessages, 
              {
                id: newMsg.id,
                text: newMsg.content,
                sender: newMsg.senderAddress === senderAddress ? 'sender' : 'recipient',
                timestamp: new Date(newMsg.sent),
                displayTime: new Date(newMsg.sent).toLocaleTimeString() + " " + new Date(newMsg.sent).toLocaleDateString()
              }
            ]);
            
            // Update conversation preview
            updateConversationPreview(activeConversation.peerAddress, newMsg.content, new Date(newMsg.sent));
            
            // Update unread counts for inactive conversations
            if (newMsg.senderAddress !== senderAddress && activeConversation.peerAddress !== newMsg.conversation?.peerAddress) {
              setUnreadCounts(prev => ({
                ...prev,
                [newMsg.conversation.peerAddress]: (prev[newMsg.conversation.peerAddress] || 0) + 1
              }));
            }
          });
          
          return unsubscribe;
        } catch (error) {
          console.error("Error loading messages:", error);
        }
      }
    };
    
    if (activeConversation) {
      loadMessages();
    }
  }, [activeConversation, senderAddress]);

  // Helper function to update conversation preview
  const updateConversationPreview = (peerAddress, messageContent, timestamp) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(convo => {
        if (convo.peerAddress === peerAddress) {
          return {
            ...convo,
            messagePreview: messageContent.length > 30 ? messageContent.substring(0, 27) + "..." : messageContent,
            timestamp
          };
        }
        return convo;
      });
      
      // Re-sort by most recent
      return updatedConversations.sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  // Function to show notifications
  const showNotification = (message) => {
    setNewMessageNotification(message);
    
    // Request permission for browser notifications
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification("XMTP Message", { body: message });
    }
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNewMessageNotification(null);
    }, 5000);
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return; // Don't send empty messages
    }
    
    if (!client) {
      alert("XMTP client not initialized. Please connect your wallet first.");
      return;
    }
    
    if (!activeConversation && !recipientAddress) {
      alert("Please select a conversation or enter a recipient address.");
      return;
    }
    
    try {
      let conversation = activeConversation;
      
      // If no active conversation but we have a recipient address, start a new conversation
      if (!conversation && recipientAddress) {
        if (!ethers.isAddress(recipientAddress)) {
          alert("Please enter a valid recipient address.");
          return;
        }
        
        console.log("Creating new conversation with:", recipientAddress);
        conversation = await client.conversations.newConversation(recipientAddress);
        setActiveConversation(conversation);
      }
      
      console.log("Sending message to:", conversation.peerAddress);
      await conversation.send(newMessage);
      
      const now = new Date();
      
      // Add message to UI immediately
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `temp-${Date.now()}`,
          text: newMessage,
          sender: 'sender',
          timestamp: now,
          displayTime: now.toLocaleTimeString() + " " + now.toLocaleDateString()
        }
      ]);
      
      // Update conversation preview
      updateConversationPreview(conversation.peerAddress, newMessage, now);
      
      console.log("Message sent successfully");
      setNewMessage("");
    } catch (error) {
      console.error("Message sending error:", error);
      alert("Error sending message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Handle selecting a conversation
  const selectConversation = (conversation) => {
    setActiveConversation(conversation.conversation);
    setRecipientAddress(conversation.peerAddress);
    
    // Reset unread count
    setUnreadCounts(prev => ({
      ...prev,
      [conversation.peerAddress]: 0
    }));
    
    // Update last seen timestamp
    setLastSeenTimestamps(prev => ({
      ...prev,
      [conversation.peerAddress]: new Date()
    }));
    
    // Close menu after selection
    setMenuOpen(false);
  };

  // For new conversation
  const startNewConversation = () => {
    setActiveConversation(null);
    setRecipientAddress("");
    setMessages([]);
    // Close menu after clicking new conversation
    setMenuOpen(false);
  };

  // Toggle hamburger menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get total unread messages count
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="app-container">
      {/* Chat section */}
      <div className="chat-section">
        <div className="address-bar">
          <div className="menu-container">
            <button 
              className="hamburger-menu" 
              onClick={toggleMenu} 
              aria-label="Toggle conversation menu"
            >
              <span className="hamburger-icon">☰</span>
              {getTotalUnreadCount() > 0 && (
                <span className="menu-badge">{getTotalUnreadCount()}</span>
              )}
            </button>
            
            <div className="recipient-info">
              {recipientAddress ? (
                <>
                  <span className="recipient-address">{formatAddress(recipientAddress)}</span>
                  <span className="recipient-status">
                    Last seen: {lastSeenTimestamps[recipientAddress] 
                      ? new Date(lastSeenTimestamps[recipientAddress]).toLocaleTimeString() 
                      : "Never"}
                  </span>
                </>
              ) : (
                <span className="no-recipient">No active conversation</span>
              )}
            </div>
          </div>
          
          {!activeConversation && (
            <div className="new-recipient-input">
              <input 
                type="text" 
                className="address-input" 
                placeholder="Enter recipient address..." 
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>
          )}
        </div>
        
        {/* Hamburger menu sidebar */}
        <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="user-profile">
            <div className="profile-address">{formatAddress(senderAddress)}</div>
            <div className={`connection-status ${isInitialized ? "connected" : ""}`}>
              {isInitialized ? "Connected" : "Disconnected"}
            </div>
          </div>
          
          <button className="new-chat-button" onClick={startNewConversation}>
            + New Conversation
          </button>
          
          <h3 className="conversations-header">Conversations by Address</h3>
          
          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((convo, idx) => (
                <div 
                  key={idx} 
                  className={`conversation-item ${activeConversation && activeConversation.peerAddress === convo.peerAddress ? 'active' : ''}`}
                  onClick={() => selectConversation(convo)}
                >
                  <div className="conversation-icon">
                    {formatAddress(convo.peerAddress).charAt(0)}
                  </div>
                  <div className="conversation-details">
                    <div className="conversation-header">
                      <span className="peer-address">{formatAddress(convo.peerAddress)}</span>
                      <span className="timestamp">{convo.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="message-preview">{convo.messagePreview}</div>
                  </div>
                  {unreadCounts[convo.peerAddress] > 0 && (
                    <div className="unread-badge">{unreadCounts[convo.peerAddress]}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-conversations">No conversations yet</div>
            )}
          </div>
          
          <div className="sidebar-footer">
            <div className="connected-as">
              Connected as:
              <div className="current-address">{senderAddress}</div>
            </div>
          </div>
        </div>
        
        {/* Overlay for closing the menu when clicking outside */}
        {menuOpen && (
          <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
        )}
        
        <div className="messages-container">
          {messages.length > 0 ? (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender === 'sender' ? 'sender-message' : 'recipient-message'}`}>
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{msg.displayTime}</div>
              </div>
            ))
          ) : (
            <div className="empty-conversation">
              {recipientAddress ? 
                "No messages yet. Start the conversation!" : 
                "Select a conversation or start a new one"}
            </div>
          )}
        </div>
        
        <div className="message-input">
          <input 
            type="text"
            placeholder="Type your message here"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isInitialized || (!activeConversation && !recipientAddress)}
          />
          <button 
            className="send-button" 
            onClick={sendMessage}
            disabled={!isInitialized || (!activeConversation && !recipientAddress)}
          >
            Send
          </button>
        </div>
      </div>
      
      {/* Info panel */}
      <div className="info-panel">
        {newMessageNotification && (
          <div className="notification">
            {newMessageNotification}
          </div>
        )}
        
        <div className="info-section">
          <h2 className="info-title">Message System State</h2>
          <div className="info-item">Connection status: {isConnected ? "Connected" : "Disconnected"}</div>
          <div className="info-item">XMTP status: {isInitialized ? "Initialized" : "Not initialized"}</div>
        </div>
        
        <div className="info-section">
          <h2 className="info-title">Sender address:</h2>
          <div className="address-info">
            <div className="address-title">Public Key</div>
            <div className="address-value">{senderAddress || "Not connected"}</div>
          </div>
        </div>
        
        <div className="info-section">
          <h2 className="info-title">Active conversation with:</h2>
          <div className="address-info recipient">
            <div className="address-title">Public Key</div>
            <div className="address-value">{recipientAddress || "None selected"}</div>
            <div className="info-item">
              {recipientAddress && !ethers.isAddress(recipientAddress) && 
                "⚠️ Invalid Ethereum address format"}
            </div>
          </div>
        </div>
        
        <div className="info-section">
          <h2 className="info-title">Message Info</h2>
          <div className="info-item">Total messages: {messages.length}</div>
          <div className="info-item">
            Last activity: {messages.length > 0 ? messages[messages.length - 1].displayTime : "No messages"}
          </div>
          <div className="info-item">Total conversations: {conversations.length}</div>
          <div className="info-item">Unread messages: {getTotalUnreadCount()}</div>
        </div>
      </div>
    </div>
  );
}

export default ChattingContent;