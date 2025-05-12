import { describe, it, expect, beforeEach } from 'vitest';

// Mock state
let mockState = {
  dataToken: {
    balances: {},
    totalSupply: 0
  },
  assetPricing: {}
};

// Mock contract functions
const ftMint = (amount, recipient) => {
  if (!mockState.dataToken.balances[recipient]) {
    mockState.dataToken.balances[recipient] = 0;
  }
  
  mockState.dataToken.balances[recipient] += amount;
  mockState.dataToken.totalSupply += amount;
  
  return { value: true };
};

const ftTransfer = (amount, sender, recipient) => {
  if (!mockState.dataToken.balances[sender] || mockState.dataToken.balances[sender] < amount) {
    return { error: 1 }; // Insufficient balance
  }
  
  if (!mockState.dataToken.balances[recipient]) {
    mockState.dataToken.balances[recipient] = 0;
  }
  
  mockState.dataToken.balances[sender] -= amount;
  mockState.dataToken.balances[recipient] += amount;
  
  return { value: true };
};

const setAssetPricing = (caller, assetId, viewPrice, downloadPrice, analyzePrice) => {
  mockState.assetPricing[assetId] = {
    viewPrice,
    downloadPrice,
    analyzePrice,
    owner: caller
  };
  
  return { value: true };
};

const payForAccess = (caller, assetId, actionType) => {
  if (!mockState.assetPricing[assetId]) {
    return { error: 404 };
  }
  
  const pricing = mockState.assetPricing[assetId];
  let amount;
  
  if (actionType === 1) {
    amount = pricing.viewPrice;
  } else if (actionType === 2) {
    amount = pricing.downloadPrice;
  } else {
    amount = pricing.analyzePrice;
  }
  
  return ftTransfer(amount, caller, pricing.owner);
};

const getAssetPricing = (assetId) => {
  return mockState.assetPricing[assetId] || null;
};

const getBalance = (account) => {
  return mockState.dataToken.balances[account] || 0;
};

// Initialize token supply
ftMint(1000000000, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

describe('Value Exchange Contract', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockState = {
      dataToken: {
        balances: {},
        totalSupply: 0
      },
      assetPricing: {}
    };
    
    // Initialize token supply
    ftMint(1000000000, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  });
  
  it('should set pricing for a data asset', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    
    const result = setAssetPricing(owner, assetId, 10, 50, 100);
    
    expect(result.value).toBe(true);
    expect(mockState.assetPricing[assetId]).toBeDefined();
    expect(mockState.assetPricing[assetId].viewPrice).toBe(10);
    expect(mockState.assetPricing[assetId].downloadPrice).toBe(50);
    expect(mockState.assetPricing[assetId].analyzePrice).toBe(100);
    expect(mockState.assetPricing[assetId].owner).toBe(owner);
  });
  
  it('should pay for viewing access', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const user = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    
    // Give the user some tokens
    ftMint(100, user);
    
    // Set pricing
    setAssetPricing(owner, assetId, 10, 50, 100);
    
    // Pay for view access
    const result = payForAccess(user, assetId, 1);
    
    expect(result.value).toBe(true);
    expect(getBalance(user)).toBe(90);
    expect(getBalance(owner)).toBe(10);
  });
  
  it('should pay for download access', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const user = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    
    // Give the user some tokens
    ftMint(100, user);
    
    // Set pricing
    setAssetPricing(owner, assetId, 10, 50, 100);
    
    // Pay for download access
    const result = payForAccess(user, assetId, 2);
    
    expect(result.value).toBe(true);
    expect(getBalance(user)).toBe(50);
    expect(getBalance(owner)).toBe(50);
  });
  
  it('should fail payment with insufficient balance', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const user = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const assetId = 1;
    
    // Give the user some tokens, but not enough
    ftMint(40, user);
    
    // Set pricing
    setAssetPricing(owner, assetId, 10, 50, 100);
    
    // Try to pay for download access
    const result = payForAccess(user, assetId, 2);
    
    expect(result.error).toBe(1);
    expect(getBalance(user)).toBe(40);
    expect(getBalance(owner)).toBe(0);
  });
  
  it('should get asset pricing', () => {
    const owner = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const assetId = 1;
    
    setAssetPricing(owner, assetId, 10, 50, 100);
    
    const pricing = getAssetPricing(assetId);
    
    expect(pricing).toBeDefined();
    expect(pricing.viewPrice).toBe(10);
    expect(pricing.downloadPrice).toBe(50);
    expect(pricing.analyzePrice).toBe(100);
  });
  
  it('should check token balance', () => {
    const account = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    expect(getBalance(account)).toBe(0);
    
    ftMint(500, account);
    
    expect(getBalance(account)).toBe(500);
  });
});
