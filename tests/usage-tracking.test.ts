import { describe, it, expect, beforeEach } from 'vitest';

// Mock state
let mockState = {
  eventIdCounter: 0,
  usageEvents: {},
  assetUsageStats: {}
};

// Mock contract functions
const recordUsage = (caller, assetId, actionType, details) => {
  const newId = mockState.eventIdCounter + 1;
  const blockHeight = 100; // Mock block height
  
  // Record the usage event
  mockState.usageEvents[newId] = {
    assetId,
    user: caller,
    actionType,
    timestamp: blockHeight,
    details
  };
  
  // Update the event counter
  mockState.eventIdCounter = newId;
  
  // Update usage statistics
  if (!mockState.assetUsageStats[assetId]) {
    mockState.assetUsageStats[assetId] = {
      totalViews: 0,
      totalDownloads: 0,
      totalAnalyses: 0,
      lastAccessed: 0
    };
  }
  
  const stats = mockState.assetUsageStats[assetId];
  
  // Update the appropriate counter based on action type
  if (actionType === 1) {
    stats.totalViews += 1;
  } else if (actionType === 2) {
    stats.totalDownloads += 1;
  } else if (actionType === 3) {
    stats.totalAnalyses += 1;
  }
  
  stats.lastAccessed = blockHeight;
  
  return { value: newId };
};

const getUsageEvent = (eventId) => {
  return mockState.usageEvents[eventId] || null;
};

const getAssetUsageStats = (assetId) => {
  return mockState.assetUsageStats[assetId] || {
    totalViews: 0,
    totalDownloads: 0,
    totalAnalyses: 0,
    lastAccessed: 0
  };
};

describe('Usage Tracking Contract', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockState = {
      eventIdCounter: 0,
      usageEvents: {},
      assetUsageStats: {}
    };
  });
  
  it('should record a view usage event', () => {
    const user = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    const actionType = 1; // View
    
    const result = recordUsage(user, assetId, actionType, 'Viewed data summary');
    
    expect(result.value).toBe(1);
    expect(mockState.usageEvents[1]).toBeDefined();
    expect(mockState.usageEvents[1].actionType).toBe(actionType);
    expect(mockState.usageEvents[1].user).toBe(user);
    
    const stats = getAssetUsageStats(assetId);
    expect(stats.totalViews).toBe(1);
    expect(stats.totalDownloads).toBe(0);
    expect(stats.totalAnalyses).toBe(0);
  });
  
  it('should record a download usage event', () => {
    const user = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    const actionType = 2; // Download
    
    const result = recordUsage(user, assetId, actionType, 'Downloaded full dataset');
    
    expect(result.value).toBe(1);
    
    const stats = getAssetUsageStats(assetId);
    expect(stats.totalViews).toBe(0);
    expect(stats.totalDownloads).toBe(1);
    expect(stats.totalAnalyses).toBe(0);
  });
  
  it('should record an analyze usage event', () => {
    const user = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    const actionType = 3; // Analyze
    
    const result = recordUsage(user, assetId, actionType, 'Ran clustering algorithm');
    
    expect(result.value).toBe(1);
    
    const stats = getAssetUsageStats(assetId);
    expect(stats.totalViews).toBe(0);
    expect(stats.totalDownloads).toBe(0);
    expect(stats.totalAnalyses).toBe(1);
  });
  
  it('should get usage event details', () => {
    const user = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    
    recordUsage(user, assetId, 1, 'Viewed data summary');
    
    const event = getUsageEvent(1);
    
    expect(event).toBeDefined();
    expect(event.assetId).toBe(assetId);
    expect(event.user).toBe(user);
    expect(event.details).toBe('Viewed data summary');
  });
  
  it('should accumulate usage statistics for an asset', () => {
    const user = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    
    recordUsage(user, assetId, 1, 'Viewed data summary');
    recordUsage(user, assetId, 1, 'Viewed data again');
    recordUsage(user, assetId, 2, 'Downloaded dataset');
    recordUsage(user, assetId, 3, 'Ran analysis');
    
    const stats = getAssetUsageStats(assetId);
    
    expect(stats.totalViews).toBe(2);
    expect(stats.totalDownloads).toBe(1);
    expect(stats.totalAnalyses).toBe(1);
    expect(stats.lastAccessed).toBe(100);
  });
});
