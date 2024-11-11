const recordTabButton = document.querySelector("#tab");
const recordScreenButton = document.querySelector("#screen");
const toggleCameraButton = document.querySelector("#toggleCamera");
const toggleMicButton = document.querySelector("#mic");

let micStream = null; // Track microphone stream
let isMicOn = false; // Track mic state

// Check and return recording state from storage
const checkRecordingState = async () => {
  const { recording = false, type = "" } = await chrome.storage.local.get([
    "recording",
    "type",
  ]);
  return [recording, type];
};

// Update button text based on recording state
const updateRecordingText = (button, isRecording) => {
  button.innerText = isRecording
    ? "Stop Recording"
    : button.id === "tab"
    ? "Record Tab"
    : "Record Screen";
};

// Inject camera script into the tab
const injectCamera = async () => {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab?.id) {
      console.error("Active tab not found.");
      return;
    }

    await chrome.scripting.executeScript({
      files: ["content.js"],
      target: { tabId: activeTab.id },
    });
  } catch (error) {
    console.error("Error injecting camera:", error);
  }
};

// Remove camera from the tab
// const removeCamera = async () => {
//   const [activeTab] = await chrome.tabs.query({
//     active: true,
//     currentWindow: true,
//   });
//   if (activeTab?.id) {
//     await chrome.scripting.executeScript({
//       func: () => {
//         const camera = document.querySelector("#ab-camera");
//         if (camera) camera.style.display = "none";
//       },
//       target: { tabId: activeTab.id },
//     });
//     console.log("Camera removed from tab.");
//   }
// };

// Remove camera from the tab and stop the camera stream
const removeCamera = async () => {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTab?.id) {
    await chrome.scripting.executeScript({
      func: () => {
        const camera = document.querySelector("#ab-camera");
        if (camera) {
          // Stop the camera stream if it's active
          const stream = camera.srcObject;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          // Remove the camera element from the DOM
          camera.remove();
        }
      },
      target: { tabId: activeTab.id },
    });
    console.log("Camera removed from tab.");
  }
};

// Start the microphone
const startMic = async () => {
  try {
    if (isMicOn) return;
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone started");
    isMicOn = true;
    toggleMicButton.classList.add("active");
    toggleMicButton.innerText = "ON";
  } catch (error) {
    console.error("Error starting mic:", error);
    alert("Could not access microphone.");
  }
};

// Stop the microphone
const stopMic = async () => {
  if (micStream === null) return;
  console.log("mic here!!!", micStream);
  micStream.getAudioTracks().forEach((track) => track.stop());
  micStream = null;
  console.log("Microphone stopped");
  isMicOn = false;
  toggleMicButton.classList.remove("active");
  toggleMicButton.innerText = "OFF";
};

// Toggle recording on/off and update the UI accordingly
const toggleRecording = async (recordingType) => {
  const [isRecording, currentType] = await checkRecordingState();
  const buttonToToggle =
    recordingType === "tab" ? recordTabButton : recordScreenButton;

  if (isRecording && currentType === recordingType) {
    chrome.runtime.sendMessage({ type: "stop-recording" });
    updateRecordingText(buttonToToggle, false);
    removeCamera();
  } else if (!isRecording) {
    chrome.runtime.sendMessage({ type: "start-recording", recordingType });
    updateRecordingText(buttonToToggle, true);
    injectCamera();
  }
  window.close();
};

// const toggleRecording = async (recordingType) => {
//   const [isRecording] = await checkRecordingState();
//   const buttonToToggle =
//     recordingType === "tab" ? recordTabButton : recordScreenButton;

//   if (isRecording) {
//     chrome.runtime.sendMessage({ type: "stop-recording" });
//     updateRecordingText(buttonToToggle, false);
//     removeCamera();
//   } else {
//     chrome.runtime.sendMessage({ type: "start-recording", recordingType });
//     updateRecordingText(buttonToToggle, true);
//     injectCamera();
//   }
//   window.close();
// };

// Initialize event listeners for buttons
const initializeButtons = async () => {
  const [isRecording, recordingType] = await checkRecordingState();

  // Set initial button text based on recording state
  updateRecordingText(recordTabButton, isRecording && recordingType === "tab");
  updateRecordingText(
    recordScreenButton,
    isRecording && recordingType === "screen"
  );

  // Set initial states for Camera and Mic as "ON"
  toggleCameraButton.classList.add("active");
  toggleCameraButton.innerText = "ON";
  injectCamera(); // Inject camera at start

  // Start mic on initialization (ensure mic is on initially)
  if (!micStream) {
    await startMic();
  }

  // Event listeners for record buttons
  recordTabButton.addEventListener("click", () => toggleRecording("tab"));
  recordScreenButton.addEventListener("click", () => toggleRecording("screen"));

  // Camera toggle button functionality
  toggleCameraButton.addEventListener("click", () => {
    const isActive = toggleCameraButton.classList.toggle("active");
    toggleCameraButton.innerText = isActive ? "ON" : "OFF";
    isActive ? injectCamera() : removeCamera();
  });

  // Mic toggle button functionality
  toggleMicButton.addEventListener("click", () => {
    if (isMicOn) {
      stopMic(); // Stop mic if it's currently on
    } else {
      startMic(); // Start mic if it's currently off
    }
  });
};

// Initialize popup when loaded
document.addEventListener("DOMContentLoaded", initializeButtons);
