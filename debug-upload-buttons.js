// Debug script for upload button issues in ResidentDocumentsModal
// Run this in the browser console when the modal is open

console.log("🔍 Debugging Upload Buttons in ResidentDocumentsModal");

// Check if fileInputRef exists
const fileInputs = document.querySelectorAll('input[type="file"]');
console.log(`📄 Found ${fileInputs.length} file input(s):`, fileInputs);

// Check upload buttons
const uploadButtons = document.querySelectorAll('button[onclick*="fileInputRef"], button:has(svg[data-lucide="upload"])');
console.log(`🔘 Found ${uploadButtons.length} upload button(s):`, uploadButtons);

// More specific search for upload buttons
const allButtons = document.querySelectorAll('button');
const suspectedUploadButtons = Array.from(allButtons).filter(btn => {
  const text = btn.textContent?.toLowerCase() || '';
  return text.includes('upload') || text.includes('document') || btn.querySelector('svg[data-lucide="upload"]');
});
console.log(`🎯 Suspected upload buttons:`, suspectedUploadButtons);

// Check if any buttons have click listeners
suspectedUploadButtons.forEach((btn, idx) => {
  console.log(`Button ${idx + 1}:`, {
    text: btn.textContent?.trim(),
    disabled: btn.disabled,
    style: btn.style.cssText,
    className: btn.className,
    onclick: btn.onclick,
    hasEventListeners: getEventListeners ? getEventListeners(btn) : 'N/A'
  });
});

// Check file inputs
fileInputs.forEach((input, idx) => {
  console.log(`File Input ${idx + 1}:`, {
    accept: input.accept,
    multiple: input.multiple,
    disabled: input.disabled,
    style: input.style.cssText,
    className: input.className,
    value: input.value,
    files: input.files?.length || 0
  });
});

// Test file input click programmatically
if (fileInputs.length > 0) {
  console.log("🧪 Testing programmatic click on first file input...");
  try {
    fileInputs[0].click();
    console.log("✅ File input click executed successfully");
  } catch (error) {
    console.error("❌ Error clicking file input:", error);
  }
}

// Check for any error event listeners
document.addEventListener('error', (e) => {
  console.error("❌ Error event detected:", e);
}, { once: true });

// Check console for any existing errors
console.log("🔍 Check browser console for any JavaScript errors related to the upload functionality");
console.log("💡 If upload buttons aren't working, check:");
console.log("1. Network tab for failed API requests");
console.log("2. Console for JavaScript errors");
console.log("3. Whether the file input is properly connected to the button");
console.log("4. If the handleFileUpload function is being called");