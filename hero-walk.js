const story = document.querySelector('.hero-story');
const hero = story.querySelector('.hero');
const canvas = story.querySelector('.hero-walk-canvas');
const context = canvas.getContext('2d', { alpha: false });
const video = story.querySelector('.hero-video');
const endImage = story.querySelector('.hero-walk-end');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = matchMedia('(max-width: 760px)').matches;
const connection = navigator.connection;
const lightweight = smallScreen || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
const lastFrame = 360;
const frameRate = 24;
const groupSize = 8;
const walkEnd = 0.88;
// Decoded frames kept around the playhead: more of them ahead in the scroll direction.
const groupsAhead = lightweight ? 4 : 3;
const groupsBehind = 1;
const glide = 150;
// The camera in the recording speeds up and slows down. This table spreads the frames over the scroll
// distance by how far the picture moves, so fast passages get more room and slow ones less.
// Entries are frame numbers at equal scroll steps, measured from the source video.
const retime = [0, 7.1, 12.6, 17.2, 21, 24.1, 26.8, 29.1, 31.1, 33, 34.9, 37.2, 40.2, 45.4, 50.3, 54.9, 59.3, 63.3, 67.3, 71.4, 75.4, 79.2, 82.9, 86.3, 89.4, 92.3, 95, 97.4, 99.6, 101.7, 103.6, 105.5, 107.2, 109, 110.7, 112.4, 114.2, 115.9, 117.7, 119.4, 121.2, 122.9, 124.7, 126.6, 128.6, 130.8, 133.2, 135.7, 138.1, 140.4, 142.6, 144.7, 147, 149.4, 152.1, 155.3, 158.9, 163, 167.6, 172.4, 177.1, 181.3, 185.2, 189, 192.6, 195.8, 198.5, 201, 203.3, 205.5, 207.6, 209.7, 211.8, 214, 216.1, 218.3, 220.5, 222.8, 225.3, 228, 230.9, 234.3, 238.3, 243.5, 249.5, 255.5, 261.5, 270.3, 280.3, 290.3, 300.2, 310.2, 320.1, 330.1, 340.1, 350, 360];

let frameBuffer;
let usingVideo = false;
let animation = null;
let progress = null;
let previousTime = null;
let painted = null;
let direction = 1;

function requestRender() {
  if (animation === null && story.classList.contains('is-hero-walk')) {
    animation = requestAnimationFrame(render);
  }
}

function useVideo() {
  frameBuffer?.close();
  frameBuffer = null;
  usingVideo = true;
  video.preload = 'auto';
  video.src = lightweight ? 'assets/hero-playback-mobile.mp4?v=11' : 'assets/hero-playback.mp4?v=11';
  requestRender();
}

function render(now) {
  animation = null;
  if (!story.classList.contains('is-hero-walk')) return;
  const travel = story.offsetHeight - hero.offsetHeight;
  if (!travel) return;

  const target = Math.max(0, Math.min(1, -story.getBoundingClientRect().top / travel));
  const delta = previousTime === null ? 16 : Math.min(now - previousTime, 50);
  previousTime = now;
  if (progress === null || target === 1 || Math.abs(progress - target) < 0.001) progress = target;
  else progress += (target - progress) * (1 - Math.exp(-delta / glide));

  if (target === 1) painted = null;
  else if (!frameBuffer && !usingVideo) {
    if (context && 'VideoDecoder' in window && 'createImageBitmap' in window) {
      try {
        frameBuffer = createFrameBuffer(lightweight ? 'mobile' : 'desktop', requestRender, useVideo);
      } catch {
        useVideo();
      }
    } else {
      useVideo();
    }
  }

  const position = Math.min(1, progress / walkEnd);
  // Ease the last part of the route into a full stop without changing the scroll distance.
  const braking = Math.max(0, (position - 0.78) / 0.22);
  const clip = (position - 0.11 * braking * braking) / 0.89;
  const step = Math.max(0, clip) * (retime.length - 1);
  const entry = Math.min(retime.length - 2, Math.floor(step));
  const wanted = Math.min(lastFrame, Math.round(retime[entry] + (retime[entry + 1] - retime[entry]) * (step - entry)));
  let paintedNewFrame = false;
  if (target < 1 && frameBuffer) {
    const difference = wanted - (painted ?? wanted);
    if (difference) direction = Math.sign(difference);
    // Show the wanted frame, or the closest decoded one on the way to it, so fast scrolling never stalls.
    const next = frameBuffer.nearest(wanted, painted, direction);
    const image = next === null ? null : frameBuffer.image(next);
    if (image && painted !== next) {
      if (canvas.width !== image.width || canvas.height !== image.height) {
        canvas.width = image.width;
        canvas.height = image.height;
      }
      context.drawImage(image, 0, 0);
      canvas.classList.add('is-ready');
      painted = next;
      paintedNewFrame = true;
    }
  } else if (target < 1 && usingVideo && !video.seeking && Number.isFinite(video.duration)) {
    const time = wanted / frameRate;
    if (Math.abs(video.currentTime - time) >= 0.5 / frameRate) video.currentTime = time;
  }

  const atEnd = target === 1 || (wanted === lastFrame && (usingVideo || painted === lastFrame));
  const keepEnd = !usingVideo && painted === null && endImage.classList.contains('is-ready');
  endImage.classList.toggle('is-ready', endImage.naturalWidth > 0 && (atEnd || keepEnd));

  if (progress !== target || (paintedNewFrame && painted !== wanted)) requestRender();
  else previousTime = null;
}

function syncMotion() {
  const enabled = !reducedMotion.matches && !connection?.saveData;
  story.classList.toggle('is-hero-walk', enabled);
  if (enabled) {
    requestRender();
    return;
  }
  progress = previousTime = painted = null;
  direction = 1;
  frameBuffer?.close();
  frameBuffer = null;
  usingVideo = false;
  canvas.classList.remove('is-ready');
  endImage.classList.remove('is-ready');
  video.classList.remove('is-ready');
  video.removeAttribute('src');
  video.load();
}

video.addEventListener('loadeddata', () => {
  canvas.classList.remove('is-ready');
  video.classList.add('is-ready');
  requestRender();
});
video.addEventListener('loadedmetadata', requestRender);
video.addEventListener('seeked', requestRender);
video.addEventListener('error', () => {
  video.classList.remove('is-ready');
  story.classList.remove('is-hero-walk');
});
endImage.addEventListener('load', requestRender);
window.addEventListener('scroll', requestRender, { passive: true });
window.addEventListener('resize', requestRender);
reducedMotion.addEventListener('change', syncMotion);
syncMotion();

const initialTarget = document.getElementById(location.hash.slice(1));
if (initialTarget && story.classList.contains('is-hero-walk')) {
  initialTarget.scrollIntoView({ behavior: 'instant' });
}

function createFrameBuffer(variant, onFrame, onError) {
  const controller = new AbortController();
  const packets = [];
  const images = new Map();
  const decodedGroups = new Set();
  const dropped = new Set();
  let needed = [];
  let conversionJobs = [];
  let decoding = false;
  let closed = false;

  const decoder = new VideoDecoder({
    output(frame) {
      const index = frame.timestamp;
      const group = Math.floor(index / groupSize);
      conversionJobs.push(createImageBitmap(frame).then((image) => {
        if (closed || !needed.includes(group)) {
          image.close();
          dropped.add(group);
          return;
        }
        images.get(index)?.close();
        images.set(index, image);
        onFrame();
      }, fail).finally(() => frame.close()));
    },
    error: fail,
  });
  decoder.configure({ codec: 'avc1.640028', optimizeForLatency: true });

  function fail() {
    if (!closed) onError();
  }

  async function decodeNext() {
    if (closed || decoding) return;
    const group = needed.find((index) => !decodedGroups.has(index)
      && packets[Math.min(lastFrame, (index + 1) * groupSize - 1)]);
    if (group === undefined) return;

    decoding = true;
    conversionJobs = [];
    dropped.delete(group);
    try {
      const start = group * groupSize;
      const end = Math.min(start + groupSize, lastFrame + 1);
      for (let index = start; index < end; index++) {
        decoder.decode(new EncodedVideoChunk({
          type: index === start ? 'key' : 'delta',
          timestamp: index,
          data: packets[index],
        }));
      }
      await decoder.flush();
      await Promise.all(conversionJobs);
      if (needed.includes(group) && !dropped.has(group)) decodedGroups.add(group);
    } catch {
      fail();
    } finally {
      decoding = false;
      decodeNext();
    }
  }

  readPackets(`assets/hero-walk-${variant}.bin?v=11`, controller.signal, (packet) => {
    packets.push(packet);
    decodeNext();
  }).catch(fail);

  return {
    image(frame) {
      return images.get(frame);
    },
    nearest(frame, from, direction) {
      const group = Math.floor(frame / groupSize);
      const wantedGroups = [group];
      for (let step = 1; step <= groupsAhead; step++) wantedGroups.push(group + direction * step);
      for (let step = 1; step <= groupsBehind; step++) wantedGroups.push(group - direction * step);
      const next = wantedGroups.filter((index) => index >= 0 && index * groupSize <= lastFrame);
      if (next.join() !== needed.join()) {
        needed = next;
        this.trim();
        decodeNext();
      }
      if (images.has(frame)) return frame;
      const step = from === null ? 0 : Math.sign(frame - from);
      if (!step) return null;
      for (let index = frame - step; index !== from; index -= step) {
        if (images.has(index)) return index;
      }
      return null;
    },
    trim() {
      for (const [index, image] of images) {
        if (needed.includes(Math.floor(index / groupSize))) continue;
        image.close();
        images.delete(index);
      }
      for (const index of decodedGroups) {
        if (!needed.includes(index)) decodedGroups.delete(index);
      }
    },
    close() {
      closed = true;
      controller.abort();
      if (decoder.state !== 'closed') decoder.close();
      for (const image of images.values()) image.close();
      images.clear();
    },
  };
}

async function readPackets(url, signal, onPacket) {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) throw new Error('Could not load walk-through');
  const reader = response.body.getReader();
  let pending = new Uint8Array(0);
  let count = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const bytes = new Uint8Array(pending.length + value.length);
    bytes.set(pending);
    bytes.set(value, pending.length);
    const view = new DataView(bytes.buffer);
    let offset = 0;
    while (offset + 4 <= bytes.length) {
      const length = view.getUint32(offset, true);
      if (!length || length > 2_000_000 || count > lastFrame) throw new Error('Invalid walk-through packet');
      if (offset + 4 + length > bytes.length) break;
      onPacket(bytes.slice(offset + 4, offset + 4 + length));
      count++;
      offset += 4 + length;
    }
    pending = bytes.subarray(offset);
  }
  if (pending.length || count !== lastFrame + 1) throw new Error('Incomplete walk-through');
}
