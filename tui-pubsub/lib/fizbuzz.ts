export function fizzbuzz(tickMillis: number) {
  const seconds = Math.floor(tickMillis / 1000);
  let message = "";

  if (seconds % 3 === 0 && seconds % 5 === 0) {
    message = "FizzBuzz";
  } else if (seconds % 3 === 0) {
    message = "Fizz";
  } else if (seconds % 5 === 0) {
    message = "Buzz";
  }

  return {
    timestamp: new Date(tickMillis).toISOString(),
    fizzbuzz: message,
  };
}
