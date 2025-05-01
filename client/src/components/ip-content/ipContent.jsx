import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewConversationMode, setIsNewConversationMode] = useState(false); // New state to track new conversation mode

  // Initialize provider and connect to MetaMask
  useEffect(() => {
    const initProvider = async () => {
      setConnectionStatus("Connecting to wallet...");
      if (window.ethereum) {
        try {
          // Request accounts with clear error handling
          try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
          } catch (requestError) {
            console.error("MetaMask account request error:", requestError);
            setConnectionStatus("Wallet connection rejected");
            alert("Please connect to MetaMask to use this app.");
            return;
          }
          
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const address = await web3Signer.getAddress();
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setSenderAddress(address);
          setIsConnected(true);
          setConnectionStatus("Wallet connected");
          console.log("Connected to wallet:", address);
          
          // Listen for account changes
          window.ethereum.on("accountsChanged", (accounts) => {
            if (accounts.length === 0) {
              // User disconnected wallet
              setIsConnected(false);
              setSigner(null);
              setClient(null);
              setIsInitialized(false);
              setConnectionStatus("Wallet disconnected");
              console.log("Wallet disconnected");
            } else {
              // Account changed, reload page to reinitialize everything
              window.location.reload();
            }
          });
          
        } catch (error) {
          console.error("MetaMask connection error:", error);
          setConnectionStatus("Wallet connection failed");
          alert("Error connecting to MetaMask: " + error.message);
        }
      } else {
        setConnectionStatus("No wallet detected");
        alert("MetaMask not detected. Please install MetaMask to use this app.");
        console.error("MetaMask not detected");
      }
    };
    
    initProvider();
    
    // Cleanup listener on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, []);

  // Initialize XMTP client
  useEffect(() => {
    const initXMTP = async () => {
      if (signer && isConnected) {
        try {
          setConnectionStatus("Initializing XMTP...");
          console.log("Initializing XMTP client...");
          
          // Create XMTP client with proper configuration for CORS
          const xmtpClient = await Client.create(signer, { 
            env: "production",
            options: {
              fetchOptions: {
                mode: 'cors',
               credentials: 'same-origin'
              }
            }
          });
          
          console.log("XMTP client version:", Client.version);
          console.log("XMTP client address:", await xmtpClient.address);
          
          setClient(xmtpClient);
          setIsInitialized(true);
          setConnectionStatus("XMTP initialized");
          console.log("XMTP client initialized successfully");
        } catch (error) {
          console.error("XMTP initialization error:", error);
          setConnectionStatus("XMTP initialization failed");
          alert("Error initializing XMTP client: " + error.message);
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
      if (!client) return;
      
      try {
        setIsLoading(true);
        console.log("Loading all conversations...");
        
        // Get all conversations from the client
        const allConversations = await client.conversations.list();
        console.log("Raw conversations count:", allConversations.length);
        
        // Group conversations by peer address
        const conversationsByAddress = {};
        
        // Format conversations for display
        await Promise.all(allConversations.map(async (convo) => {
          try {
            if (!convo || !convo.peerAddress) {
              console.error("Invalid conversation object:", convo);
              return;
            }
            
            const peerAddress = convo.peerAddress;
            console.log("Processing conversation with peer:", peerAddress);
            
            // Get the last message for preview
            const lastMessage = await convo.messages({ limit: 1 });
            const messagePreview = lastMessage && lastMessage.length > 0 && lastMessage[0].content
              ? lastMessage[0].content
              : "No messages yet";
            const timestamp = lastMessage && lastMessage.length > 0 && lastMessage[0].sent
              ? new Date(lastMessage[0].sent)
              : new Date();
            
            // Add to the grouped conversations
            if (!conversationsByAddress[peerAddress]) {
              conversationsByAddress[peerAddress] = {
                peerAddress,
                messagePreview: typeof messagePreview === 'string' && messagePreview.length > 30 
                  ? messagePreview.substring(0, 27) + "..."
                  : messagePreview,
                timestamp,
                conversation: convo
              };
            } else if (timestamp > conversationsByAddress[peerAddress].timestamp) {
              // Update if this message is newer
              conversationsByAddress[peerAddress] = {
                peerAddress,
                messagePreview: typeof messagePreview === 'string' && messagePreview.length > 30 
                  ? messagePreview.substring(0, 27) + "..."
                  : messagePreview,
                timestamp,
                conversation: convo
              };
            }
          } catch (convoError) {
            console.error("Error processing conversation:", convoError);
          }
        }));
        
        // Convert object to array and sort by most recent message
        const formattedConversations = Object.values(conversationsByAddress);
        formattedConversations.sort((a, b) => b.timestamp - a.timestamp);
        
        setConversations(formattedConversations);
        console.log("Loaded conversations:", formattedConversations.length);
        
        // Subscribe to new conversations with improved error handling
        const setupConversationStream = async (retryCount = 0, maxRetries = 5) => {
          try {
            return await client.conversations.stream(conversation => {
              if (!conversation || !conversation.peerAddress) {
                console.error("Received invalid conversation:", conversation);
                return;
              }
              
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
          } catch (error) {
            console.error("Conversation stream error:", error);
            if (retryCount < maxRetries) {
              console.log(`Retrying conversation stream (${retryCount + 1}/${maxRetries})...`);
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
              setTimeout(() => setupConversationStream(retryCount + 1, maxRetries), delay);
            } else {
              console.error("Failed to establish conversation stream after multiple attempts");
            }
          }
        };
        
        const unsubscribe = await setupConversationStream();
        
        // Set first conversation as active if no active conversation and there are conversations
        // BUT only if we're not in new conversation mode
        if (!activeConversation && formattedConversations.length > 0 && !isNewConversationMode) {
          setActiveConversation(formattedConversations[0].conversation);
          setRecipientAddress(formattedConversations[0].peerAddress);
        }
        
        setIsLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error("Error loading conversations:", error);
        setIsLoading(false);
        alert("Error loading conversations: " + error.message);
      }
    };
    
    if (isInitialized && client) {
      loadConversations();
    }
  }, [client, isInitialized, activeConversation, isNewConversationMode]); // Added isNewConversationMode to dependencies

  // Load messages when active conversation changes
  useEffect(() => {
    let messageStreamUnsubscribe = null;
    
    const loadMessages = async () => {
      if (!activeConversation) {
        setMessages([]);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log("Loading messages for conversation with:", activeConversation.peerAddress);
        
        // Get messages for the active conversation
        const messageList = await activeConversation.messages();
        console.log("Raw messages count:", messageList.length);
        
        // Format messages for display with proper validation
        const formattedMessages = messageList
          .filter(msg => msg && msg.content) // Filter out invalid messages
          .map(msg => ({
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
        
        // Subscribe to new messages with improved error handling and retry logic
        const setupMessageStream = async (retryCount = 0, maxRetries = 5) => {
          try {
            return await activeConversation.streamMessages(newMsg => {
              console.log("New message received:", newMsg);
              
              // Check if message is valid before processing
              if (!newMsg || typeof newMsg !== 'object') {
                console.error("Received invalid message:", newMsg);
                return;
              }
              
              // Safely access content
              const messageContent = newMsg.content || "Empty message";
              console.log("New message content:", messageContent);
              
              // Safely access sender
              const messageSender = newMsg.senderAddress || "Unknown sender";
              console.log("New message sender:", messageSender);
              
              // Show notification if message is from recipient
              if (messageSender !== senderAddress) {
                const shortAddress = messageSender.substring(0, 8) + "...";
                const previewContent = typeof messageContent === 'string' && messageContent.length > 20 
                  ? messageContent.substring(0, 20) + '...' 
                  : messageContent;
                
                showNotification(`${shortAddress}: ${previewContent}`);
                
                // Increment unread count if this is not the active conversation
                const messageConversationAddress = newMsg.conversation?.peerAddress;
                if (messageConversationAddress && activeConversation.peerAddress !== messageConversationAddress) {
                  setUnreadCounts(prev => ({
                    ...prev,
                    [messageConversationAddress]: (prev[messageConversationAddress] || 0) + 1
                  }));
                }
              }
              
              // Add message to UI
              setMessages(prevMessages => [
                ...prevMessages, 
                {
                  id: newMsg.id || `temp-${Date.now()}`,
                  text: messageContent,
                  sender: messageSender === senderAddress ? 'sender' : 'recipient',
                  timestamp: newMsg.sent ? new Date(newMsg.sent) : new Date(),
                  displayTime: (newMsg.sent ? new Date(newMsg.sent) : new Date()).toLocaleTimeString() + 
                    " " + (newMsg.sent ? new Date(newMsg.sent) : new Date()).toLocaleDateString()
                }
              ]);
              
              // Update conversation preview
              if (activeConversation && activeConversation.peerAddress) {
                updateConversationPreview(
                  activeConversation.peerAddress, 
                  messageContent, 
                  newMsg.sent ? new Date(newMsg.sent) : new Date()
                );
              }
            });
          } catch (error) {
            console.error("Message stream error:", error);
            if (retryCount < maxRetries) {
              console.log(`Retrying message stream (${retryCount + 1}/${maxRetries})...`);
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
              setTimeout(() => setupMessageStream(retryCount + 1, maxRetries), delay);
            } else {
              console.error("Failed to establish message stream after multiple attempts");
            }
          }
        };
        
        messageStreamUnsubscribe = await setupMessageStream();
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading messages:", error);
        setIsLoading(false);
        alert("Error loading messages: " + error.message);
      }
    };
    
    if (activeConversation) {
      loadMessages();
    }
    
    // Cleanup subscription when component unmounts or conversation changes
    return () => {
      if (messageStreamUnsubscribe && typeof messageStreamUnsubscribe === 'function') {
        messageStreamUnsubscribe();
      }
    };
  }, [activeConversation, senderAddress]);

  // Helper function to update conversation preview - memoized to prevent unnecessary rerenders
  const updateConversationPreview = useCallback((peerAddress, messageContent, timestamp) => {
    if (!peerAddress || typeof messageContent === 'undefined') return;
    
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(convo => {
        if (convo.peerAddress === peerAddress) {
          return {
            ...convo,
            messagePreview: typeof messageContent === 'string' && messageContent.length > 30 
              ? messageContent.substring(0, 27) + "..." 
              : messageContent,
            timestamp
          };
        }
        return convo;
      });
      
      // Re-sort by most recent
      return updatedConversations.sort((a, b) => b.timestamp - a.timestamp);
    });
  }, []);

  // Function to show notifications
  const showNotification = useCallback((message) => {
    setNewMessageNotification(message);
    
    // Request permission for browser notifications
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      try {
        new Notification("XMTP Message", { body: message });
      } catch (error) {
        console.error("Browser notification error:", error);
      }
    }
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNewMessageNotification(null);
    }, 5000);
  }, []);

  // Send message function with improved error handling
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) {
      return; // Don't send empty messages
    }
    
    if (!client) {
      console.error("XMTP client not initialized");
      alert("XMTP client not initialized. Please connect your wallet first.");
      return;
    }
    
    if (!activeConversation && !recipientAddress) {
      console.error("No active conversation or recipient address");
      alert("Please select a conversation or enter a recipient address.");
      return;
    }
    
    try {
      setIsLoading(true);
      let conversation = activeConversation;
      
      // If no active conversation but we have a recipient address, start a new conversation
      if (!conversation && recipientAddress) {
        // Validate the address format
        if (!ethers.isAddress(recipientAddress)) {
          console.error("Invalid recipient address:", recipientAddress);
          alert("Please enter a valid Ethereum address.");
          setIsLoading(false);
          return;
        }
        
        // Normalize to checksum address
        const checksummedAddress = ethers.getAddress(recipientAddress);
        setRecipientAddress(checksummedAddress);
        
        // Check if the recipient has XMTP initialized
        console.log("Checking if address can receive messages:", checksummedAddress);
        try {
          const canMessage = await client.canMessage(checksummedAddress);
          if (!canMessage) {
            console.error("Cannot message address:", checksummedAddress);
            alert("This address cannot receive messages. The recipient needs to initialize XMTP first.");
            setIsLoading(false);
            return;
          }
        } catch (canMessageError) {
          console.error("Error checking if can message:", canMessageError);
          alert("Error checking if recipient can receive messages: " + canMessageError.message);
          setIsLoading(false);
          return;
        }
        
        console.log("Creating new conversation with:", checksummedAddress);
        try {
          conversation = await client.conversations.newConversation(checksummedAddress);
          console.log("New conversation created:", conversation);
          
          // Add the new conversation to the list
          const newConvo = {
            peerAddress: checksummedAddress,
            messagePreview: "New conversation",
            timestamp: new Date(),
            conversation: conversation
          };
          
          setConversations(prev => [newConvo, ...prev]);
          setActiveConversation(conversation);
          // Once we've created a new conversation, we're no longer in new conversation mode
          setIsNewConversationMode(false);
        } catch (convoError) {
          console.error("Error creating conversation:", convoError);
          alert("Error creating conversation: " + convoError.message);
          setIsLoading(false);
          return;
        }
      }
      
      // Now send the message
      console.log("Sending message to:", conversation.peerAddress);
      console.log("Message content:", newMessage);
      
      try {
        const sentMessage = await conversation.send(newMessage);
        console.log("Message sent successfully:", sentMessage);
        
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
        
        // Clear message input
        setNewMessage("");
      } catch (sendError) {
        console.error("Error sending message:", sendError);
        alert("Error sending message: " + sendError.message);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Message sending error:", error);
      alert("Error processing message: " + error.message);
      setIsLoading(false);
    }
  }, [client, activeConversation, newMessage, recipientAddress, senderAddress, updateConversationPreview]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }, [sendMessage]);

  // Handle selecting a conversation
  const selectConversation = useCallback((conversation) => {
    if (!conversation || !conversation.conversation) {
      console.error("Invalid conversation selection:", conversation);
      return;
    }
    
    console.log("Selecting conversation with:", conversation.peerAddress);
    setActiveConversation(conversation.conversation);
    setRecipientAddress(conversation.peerAddress);
    setIsNewConversationMode(false); // Exit new conversation mode when selecting an existing conversation
    
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
  }, []);

  // For new conversation - updated to set the new conversation mode
  const startNewConversation = useCallback(() => {
    setActiveConversation(null);
    setRecipientAddress("");
    setMessages([]);
    setIsNewConversationMode(true); // Set new conversation mode to true
    // Close menu after clicking new conversation
    setMenuOpen(false);
  }, []);

  // Toggle hamburger menu
  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  // Format address for display
  const formatAddress = useCallback((address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Get total unread messages count
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);
  
  // Check if recipient can receive messages
  const checkRecipientXMTP = useCallback(async () => {
    if (!client || !recipientAddress) return;
    
    try {
      if (!ethers.isAddress(recipientAddress)) {
        alert("Please enter a valid Ethereum address.");
        return;
      }
      
      const checksummedAddress = ethers.getAddress(recipientAddress);
      const canMessage = await client.canMessage(checksummedAddress);
      
      if (canMessage) {
        alert("This address can receive XMTP messages!");
      } else {
        alert("This address cannot receive XMTP messages. The recipient needs to initialize XMTP first.");
      }
    } catch (error) {
      console.error("Error checking recipient XMTP status:", error);
      alert("Error checking recipient XMTP status: " + error.message);
    }
  }, [client, recipientAddress]);

  // Memoize some computed values
  const isAddressValid = useMemo(() => {
    return recipientAddress && ethers.isAddress(recipientAddress);
  }, [recipientAddress]);
  
  const canSendMessage = useMemo(() => {
    return isInitialized && (activeConversation || isAddressValid) && !isLoading;
  }, [isInitialized, activeConversation, isAddressValid, isLoading]);

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
                <span className="no-recipient">
                  {isNewConversationMode ? "New conversation" : "No active conversation"}
                </span>
              )}
            </div>
          </div>
          
          {/* Show input field if we're in new conversation mode or there's no active conversation */}
          {(isNewConversationMode || !activeConversation) && (
            <div className="new-recipient-input">
              <input 
                type="text" 
                className="address-input" 
                placeholder="Enter recipient address..." 
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
              <button 
                className="check-xmtp-button" 
                onClick={checkRecipientXMTP}
                disabled={!client || !recipientAddress || !isAddressValid}
              >
                Check XMTP
              </button>
            </div>
          )}
        </div>
        
        {/* Hamburger menu sidebar */}
        <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="user-profile">
            <div className="profile-address">{formatAddress(senderAddress)}</div>
            <div className={`connection-status ${isInitialized ? "connected" : ""}`}>
              {connectionStatus}
            </div>
          </div>
          
          <button className="new-chat-button" onClick={startNewConversation}>
            + New Conversation
          </button>
          
          <h3 className="conversations-header">Conversations by Address</h3>
          
          <div className="conversations-list">
            {isLoading ? (
              <div className="loading-indicator">Loading conversations...</div>
            ) : conversations.length > 0 ? (
              conversations.map((convo, idx) => (
                <div 
                  key={convo.peerAddress || idx} 
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
          {isLoading ? (
            <div className="loading-indicator">Loading messages...</div>
          ) : messages.length > 0 ? (
            messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`message ${msg.sender === 'sender' ? 'sender-message' : 'recipient-message'}`}>
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{msg.displayTime}</div>
              </div>
            ))
          ) : (
            <div className="empty-conversation">
              {isNewConversationMode ? "Enter a recipient address and start a new conversation!" : 
                recipientAddress ? "No messages yet. Start the conversation!" : 
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
            disabled={!canSendMessage}
          />
          <button 
            className="send-button" 
            onClick={sendMessage}
            disabled={!canSendMessage}
          >
            {isLoading ? "Sending..." : "Send"}
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
          <div className="info-item">Connection status: {connectionStatus}</div>
          <div className="info-item">XMTP status: {isInitialized ? "Initialized" : "Not initialized"}</div>
          {isLoading && <div className="info-item loading">Processing request...</div>}
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
              {recipientAddress && !isAddressValid && 
                "⚠️ Invalid Ethereum address format"}
            </div>
          </div>
        </div>
        
        <div className="info-section">
          <h2 className="info-title">Troubleshooting</h2>
          <button 
            className="reload-button"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
          <div className="info-item">
            <button 
              className="check-button"
              onClick={checkRecipientXMTP}
              disabled={!client || !recipientAddress || !ethers.isAddress(recipientAddress)}
            >
              Check if Recipient has XMTP
            </button>
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