#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LaTeX 数式エディタ（Computer Modern フォント）
matplotlib + LaTeX を使用して完全な LaTeX デフォルトフォント対応
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import matplotlib

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
        self.current_equation = r"E = mc^2"
        self.render_equation()

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
            input_frame, height=4, width=80, font=("Courier New", 11)
        )
        self.equation_text.insert("1.0", r"E = mc^2")
        self.equation_text.grid(row=0, column=0, sticky=(tk.W, tk.E))

        # ボタンフレーム
        button_frame = ttk.Frame(input_frame)
        button_frame.grid(row=1, column=0, pady=(5, 0))

        ttk.Button(
            button_frame, text="プレビュー更新", command=self.render_equation
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="クリア", command=self.clear_equation).pack(
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

        # プレビューフレーム
        preview_frame = ttk.LabelFrame(main_frame, text="プレビュー", padding="10")
        preview_frame.grid(
            row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10)
        )

        # matplotlib Figure
        self.figure = Figure(figsize=(8, 3), dpi=100)
        self.canvas = FigureCanvasTkAgg(self.figure, master=preview_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        # 保存ボタンフレーム
        save_frame = ttk.Frame(main_frame)
        save_frame.grid(row=3, column=0, columnspan=2, pady=(0, 10))

        ttk.Button(
            save_frame, text="📥 PNG として保存", command=lambda: self.save_image("png")
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(
            save_frame, text="📥 PDF として保存", command=lambda: self.save_image("pdf")
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(
            save_frame, text="📥 SVG として保存", command=lambda: self.save_image("svg")
        ).pack(side=tk.LEFT, padx=5)

        # サンプル数式
        samples_frame = ttk.LabelFrame(
            main_frame, text="サンプル数式（クリックで挿入）", padding="10"
        )
        samples_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E))

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
            # 数式をレンダリング
            ax.text(
                0.5,
                0.5,
                f"${equation}$",
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

    def save_image(self, format):
        """画像を保存"""
        # ファイル名を生成
        if self.use_equation_filename_var.get():
            # 数式からファイル名を生成
            equation = self.current_equation.replace(r"\displaystyle", "").strip()
            # ファイル名に使えない文字を削除
            safe_name = equation.replace("\\", "").replace("{", "").replace("}", "")
            safe_name = safe_name.replace("$", "").replace("^", "").replace("_", "")
            safe_name = safe_name.replace(" ", "_").replace("/", "_").replace("*", "")
            safe_name = (
                safe_name.replace("(", "")
                .replace(")", "")
                .replace("[", "")
                .replace("]", "")
            )
            safe_name = safe_name.replace("|", "").replace(":", "").replace(";", "")
            safe_name = (
                safe_name.replace("=", "eq").replace("+", "plus").replace("-", "minus")
            )
            # 長すぎる場合は切り詰める
            if len(safe_name) > 50:
                safe_name = safe_name[:50]
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

                equation = self.current_equation
                fontsize = self.fontsize_var.get()

                # テキストをデータ座標で配置（中央配置だとより密着）
                text_obj = save_ax.text(
                    0.5,
                    0.5,
                    f"${equation}$",
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


def main():
    root = tk.Tk()
    app = LaTeXEditor(root)
    root.mainloop()


if __name__ == "__main__":
    main()
