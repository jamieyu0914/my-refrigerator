import { supabase } from './supabaseClient'
import { CATEGORIES } from '../utils/constants'

const EMOJI_BY_CATEGORY = {
  蔬果: '🥬',
  肉類: '🍗',
  乳製品: '🥛',
  飲品: '🥤',
  其他: '🍽️',
}

function toRecognizedItem(item) {
  const category = CATEGORIES.includes(item.category) ? item.category : '其他'

  return {
    tempId: crypto.randomUUID(),
    name: item.name,
    category,
    emoji: EMOJI_BY_CATEGORY[category],
    confidence: item.confidence,
    selected: true,
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const MAX_DIMENSION = 1568 // Anthropic's recommended long-edge cap for vision requests
const JPEG_QUALITY = 0.85

// The Anthropic API only accepts image/jpeg, image/png, image/gif or image/webp - a phone
// photo can be HEIC (picked from the library) or several MB (straight off the camera), either
// of which makes the request fail every time. Re-encode to a downsized JPEG client-side so the
// Edge Function always receives a format/size it can actually send on.
async function prepareImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('圖片轉換失敗'))),
        'image/jpeg',
        JPEG_QUALITY,
      )
    })

    return { image: await fileToBase64(blob), mediaType: 'image/jpeg' }
  } finally {
    bitmap.close()
  }
}

export async function recognizeFoods(imageFile) {
  const { image, mediaType } = await prepareImage(imageFile)

  const { data, error } = await supabase.functions.invoke('analyze-food-image', {
    body: { image, mediaType },
  })

  if (error) throw error
  if (!Array.isArray(data?.items)) throw new Error('AI 辨識結果格式錯誤')

  return data.items.map(toRecognizedItem)
}
