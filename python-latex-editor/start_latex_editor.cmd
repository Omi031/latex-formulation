@echo off
REM LaTeX Editor 起動スクリプト

REM 仮想環境mainをアクティベート
call conda activate main

REM latex_editor.pyを起動
python latex_editor.py

REM エラーが発生した場合はウィンドウを閉じないで待機
if errorlevel 1 (
    echo.
    echo エラーが発生しました。
    pause
)
