/**
 * Shared types for the camera input stage. Lives in the backend so
 * the camera handler doesn't need to reach into UI code for its own
 * data shapes.
 */

// What the camera handler returns to its caller. The image URI shows
// up in the user bubble; the text feeds into the AI turn (OCR or
// vision summary, depending on the mode chosen). When the reader
// (OCR or Vision) couldn't extract anything usable, `error` is set
// and the caller surfaces it directly to the user instead of sending
// `text` to the AI — otherwise a fallback instruction string would
// be sent as if it were prompt content.
export interface CameraInputResult {
  imageUri: string;  // Local URI for the captured photo.
  text: string;      // Any OCR / accompanying text picked up with the photo.
  error?: string;    // User-facing message when the photo couldn't be read; `text` is empty in this case.
}
