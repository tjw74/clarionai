// Simple test script to verify DCA calculations
const { calculateTunedDCA, calculateRegularDCA } = require('./src/datamanager/dca');
const { calculateZScores } = require('./src/datamanager/zScore');

// Test data
const testPriceData = [100, 90, 110, 80, 120, 95, 105, 85, 115, 100];
const testMetricData = [1.0, 0.8, 1.2, 0.7, 1.3, 0.9, 1.1, 0.8, 1.2, 1.0];
const budgetPerDay = 10;
const windowSize = 10;

console.log('Testing DCA calculations...');

// Test regular DCA
const regularDCA = calculateRegularDCA(testPriceData, budgetPerDay, windowSize);
console.log('Regular DCA BTC bought:', regularDCA);
console.log('Total BTC (Regular):', regularDCA.reduce((sum, btc) => sum + btc, 0));

// Test tuned DCA with zone-based model
const zScores = calculateZScores(testMetricData, windowSize);
console.log('Z-scores:', zScores);

const tunedDCA = calculateTunedDCA(testPriceData, zScores, budgetPerDay, windowSize, 
  (zScores, zoneSize, maxBonus) => {
    // Simple zone-based allocation for testing
    return zScores.map(z => z < 0 ? 2.0 : 1.0); // 2x allocation for negative z-scores
  }, 0.25, 5.0);

console.log('Tuned DCA BTC bought:', tunedDCA.btcBought);
console.log('Tuned DCA daily allocations:', tunedDCA.dailyAllocations);
console.log('Total BTC (Tuned):', tunedDCA.btcBought.reduce((sum, btc) => sum + btc, 0));
console.log('Total spent (Tuned):', tunedDCA.dailyAllocations.reduce((sum, allocation) => sum + allocation, 0));

console.log('Test completed successfully!'); 