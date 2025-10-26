/**
 * 画像エクスポート機能
 * PNG, SVG, PDF形式での保存をサポート
 */

/**
 * ファイル名を生成
 * @param {string} format - ファイル形式 ('png', 'svg', 'pdf')
 * @returns {string} ファイル名
 */
function generateFileName(format) {
    const useEquationName = document.getElementById('useEquationFilename') 
        ? document.getElementById('useEquationFilename').checked 
        : false;
    
    if (useEquationName) {
        // 数式からファイル名を生成
        const equation = document.getElementById('equation').value;
        // LaTeX コマンドや記号を安全な文字に変換
        let filename = equation
            .replace(/\\/g, '')  // バックスラッシュ削除
            .replace(/[^a-zA-Z0-9_\-]/g, '_')  // 使用できない文字をアンダースコアに
            .replace(/_+/g, '_')  // 連続するアンダースコアを1つに
            .replace(/^_|_$/g, '')  // 先頭と末尾のアンダースコアを削除
            .substring(0, 50);  // 最大50文字に制限
        
        // 空になった場合はデフォルトに戻す
        if (!filename) {
            filename = 'equation';
        }
        
        return `${filename}.${format}`;
    } else {
        // デフォルト: タイムスタンプを使用
        return `equation_${Date.now()}.${format}`;
    }
}

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
        // Ensure MathJax typesetting completed for this preview
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            try {
                await MathJax.typesetPromise([preview]);
            } catch (e) {
                console.warn('MathJax.typesetPromise failed before export:', e);
            }
        }

        // まずSVGが存在するか試す。MathJaxはSVG要素を生成するため、これを直接PNGに変換する方が確実
        const svgEl = preview.querySelector('svg');
        console.log('export: svgEl found?', !!svgEl);
        let dataUrl;

        if (svgEl) {
            // SVGをクローンしてスタイルをインライン化
            const svgClone = svgEl.cloneNode(true);
            if (!svgClone.getAttribute('xmlns')) svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Inline computed styles so the serialized SVG looks the same
            const inlineStyles = (sourceEl, targetEl) => {
                const computed = window.getComputedStyle(sourceEl);
                const props = ['font-size','font-family','fill','stroke','stroke-width','color','font-weight','font-style','text-decoration'];
                let styleStr = '';
                props.forEach(p => {
                    const v = computed.getPropertyValue(p);
                    if (v) styleStr += `${p}: ${v};`;
                });
                const existing = targetEl.getAttribute('style') || '';
                targetEl.setAttribute('style', existing + styleStr);
            };

            // walk nodes and apply computed styles from original to clone
            const walkAndInline = (orig, clone) => {
                if (!orig || !clone) return;
                inlineStyles(orig, clone);
                const origChildren = Array.from(orig.children || []);
                const cloneChildren = Array.from(clone.children || []);
                for (let i = 0; i < origChildren.length; i++) {
                    const o = origChildren[i];
                    let c = cloneChildren[i];
                    if (!c) {
                        // create a shallow clone in the target to preserve structure
                        c = o.cloneNode(false);
                        clone.appendChild(c);
                    }
                    walkAndInline(o, c);
                }
            };

            walkAndInline(svgEl, svgClone);

            // width/height determination
            let width = svgEl.getAttribute('width');
            let height = svgEl.getAttribute('height');
            const viewBox = svgEl.getAttribute('viewBox');
            if ((!width || !height) && viewBox) {
                const parts = viewBox.split(/\s+|,/).filter(Boolean);
                if (parts.length >= 4) {
                    width = parts[2];
                    height = parts[3];
                }
            }

            // Prefer rendered CSS pixel size when available (better fidelity)
            try {
                const rect = svgEl.getBoundingClientRect();
                if (rect && rect.width && rect.height) {
                    width = rect.width;
                    height = rect.height;
                }
            } catch (e) {
                // ignore
            }

            width = parseFloat(width) || 800;
            height = parseFloat(height) || 200;

            console.log('export: svg dimensions (w,h)=', width, height);

            const serializer = new XMLSerializer();
            // Inline any external <defs> referenced by <use xlink:href="#..."> so the SVG is standalone
            const inlineExternalDefs = (svgNode) => {
                try {
                    const uses = svgNode.querySelectorAll('use');
                    const ids = new Set();
                    uses.forEach(u => {
                        const href = u.getAttribute('xlink:href') || u.getAttribute('href');
                        if (href && href[0] === '#') ids.add(href.slice(1));
                    });
                    if (ids.size === 0) return;
                    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
                    ids.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) defs.appendChild(el.cloneNode(true));
                    });
                    if (defs.childNodes.length) {
                        // append defs to avoid changing child indexing which breaks walkAndInline
                        svgNode.appendChild(defs);
                    }
                } catch (e) {
                    console.warn('inlineExternalDefs failed:', e);
                }
            };

            inlineExternalDefs(svgClone);
            // Ensure width/height attributes exist in px for standalone rendering
            try {
                svgClone.setAttribute('width', width);
                svgClone.setAttribute('height', height);
            } catch (e) {}

            const svgString = serializer.serializeToString(svgClone);
            console.log('export: serialized svg length', svgString.length);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

            // draw SVG onto canvas using data URL (avoids blob/CORS issues)
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (e) => reject(e);
                img.src = svgDataUrl;
            });

            const dpr = window.devicePixelRatio || 1;
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(width * scale * dpr);
            canvas.height = Math.ceil(height * scale * dpr);
            const ctx = canvas.getContext('2d');
            // scale the context so drawing uses css pixels
            ctx.scale(dpr, dpr);
            if (!transparent) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, width * scale, height * scale);
            }
            // draw scaled image to canvas (using css-pixel dimensions)
            ctx.drawImage(img, 0, 0, width * scale, height * scale);

            dataUrl = canvas.toDataURL('image/png');
        } else {
            // SVGがない場合は既存のhtml2canvasをフォールバック
            const canvas = await html2canvas(preview, {
                backgroundColor: transparent ? null : bgColor,
                scale: scale,
                logging: false,
                useCORS: true
            });
            dataUrl = canvas.toDataURL('image/png');
        }

        const link = document.createElement('a');
        link.download = generateFileName(format);
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
    // Ensure MathJax typesetting completed for this preview
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([preview]).catch(e => console.warn('MathJax.typesetPromise failed before SVG export:', e));
    }

    const svg = preview.querySelector('svg');
    console.log('downloadSVG: svg found?', !!svg);

    if (!svg) {
        alert('まずプレビューを更新してください。');
        return;
    }

    const svgClone = svg.cloneNode(true);

    // Inline external defs referenced by <use> so the saved SVG is standalone
    const inlineExternalDefs = (svgNode) => {
        try {
            const uses = svgNode.querySelectorAll('use');
            const ids = new Set();
            uses.forEach(u => {
                const href = u.getAttribute('xlink:href') || u.getAttribute('href');
                if (href && href[0] === '#') ids.add(href.slice(1));
            });
            if (ids.size === 0) return;
            const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) defs.appendChild(el.cloneNode(true));
            });
            if (defs.childNodes.length) svgNode.appendChild(defs);
        } catch (e) {
            console.warn('inlineExternalDefs failed:', e);
        }
    };

    inlineExternalDefs(svgClone);

    // Inline computed styles to make the SVG standalone
    const inlineStyles = (sourceEl, targetEl) => {
        const computed = window.getComputedStyle(sourceEl);
        const props = ['font-size','font-family','fill','stroke','stroke-width','color','font-weight','font-style'];
        let styleStr = '';
        props.forEach(p => {
            const v = computed.getPropertyValue(p);
            if (v) styleStr += `${p}: ${v};`;
        });
        const existing = targetEl.getAttribute('style') || '';
        targetEl.setAttribute('style', existing + styleStr);
    };

    const walkAndInline = (orig, clone) => {
        if (!orig || !clone) return;
        inlineStyles(orig, clone);
        const origChildren = Array.from(orig.children || []);
        const cloneChildren = Array.from(clone.children || []);
        for (let i = 0; i < origChildren.length; i++) {
            const o = origChildren[i];
            let c = cloneChildren[i];
            if (!c) {
                c = o.cloneNode(false);
                clone.appendChild(c);
            }
            walkAndInline(o, c);
        }
    };

    walkAndInline(svg, svgClone);

    // Ensure xmlns so serialized SVG is valid when opened standalone
    if (!svgClone.getAttribute('xmlns')) {
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    // SVG の正確なサイズを取得して設定
    let width = svg.getAttribute('width');
    let height = svg.getAttribute('height');
    let viewBox = svg.getAttribute('viewBox');
    
    // まず viewBox から正確なサイズを取得
    if (viewBox) {
        const parts = viewBox.split(/\s+|,/).filter(Boolean).map(parseFloat);
        if (parts.length >= 4) {
            // viewBox の形式は "minX minY width height"
            width = parts[2];
            height = parts[3];
        }
    }
    
    // getBBox でコンテンツの実際の境界を取得(最も正確)
    try {
        const bbox = svg.getBBox();
        console.log('Original bbox:', JSON.stringify({x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height}));
        if (bbox && bbox.width > 0 && bbox.height > 0) {
            // 余白を追加(上下左右に少しパディング)
            const padding = 20; // ピクセル単位(上部の見切れを防ぐため増量)
            
            // viewBoxは元の座標系のまま、パディングを含めた範囲を指定
            const viewBoxX = bbox.x - padding;
            const viewBoxY = bbox.y - padding;
            const viewBoxWidth = bbox.width + padding * 2;
            const viewBoxHeight = bbox.height + padding * 2;
            
            viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
            
            // 出力サイズは適切なスケールで縮小(MathJaxの内部スケールを考慮)
            const scale = 0.08;
            width = viewBoxWidth * scale;
            height = viewBoxHeight * scale;
            
            console.log('Applied padding:', padding, 'scale:', scale);
            console.log('Final viewBox:', viewBox);
            console.log('Output size (width x height):', width.toFixed(1), 'x', height.toFixed(1));
        }
    } catch (e) {
        console.warn('getBBox failed, using fallback:', e);
    }
    
    // フォールバック: getBoundingClientRect で取得
    if (!width || !height) {
        try {
            const rect = svg.getBoundingClientRect();
            if (rect && rect.width && rect.height) {
                width = rect.width;
                height = rect.height;
            }
        } catch (e) {}
    }
    
    // デフォルト値
    width = parseFloat(width) || 200;
    height = parseFloat(height) || 50;
    
    // viewBox が設定されていない場合は作成
    if (!viewBox) {
        viewBox = `0 0 ${width} ${height}`;
    }
    
    // SVG に viewBox と preserveAspectRatio を設定
    svgClone.setAttribute('viewBox', viewBox);
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

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
    link.download = generateFileName('svg');
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
        // Try to render from SVG if available for better fidelity
        const svgEl = preview.querySelector('svg');
        let imgData;

        let width = 800;
        let height = 200;

        if (svgEl) {
            const svgClone = svgEl.cloneNode(true);
            if (!svgClone.getAttribute('xmlns')) svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            // inline styles
            const inlineStyles = (sourceEl, targetEl) => {
                const computed = window.getComputedStyle(sourceEl);
                const props = ['font-size','font-family','fill','stroke','stroke-width','color','font-weight','font-style'];
                let styleStr = '';
                props.forEach(p => {
                    const v = computed.getPropertyValue(p);
                    if (v) styleStr += `${p}: ${v};`;
                });
                const existing = targetEl.getAttribute('style') || '';
                targetEl.setAttribute('style', existing + styleStr);
            };
            const walkAndInline = (orig, clone) => {
                if (!orig || !clone) return;
                inlineStyles(orig, clone);
                const origChildren = Array.from(orig.children || []);
                const cloneChildren = Array.from(clone.children || []);
                for (let i = 0; i < origChildren.length; i++) {
                    const o = origChildren[i];
                    let c = cloneChildren[i];
                    if (!c) {
                        c = o.cloneNode(false);
                        clone.appendChild(c);
                    }
                    walkAndInline(o, c);
                }
            };
            walkAndInline(svgEl, svgClone);

            // dimensions (prefer rendered CSS pixel size)
            width = svgEl.getAttribute('width');
            height = svgEl.getAttribute('height');
            const viewBox = svgEl.getAttribute('viewBox');
            if ((!width || !height) && viewBox) {
                const parts = viewBox.split(/\s+|,/).filter(Boolean);
                if (parts.length >= 4) {
                    width = parts[2];
                    height = parts[3];
                }
            }
            try {
                const rect = svgEl.getBoundingClientRect();
                if (rect && rect.width && rect.height) {
                    width = rect.width;
                    height = rect.height;
                }
            } catch (e) {}
            width = parseFloat(width) || 800;
            height = parseFloat(height) || 200;

            // Ensure width/height attributes exist on cloned SVG
            try {
                svgClone.setAttribute('width', width);
                svgClone.setAttribute('height', height);
            } catch (e) {}

            const serializer = new XMLSerializer();
            // Inline external defs referenced by <use> so the cloned SVG is standalone
            const inlineExternalDefsPdf = (svgNode) => {
                try {
                    const uses = svgNode.querySelectorAll('use');
                    const ids = new Set();
                    uses.forEach(u => {
                        const href = u.getAttribute('xlink:href') || u.getAttribute('href');
                        if (href && href[0] === '#') ids.add(href.slice(1));
                    });
                    if (ids.size === 0) return;
                    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
                    ids.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) defs.appendChild(el.cloneNode(true));
                    });
                    if (defs.childNodes.length) svgNode.appendChild(defs);
                } catch (e) {
                    console.warn('inlineExternalDefsPdf failed:', e);
                }
            };

            inlineExternalDefsPdf(svgClone);
            const svgString = serializer.serializeToString(svgClone);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

            // Rasterize the SVG into imgData for PDF
            try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (e) => reject(e);
                    img.src = svgDataUrl;
                });

                const dpr = window.devicePixelRatio || 1;
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(width * scale * dpr);
                canvas.height = Math.ceil(height * scale * dpr);
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0,0,width * scale, height * scale);
                ctx.drawImage(img, 0, 0, width * scale, height * scale);
                imgData = canvas.toDataURL('image/png');
            } catch (e) {
                console.error('Failed to rasterize SVG for PDF fallback:', e);
                throw e;
            }
        } else {
            // fallback to html2canvas
            const canvas = await html2canvas(preview, {
                backgroundColor: transparent ? '#ffffff' : bgColor,
                scale: scale,
                logging: false,
                useCORS: true
            });
            imgData = canvas.toDataURL('image/png');
            width = canvas.width / scale;
            height = canvas.height / scale;
        }

        const { jsPDF } = window.jspdf;
        const imgWidth = (width * scale) / 4; // mm conversion approx
        const imgHeight = (height * scale) / 4;
        const pdf = new jsPDF({
            orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [imgWidth, imgHeight]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(generateFileName('pdf'));
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('PDFの生成に失敗しました。');
    }
}

/**
 * 旧バージョンのファイル名生成関数（後方互換性のため残す）
 * @returns {string} タイムスタンプ付きファイル名
 */
function generateFileNameLegacy() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `equation_${timestamp}`;
}
