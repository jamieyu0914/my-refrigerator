import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recognizeFoods } from '../aiVisionService'
import { supabase } from '../supabaseClient'

vi.mock('../supabaseClient', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}))

function makeFile(type = 'image/jpeg') {
  return new File(['fake-image-bytes'], 'photo', { type })
}

// jsdom has no real canvas/ImageBitmap decoder, so the resize/re-encode pipeline
// (createImageBitmap -> canvas -> toBlob) is stubbed. `getBitmapSize` lets a test
// simulate a differently-sized source photo to check the downscale math.
let bitmapCloseSpy
let lastCanvas

function mockImagePipeline({ width = 800, height = 600 } = {}) {
  bitmapCloseSpy = vi.fn()
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width, height, close: bitmapCloseSpy }),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    lastCanvas = this
    return { drawImage: vi.fn() }
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
    callback(new Blob(['jpeg-bytes'], { type: 'image/jpeg' }))
  })
}

describe('aiVisionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockImagePipeline()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('always sends a re-encoded image/jpeg, regardless of the source file type', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { items: [] }, error: null })

    await recognizeFoods(makeFile('image/heic'))

    expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-food-image', {
      body: { image: expect.any(String), mediaType: 'image/jpeg' },
    })
  })

  it('downscales an oversized photo to the max dimension while keeping aspect ratio', async () => {
    mockImagePipeline({ width: 3136, height: 1568 })
    supabase.functions.invoke.mockResolvedValue({ data: { items: [] }, error: null })

    await recognizeFoods(makeFile())

    expect(lastCanvas.width).toBe(1568)
    expect(lastCanvas.height).toBe(784)
  })

  it('leaves an already-small photo at its original size', async () => {
    mockImagePipeline({ width: 800, height: 600 })
    supabase.functions.invoke.mockResolvedValue({ data: { items: [] }, error: null })

    await recognizeFoods(makeFile())

    expect(lastCanvas.width).toBe(800)
    expect(lastCanvas.height).toBe(600)
  })

  it('rejects when the canvas fails to produce a blob', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
      callback(null)
    })

    await expect(recognizeFoods(makeFile())).rejects.toThrow('圖片轉換失敗')
  })

  it('rejects when reading the re-encoded image fails', async () => {
    class FailingFileReader {
      readAsDataURL() {
        this.error = new Error('read failed')
        this.onerror()
      }
    }
    vi.stubGlobal('FileReader', FailingFileReader)

    await expect(recognizeFoods(makeFile())).rejects.toThrow('read failed')
  })

  it('releases the decoded bitmap after use', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { items: [] }, error: null })

    await recognizeFoods(makeFile())

    expect(bitmapCloseSpy).toHaveBeenCalled()
  })

  it('maps each recognized item into a RecognizedFoodItem, selected by default', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { items: [{ name: '雞蛋', category: '其他', confidence: 0.95 }] },
      error: null,
    })

    const items = await recognizeFoods(makeFile())

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      name: '雞蛋',
      category: '其他',
      confidence: 0.95,
      selected: true,
    })
    expect(items[0].tempId).toEqual(expect.any(String))
    expect(items[0].emoji).toBeTruthy()
  })

  it('assigns a distinct tempId to each item', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        items: [
          { name: '番茄', category: '蔬果', confidence: 0.9 },
          { name: '雞胸肉', category: '肉類', confidence: 0.8 },
        ],
      },
      error: null,
    })

    const items = await recognizeFoods(makeFile())

    expect(items[0].tempId).not.toBe(items[1].tempId)
  })

  it('falls back to 其他 when the function returns a category outside CATEGORIES', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { items: [{ name: '神秘食材', category: '未知分類', confidence: 0.5 }] },
      error: null,
    })

    const items = await recognizeFoods(makeFile())

    expect(items[0].category).toBe('其他')
  })

  it('throws when the function call errors', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('boom') })

    await expect(recognizeFoods(makeFile())).rejects.toThrow('boom')
  })

  it('throws when the function response has no items array', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: {}, error: null })

    await expect(recognizeFoods(makeFile())).rejects.toThrow()
  })
})
