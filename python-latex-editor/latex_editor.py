#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LaTeX 数式エディタ（Computer Modern フォント）
matplotlib + LaTeX を使用して完全な LaTeX デフォルトフォント対応
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import matplotlib
import json
from pathlib import Path

matplotlib.use("TkAgg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
import matplotlib.patches as mpatches
import os
from datetime import datetime


class LaTeXEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("LaTeX 数式エディタ - Computer Modern")
        self.root.geometry("1000x700")
        
        # 設定ファイルのパス（アプリと同じフォルダ）
        app_dir = Path(__file__).parent
        self.config_file = app_dir / "latex_editor_config.json"

        # matplotlib の LaTeX 設定
        plt.rcParams.update(
            {
                "text.usetex": True,
                "font.family": "serif",
                # Computer Modern (TeXデフォルト) を使用
                "text.latex.preamble": r"\usepackage{amsmath}\usepackage{amssymb}\usepackage{bm}",
            }
        )

        self.setup_ui()
        self.load_settings()  # 設定を読み込み
        self.setup_shortcuts()  # ショートカットキーを設定
        self.current_equation = r"E = mc^2"
        self.render_equation()
        
        # 終了時に設定を保存
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def setup_ui(self):
        """UI をセットアップ"""
        # メインフレーム
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # 入力セクション
        input_frame = ttk.LabelFrame(main_frame, text="LaTeX 数式を入力", padding="10")
        input_frame.grid(
            row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10)
        )

        self.equation_text = tk.Text(
            input_frame, height=4, width=80, font=("Courier New", 11), undo=True, maxundo=-1
        )
        self.equation_text.insert("1.0", r"E = mc^2")
        self.equation_text.grid(row=0, column=0, sticky=(tk.W, tk.E))

        # ボタンフレーム
        button_frame = ttk.Frame(input_frame)
        button_frame.grid(row=1, column=0, pady=(5, 0))

        ttk.Button(
            button_frame, text="プレビュー更新 (Ctrl+Enter)", command=self.render_equation
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="クリア (Ctrl+L)", command=self.clear_equation).pack(
            side=tk.LEFT, padx=5
        )
        ttk.Button(button_frame, text="📥 保存 (Ctrl+S)", command=self.save_image).pack(
            side=tk.LEFT, padx=5
        )
        ttk.Button(button_frame, text="↶ 元に戻す (Ctrl+Z)", command=self.undo).pack(
            side=tk.LEFT, padx=5
        )
        ttk.Button(button_frame, text="↷ やり直す (Ctrl+Y)", command=self.redo).pack(
            side=tk.LEFT, padx=5
        )

        # オプションフレーム
        options_frame = ttk.LabelFrame(main_frame, text="オプション", padding="10")
        options_frame.grid(
            row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10)
        )

        # フォントサイズ
        ttk.Label(options_frame, text="フォントサイズ:").grid(
            row=0, column=0, sticky=tk.W
        )
        self.fontsize_var = tk.IntVar(value=24)
        ttk.Spinbox(
            options_frame, from_=12, to=72, textvariable=self.fontsize_var, width=10
        ).grid(row=0, column=1, padx=5)

        # 背景色
        ttk.Label(options_frame, text="背景色:").grid(
            row=0, column=2, sticky=tk.W, padx=(10, 0)
        )
        self.bgcolor_var = tk.StringVar(value="transparent")
        bgcolor_combo = ttk.Combobox(
            options_frame,
            textvariable=self.bgcolor_var,
            values=["transparent", "white", "lightgray"],
            width=12,
        )
        bgcolor_combo.grid(row=0, column=3, padx=5)

        # displaystyle
        self.displaystyle_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            options_frame, text="\\displaystyle を使用", variable=self.displaystyle_var
        ).grid(row=0, column=4, padx=10)

        # ファイル名設定
        self.use_equation_filename_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            options_frame,
            text="数式内容をファイル名に使用",
            variable=self.use_equation_filename_var,
        ).grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(5, 0))
        
        # 保存形式選択
        ttk.Label(options_frame, text="保存形式:").grid(
            row=1, column=2, sticky=tk.W, padx=(10, 0), pady=(5, 0)
        )
        self.save_format_var = tk.StringVar(value="svg")
        format_combo = ttk.Combobox(
            options_frame,
            textvariable=self.save_format_var,
            values=["svg", "png", "pdf"],
            state="readonly",
            width=8,
        )
        format_combo.grid(row=1, column=3, padx=5, pady=(5, 0))

        # プレビューフレーム
        preview_frame = ttk.LabelFrame(main_frame, text="プレビュー", padding="10")
        preview_frame.grid(
            row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10)
        )

        # matplotlib Figure
        self.figure = Figure(figsize=(8, 3), dpi=100)
        self.canvas = FigureCanvasTkAgg(self.figure, master=preview_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        # サンプル数式
        samples_frame = ttk.LabelFrame(
            main_frame, text="サンプル数式（クリックで挿入）", padding="10"
        )
        samples_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E))

        samples = [
            ("アインシュタインの質量エネルギー等価式", r"E = mc^2"),
            ("ガウス積分", r"\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"),
            ("バーゼル問題", r"\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}"),
            (
                "マクスウェル方程式",
                r"\nabla \times \bm{E} = -\frac{\partial \bm{B}}{\partial t}",
            ),
            ("二次方程式の解の公式", r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"),
            ("オイラーの等式", r"e^{i\pi} + 1 = 0"),
        ]

        for i, (name, eq) in enumerate(samples):
            btn = ttk.Button(
                samples_frame, text=name, command=lambda e=eq: self.insert_sample(e)
            )
            btn.grid(row=i // 2, column=i % 2, sticky=(tk.W, tk.E), padx=5, pady=2)

        # グリッド設定
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(2, weight=1)

    def render_equation(self):
        """数式をレンダリング"""
        equation = self.equation_text.get("1.0", tk.END).strip()
        if not equation:
            return

        # displaystyle の適用
        if self.displaystyle_var.get():
            equation = r"\displaystyle " + equation

        self.current_equation = equation
        fontsize = self.fontsize_var.get()
        bgcolor = self.bgcolor_var.get()

        # Figure をクリア
        self.figure.clear()
        ax = self.figure.add_subplot(111)

        # 背景色設定
        if bgcolor == "transparent":
            self.figure.patch.set_alpha(0)
            ax.patch.set_alpha(0)
        elif bgcolor == "white":
            self.figure.patch.set_facecolor("white")
            ax.patch.set_facecolor("white")
        else:
            self.figure.patch.set_facecolor(bgcolor)
            ax.patch.set_facecolor(bgcolor)

        try:
            # 改行を含む数式の場合は、align環境などを使用
            # 通常の数式はそのまま、改行がある場合は適切に処理
            equation_formatted = equation
            needs_math_mode = True  # 数式モード($...$)が必要かどうか
            
            # デバッグ出力（プレビュー）
            print("PREVIEW DEBUG: Original equation:")
            print(repr(equation))
            print("PREVIEW DEBUG: Starts with \\begin?", equation.strip().startswith(r'\begin'))
            
            # \begin{...} 環境がある場合はチェック
            if equation.strip().startswith(r'\begin'):
                # align, align*, equation, equation*などの環境は数式モード不要
                math_environments = ['align', 'align*', 'equation', 'equation*', 
                                   'gather', 'gather*', 'multline', 'multline*']
                for env in math_environments:
                    if equation.strip().startswith(f'\\begin{{{env}}}'):
                        needs_math_mode = False
                        print(f"PREVIEW DEBUG: Detected {env} environment, needs_math_mode = False")
                        break
            elif '\n' in equation:
                # 改行があるが\begin環境がない場合、aligned環境を使用
                lines = equation.strip().split('\n')
                lines = [line.strip() for line in lines if line.strip()]
                if len(lines) > 1:
                    equation_formatted = r'\begin{aligned}' + r'\\'.join(lines) + r'\end{aligned}'
                    print("PREVIEW DEBUG: Created aligned environment")
            
            print("PREVIEW DEBUG: needs_math_mode =", needs_math_mode)
            print("PREVIEW DEBUG: equation_formatted =", repr(equation_formatted))
            
            # 数式をレンダリング
            if needs_math_mode:
                math_text = f"${equation_formatted}$"
            else:
                math_text = equation_formatted
            
            print("PREVIEW DEBUG: Final math_text =", repr(math_text))
            
            # matplotlibに渡す前に、Pythonの改行(\n)を除去
            # LaTeXの\\は保持する必要があるため、\n のみを削除
            math_text_clean = math_text.replace('\n', ' ')
            print("PREVIEW DEBUG: Cleaned math_text =", repr(math_text_clean))
            
            ax.text(
                0.5,
                0.5,
                math_text_clean,
                fontsize=fontsize,
                ha="center",
                va="center",
                transform=ax.transAxes,
            )

            ax.axis("off")
            self.figure.tight_layout(pad=0.1)  # パディングを最小化
            self.canvas.draw()

        except Exception as e:
            messagebox.showerror(
                "レンダリングエラー",
                f"数式のレンダリングに失敗しました。\n\nエラー: {str(e)}\n\n入力: {equation}",
            )

    def clear_equation(self):
        """入力をクリア"""
        self.equation_text.delete("1.0", tk.END)
        self.render_equation()

    def insert_sample(self, equation):
        """サンプル数式を挿入"""
        self.equation_text.delete("1.0", tk.END)
        self.equation_text.insert("1.0", equation)
        self.render_equation()
    
    def undo(self):
        """元に戻す"""
        try:
            self.equation_text.edit_undo()
        except tk.TclError:
            pass  # 元に戻せない場合は何もしない
    
    def redo(self):
        """やり直す"""
        try:
            self.equation_text.edit_redo()
        except tk.TclError:
            pass  # やり直せない場合は何もしない
    
    def setup_shortcuts(self):
        """ショートカットキーを設定"""
        # Ctrl+Enter: プレビュー更新（改行を防ぐ）
        def on_ctrl_enter(e):
            self.render_equation()
            return "break"  # イベントの伝播を停止
        
        # Ctrl+S: 保存（デフォルト動作を防ぐ）
        def on_ctrl_s(e):
            self.save_image()
            return "break"
        
        # Ctrl+L: クリア（デフォルト動作を防ぐ）
        def on_ctrl_l(e):
            self.clear_equation()
            return "break"
        
        # Ctrl+Z: 元に戻す
        def on_ctrl_z(e):
            self.undo()
            return "break"
        
        # Ctrl+Y: やり直す
        def on_ctrl_y(e):
            self.redo()
            return "break"
        
        # テキストウィジェットに直接バインド
        self.equation_text.bind("<Control-Return>", on_ctrl_enter)
        self.equation_text.bind("<Control-s>", on_ctrl_s)
        self.equation_text.bind("<Control-l>", on_ctrl_l)
        self.equation_text.bind("<Control-z>", on_ctrl_z)
        self.equation_text.bind("<Control-y>", on_ctrl_y)
        
        # ルートウィンドウにもバインド（他の場所でも動作するように）
        self.root.bind("<Control-Return>", on_ctrl_enter)
        self.root.bind("<Control-s>", on_ctrl_s)
        self.root.bind("<Control-l>", on_ctrl_l)
        self.root.bind("<Control-z>", on_ctrl_z)
        self.root.bind("<Control-y>", on_ctrl_y)

    def save_image(self):
        """画像を保存"""
        # 選択された形式を取得
        format = self.save_format_var.get()
        
        # ファイル名を生成
        if self.use_equation_filename_var.get():
            import re  # reモジュールをここでインポート
            
            # 数式からファイル名を生成（元の入力から生成、改行は除去）
            equation = self.equation_text.get("1.0", tk.END).strip()
            equation = equation.replace(r"\displaystyle", "").strip()
            
            # 改行と複数のスペースをアンダースコアに変換
            equation = equation.replace("\n", "_").replace("\r", "")
            equation = re.sub(r'\s+', '_', equation)
            
            # LaTeXコマンドを適切に変換
            safe_name = equation
            # \command{} 形式を \command_ 形式に変換（{}の内容は保持）
            # \bm{X} -> bm_X のように変換
            safe_name = re.sub(r'\\(\w+)\{([^}]+)\}', r'\1_\2', safe_name)
            # 残りのバックスラッシュを削除
            safe_name = safe_name.replace("\\", "")
            
            # Windowsファイル名で使えない文字のみを削除
            # 使えない文字: < > : " / \ | ? *
            safe_name = safe_name.replace("<", "")
            safe_name = safe_name.replace(">", "")
            safe_name = safe_name.replace(":", "")
            safe_name = safe_name.replace('"', "")
            safe_name = safe_name.replace("/", "")
            safe_name = safe_name.replace("\\", "")
            safe_name = safe_name.replace("|", "")
            safe_name = safe_name.replace("?", "")
            safe_name = safe_name.replace("*", "")
            
            # その他の特殊文字を処理
            safe_name = safe_name.replace(" ", "_")
            safe_name = safe_name.replace("{", "").replace("}", "")
            safe_name = safe_name.replace("$", "")
            safe_name = safe_name.replace("(", "").replace(")", "")
            safe_name = safe_name.replace("[", "").replace("]", "")
            safe_name = safe_name.replace(";", "")
            safe_name = safe_name.replace(",", "_")
            
            # 複数の連続するアンダースコアを1つにまとめる
            safe_name = re.sub(r'_+', '_', safe_name)
            # 先頭と末尾のアンダースコアを削除
            safe_name = safe_name.strip('_')
            
            # 長すぎる場合は切り詰める
            if len(safe_name) > 80:
                safe_name = safe_name[:80]
            default_name = (
                f"{safe_name}.{format}" if safe_name else f"equation.{format}"
            )
        else:
            # タイムスタンプを使用
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            default_name = f"equation_{timestamp}.{format}"

        filetypes = {
            "png": [("PNG files", "*.png")],
            "pdf": [("PDF files", "*.pdf")],
            "svg": [("SVG files", "*.svg")],
        }

        filename = filedialog.asksaveasfilename(
            defaultextension=f".{format}",
            filetypes=filetypes[format],
            initialfile=default_name,
        )

        if filename:
            try:
                # 極小サイズでFigureを作成
                save_fig = Figure(
                    figsize=(0.1, 0.1), dpi=300 if format == "png" else 100
                )
                save_ax = save_fig.add_subplot(111)

                bgcolor = self.bgcolor_var.get()
                if bgcolor == "transparent":
                    save_fig.patch.set_alpha(0)
                    save_ax.patch.set_alpha(0)
                elif bgcolor == "white":
                    save_fig.patch.set_facecolor("white")
                    save_ax.patch.set_facecolor("white")
                else:
                    save_fig.patch.set_facecolor(bgcolor)
                    save_ax.patch.set_facecolor(bgcolor)

                # 元のテキストから数式を取得
                equation = self.equation_text.get("1.0", tk.END).strip()
                if self.displaystyle_var.get():
                    equation = r"\displaystyle " + equation
                fontsize = self.fontsize_var.get()
                
                # デバッグ出力
                print("DEBUG: Original equation:")
                print(repr(equation))
                print("DEBUG: First 50 chars:", equation[:50])
                print("DEBUG: Starts with \\begin?", equation.strip().startswith(r'\begin'))
                
                # 数式モードの判定（プレビューと同じロジック）
                equation_formatted = equation
                needs_math_mode = True
                
                if equation.strip().startswith(r'\begin'):
                    math_environments = ['align', 'align*', 'equation', 'equation*', 
                                       'gather', 'gather*', 'multline', 'multline*']
                    for env in math_environments:
                        if equation.strip().startswith(f'\\begin{{{env}}}'):
                            needs_math_mode = False
                            print(f"DEBUG: Detected {env} environment")
                            break
                elif '\n' in equation:
                    lines = equation.strip().split('\n')
                    lines = [line.strip() for line in lines if line.strip()]
                    if len(lines) > 1:
                        equation_formatted = r'\begin{aligned}' + r'\\'.join(lines) + r'\end{aligned}'
                        print("DEBUG: Created aligned environment")
                
                print("DEBUG: needs_math_mode =", needs_math_mode)
                print("DEBUG: equation_formatted:")
                print(repr(equation_formatted))
                
                # 数式テキストを生成
                if needs_math_mode:
                    math_text = f"${equation_formatted}$"
                else:
                    math_text = equation_formatted
                
                print("DEBUG: Final math_text:")
                print(repr(math_text))
                
                # matplotlibに渡す前に、Pythonの改行(\n)を除去
                math_text_clean = math_text.replace('\n', ' ')
                print("DEBUG: Cleaned math_text:")
                print(repr(math_text_clean))

                # テキストをデータ座標で配置（中央配置だとより密着）
                text_obj = save_ax.text(
                    0.5,
                    0.5,
                    math_text_clean,
                    fontsize=fontsize,
                    ha="center",
                    va="center",
                    transform=save_ax.transAxes,
                )

                save_ax.axis("off")

                # 軸の範囲を設定
                save_ax.set_xlim(0, 1)
                save_ax.set_ylim(0, 1)

                # マージンを完全にゼロに
                save_fig.subplots_adjust(
                    left=0, right=1, top=1, bottom=0, wspace=0, hspace=0
                )

                # 保存（pad_inchesを極限まで小さく）
                save_fig.savefig(
                    filename,
                    format=format,
                    bbox_inches="tight",
                    pad_inches=0,  # 完全にゼロ
                    transparent=(bgcolor == "transparent"),
                    dpi=300 if format == "png" else None,
                )

                # 保存完了（通知なし）

            except Exception as e:
                messagebox.showerror("保存エラー", f"保存に失敗しました:\n{str(e)}")
    
    def save_settings(self):
        """設定をファイルに保存"""
        try:
            settings = {
                "fontsize": self.fontsize_var.get(),
                "bgcolor": self.bgcolor_var.get(),
                "displaystyle": self.displaystyle_var.get(),
                "use_equation_filename": self.use_equation_filename_var.get(),
                "save_format": self.save_format_var.get(),
            }
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=2)
        except Exception as e:
            print(f"設定の保存に失敗しました: {e}")
    
    def load_settings(self):
        """設定をファイルから読み込み"""
        try:
            if self.config_file.exists():
                with open(self.config_file, "r", encoding="utf-8") as f:
                    settings = json.load(f)
                    self.fontsize_var.set(settings.get("fontsize", 24))
                    self.bgcolor_var.set(settings.get("bgcolor", "transparent"))
                    self.displaystyle_var.set(settings.get("displaystyle", False))
                    self.use_equation_filename_var.set(settings.get("use_equation_filename", False))
                    self.save_format_var.set(settings.get("save_format", "svg"))
        except Exception as e:
            print(f"設定の読み込みに失敗しました: {e}")
    
    def on_closing(self):
        """ウィンドウを閉じる際の処理"""
        self.save_settings()
        self.root.destroy()


def main():
    root = tk.Tk()
    app = LaTeXEditor(root)
    root.mainloop()


if __name__ == "__main__":
    main()
