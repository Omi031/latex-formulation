/**
 * 画像エクスポート機能
 * PNG, SVG, PDF形式での保存をサポート
 */

/**
 * 画像としてダウンロード (PNG)
 * @param {string} format - 出力フォーマット ('png', 'svg')
 */
async function downloadImage(format) {
    if (format === 'svg') {
        downloadSVG();
        return;
    }
    
    const preview = document.getElementById('preview');
    const scale = parseFloat(document.getElementById('scale').value);
    const transparent = document.getElementById('transparent').checked;
    const bgColor = document.getElementById('bgColor').value;
    
    try {
        const canvas = await html2canvas(preview, {
            backgroundColor: transparent ? null : bgColor,
            scale: scale,
            logging: false,
            useCORS: true
        });
        
        // Canvasから画像を生成
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `equation_${Date.now()}.${format}`;
        link.href = dataUrl;
        link.click();
        
    } catch (error) {
        console.error('Error generating image:', error);
        alert('画像の生成に失敗しました。');
    }
}

/**
 * SVGとしてダウンロード
 */
function downloadSVG() {
    const preview = document.getElementById('preview');
    const svg = preview.querySelector('svg');
    
    if (!svg) {
        alert('まずプレビューを更新してください。');
        return;
    }
    
    // SVGのクローンを作成
    const svgClone = svg.cloneNode(true);
    
    // 色の設定を適用
    const textColor = document.getElementById('textColor').value;
    svgClone.style.color = textColor;
    
    // 背景設定
    const transparent = document.getElementById('transparent').checked;
    if (!transparent) {
        const bgColor = document.getElementById('bgColor').value;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', bgColor);
        svgClone.insertBefore(rect, svgClone.firstChild);
    }
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `equation_${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * PDFとしてダウンロード
 */
async function downloadPDF() {
    // jsPDFを動的に読み込み
    if (typeof window.jspdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        
        await new Promise(resolve => {
            script.onload = resolve;
        });
    }
    
    const preview = document.getElementById('preview');
    const scale = parseFloat(document.getElementById('scale').value);
    const transparent = document.getElementById('transparent').checked;
    const bgColor = document.getElementById('bgColor').value;
    
    try {
        const canvas = await html2canvas(preview, {
            backgroundColor: transparent ? '#ffffff' : bgColor, // PDFは透明背景をサポートしないため
            scale: scale,
            logging: false,
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        // キャンバスサイズに合わせてPDFを作成
        const imgWidth = canvas.width / scale / 4; // mm単位に変換
        const imgHeight = canvas.height / scale / 4;
        
        const pdf = new jsPDF({
            orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [imgWidth, imgHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`equation_${Date.now()}.pdf`);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('PDFの生成に失敗しました。');
    }
}

/**
 * ファイル名を生成
 * @returns {string} タイムスタンプ付きファイル名
 */
function generateFileName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `equation_${timestamp}`;
}
