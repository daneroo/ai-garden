function removeFixed100VHElement(element) {
  document.documentElement.removeChild(element);
}

function setAdjustedVH() {
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

// Set the --vh-offset variable when the page loads or resizes
window.addEventListener("DOMContentLoaded", setAdjustedVH);
window.addEventListener("resize", setAdjustedVH);
