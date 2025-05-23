const videoElement = document.getElementById('webcam');
const resultText = document.getElementById('result-text');

let currentStep = 'firstNumber'; // firstNumber → waitFist → secondNumber → done
let firstNumber = null;
let secondNumber = null;
let lastFingerCount = null;
let lastActionTime = 0;

// Setup MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const fingerStates = detectFingers(landmarks);
    const fingerCount = fingerStates.filter(Boolean).length;

    // Debounce: Only update if 1.5s passed since last action
    const now = Date.now();
    if (now - lastActionTime < 1500 || fingerCount === lastFingerCount) return;

    lastFingerCount = fingerCount;
    lastActionTime = now;

    if (currentStep === 'firstNumber' && fingerCount > 0) {
      firstNumber = fingerCount;
      resultText.textContent = `Stored First Number: ${firstNumber}`;
      currentStep = 'waitFist';
    } else if (currentStep === 'waitFist' && fingerCount === 0) {
      resultText.textContent = `Fist Detected: Ready for Second Number`;
      currentStep = 'secondNumber';
    } else if (currentStep === 'secondNumber' && fingerCount > 0) {
      secondNumber = fingerCount;
      const result = firstNumber + secondNumber;
      resultText.textContent = `Result: ${firstNumber} + ${secondNumber} = ${result}`;
      currentStep = 'done';
    }
  }
});

// Camera Setup
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 480,
  height: 360,
});
camera.start();

// Basic Finger Detection Function
function detectFingers(landmarks) {
  const fingerTips = [8, 12, 16, 20];
  const fingerBases = [6, 10, 14, 18];
  const fingers = [];

  // Thumb (simple left-hand assumption)
  fingers.push(landmarks[4].x < landmarks[3].x);

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = landmarks[fingerTips[i]];
    const base = landmarks[fingerBases[i]];
    fingers.push(tip.y < base.y);
  }

  return fingers;
}
function resetCalculator() {
  currentStep = 'firstNumber';
  firstNumber = null;
  secondNumber = null;
  resultText.textContent = 'Ready for new input';
  lastFingerCount = null;
}
