import { describe, it, expect, beforeEach } from 'vitest';

// Mock state
let mockState = {
  accessPermissions: {}
};

// Helper function to create a key for the access permissions map
const createKey = (assetId, accessor) => `${assetId}-${accessor}`;

// Mock contract functions
const grantAccess = (caller, assetId, accessor, permissionType, duration) => {
  const key = createKey(assetId, accessor);
  const blockHeight = 100; // Mock block height
  
  mockState.accessPermissions[key] = {
    permissionType,
    grantedBy: caller,
    grantedAt: blockHeight,
    expiration: blockHeight + duration
  };
  
  return { value: true };
};

const revokeAccess = (caller, assetId, accessor) => {
  const key = createKey(assetId, accessor);
  
  if (!mockState.accessPermissions[key]) {
    return { error: 404 };
  }
  
  if (mockState.accessPermissions[key].grantedBy !== caller) {
    return { error: 403 };
  }
  
  delete mockState.accessPermissions[key];
  return { value: true };
};

const hasAccess = (assetId, accessor) => {
  const key = createKey(assetId, accessor);
  const blockHeight = 100; // Mock block height
  
  if (!mockState.accessPermissions[key]) {
    return false;
  }
  
  return blockHeight < mockState.accessPermissions[key].expiration;
};

const getAccessDetails = (assetId, accessor) => {
  const key = createKey(assetId, accessor);
  return mockState.accessPermissions[key] || null;
};

describe('Access Control Contract', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockState = {
      accessPermissions: {}
    };
  });
  
  it('should grant access to a data asset', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const accessor = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    const permissionType = 2; // Read and analyze
    const duration = 100;
    
    const result = grantAccess(owner, assetId, accessor, permissionType, duration);
    
    expect(result.value).toBe(true);
    
    const key = createKey(assetId, accessor);
    expect(mockState.accessPermissions[key]).toBeDefined();
    expect(mockState.accessPermissions[key].permissionType).toBe(permissionType);
    expect(mockState.accessPermissions[key].grantedBy).toBe(owner);
  });
  
  it('should revoke access to a data asset', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const accessor = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    
    grantAccess(owner, assetId, accessor, 2, 100);
    const result = revokeAccess(owner, assetId, accessor);
    
    expect(result.value).toBe(true);
    
    const key = createKey(assetId, accessor);
    expect(mockState.accessPermissions[key]).toBeUndefined();
  });
  
  it('should not allow non-grantor to revoke access', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const accessor = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const nonOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const assetId = 1;
    
    grantAccess(owner, assetId, accessor, 2, 100);
    const result = revokeAccess(nonOwner, assetId, accessor);
    
    expect(result.error).toBe(403);
    
    const key = createKey(assetId, accessor);
    expect(mockState.accessPermissions[key]).toBeDefined();
  });
  
  it('should check if an entity has access to a data asset', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const accessor = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    
    grantAccess(owner, assetId, accessor, 2, 100);
    
    expect(hasAccess(assetId, accessor)).toBe(true);
  });
  
  it('should get access details', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const accessor = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    const permissionType = 2;
    
    grantAccess(owner, assetId, accessor, permissionType, 100);
    
    const details = getAccessDetails(assetId, accessor);
    
    expect(details).toBeDefined();
    expect(details.permissionType).toBe(permissionType);
    expect(details.grantedBy).toBe(owner);
  });
});
