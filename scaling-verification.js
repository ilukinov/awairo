/**
 * Test script to verify that Pomodoro widget elements scale with container, not viewport
 */

// Test function to run in browser console
function testPomodoroScaling() {
  console.log('🧪 Testing Pomodoro Widget Scaling...');
  
  // Get initial window size
  const initialWindowWidth = window.innerWidth;
  const initialWindowHeight = window.innerHeight;
  console.log(`Initial window size: ${initialWindowWidth}x${initialWindowHeight}`);
  
  // Find Pomodoro widget elements
  const displayElement = document.querySelector('.pomodoro-container .display');
  const buttonElement = document.querySelector('.pomodoro-container button');
  const iconElement = document.querySelector('.pomodoro-container .pomodoro-icon');
  
  if (!displayElement) {
    console.error('❌ No Pomodoro widget found! Make sure a widget is added to the canvas.');
    return;
  }
  
  // Measure initial sizes
  const initialDisplaySize = window.getComputedStyle(displayElement).fontSize;
  const initialButtonSize = window.getComputedStyle(buttonElement).fontSize;
  const initialIconSize = window.getComputedStyle(iconElement).fontSize;
  
  console.log('📏 Initial element sizes:');
  console.log(`  Display font-size: ${initialDisplaySize}`);
  console.log(`  Button font-size: ${initialButtonSize}`);
  console.log(`  Icon font-size: ${initialIconSize}`);
  
  // Simulate window resize by changing viewport temporarily
  const originalWidth = document.documentElement.style.width;
  const originalHeight = document.documentElement.style.height;
  
  // Change window size simulation
  const testWidth = initialWindowWidth * 1.5;
  const testHeight = initialWindowHeight * 1.5;
  
  console.log(`🔄 Simulating window resize to ${testWidth}x${testHeight}...`);
  
  // Force viewport change
  document.documentElement.style.width = testWidth + 'px';
  document.documentElement.style.height = testHeight + 'px';
  
  // Force recalculation
  setTimeout(() => {
    // Measure sizes after "resize"
    const afterDisplaySize = window.getComputedStyle(displayElement).fontSize;
    const afterButtonSize = window.getComputedStyle(buttonElement).fontSize;
    const afterIconSize = window.getComputedStyle(iconElement).fontSize;
    
    console.log('📏 After window resize:');
    console.log(`  Display font-size: ${afterDisplaySize}`);
    console.log(`  Button font-size: ${afterButtonSize}`);
    console.log(`  Icon font-size: ${afterIconSize}`);
    
    // Check if sizes remained the same (good) or changed (bad)
    const displayChanged = initialDisplaySize !== afterDisplaySize;
    const buttonChanged = initialButtonSize !== afterButtonSize;
    const iconChanged = initialIconSize !== afterIconSize;
    
    console.log('\n🔍 Test Results:');
    
    if (!displayChanged && !buttonChanged && !iconChanged) {
      console.log('✅ SUCCESS: Widget elements did NOT change size with window resize!');
      console.log('✅ Container-based scaling is working correctly.');
    } else {
      console.log('❌ FAILURE: Widget elements changed size with window resize!');
      console.log('❌ Elements are still using viewport-based scaling.');
      
      if (displayChanged) console.log(`   - Display size changed: ${initialDisplaySize} → ${afterDisplaySize}`);
      if (buttonChanged) console.log(`   - Button size changed: ${initialButtonSize} → ${afterButtonSize}`);
      if (iconChanged) console.log(`   - Icon size changed: ${initialIconSize} → ${afterIconSize}`);
    }
    
    // Restore original size
    document.documentElement.style.width = originalWidth;
    document.documentElement.style.height = originalHeight;
    
    console.log('\n💡 How to test manually:');
    console.log('1. Right-click on canvas and add a Pomodoro Timer widget');
    console.log('2. Note the size of the timer display and buttons');
    console.log('3. Resize the main window (not the widget)');
    console.log('4. The timer display and buttons should stay the same size');
    console.log('5. Resize the widget container itself');
    console.log('6. NOW the timer display and buttons should scale');
    
  }, 100);
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  // Wait for page load
  window.addEventListener('load', () => {
    setTimeout(testPomodoroScaling, 2000); // Wait 2s for widgets to load
  });
}

// Export for manual testing
if (typeof module !== 'undefined') {
  module.exports = { testPomodoroScaling };
}