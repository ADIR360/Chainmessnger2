require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337, 
    },
    localTestnet: {
      url: "http://127.0.0.1:8545", 
      chainId: 1337, 
    },
  },
};
