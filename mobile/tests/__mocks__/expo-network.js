module.exports = {
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
};
