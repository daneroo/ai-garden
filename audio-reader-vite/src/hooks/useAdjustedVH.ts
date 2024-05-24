import { useEffect, useState } from "react";

/**
 * This hook (`useAdjustedVH`) adjusts the value of the CSS variable --vh
 * to match the actual height of the viewport.
 * Specifically on Mobile devices, where the height of the URL bar
 * is not accounted for in the vh unit.
 * The `useVHUrlBarHeight` hook also calculates the height of the URL bar on mobile devices, but is not strictly necessary to do the new vh unit calculation
 */

export function useAdjustedVH() {
  useEffect(() => {
    // Set the value when the component mounts
    setAdjustedVH();

    // Add event listeners
    window.addEventListener("resize", setAdjustedVH);
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("resize", setAdjustedVH);
    };
  }, []);
}

/**
 * This function calculates the new value of the CSS variable --vh
 * based on the actual height of the viewport / 100,
 * and sets the value of the CSS variable --vh
 */
function setAdjustedVH() {
  const windowHeight = window.innerHeight;
  const vhUnit = windowHeight / 100;
  document.documentElement.style.setProperty("--vh", `${vhUnit}px`);
  // console.log(`new vh unit: ${vhUnit}px`);
}

/**
 *  This hook calculates the height of the URL bar on mobile devices
 * @returns an object with the following properties:
 * - windowHeight: the height of the viewport
 * - urlBarHeight: the height of the URL bar on mobile devices
 * - vhUnit: the new value of the CSS variable --vh
 */
export function useVHUrlBarHeight() {
  const [vhValues, setVhValues] = useState({
    windowHeight: 0,
    urlBarHeight: 0,
    vhUnit: 0,
  });

  useEffect(() => {
    function updateVHValues() {
      const values = getVHUrlBarHeight();
      setVhValues(values);
    }

    // Set the initial values
    updateVHValues();

    // Update the values on window resize
    window.addEventListener("resize", updateVHValues);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", updateVHValues);
    };
  }, []);

  return vhValues;
}

function getVHUrlBarHeight() {
  const windowHeight = window.innerHeight;
  const vhUnit = windowHeight / 100; // Each unit of VH should be 1% of the actual windowHeight
  // This section is not actually needed to calculate the --vh value
  // But it is useful to show the actual height of the URL Bar height on mobile devices
  const fixed100VHElt = createFixed100VHFElement();
  const fixed100VHHeight = fixed100VHElt.offsetHeight;
  removeFixed100VHElement(fixed100VHElt);
  const urlBarHeight = fixed100VHHeight - windowHeight;

  console.log(`window.innerHeight: ${windowHeight}`);
  console.log(`URL Bar Height: ${urlBarHeight}`);
  console.log(`new vh unit: ${vhUnit}px`);

  return {
    windowHeight,
    urlBarHeight,
    vhUnit,
  };
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

function removeFixed100VHElement(element: HTMLElement) {
  document.documentElement.removeChild(element);
}
