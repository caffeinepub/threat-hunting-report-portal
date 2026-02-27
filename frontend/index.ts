import html2canvas from 'html2canvas';

// In your export function:
const canvas = await html2canvas(canvasElement);
const dataUrl = canvas.toDataURL('image/png');
// Then download or display the image
