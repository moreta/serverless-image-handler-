import sharp from "sharp"
import { FitEnum, JpegOptions, PngOptions, ResizeOptions, Sharp, WebpOptions } from "sharp"
import { streamToUint8Array } from "../s3/s3-reader"
import { AllowedFormat, FileFormats, ImageRequest, QueryStringParameters } from "./image-request"

export class ImageHandler {
  async process(request: ImageRequest): Promise<string> {
    const originalImageBody = await streamToUint8Array(request.originalImage.Body)
    const originalImageExtension = this.getFileExtension(request.imageExtension)
    const outputOptions = request.outputOptions || {}

    const modifiedImage = await this.applyEdits(
      originalImageBody,
      originalImageExtension,
      outputOptions
    )

    // 一旦original imageをそのまま返してためす
    const bufferImage = await modifiedImage.toBuffer()
    return bufferImage.toString("base64")
  }

  private async applyEdits(originalImageBody: Uint8Array,
    originalImageExtension: AllowedFormat,
    outputOptions: QueryStringParameters): Promise<sharp.Sharp> {
    let image = sharp(originalImageBody, {
      failOnError: false
    })


    let format = originalImageExtension
    if (outputOptions.f) {
      format = outputOptions.f
    }

    console.log(`handling format : ${format}`)

    switch (format) {
      case "jpeg":
        image = this.handleImageJpeg(image, outputOptions.q)
        break
      case "png":
        image = this.handleImagePng(image, outputOptions.q)
        break
      case "webp":
        image = this.handleImageWebp(image, outputOptions.q, outputOptions.lossless, outputOptions.near_lossless)
        break
    }

    image = this.handleImageSize(image, outputOptions.w, outputOptions.h, outputOptions.fit)

    return image
  }

  private handleImageSize(image: Sharp,
    w: string | undefined,
    h: string | undefined,
    fit: string | undefined): Sharp {
    if (w || h) {
      const resizeOptions: ResizeOptions = {}
      if (w) {
        resizeOptions["width"] = parseInt(w)
      }
      if (h) {
        resizeOptions["height"] = parseInt(h)
      }
      if (fit) {
        resizeOptions["fit"] = fit as keyof FitEnum
      }
      return image.resize(resizeOptions)
    }
    return image
  }

  /**
   * jpeg
   *
   * @param image
   * @param q
   */
  private handleImageJpeg(image: sharp.Sharp,
    q: string | undefined): Sharp {
    const jpegOptions: JpegOptions = {}
    if (q) {
      jpegOptions["quality"] = parseInt(q)
    }
    return image.jpeg(jpegOptions)
  }

  /**
   * png
   *
   * @param image
   * @param q
   */
  private handleImagePng(image: sharp.Sharp,
    q: string | undefined): Sharp {
    const pngOptions: PngOptions = {}
    if (q) {
      pngOptions["quality"] = parseInt(q)
    }
    return image.png(pngOptions)
  }

  /**
   * webp
   *
   * @param image
   * @param q
   * @param lossless
   * @param near_lossless
   */
  private handleImageWebp(image: sharp.Sharp,
    q: string | undefined,
    lossless: boolean | undefined,
    near_lossless: boolean | undefined): Sharp {
    const webpOptions: WebpOptions = {}
    if (q) {
      webpOptions["quality"] = parseInt(q)
    }
    if (lossless !== undefined) {
      webpOptions["lossless"] = lossless
    }
    if (near_lossless !== undefined) {
      webpOptions["nearLossless"] = near_lossless
    }
    return image.webp(webpOptions)
  }

  private getFileExtension(originalExtension: string): AllowedFormat {
    let matchExt = originalExtension
    if (originalExtension === "jpg") {
      matchExt = "jpeg"
    }
    const format = FileFormats.find(fileFormat => {
      return fileFormat === matchExt
    })

    if (format) {
      return format
    } else {
      return "jpeg"
    }
  }
}
