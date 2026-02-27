export async function exportCanvasToPng(container: HTMLElement): Promise<void> {
  // Find the SVG element inside the container
  const svgEl = container.querySelector('svg');
  if (!svgEl) throw new Error('No SVG found');

  const rect = svgEl.getBoundingClientRect();
  const width = rect.width || 1200;
  const height = rect.height || 800;

  // Serialize SVG
  const serializer = new XMLSerializer();
  const svgClone = svgEl.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('width', String(width));
  svgClone.setAttribute('height', String(height));
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add white background rect
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', String(width));
  bgRect.setAttribute('height', String(height));
  bgRect.setAttribute('fill', '#ffffff');
  svgClone.insertBefore(bgRect, svgClone.firstChild);

  // Handle external images - convert to data URLs
  const images = svgClone.querySelectorAll('image');
  await Promise.all(Array.from(images).map(async (img) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (href && !href.startsWith('data:')) {
      try {
        const dataUrl = await fetchImageAsDataUrl(href);
        img.setAttribute('href', dataUrl);
      } catch {
        // ignore failed images
      }
    }
  }));

  const svgString = serializer.serializeToString(svgClone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.onerror = reject;
    img.src = svgUrl;
  });

  const pngUrl = canvas.toDataURL('image/png');
  const timestamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.download = `canvas-studio-${timestamp}.png`;
  link.href = pngUrl;
  link.click();
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
