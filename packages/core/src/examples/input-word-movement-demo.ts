import {
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  type CliRenderer,
  t,
  bold,
  fg,
  BoxRenderable,
} from "../index"
import { setupCommonDemoKeys } from "./lib/standalone-keys"
import { TextRenderable } from "../renderables/Text"

let testInput: InputRenderable | null = null
let renderer: CliRenderer | null = null
let infoDisplay: TextRenderable | null = null
let cursorPosDisplay: TextRenderable | null = null

function updateDisplays() {
  if (!testInput) return

  const value = testInput.value
  const cursorPos = testInput.cursorPosition

  // Show cursor position with visual indicator
  const beforeCursor = value.substring(0, cursorPos)
  const atCursor = value[cursorPos] || " "
  const afterCursor = value.substring(cursorPos + 1)

  const visualText = `${fg("#FFFFFF")(beforeCursor)}${fg("#000000")(bold(`[${atCursor}]`))}${fg("#FFFFFF")(afterCursor)}`

  const cursorText = t`${bold(fg("#FFCC00")("Current Input:"))}

${visualText}

${bold(fg("#AAAAAA")(`Cursor Position: ${cursorPos} / ${value.length}`))}
${fg("#666666")(`Character at cursor: "${atCursor === " " ? "SPACE" : atCursor}"`)}
`

  if (cursorPosDisplay) {
    cursorPosDisplay.content = cursorText
  }

  const infoText = t`${bold(fg("#00FFFF")("ALT+Arrow Word Movement Test"))}

${bold(fg("#FFFFFF")("Controls:"))}
${fg("#00FF00")("ALT+Left")}   - Move cursor one word LEFT
${fg("#00FF00")("ALT+Right")}  - Move cursor one word RIGHT
${fg("#FFAA00")("Left/Right")} - Move cursor one character
${fg("#FFAA00")("Home/End")}   - Move to start/end
${fg("#FF6666")("Ctrl+Q")}     - Quit demo

${bold(fg("#FFFFFF")("Terminal Compatibility:"))}
${fg("#CCCCCC")("Modern terminals (xterm, kitty, iTerm2):")}
  Send ${fg("#AAAAAA")("ESC[1;3C")} for ALT+Right
  
${fg("#CCCCCC")("PuTTY (default mode):")}
  Send ${fg("#AAAAAA")("ESC ESC [C")} (double ESC) for ALT+Right
  
${fg("#FFFF00")("Both modes are supported!")}

${bold(fg("#FFFFFF")("Try it:"))}
1. Use ALT+Right to jump forward word by word
2. Use ALT+Left to jump backward word by word
3. Notice how it skips over whitespace
4. Works from any cursor position!
`

  if (infoDisplay) {
    infoDisplay.content = infoText
  }
}

export function run(rendererInstance: CliRenderer): void {
  renderer = rendererInstance
  renderer.setBackgroundColor("#000000")

  const container = new BoxRenderable(renderer, {
    id: "container",
    zIndex: 1,
  })
  renderer.root.add(container)

  // Create input with pre-filled text for testing
  testInput = new InputRenderable(renderer, {
    id: "test-input",
    position: "absolute",
    left: 5,
    top: 3,
    width: 80,
    height: 3,
    zIndex: 100,
    backgroundColor: "#1a1a1a",
    textColor: "#FFFFFF",
    focusedBackgroundColor: "#2a2a2a",
    cursorColor: "#00FF00",
    value: "The quick brown fox jumps over the lazy dog",
    maxLength: 200,
  })

  renderer.root.add(testInput)

  // Info display
  infoDisplay = new TextRenderable(renderer, {
    id: "info-display",
    content: t``,
    width: 80,
    height: 25,
    position: "absolute",
    left: 5,
    top: 8,
    zIndex: 50,
  })
  container.add(infoDisplay)

  // Cursor position display
  cursorPosDisplay = new TextRenderable(renderer, {
    id: "cursor-display",
    content: t``,
    width: 80,
    height: 6,
    position: "absolute",
    left: 5,
    top: 34,
    zIndex: 50,
  })
  container.add(cursorPosDisplay)

  // Event handlers
  testInput.on(InputRenderableEvents.INPUT, () => {
    updateDisplays()
  })

  // Update when cursor moves (via arrow keys)
  const originalHandleKeyPress = testInput.handleKeyPress.bind(testInput)
  testInput.handleKeyPress = (key) => {
    const result = originalHandleKeyPress(key)
    updateDisplays()
    return result
  }

  // Global key handler for quit
  const keyHandler = (key: any) => {
    if (key.ctrl && key.name === "q") {
      renderer?.destroy()
      process.exit(0)
    }
  }

  rendererInstance.keyInput.on("keypress", keyHandler)

  // Initial state
  testInput.focus()
  testInput.cursorPosition = testInput.value.length // Start at end
  updateDisplays()
}

export function destroy(rendererInstance: CliRenderer): void {
  if (testInput) {
    rendererInstance.root.remove(testInput.id)
    testInput.destroy()
    testInput = null
  }

  rendererInstance.root.remove("container")
  infoDisplay = null
  cursorPosDisplay = null
  renderer = null
}

if (import.meta.main) {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  })

  run(renderer)
  setupCommonDemoKeys(renderer)
  renderer.start()
}
