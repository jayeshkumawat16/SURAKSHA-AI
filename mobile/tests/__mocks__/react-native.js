module.exports = {
  Share: {
    share: jest.fn().mockResolvedValue({ action: "sharedAction" }),
    sharedAction: "sharedAction",
    dismissedAction: "dismissedAction",
  },
  Linking: {
    openURL: jest.fn().mockResolvedValue(true),
    canOpenURL: jest.fn().mockResolvedValue(true),
  },
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: "ios",
    select: (obj) => obj.ios,
  },
};
