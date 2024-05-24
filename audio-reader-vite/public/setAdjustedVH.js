/*
  We are no longer using this file, in favor of the equivalent hook (useAdjustedVH.ts)
  Set the --vh variable to a corrected value that works even on mobile 
  where the URL Bar Height is not taken into consideration

  default value of --vh is 1vh, but that will be corrected on mobile, when URL Bar is present to window.innerHeight/100.0

  CSS:
  :root {
    --vh: 1vh;
  }
  index.html:
  <script type="module" src="setAdjustedVH.js"></script>
 */
function removeFixed100VHElement(element) {
  document.documentElement.removeChild(element);
}

export function setAdjustedVH() {
  const windowHeight = window.innerHeight;
  const newVH = windowHeight / 100; // Each unit of VH should be 1% of the actual windowHeight
  document.documentElement.style.setProperty("--vh", `${newVH}px`);
  // console.log("window.innerHeight: ", windowHeight);
  // console.log("Corrected vh: ", newVH);
}

// These two functions are not necessary to calculate the --vh value
// But they are useful to show the actual height of the URL Bar height on mobile devices
function createFixed100VHFElement() {
  const testElement = document.createElement("div");
  testElement.style.cssText =
    "position: fixed; top: 0; height: 100vh; pointer-events: none;";
  document.documentElement.insertBefore(
    testElement,
    document.documentElement.firstChild
  );
  return testElement;
}

function getVHDebugValues() {
  const windowHeight = window.innerHeight;
  const newVH = windowHeight / 100; // Each unit of VH should be 1% of the actual windowHeight
  // This section is not actually need to calculate the --vh value
  // But it is useful to show the actual height of the URL Bar height on mobile devices
  const fixed100VHElt = createFixed100VHFElement();
  const fixed100VHHeight = fixed100VHElt.offsetHeight;
  removeFixed100VHElement(fixed100VHElt);
  const urlBarHeight = fixed100VHHeight - windowHeight;

  console.log("window.innerHeight: ", windowHeight);
  console.log("Fixed 100vh Height: ", fixed100VHHeight);
  console.log("URL Bar Height: ", urlBarHeight);
  console.log("Corrected vh: ", newVH);

  return {
    windowHeight,
    fixed100VHElt,
    urlBarHeight,
    newVH,
  };
}
export function showCorrectedVH() {
  const str = JSON.stringify(getVHDebugValues(), null, 2);
  const numCopies = 10;
  const strCopies = Array(numCopies).fill(str).join("\n");

  // Optionally update display or debug info
  const debugVHElt = document.getElementById("debugVH");
  if (debugVHElt) {
    debugVHElt.innerHTML = strCopies;
  } else {
    console.error("No element with id 'debugVH' found");
  }
}

// Set the --vh-offset variable when the page loads or resizes
window.addEventListener("DOMContentLoaded", setAdjustedVH);
window.addEventListener("resize", setAdjustedVH);
// if (+new Date() > 0) {
//   // Set the --vh-offset variable when the page loads
//   window.addEventListener("DOMContentLoaded", showCorrectedVH);
//   window.addEventListener("resize", showCorrectedVH);
// }
// setInterval(showCorrectedVH, 1000);
