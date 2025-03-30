import React, { useState, useEffect } from "react";
import "./LandingPage.css";

function LandingPage() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleRedirect = () => {
    setIsAnimating(true);
    setTimeout(() => {
      window.location.href = "/IpTracker"; 
    }, 800); 
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = document.querySelectorAll('.blockchain-node');
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (randomNode) {
        randomNode.classList.add('pulse');
        setTimeout(() => {
          randomNode.classList.remove('pulse');
        }, 1000);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Check if MetaMask is installed
  const checkIfMetaMaskIsInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  
  const connectToMetaMask = async () => {
    setIsConnecting(true);
    try {
 
      const isMetaMaskInstalled = checkIfMetaMaskIsInstalled();
      if (!isMetaMaskInstalled) {
        alert("Please install MetaMask to connect!");
        setIsConnecting(false);
        return;
      }

     
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
    
      setAccount(accounts[0]);
      
     
      localStorage.setItem('walletAddress', accounts[0]);
      
      console.log("Connected with account:", accounts[0]);
      setIsConnecting(false);
      
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Failed to connect to MetaMask. Please try again.");
      setIsConnecting(false);
    }
  };


  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  
  const handleContinueToChat = () => {
    handleRedirect();
  };

  
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        } else {
          setAccount(null);
          localStorage.removeItem('walletAddress');
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div className={`landing-container ${isAnimating ? 'fade-out' : ''}`}>
      <div className="blockchain-background">
        <div className="blockchain-grid">
          {Array(30)
            .fill()
            .map((_, i) => (
              <div key={i} className="blockchain-node">
                <div className="node-inner"></div>
              </div>
            ))}
        </div>
      </div>

      <div className="content-container">
        <div className="connect-container">
          <h1 className="title-animate">Secure Messaging on the Blockchain</h1>
          <p className="subtitle-animate">Experience truly decentralized communication.</p>

          <div className="button-group">
            {account ? (
              <>
                <div className="wallet-display">
                  <span className="metamask-icon">🦊</span>
                  <span className="wallet-address">{formatAddress(account)}</span>
                </div>
                <button 
                  className="connect-button" 
                  onClick={handleContinueToChat}
                >
                  Enter App
                </button>
              </>
            ) : (
              <button 
                className="metamask-button" 
                onClick={() => connectToMetaMask()}
                disabled={isConnecting}
              >
                <span className="metamask-icon">🦊</span>
                <span>{isConnecting ? "Connecting..." : "Connect with MetaMask"}</span>
              </button>
            )}
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">End-to-End Encryption</div>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">Fast & Reliable</div>
            </div>
            <div className="feature">
              <div className="feature-icon">👨🏻‍💻</div>
              <div className="feature-text">Anonymous</div>
            </div>
            <div className="feature">
              <div className="feature-icon">🔗</div>
              <div className="feature-text">Fully Decentralized</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// I am not the only traveller , searching for a trail to follow again , oh take me back to the night we met. 
// I had all of you then none of you. I am not the only traveller , who has not repaid his debt.
//  I've been searching for a trail to follow again. Take me back to the night we met. And then I can tell myself, what the hell I'm supposed to do. 
// And then I can tell myself, not to ride along with you. I had all of you then none of you. I am not the only traveller, who has not repaid his debt. 
// I've been searching for a trail to follow again. Take me back to the night we met. I don't know what I'm supposed to do, haunted by the ghost of you. 
// Oh, take me back to the night we met. When the night was full of terrors and your eyes were filled with tears. When you had not touched me yet. 
export default LandingPage;