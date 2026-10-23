/**
 * Phân tích độ biến màu tờ Bowie-Dick từ ảnh chụp
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - Ảnh hoặc canvas chứa mẻ test
 * @param {Object} bdRectNorm - Tọa độ vùng tờ test (chuẩn hóa 0..1 theo khung ảnh)
 *                             Mặc định theo layout 4 khung: { x: 0.05, y: 0.05, w: 0.60, h: 0.60 }
 * @returns {Object} Kết quả đánh giá: { result: 'PASS'|'FAIL', confidence, delta, details }
 */
function analyzeBowieDickSheet(sourceImage, bdRectNorm = { x: 0.04, y: 0.04, w: 0.58, h: 0.58 }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const imgW = sourceImage.naturalWidth || sourceImage.width;
  const imgH = sourceImage.naturalHeight || sourceImage.height;

  // 1. Cắt riêng vùng tờ Bowie-Dick theo tỷ lệ khung đã căn
  const cropX = Math.round(bdRectNorm.x * imgW);
  const cropY = Math.round(bdRectNorm.y * imgH);
  const cropW = Math.round(bdRectNorm.w * imgW);
  const cropH = Math.round(bdRectNorm.h * imgH);

  canvas.width = cropW;
  canvas.height = cropH;
  ctx.drawImage(sourceImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Lấy dữ liệu pixel toàn bộ tờ test
  const imgData = ctx.getImageData(0, 0, cropW, cropH);
  const data = imgData.data;

  // 2. Xác định 2 vùng lấy mẫu: Vùng Tâm (Center) và Vùng Rìa Ngoài (Periphery)
  // Tâm: Bán kính khoảng 15% - 25% tính từ giữa tờ test
  const centerX = cropW / 2;
  const centerY = cropH / 2;
  const centerRadius = Math.min(cropW, cropH) * 0.18;
  const innerRadius = Math.min(cropW, cropH) * 0.25;
  const outerRadius = Math.min(cropW, cropH) * 0.42;

  let centerLumaSum = 0, centerCount = 0;
  let periLumaSum = 0, periCount = 0;

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const idx = (y * cropW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Tính độ sáng theo chuẩn Y = 0.299R + 0.587G + 0.114B (thang 0 - 255)
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // Tính khoảng cách từ pixel hiện tại tới tâm
      const dist = Math.hypot(x - centerX, y - centerY);

      if (dist <= centerRadius) {
        centerLumaSum += luma;
        centerCount++;
      } else if (dist >= innerRadius && dist <= outerRadius) {
        periLumaSum += luma;
        periCount++;
      }
    }
  }

  const avgCenterLuma = centerCount > 0 ? centerLumaSum / centerCount : 0;
  const avgPeriLuma = periCount > 0 ? periLumaSum / periCount : 0;

  // 3. Đánh giá độ chênh lệch
  // Delta > 0: Vùng tâm sáng hơn vùng viền (dấu hiệu túi khí cản hơi nước)
  const deltaLuma = avgCenterLuma - avgPeriLuma;
  const THRESHOLD = 18.0; // Ngưỡng chênh lệch độ sáng (điều chỉnh từ 15-22 tùy điều kiện chụp)

  let isPass = false;
  let verdictReason = '';

  if (deltaLuma > THRESHOLD) {
    isPass = false;
    verdictReason = `Phát hiện tâm sáng hơn viền (Chênh lệch: +${deltaLuma.toFixed(1)} > Ngưỡng ${THRESHOLD}). Nghi ngờ sót khí (Air Pocket).`;
  } else if (avgCenterLuma > 140 && avgPeriLuma > 140) {
    isPass = false;
    verdictReason = `Toàn bộ tờ test chưa chuyển màu đen (Độ sáng trung bình cao: ${avgCenterLuma.toFixed(1)}). Mẻ hấp chưa đạt nhiệt/thời gian.`;
  } else {
    isPass = true;
    verdictReason = `Biến màu đen đồng nhất. Chênh lệch tâm/viền nhỏ (${deltaLuma.toFixed(1)} <= Ngưỡng ${THRESHOLD}).`;
  }

  return {
    result: isPass ? 'PASS' : 'FAIL',
    avgCenterLuma: Math.round(avgCenterLuma),
    avgPeriLuma: Math.round(avgPeriLuma),
    deltaLuma: parseFloat(deltaLuma.toFixed(1)),
    message: verdictReason
  };
}
