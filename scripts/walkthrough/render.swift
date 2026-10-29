// Run from the repository root. Original recordings are deliberately kept local.
// swiftc scripts/walkthrough/render.swift -o output/walkthrough-2026-10-26/render
// output/walkthrough-2026-10-26/render [--stills]
import AppKit
import AVFoundation
import CoreVideo

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let preview = CommandLine.arguments.contains("--stills")
let output = root.appendingPathComponent("output/walkthrough-2026-10-26")
let media = root.appendingPathComponent("public/assets/media")
let stem = "trayage-walkthrough-2026-10"
let target = media.appendingPathComponent(stem + ".mp4")
let width = 1920, height = 1080, fps: Int32 = 30
let space = CGColorSpace(name: CGColorSpace.sRGB)!
struct Scene: Decodable {
    let duration: Double, kind: String, source: Double, span: Double
    let label: String, title: String, detail: String, note: String, focus: String
}
let scenes = try JSONDecoder().decode([Scene].self, from: Data(contentsOf: root.appendingPathComponent("scripts/walkthrough/storyboard.json")))
let duration = scenes.reduce(0) { $0 + $1.duration }
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
func generator(_ file: String) -> AVAssetImageGenerator {
    let g = AVAssetImageGenerator(asset: AVURLAsset(url: root.appendingPathComponent(file)))
    g.appliesPreferredTrackTransform = true
    g.requestedTimeToleranceBefore = CMTime(value: 1, timescale: 120)
    g.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 120)
    return g
}
let review = generator("output/demo-v1.1/raw/review.mov")
let confirmation = generator("output/demo-v1.1/raw/confirmation.mov")
func loadImage(_ file: String) -> CGImage {
    NSImage(contentsOf: root.appendingPathComponent(file))!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
}
let icon = loadImage("public/assets/brand-violet/trayage-app-icon.png")
let glance = loadImage("public/assets/product-views/menu-glance-dark.png")
let quick = loadImage("public/assets/product-views/menu-quickReview-dark.png")
func color(_ rgb: UInt32, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: CGFloat((rgb >> 16) & 255)/255, green: CGFloat((rgb >> 8) & 255)/255, blue: CGFloat(rgb & 255)/255, alpha: a)
}
let ink = color(0xF6F2FF), muted = color(0xC8BED9), accent = color(0xC7AAFF)
func rect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> CGRect { CGRect(x:x, y:1080-y-h, width:w, height:h) }
func clamp(_ p: Double) -> Double { max(0, min(1, p)) }
func ease(_ p: Double) -> CGFloat { let v = clamp(p); return CGFloat(v*v*(3-2*v)) }
func text(_ s: String, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ size: CGFloat, _ weight: NSFont.Weight = .regular, _ c: NSColor? = nil) {
    let p = NSMutableParagraphStyle(); p.lineSpacing = 6
    (s as NSString).draw(in:rect(x,y,w,h), withAttributes:[.font:NSFont.systemFont(ofSize:size,weight:weight),.foregroundColor:c ?? ink,.paragraphStyle:p])
}
func tween(_ a: CGRect, _ b: CGRect, _ p: CGFloat) -> CGRect {
    CGRect(x:a.minX+(b.minX-a.minX)*p,y:a.minY+(b.minY-a.minY)*p,width:a.width+(b.width-a.width)*p,height:a.height+(b.height-a.height)*p)
}
func panel(_ ctx: CGContext, _ image: CGImage, _ dest: CGRect, _ radius: CGFloat = 20) {
    ctx.saveGState()
    ctx.setShadow(offset:CGSize(width:0,height:-16),blur:35,color:color(0x000000,0.3).cgColor)
    ctx.setFillColor(color(0x252032).cgColor)
    ctx.addPath(CGPath(roundedRect:dest,cornerWidth:radius,cornerHeight:radius,transform:nil)); ctx.fillPath()
    ctx.restoreGState()
    ctx.saveGState(); ctx.addPath(CGPath(roundedRect:dest,cornerWidth:radius,cornerHeight:radius,transform:nil)); ctx.clip()
    ctx.interpolationQuality = .high; ctx.draw(image,in:dest); ctx.restoreGState()
    ctx.setStrokeColor(color(0xFFFFFF,0.13).cgColor); ctx.setLineWidth(1)
    ctx.addPath(CGPath(roundedRect:dest,cornerWidth:radius,cornerHeight:radius,transform:nil)); ctx.strokePath()
}
func render(_ ctx: CGContext, _ t: Double) throws {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext:ctx,flipped:false)
    defer { NSGraphicsContext.restoreGraphicsState() }
    NSGradient(starting:color(0x171320),ending:color(0x382A4C))!.draw(in:rect(0,0,1920,1080),angle:-25)
    // One quiet, directional accent ties the copy and footage together.
    ctx.setFillColor(color(0xB996F0,0.045).cgColor)
    ctx.fillEllipse(in:rect(1200-CGFloat(t)*3,-360,1100,1100))
    ctx.draw(icon,in:rect(64,43,64,64)); text("Trayage",142,53,230,55,32,.semibold)
    text("FOR MAC",295,65,170,32,16,.medium,muted)
    text("TRAYAGE 1.1  ·  SAMPLE FILES",1430,65,440,35,17,.medium,muted)
    var start = 0.0, index = scenes.count-1
    for (i,s) in scenes.enumerated() { if t < start+s.duration { index=i; break }; start += s.duration }
    let s = scenes[index], local = t-start
    let entering = ease(local/0.44), exiting = ease((local-(s.duration-0.24))/0.24)
    let shift = (1-entering)*42 - exiting*24
    if s.kind == "outro" {
        ctx.saveGState(); ctx.setAlpha(entering)
        let lift = (1-entering)*35
        ctx.draw(icon,in:rect(154,260+lift,250,250))
        text(s.label,490,228+lift,1200,40,22,.semibold,accent)
        text(s.title,480,300+lift,1300,260,91,.semibold)
        text("File review is free.",490,575+lift,1200,70,38,.medium,muted)
        text("trayage.app",490,680+lift,1000,80,52,.semibold,accent)
        text(s.note,154,935,1660,60,25,.regular,muted)
        ctx.restoreGState()
    } else {
        ctx.saveGState(); ctx.setAlpha(entering*(1-exiting*0.6))
        text(s.label,68+shift,219,540,45,20,.semibold,accent)
        text(s.title,64+shift,282,540,285,61,.semibold)
        // Detail follows the headline by a few frames; both settle quickly.
        let detailShift = (1-ease((local-0.10)/0.38))*20
        text(s.detail,68+shift+detailShift,600,535,180,28,.regular,muted)
        ctx.setFillColor(accent.cgColor); ctx.fill(rect(68+shift,826,54,3))
        text(s.note,68+shift,858,520,100,22,.medium)
        ctx.restoreGState()
        if s.kind == "menus" {
            // Native sample-data captures; their contents are not animated or fabricated.
            let a = ease(local/0.6), b = ease((local-0.17)/0.6)
            let drift = CGFloat(local/s.duration)*14
            ctx.saveGState(); ctx.setAlpha(a*(1-exiting*0.5))
            panel(ctx,glance,rect(750+(1-a)*100,235-drift,404,CGFloat(glance.height)*404/CGFloat(glance.width)))
            text("GLANCE",750,185-drift,400,40,20,.semibold,accent); ctx.restoreGState()
            ctx.saveGState(); ctx.setAlpha(b*(1-exiting*0.5))
            panel(ctx,quick,rect(1275+(1-b)*100,210+drift,404,CGFloat(quick.height)*404/CGFloat(quick.width)))
            text("QUICK REVIEW",1275,160+drift,450,40,20,.semibold,accent); ctx.restoreGState()
        } else {
            let g = s.kind == "confirmation" ? confirmation : review
            let sample = s.source + min(s.span-1/30, local*s.span/s.duration)
            let frame = try g.copyCGImage(at:CMTime(seconds:sample,preferredTimescale:600),actualTime:nil)
            let full = s.kind == "confirmation" ? CGRect(x:46,y:112,width:3456,height:1954) : CGRect(x:112,y:160,width:3456,height:1954)
            var focus = full
            switch s.focus {
            case "detail": focus=CGRect(x:2200,y:430,width:1360,height:769)
            case "hide": focus=full.insetBy(dx:45,dy:25)
            case "selection": focus=CGRect(x:240,y:1410,width:3260,height:590)
            case "confirm": focus=CGRect(x:1300,y:790,width:950,height:537)
            default: break
            }
            // Selection retains the complete window so the checkbox and footer remain connected.
            if s.focus == "selection" { focus=full.insetBy(dx:40,dy:23) }
            let p = ease((local-0.25)/1.15)
            var crop = tween(full,focus,p)
            if s.focus == "full" { crop=full.insetBy(dx:CGFloat(local/s.duration)*65,dy:CGFloat(local/s.duration)*37) }
            // Gentle continuous push after the initial focus move, staying inside the real recording.
            if s.focus == "detail" || s.focus == "confirm" { crop=crop.insetBy(dx:CGFloat(local/s.duration)*12,dy:CGFloat(local/s.duration)*6.8) }
            let destination = rect(640+(1-entering)*65-exiting*30,210+(1-entering)*10,1216,688)
            ctx.saveGState(); ctx.setAlpha(entering*(1-exiting*0.5))
            guard let cropped=frame.cropping(to:crop) else { fatalError("Invalid source crop") }
            panel(ctx,cropped,destination); ctx.restoreGState()
        }
        text(s.kind == "menus" ? "NATIVE APP VIEWS  ·  SAMPLE DATA" : "REAL APP RECORDING  ·  SAMPLE FILES",644,966,1000,35,17,.medium,muted)
        text(String(format:"%02d / 08",index+1),1750,966,150,35,17,.medium,muted)
    }
    // Chapter segments keep progression legible, without extra reading.
    var x: CGFloat=64
    var elapsed=0.0
    for scene in scenes {
        let w = CGFloat(scene.duration/duration)*1792-7
        ctx.setFillColor(color(0xFFFFFF,0.10).cgColor); ctx.fill(rect(x,1035,w,4))
        ctx.setFillColor(accent.cgColor); ctx.fill(rect(x,1035,w*CGFloat(clamp((t-elapsed)/scene.duration)),4))
        x += w+7; elapsed += scene.duration
    }
}
func jpeg(_ ctx: CGContext, _ url: URL) throws {
    try NSBitmapImageRep(cgImage:ctx.makeImage()!).representation(using:.jpeg,properties:[.compressionFactor:0.92])!.write(to:url)
}
if preview {
    var start=0.0
    for (index,s) in scenes.enumerated() {
        let ctx=CGContext(data:nil,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:space,bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue)!
        try render(ctx,start+min(2,s.duration/2))
        try jpeg(ctx,output.appendingPathComponent(String(format:"scene-%02d.jpg",index+1)))
        if index == 0 { try jpeg(ctx,media.appendingPathComponent(stem+"-poster.jpg")) }
        start += s.duration
    }
    print("Saved nine preview frames and poster.")
    exit(0)
}
guard !FileManager.default.fileExists(atPath:target.path) else { fatalError("Preserve or remove the previous draft explicitly before rendering again.") }
let writer = try AVAssetWriter(outputURL:target,fileType:.mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType:.video,outputSettings:[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:width,AVVideoHeightKey:height,AVVideoCompressionPropertiesKey:[AVVideoAverageBitRateKey:5_000_000,AVVideoProfileLevelKey:AVVideoProfileLevelH264HighAutoLevel,AVVideoMaxKeyFrameIntervalKey:60]])
let adaptor=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input,sourcePixelBufferAttributes:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32ARGB,kCVPixelBufferWidthKey as String:width,kCVPixelBufferHeightKey as String:height,kCVPixelBufferCGImageCompatibilityKey as String:true,kCVPixelBufferCGBitmapContextCompatibilityKey as String:true])
writer.add(input); guard writer.startWriting() else { throw writer.error! }; writer.startSession(atSourceTime:.zero)
for frame in 0..<Int(duration*Double(fps)) {
    while !input.isReadyForMoreMediaData { if writer.status == .failed { throw writer.error! }; Thread.sleep(forTimeInterval:0.002) }
    try autoreleasepool {
        var pixel:CVPixelBuffer?
        guard CVPixelBufferPoolCreatePixelBuffer(nil,adaptor.pixelBufferPool!,&pixel) == kCVReturnSuccess, let buffer=pixel else { fatalError("Pixel allocation failed") }
        CVPixelBufferLockBaseAddress(buffer,[])
        let ctx=CGContext(data:CVPixelBufferGetBaseAddress(buffer),width:width,height:height,bitsPerComponent:8,bytesPerRow:CVPixelBufferGetBytesPerRow(buffer),space:space,bitmapInfo:CGImageAlphaInfo.noneSkipFirst.rawValue)!
        try render(ctx,Double(frame)/Double(fps))
        CVPixelBufferUnlockBaseAddress(buffer,[])
        guard adaptor.append(buffer,withPresentationTime:CMTime(value:Int64(frame),timescale:fps)) else { throw writer.error! }
    }
    if frame%150 == 0 { print("Rendered \(frame)/\(Int(duration*Double(fps)))"); fflush(stdout) }
}
input.markAsFinished(); writer.endSession(atSourceTime:CMTime(seconds:duration,preferredTimescale:fps))
let done=DispatchSemaphore(value:0); writer.finishWriting { done.signal() }; done.wait()
guard writer.status == .completed else { throw writer.error! }
func timestamp(_ seconds:Double)->String { let ms=Int((seconds*1000).rounded()); return String(format:"%02d:%02d:%02d.%03d",ms/3600000,(ms/60000)%60,(ms/1000)%60,ms%1000) }
var vtt="WEBVTT\n\n", start=0.0
for s in scenes {
    // All editorial copy is available in the caption track and the page transcript.
    vtt += "\(timestamp(start)) --> \(timestamp(start+s.duration))\n\(s.title.replacingOccurrences(of:"\n",with:" "))\n\(s.detail.replacingOccurrences(of:"\n",with:" "))\n\(s.note)\n\n"
    start += s.duration
}
try vtt.write(to:media.appendingPathComponent(stem+".vtt"),atomically:true,encoding:.utf8)
print("Complete: \(duration)s, 1920×1080, 30fps, silent H.264")
