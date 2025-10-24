/**
 * メインアプリケーションロジック
 * イベントリスナーと初期化処理
 */

/**
 * アプリケーション初期化
 */
function initApp() {
    // MathJaxの読み込み完了を待つ
    if (typeof MathJax !== 'undefined') {
        MathJax.startup.promise.then(() => {
            console.log('MathJax loaded successfully');
            // 初期レンダリング
            renderEquation();
            // イベントリスナーの設定
            setupEventListeners();
            console.log('TeX to Image Converter initialized');
        });
    } else {
        console.warn('MathJax not found, retrying...');
        setTimeout(initApp, 100);
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // Ctrl+Enterでプレビュー更新
    document.getElementById('equation').addEventListener('keyup', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            renderEquation();
        }
    });
    
    // オプション変更時に自動更新
    document.getElementById('fontSize').addEventListener('change', renderEquation);
    document.getElementById('textColor').addEventListener('change', renderEquation);
    document.getElementById('bgColor').addEventListener('change', renderEquation);
    document.getElementById('transparent').addEventListener('change', renderEquation);
    
    // スケール変更時の説明
    document.getElementById('scale').addEventListener('change', function() {
        const scale = this.value;
        console.log(`Scale changed to: ${scale}x`);
    });
}

/**
 * ページロード時の処理
 */
window.addEventListener('load', function() {
    initApp();
});

/**
 * エラーハンドリング
 */
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

/**
 * ローカルストレージに設定を保存
 */
function saveSettings() {
    const settings = {
        fontSize: document.getElementById('fontSize').value,
        scale: document.getElementById('scale').value,
        bgColor: document.getElementById('bgColor').value,
        textColor: document.getElementById('textColor').value,
        transparent: document.getElementById('transparent').checked
    };
    
    localStorage.setItem('texToImageSettings', JSON.stringify(settings));
    console.log('Settings saved');
}

/**
 * ローカルストレージから設定を読み込み
 */
function loadSettings() {
    const saved = localStorage.getItem('texToImageSettings');
    
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            
            if (settings.fontSize) document.getElementById('fontSize').value = settings.fontSize;
            if (settings.scale) document.getElementById('scale').value = settings.scale;
            if (settings.bgColor) document.getElementById('bgColor').value = settings.bgColor;
            if (settings.textColor) document.getElementById('textColor').value = settings.textColor;
            if (settings.transparent !== undefined) document.getElementById('transparent').checked = settings.transparent;
            
            console.log('Settings loaded');
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

/**
 * 設定をリセット
 */
function resetSettings() {
    document.getElementById('fontSize').value = APP_CONFIG.defaults.fontSize;
    document.getElementById('scale').value = APP_CONFIG.defaults.scale;
    document.getElementById('bgColor').value = APP_CONFIG.defaults.bgColor;
    document.getElementById('textColor').value = APP_CONFIG.defaults.textColor;
    document.getElementById('transparent').checked = APP_CONFIG.defaults.transparent;
    
    renderEquation();
    console.log('Settings reset to defaults');
}
