/**
 * 数式レンダリング機能
 * MathJaxを使用して数式を表示
 */

/**
 * 数式をプレビューに表示
 */
function renderEquation() {
    const equation = document.getElementById('equation').value;
    const preview = document.getElementById('preview');
    const fontSize = document.getElementById('fontSize').value;
    const textColor = document.getElementById('textColor').value;
    const transparent = document.getElementById('transparent').checked;
    const bgColor = document.getElementById('bgColor').value;
    const previewBox = document.getElementById('previewBox');
    
    // スタイル設定
    preview.style.fontSize = fontSize + 'px';
    preview.style.color = textColor;
    
    // 背景設定
    if (transparent) {
        previewBox.classList.add('transparent');
        previewBox.style.backgroundColor = 'transparent';
    } else {
        previewBox.classList.remove('transparent');
        previewBox.style.backgroundColor = bgColor;
    }
    
    // 数式をレンダリング
    preview.innerHTML = '\\(' + equation + '\\)';
    
    // MathJaxが読み込まれているか確認
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([preview]).catch((err) => {
            console.error('MathJax rendering error:', err);
            alert('数式のレンダリングに失敗しました。構文を確認してください。');
        });
    } else {
        console.warn('MathJax is not loaded yet. Retrying in 500ms...');
        setTimeout(renderEquation, 500);
    }
}

/**
 * サンプル数式を設定
 * @param {string} eq - 設定する数式
 */
function setEquation(eq) {
    document.getElementById('equation').value = eq;
    renderEquation();
}

/**
 * 入力をクリア
 */
function clearAll() {
    document.getElementById('equation').value = '';
    renderEquation();
}

/**
 * プレビューボックスの背景を更新
 */
function updatePreviewBackground() {
    const transparent = document.getElementById('transparent').checked;
    const bgColor = document.getElementById('bgColor').value;
    const previewBox = document.getElementById('previewBox');
    
    if (transparent) {
        previewBox.classList.add('transparent');
        previewBox.style.backgroundColor = 'transparent';
    } else {
        previewBox.classList.remove('transparent');
        previewBox.style.backgroundColor = bgColor;
    }
}
