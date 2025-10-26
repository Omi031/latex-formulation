# LaTeX 数式エディタ（Python GUI版）

Times New Roman フォント完全対応の LaTeX 数式エディタです。matplotlib と LaTeX エンジンを使用して、高品質な数式画像を生成します。

## 特徴

- ✅ **Times New Roman フォント完全対応** - 実際の LaTeX エンジンを使用
- ✅ **\bm コマンド対応** - 太字ベクトル記法が使用可能
- ✅ **PNG/PDF/SVG エクスポート** - 高解像度で保存可能
- ✅ **リアルタイムプレビュー** - 入力した数式をすぐに確認
- ✅ **カスタマイズ可能** - フォントサイズ、背景色、displaystyle 切替

## 必要要件

### システム要件
- Python 3.7 以上
- LaTeX ディストリビューション（TeX Live または MiKTeX）

### LaTeX のインストール

**Windows:**
```cmd
# MiKTeX をインストール
# https://miktex.org/download からインストーラーをダウンロード

# または TeX Live
# https://www.tug.org/texlive/windows.html
```

**Mac:**
```bash
# MacTeX をインストール
brew install --cask mactex
```

**Linux:**
```bash
# TeX Live をインストール
sudo apt-get install texlive-full
# または
sudo dnf install texlive-scheme-full
```

## インストール

1. リポジトリをクローンまたはダウンロード

2. Python パッケージをインストール:
```cmd
cd python-latex-editor
pip install -r requirements.txt
```

3. LaTeX がインストールされているか確認:
```cmd
latex --version
```

## 使い方

### 起動

```cmd
python latex_editor.py
```

### 基本操作

1. **数式を入力**: テキストエリアに LaTeX 形式で数式を入力
2. **プレビュー更新**: ボタンをクリックして数式を表示
3. **保存**: PNG/PDF/SVG 形式で保存

### サンプル数式

アプリには以下のサンプル数式が用意されています:
- アインシュタインの質量エネルギー等価式: `E = mc^2`
- ガウス積分: `\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}`
- マクスウェル方程式: `\nabla \times \bm{E} = -\frac{\partial \bm{B}}{\partial t}`
- 他多数

### オプション

- **フォントサイズ**: 12pt ～ 72pt で調整可能
- **背景色**: white / transparent / lightgray
- **\displaystyle**: チェックで数式を display style で表示

## LaTeX コマンド

以下のパッケージが利用可能です:
- `amsmath` - 拡張数式環境
- `amssymb` - 数学記号
- `bm` - 太字コマンド（`\bm{...}`）

### よく使うコマンド

```latex
# 分数
\frac{a}{b}

# 積分
\int_0^\infty f(x) dx

# 総和
\sum_{n=1}^{\infty} a_n

# 太字ベクトル
\bm{v}, \bm{\alpha}

# 行列
\begin{pmatrix} a & b \\ c & d \end{pmatrix}

# ギリシャ文字
\alpha, \beta, \gamma, \Delta, \Omega
```

## トラブルシューティング

### LaTeX エラーが出る場合

1. LaTeX がインストールされているか確認:
   ```cmd
   latex --version
   ```

2. 必要なパッケージがインストールされているか確認:
   ```cmd
   # MiKTeX の場合、パッケージマネージャーで amsmath, amssymb, bm をインストール
   ```

### フォントが Times New Roman にならない場合

- matplotlib の設定で `text.usetex: True` が有効になっているか確認
- LaTeX ディストリビューションに Times フォントが含まれているか確認

### 保存した画像が空白の場合

- プレビューが正常に表示されているか確認
- 背景色を white に設定してみる
- LaTeX のエラーメッセージを確認

## Web 版との違い

| 機能 | Web 版（MathJax） | Python GUI 版（LaTeX） |
|------|------------------|----------------------|
| フォント | MathJax 組み込み（制限あり） | Times New Roman 完全対応 ✅ |
| レンダリング | ブラウザ（JavaScript） | LaTeX エンジン ✅ |
| オフライン | 一部 CDN 必要 | 完全オフライン可能 ✅ |
| 起動 | ブラウザで開くだけ | Python + LaTeX 必要 |
| 品質 | 良い | 最高品質 ✅ |

## ライセンス

このプロジェクトは個人・商用利用ともに自由に使用できます。

## 謝辞

- matplotlib プロジェクト
- LaTeX プロジェクト（TeX Live / MiKTeX）
- amsmath, amssymb, bm パッケージの作者
