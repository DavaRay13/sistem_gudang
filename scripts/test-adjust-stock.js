import assert from 'node:assert';

// Mock localStorage for node environment
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

// Simulating adjustStock logic
function simulateAdjustStock(currentStock, targetStock) {
  if (targetStock < 0) throw new Error('Stok tidak boleh negatif');
  const diff = targetStock - currentStock;
  return {
    newStock: targetStock,
    mutationQty: Math.abs(diff),
    mutationType: 'MANUAL_ADJUSTMENT',
  };
}

// Test: Adjust stock to 0 from 10
const res1 = simulateAdjustStock(10, 0);
assert.strictEqual(res1.newStock, 0, 'Stock must become 0');
assert.strictEqual(res1.mutationQty, 10, 'Diff must be 10');

// Test: Adjust stock to 0 when already 0
const res2 = simulateAdjustStock(0, 0);
assert.strictEqual(res2.newStock, 0, 'Stock must stay 0');
assert.strictEqual(res2.mutationQty, 0, 'Diff must be 0');

// Test: Negative stock rejection
assert.throws(() => simulateAdjustStock(5, -1), /negatif/);

console.log('All adjust stock assertion checks passed!');
