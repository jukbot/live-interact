const {Writable, PassThrough} = require('stream')
const ffmpeg = require('fluent-ffmpeg')

const {fps, logFile, size} = require('../config')

// Custom FFMPEG Flags
// prettier-ignore
const customFlags = [
  '-threads', '0',  // Threads: 0
  '-y',             // Replace Existing File
  '-v', 'verbose',  // Logging Level: Verbose
]

// FMPEG Encoder
function Encoder(input, output) {
  // Video Input
  // Codec: PNG
  // Format: Image to Pipe
  const vInput = ffmpeg(input)
    .inputOptions(customFlags)
    .inputOptions('-c:v', 'png')
    .inputFPS(fps)
    .inputFormat('image2pipe')

  // Audio Settings
  // Source: Null Audio Source
  // Input Format: LibAV Virtual Input
  const vAudio = vInput
    .input('anullsrc')
    .inputFormat('lavfi')
    .audioCodec('aac')
    .audioChannels(1)
    .audioFrequency(44100)
    .audioBitrate(128)

  // Video Output
  // Codec: H264 (libx264)
  // Output: RTMP Stream to Facebook Live
  // Pix Format: YUV420P
  const vOutput = vAudio
    .addOption('-c:v', 'libx264')
    .size(`${size.width}x${size.height}`)
    .addOption('-pix_fmt', 'yuv420p')
    .format('flv')
    .output(output)

  return vOutput
}

class VideoStream extends Writable {
  constructor(rtmpUrl) {
    super()

    // Input Stream
    this.input = new PassThrough()

    // FFMPEG Encoder Instance
    const encoder = Encoder(this.input, rtmpUrl)
      .on('data', data => console.info('On Data', data))
      .on('error', err => console.warn('On Error', err))
      .on('end', () => console.info('On End', data))
      .run()
  }

  write(buffer) {
    this.input.write(buffer)
  }
}

module.exports = VideoStream
