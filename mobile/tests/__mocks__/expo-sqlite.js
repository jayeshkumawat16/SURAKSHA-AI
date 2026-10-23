module.exports = {
  openDatabaseAsync: jest.fn().mockRejectedValue(new Error("Mock memory fallback in Jest")),
};
