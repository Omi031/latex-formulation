/**
 * MathJax設定ファイル
 * 数式レンダリングの設定を管理
 */

// MathJax設定（MathJax読み込み前に定義する必要がある）
window.MathJax = {
    tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
        packages: {'[+]': ['ams', 'color']},
        // カスタムマクロ: \bm を \boldsymbol のショートカットとして追加
        macros: {
            // \bm{...} を \boldsymbol{...} として解釈する（引数1つ）
            bm: ['\\boldsymbol{#1}', 1]
        }
    },
    svg: {
        fontCache: 'global'
    },
    startup: {
        pageReady: () => {
            return MathJax.startup.defaultPageReady().then(() => {
                console.log('MathJax initial typesetting complete');
            });
        }
    }
};

// アプリケーション設定
const APP_CONFIG = {
    // デフォルト設定
    defaults: {
        fontSize: 48,
        scale: 2,
        bgColor: '#ffffff',
        textColor: '#000000',
        transparent: true,
        equation: 'E = mc^2'
    },
    
    // サンプル数式
    examples: [
        {
            name: 'アインシュタインの質量エネルギー等価式',
            equation: 'E = mc^2'
        },
        {
            name: 'ガウス積分',
            equation: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
        },
        {
            name: 'バーゼル問題',
            equation: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}'
        },
        {
            name: 'マクスウェル方程式',
            equation: '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}'
        },
        {
            name: '二次方程式の解の公式',
            equation: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
        },
        {
            name: 'オイラーの等式',
            equation: 'e^{i\\pi} + 1 = 0'
        },
        {
            name: 'ネイピア数の極限',
            equation: '\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e'
        }
    ]
};
