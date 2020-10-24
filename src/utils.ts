export function formatTime(ms: number): string {
  let seconds = ms / 1000; // ms -> s
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60; // don't need to ALSO include minutes in the second counter
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toFixed(2)
    .padStart(5, "0")}`;
}
