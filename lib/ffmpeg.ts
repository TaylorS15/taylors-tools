import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export default async function loadFfmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.10.0/dist";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
}
