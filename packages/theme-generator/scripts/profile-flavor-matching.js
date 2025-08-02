#!/usr/bin/env node

// Simple profiling script to identify performance bottlenecks
const { findBestMatchingFlavor, getAvailableFlavors, extractColorsFromImage } = require('../dist/index.js');
const fs = require('fs');
const path = require('path');

// Mock performance.now() for Node.js if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

async function runProfilingTest() {
  console.log('🔍 Starting Performance Profiling...\n');
  
  // Get available flavors
  const availableFlavors = getAvailableFlavors();
  console.log(`📋 Available flavors: ${availableFlavors.length}`);
  
  // Create some mock extracted colors (simulating what we'd get from an image)
  const mockExtractedColors = [
    { r: 45, g: 55, b: 72 },    // Dark blue-gray
    { r: 88, g: 101, b: 242 },  // Blue
    { r: 156, g: 207, b: 216 }, // Light blue
    { r: 255, g: 199, b: 95 },  // Yellow
    { r: 237, g: 135, b: 150 }, // Pink
    { r: 151, g: 209, b: 129 }, // Green
    { r: 245, g: 169, b: 127 }, // Orange
    { r: 198, g: 160, b: 246 }  // Purple
  ];
  
  console.log(`🎨 Mock extracted colors: ${mockExtractedColors.length}`);
  console.log('🚀 Running profiling test...\n');
  
  try {
    const result = await findBestMatchingFlavor(mockExtractedColors, availableFlavors);
    
    console.log('\n✅ Profiling completed successfully!');
    console.log(`🏆 Final result: ${result.flavorName} @ ${result.contrastLevel}x (score: ${result.score.toFixed(2)})`);
    
  } catch (error) {
    console.error('❌ Profiling failed:', error);
    process.exit(1);
  }
}

// Run the profiling test
runProfilingTest().catch(console.error);