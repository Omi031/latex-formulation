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
    // \displaystyle オプションが有効なら先頭に挿入する
    const useDisplay = document.getElementById('useDisplaystyle') ? document.getElementById('useDisplaystyle').checked : false;
    // Try to use MathJax.tex2svg synchronously if available to catch errors early
    const mathSource = (useDisplay ? '\\displaystyle ' : '') + equation;
    let usedSync = false;
    if (typeof MathJax !== 'undefined' && typeof MathJax.tex2svg === 'function') {
        try {
            const node = MathJax.tex2svg(mathSource, {display: useDisplay});
            // Clear preview and append converted node
            preview.innerHTML = '';
            // node may be an element; clone to avoid moving internal state
            preview.appendChild(node.cloneNode(true));
            usedSync = true;
        } catch (err) {
            console.error('MathJax tex2svg error:', err);
            // MathJax may throw a 'retry' error when internal resources (fonts/packages)
            // are not yet ready. In that case, schedule a short retry instead of treating
            // it as a fatal error.
            const msg = (err && err.message) ? err.message : String(err);
            const isRetry = (msg && /retry/i.test(msg)) || (err && typeof err.retryAfter === 'function');
            if (isRetry) {
                console.warn('MathJax requested retry; will retry rendering shortly.');
                // small backoff then retry rendering
                setTimeout(() => {
                    try { renderEquation(); } catch (e) { console.error('Retry render failed', e); }
                }, 200);
                return;
            }

            try {
                alert('数式のレンダリングに失敗しました。\n\n' +
                      'エラー: ' + msg + '\n\n' +
                      '入力: ' + equation + '\n\n' +
                      '詳細は開発者ツールのコンソールを確認してください。');
            } catch (e) {}
            // Show a clear message in the preview instead of MathJax's internal error box
            preview.textContent = 'Math output error: ' + msg;
            return;
        }
    }

    // If tex2svg wasn't available or we didn't use it, fall back to typesetPromise
    if (!usedSync) {
        preview.innerHTML = '\\(' + (useDisplay ? '\\displaystyle ' : '') + equation + '\\)';

        // MathJaxが読み込まれているか確認
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([preview]).catch((err) => {
                // エラー情報を詳細に出す（コンソールにスタック、アラートに簡潔な説明）
                console.error('MathJax rendering error:', err);
                const msg = (err && err.message) ? err.message : String(err);
                // ユーザーに表示するアラートは簡潔に。詳細はコンソールを参照するよう促す。
                try {
                    alert('数式のレンダリングに失敗しました。\\n\\n' +
                          'エラー: ' + msg + '\\n\\n' +
                          '入力: ' + equation + '\\n\\n' +
                          '詳細は開発者ツールのコンソールを確認してください。');
                } catch (e) {
                    // alert が失敗しても何もしない
                }
                // If MathJax inserted its own 'Math output error' box, replace it with a clearer text
                try {
                    if (preview.textContent && preview.textContent.toLowerCase().includes('math output error')) {
                        preview.textContent = 'Math output error: ' + msg;
                    }
                } catch (e) {}
            });
        } else {
            console.warn('MathJax is not loaded yet. Retrying in 500ms...');
            setTimeout(renderEquation, 500);
        }
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
