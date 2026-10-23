module.exports = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 10,
    },
    timestamp: Date.now(),
  }),
  Accuracy: {
    Balanced: 3,
  },
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
  },
};
